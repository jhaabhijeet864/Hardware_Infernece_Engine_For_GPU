import * as fs from "node:fs";
import * as path from "node:path";
import { captureSystemEnvironment } from "./env-capture";
import { executeBenchmarkSuite } from "./vllm-adapter";
import { buildQualificationBundle } from "./bundle-builder";
import { WORKLOAD_ARCHETYPES, WorkloadSpecification } from "../lib/engine/workload";

function printHelp() {
  console.log(`
==============================================================
   Local AI Hardware Qualification Suite CLI (hw-qual)
==============================================================

Usage:
  npx hw-qual env                         Inspect local hardware environment
  npx hw-qual run [options]               Run hardware qualification benchmark

Run Options:
  --archetype <id>     Run built-in archetype (e.g. enterprise-rag, customer-support, code-assistant)
  --spec <file>        Path to exported WorkloadSpecification JSON file
  --simulate           Simulate execution and telemetry (for non-GPU dev/testing)
  --out <dir>          Output directory for qualification bundle (default: ./qualification_artifacts)
  --profile <name>     Custom profile name for the acceptance report
  --help               Show this help message

Examples:
  npx hw-qual env
  npx hw-qual run --archetype enterprise-rag --simulate
  npx hw-qual run --spec ./workload.json --simulate
`);
}

function parseCliArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    } else if (!result._command) {
      result._command = arg;
    }
  }
  return result;
}

export async function main() {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  const command = (cliArgs._command as string) || "help";

  if (command === "help" || cliArgs.help) {
    printHelp();
    return;
  }

  if (command === "env") {
    console.log("\n--- Probing Local Machine Hardware Environment ---");
    const env = captureSystemEnvironment({ simulated: Boolean(cliArgs.simulate) });
    console.log(`GPU Model:        ${env.gpu.model} (Count: ${env.gpu.count})`);
    console.log(`Total VRAM:       ${env.gpu.total_vram_gib.toFixed(2)} GiB`);
    console.log(`NVIDIA Driver:    ${env.gpu.driver_version}`);
    console.log(`CUDA Version:     ${env.gpu.cuda_version}`);
    console.log(`PCIe Link:        ${env.gpu.pcie_link || "N/A"}`);
    console.log(`Host CPU:         ${env.host.cpu} (${env.host.cores_logical} logical cores)`);
    console.log(`Host RAM:         ${env.host.ram_gib.toFixed(2)} GiB`);
    console.log(`OS:               ${env.host.os} (${env.host.platform} / ${env.host.arch})`);
    console.log(`Hardware Hash:    ${env.system_hash}`);
    console.log(`Simulated:        ${env.is_simulated ? "YES (Hardware fallback/mock)" : "NO (Physical GPU)"}\n`);
    return;
  }

  if (command === "run") {
    const isSimulated = Boolean(cliArgs.simulate);
    let workload: WorkloadSpecification;

    if (cliArgs.spec && typeof cliArgs.spec === "string") {
      const specPath = path.resolve(process.cwd(), cliArgs.spec);
      if (!fs.existsSync(specPath)) {
        console.error(`Error: Specification file not found at ${specPath}`);
        process.exit(1);
      }
      workload = JSON.parse(fs.readFileSync(specPath, "utf8"));
    } else {
      const archetypeId = (cliArgs.archetype as string) || "enterprise-rag";
      const found = WORKLOAD_ARCHETYPES.find((a) => a.id === archetypeId);
      if (!found) {
        console.error(`Error: Unknown archetype '${archetypeId}'. Available: ${WORKLOAD_ARCHETYPES.map((a) => a.id).join(", ")}`);
        process.exit(1);
      }
      workload = found;
    }

    console.log("\n==============================================================");
    console.log(`🚀 Starting Hardware Qualification Run: ${workload.name}`);
    console.log(`Model: ${workload.modelId} | Concurrency: ${workload.concurrency} streams`);
    console.log(`Target SLAs: TTFT < ${workload.sla.maxTtftMs}ms | ITL < ${workload.sla.maxItlMs}ms`);
    console.log("==============================================================\n");

    const outDir = path.resolve(process.cwd(), (cliArgs.out as string) || "./qualification_artifacts");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const env = captureSystemEnvironment({ simulated: isSimulated });
    console.log(`[1/4] Machine Profile: ${env.gpu.model} | VRAM: ${env.gpu.total_vram_gib} GiB`);
    console.log(`[2/4] Executing Benchmark & Polling Telemetry (${isSimulated ? "Simulated" : "Live"})...`);

    const { metrics, telemetry } = await executeBenchmarkSuite(workload, {
      simulated: isSimulated,
      resultDir: outDir,
    });

    console.log("[3/4] Benchmarking Complete. Evaluating Qualification Verdict...");
    const bundle = buildQualificationBundle(workload, env, telemetry, metrics, {
      profile: (cliArgs.profile as string) || "Workstation Factory Acceptance",
    });

    const runFilePath = path.join(outDir, `qualification-run-${bundle.metadata.run_id}.json`);
    fs.writeFileSync(runFilePath, JSON.stringify(bundle, null, 2), "utf8");

    console.log("\n--------------------------------------------------------------");
    console.log("📊 HARDWARE ACCEPTANCE VERDICT SUMMARY");
    console.log("--------------------------------------------------------------");
    console.log(`Overall Status:   ${bundle.qualification_verdict.overall === "PASSED" ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Peak VRAM Used:   ${telemetry.peak_vram_used_gib} GiB / ${env.gpu.total_vram_gib} GiB`);
    console.log(`TTFT (P95):       ${metrics.latencies.ttft_ms.p95} ms (Target: < ${workload.sla.maxTtftMs} ms)`);
    console.log(`ITL (P95):        ${metrics.latencies.itl_ms.p95} ms (Target: < ${workload.sla.maxItlMs} ms)`);
    console.log(`Throughput:       ${metrics.throughput.generation_tokens_per_sec} gen tokens/sec`);
    console.log(`SLA Goodput:      ${metrics.goodput_pct}% of requests satisfied SLA`);
    console.log("\nDetailed Checks:");
    for (const c of bundle.qualification_verdict.checks) {
      console.log(`  ${c.passed ? "✓" : "✗"} ${c.criterion.padEnd(45)} -> ${c.actual}`);
    }
    console.log(`\nRecommendation:\n${bundle.qualification_verdict.recommendation}`);
    console.log("\n--------------------------------------------------------------");
    console.log(`📁 Qualification Bundle written to:\n${runFilePath}`);
    console.log("--------------------------------------------------------------\n");

    return bundle;
  }

  printHelp();
}

if (process.argv[1]?.endsWith("runner.ts") || process.argv[1]?.endsWith("hw-qual.js")) {
  main().catch((err) => {
    console.error("Execution error:", err);
    process.exit(1);
  });
}
