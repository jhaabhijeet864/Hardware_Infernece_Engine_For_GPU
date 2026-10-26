import { WorkloadSpecification, calculateWorkloadMemory } from "../lib/engine/workload";
import { SystemEnvironment } from "./env-capture";
import { TelemetrySummary } from "./telemetry";
import { ParsedBenchmarkResults } from "./metrics-parser";

export interface QualificationCheck {
  criterion: string;
  actual: string;
  passed: boolean;
}

export interface QualificationVerdict {
  overall: "PASSED" | "FAILED";
  checks: QualificationCheck[];
  recommendation: string;
}

export interface QualificationRunBundle {
  $schema: string;
  metadata: {
    run_id: string;
    timestamp: string;
    qualification_profile: string;
    system_hash: string;
  };
  environment: {
    gpu: SystemEnvironment["gpu"];
    host: SystemEnvironment["host"];
    runtime: {
      engine: string;
      version: string;
      kv_cache_dtype: string;
      enforce_eager: boolean;
    };
    is_simulated: boolean;
  };
  workload_spec: WorkloadSpecification;
  analytical_estimate: {
    typical_vram_gib: number;
    peak_vram_gib: number;
    weights_gib: number;
    typical_kv_cache_gib: number;
    peak_kv_cache_gib: number;
    cuda_overhead_gib: number;
    status: string;
    plausibility: string;
  };
  measured_results: {
    telemetry: TelemetrySummary;
    latencies: ParsedBenchmarkResults["latencies"];
    throughput: ParsedBenchmarkResults["throughput"];
    reliability: ParsedBenchmarkResults["reliability"];
    goodput_pct: number;
  };
  qualification_verdict: QualificationVerdict;
}

/**
 * Builds the qualification run artifact conforming to BENCHMARK_ADAPTER_ARCHITECTURE.md.
 */
export function buildQualificationBundle(
  workload: WorkloadSpecification,
  environment: SystemEnvironment,
  telemetry: TelemetrySummary,
  metrics: ParsedBenchmarkResults,
  options?: { profile?: string; runId?: string }
): QualificationRunBundle {
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.replace(/[-:]/g, "").slice(0, 15);
  const runId = options?.runId || `qual-${dateStr}-${workload.id}`;
  const profile = options?.profile || "OEM Pre-Sales & Factory Acceptance Profile";

  // Analytical baseline prediction
  const sizing = calculateWorkloadMemory(workload);

  // SLA and Hardware checks
  const maxVram = environment.gpu.total_vram_gib;
  const peakVram = telemetry.peak_vram_used_gib;
  const memoryPassed = peakVram <= maxVram;

  const actualTtftP95 = metrics.latencies.ttft_ms.p95;
  const targetTtftMax = workload.sla.maxTtftMs;
  const ttftPassed = actualTtftP95 <= targetTtftMax;

  const actualItlP95 = metrics.latencies.itl_ms.p95;
  const targetItlMax = workload.sla.maxItlMs;
  const itlPassed = actualItlP95 <= targetItlMax;

  const oomPassed = metrics.reliability.oom_events === 0 && metrics.reliability.failed_requests === 0;

  const checks: QualificationCheck[] = [
    {
      criterion: `Memory Fit (Peak < ${maxVram.toFixed(1)} GiB)`,
      actual: `${peakVram.toFixed(2)} GiB (${Math.round((peakVram / maxVram) * 100)}% capacity)`,
      passed: memoryPassed,
    },
    {
      criterion: `TTFT SLA (P95 < ${targetTtftMax} ms)`,
      actual: `${actualTtftP95.toFixed(1)} ms`,
      passed: ttftPassed,
    },
    {
      criterion: `ITL SLA (P95 < ${targetItlMax} ms)`,
      actual: `${actualItlP95.toFixed(1)} ms`,
      passed: itlPassed,
    },
    {
      criterion: "Zero Out-of-Memory / CUDA Failures",
      actual: `${metrics.reliability.oom_events} OOMs, ${metrics.reliability.failed_requests} failed requests`,
      passed: oomPassed,
    },
  ];

  const overallPassed = checks.every((c) => c.passed);

  let recommendation: string;
  if (overallPassed) {
    recommendation = `Machine ${environment.gpu.model} is fully qualified for production deployment of ${workload.name} under ${workload.concurrency} concurrent streams.`;
  } else if (!memoryPassed) {
    recommendation = `Disqualified: Workload memory footprint (${peakVram.toFixed(2)} GiB) exceeds installed physical VRAM (${maxVram.toFixed(1)} GiB). Upgrade GPU tier or apply INT4/AWQ quantization.`;
  } else if (!ttftPassed || !itlPassed) {
    recommendation = `Disqualified: Machine fails customer SLA targets under concurrency limit ${workload.concurrency}. Reduce batch concurrency or enable tensor parallel multi-GPU acceleration.`;
  } else {
    recommendation = "Disqualified: Unhandled execution errors or OOM events detected during qualification.";
  }

  return {
    $schema: "https://hardware-inference.schema.json/v1/qualification-run.json",
    metadata: {
      run_id: runId,
      timestamp,
      qualification_profile: profile,
      system_hash: environment.system_hash,
    },
    environment: {
      gpu: environment.gpu,
      host: environment.host,
      runtime: {
        engine: workload.runtime,
        version: "0.6.3",
        kv_cache_dtype: workload.kvCachePrecision.toLowerCase(),
        enforce_eager: false,
      },
      is_simulated: environment.is_simulated,
    },
    workload_spec: workload,
    analytical_estimate: {
      typical_vram_gib: sizing.typicalMemory.totalVRAMRequiredGiB,
      peak_vram_gib: sizing.peakMemory.totalVRAMRequiredGiB,
      weights_gib: sizing.typicalMemory.modelWeightsGiB,
      typical_kv_cache_gib: sizing.typicalMemory.kvCacheGiB,
      peak_kv_cache_gib: sizing.peakMemory.kvCacheGiB,
      cuda_overhead_gib: sizing.typicalMemory.cudaOverheadGiB,
      status: sizing.typicalMemory.status,
      plausibility: sizing.typicalMemory.totalVRAMRequiredGiB <= maxVram ? "Fits VRAM" : "Exceeds VRAM",
    },
    measured_results: {
      telemetry,
      latencies: metrics.latencies,
      throughput: metrics.throughput,
      reliability: metrics.reliability,
      goodput_pct: metrics.goodput_pct,
    },
    qualification_verdict: {
      overall: overallPassed ? "PASSED" : "FAILED",
      checks,
      recommendation,
    },
  };
}
