import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { WorkloadSpecification } from "../lib/engine/workload";
import { GpuTelemetrySampler, TelemetrySummary } from "./telemetry";
import { parseBenchmarkMetrics, ParsedBenchmarkResults } from "./metrics-parser";

export interface VllmBenchOptions {
  host?: string;
  port?: number;
  numPrompts?: number;
  resultDir?: string;
  resultFilename?: string;
  simulated?: boolean;
}

export interface VllmCommandPlan {
  command: string;
  args: string[];
  fullCommandLine: string;
}

/**
 * Builds the exact vllm bench serve CLI command arguments from a WorkloadSpecification.
 */
export function buildVllmBenchCommand(
  workload: WorkloadSpecification,
  options?: VllmBenchOptions
): VllmCommandPlan {
  const host = options?.host || "localhost";
  const port = options?.port || 8000;
  const numPrompts = options?.numPrompts || 100;
  const resultDir = options?.resultDir || "./qualification_artifacts";
  const resultFilename = options?.resultFilename || `vllm-bench-${workload.id}.json`;

  const args: string[] = [
    "bench",
    "serve",
    "--backend",
    "vllm",
    "--model",
    workload.modelId,
    "--host",
    host,
    "--port",
    port.toString(),
    "--dataset-name",
    "random",
    "--random-input-len",
    workload.promptTokensP50.toString(),
    "--random-output-len",
    workload.generationTokensP50.toString(),
    "--request-rate",
    workload.concurrency.toString(),
    "--num-prompts",
    numPrompts.toString(),
    "--save-result",
    "--save-detailed",
    "--result-dir",
    resultDir,
    "--result-filename",
    resultFilename,
  ];

  return {
    command: "vllm",
    args,
    fullCommandLine: `vllm ${args.join(" ")}`,
  };
}

/**
 * Generates verified synthetic benchmark metrics for simulation and qualification test suites.
 */
export function generateSyntheticBenchmark(
  workload: WorkloadSpecification,
  options?: { baselineVramGiB?: number; peakVramGiB?: number }
): {
  metrics: ParsedBenchmarkResults;
  telemetry: TelemetrySummary;
} {
  const isHighConcurrency = workload.concurrency > 8;
  const promptLen = workload.promptTokensP50;

  // Realistic latency estimation based on prompt length and concurrency on modern GPU
  const baseTtft = Math.max(80, Math.round((promptLen / 1000) * 35 + (workload.concurrency * 8)));
  const baseItl = Math.max(12, Math.round(14 + (workload.concurrency * 0.8)));

  const p90Ttft = Math.round(baseTtft * 1.35);
  const p95Ttft = Math.round(baseTtft * 1.5);
  const p99Ttft = Math.round(baseTtft * 1.85);

  const p90Itl = Math.round(baseItl * 1.22);
  const p95Itl = Math.round(baseItl * 1.35);
  const p99Itl = Math.round(baseItl * 1.55);

  const totalReqs = 100;
  const durationSec = 45;
  const rps = Number((totalReqs / durationSec).toFixed(2));
  const genTokensPerSec = Number((rps * workload.generationTokensP50).toFixed(1));
  const totalTokensPerSec = Number((rps * (promptLen + workload.generationTokensP50)).toFixed(1));

  const satisfiesTtft = p95Ttft <= workload.sla.maxTtftMs;
  const satisfiesItl = p95Itl <= workload.sla.maxItlMs;
  const goodput = (satisfiesTtft && satisfiesItl) ? 98.5 : 74.2;

  const peakVram = options?.peakVramGiB ?? (promptLen > 4000 ? 19.8 : 16.5);
  const idleVram = options?.baselineVramGiB ?? 0.85;

  return {
    metrics: {
      latencies: {
        ttft_ms: { median: baseTtft, p90: p90Ttft, p95: p95Ttft, p99: p99Ttft },
        itl_ms: { median: baseItl, p90: p90Itl, p95: p95Itl, p99: p99Itl },
        e2e_request_ms: {
          median: baseTtft + baseItl * workload.generationTokensP50,
          p90: p90Ttft + p90Itl * workload.generationTokensP50,
          p95: p95Ttft + p95Itl * workload.generationTokensP50,
          p99: p99Ttft + p99Itl * workload.generationTokensP50,
        },
      },
      throughput: {
        requests_per_sec: rps,
        generation_tokens_per_sec: genTokensPerSec,
        total_tokens_per_sec: totalTokensPerSec,
      },
      reliability: {
        total_requests: totalReqs,
        successful_requests: totalReqs,
        failed_requests: 0,
        oom_events: 0,
      },
      goodput_pct: goodput,
      raw_source: "synthetic_trace",
    },
    telemetry: {
      idle_vram_gib: idleVram,
      peak_vram_used_gib: peakVram,
      peak_gpu_utilization_pct: 98.2,
      peak_temperature_c: 64.5,
      average_power_w: 385.0,
      samples_count: 50,
      duration_ms: durationSec * 1000,
      is_simulated: true,
    },
  };
}

/**
 * Runs the physical or simulated benchmark suite with background telemetry.
 */
export async function executeBenchmarkSuite(
  workload: WorkloadSpecification,
  options?: VllmBenchOptions
): Promise<{
  metrics: ParsedBenchmarkResults;
  telemetry: TelemetrySummary;
}> {
  if (options?.simulated) {
    const sampler = new GpuTelemetrySampler({ simulated: true, intervalMs: 50 });
    sampler.start();
    await new Promise((r) => setTimeout(r, 200));
    const telemetry = sampler.stop();

    const synthetic = generateSyntheticBenchmark(workload, {
      baselineVramGiB: telemetry.idle_vram_gib,
      peakVramGiB: telemetry.peak_vram_used_gib,
    });

    return {
      metrics: synthetic.metrics,
      telemetry,
    };
  }

  // Physical execution
  const sampler = new GpuTelemetrySampler({ intervalMs: 100 });
  sampler.start();

  const commandPlan = buildVllmBenchCommand(workload, options);

  try {
    const resultDir = options?.resultDir || "./qualification_artifacts";
    const resultFilename = options?.resultFilename || `vllm-bench-${workload.id}.json`;
    const outputPath = path.resolve(resultDir, resultFilename);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(commandPlan.fullCommandLine, {
        stdio: "inherit",
        shell: true,
      });

      proc.on("error", (err) => {
        reject(new Error(`Failed to spawn vLLM benchmark: ${err.message}. Make sure 'vllm' is installed in your Python environment or run with --simulate.`));
      });
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else {
          reject(new Error(`vllm bench serve exited with code ${code}. If vLLM is not installed or the model server is not running, run with '--simulate' for simulated benchmark qualification.`));
        }
      });
    });

    const telemetry = sampler.stop();

    if (fs.existsSync(outputPath)) {
      const rawContent = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      const metrics = parseBenchmarkMetrics(rawContent, {
        maxTtftMs: workload.sla.maxTtftMs,
        maxItlMs: workload.sla.maxItlMs,
      });
      return { metrics, telemetry };
    } else {
      throw new Error(`Expected benchmark output file not found at ${outputPath}`);
    }
  } catch (err) {
    sampler.stop();
    throw err;
  }
}
