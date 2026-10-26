import { buildVllmBenchCommand, executeBenchmarkSuite } from "../src/vllm-adapter";
import { parseBenchmarkMetrics } from "../src/metrics-parser";
import { WORKLOAD_ARCHETYPES } from "@hardware-inference/core";

async function runAdapterTests() {
  console.log("--- Starting Benchmark Adapter & Metrics Verification Tests ---");

  const ragWorkload = WORKLOAD_ARCHETYPES.find((a) => a.id === "enterprise-rag");
  if (!ragWorkload) throw new Error("Could not find enterprise-rag archetype");

  // Test 1: Command Builder
  const plan = buildVllmBenchCommand(ragWorkload, { host: "127.0.0.1", port: 8000 });
  if (!plan.fullCommandLine.includes("--backend vllm")) {
    throw new Error(`Test 1 Failed: Missing backend in command: ${plan.fullCommandLine}`);
  }
  if (!plan.fullCommandLine.includes("--random-input-len 3500")) {
    throw new Error(`Test 1 Failed: Prompt length not mapped correctly: ${plan.fullCommandLine}`);
  }
  if (!plan.fullCommandLine.includes("--request-rate 8")) {
    throw new Error(`Test 1 Failed: Concurrency not mapped to request-rate: ${plan.fullCommandLine}`);
  }
  console.log("✓ Test 1 Passed: vllm bench serve CLI command generated with matching workload parameters.");

  // Test 2: Metrics Parser with synthetic vLLM fixture
  const fixture = {
    backend: "vllm",
    num_prompts: 100,
    duration: 50.0,
    completed: 98,
    errors: 2,
    oom_events: 0,
    mean_ttft_ms: 215.0,
    median_ttft_ms: 205.0,
    p90_ttft_ms: 320.0,
    p95_ttft_ms: 380.0,
    p99_ttft_ms: 450.0,
    mean_itl_ms: 22.0,
    median_itl_ms: 21.5,
    p90_itl_ms: 27.0,
    p95_itl_ms: 30.0,
    p99_itl_ms: 34.0,
    request_throughput: 1.96,
    output_throughput: 501.76,
  };

  const parsed = parseBenchmarkMetrics(fixture, { maxTtftMs: 600, maxItlMs: 35 });
  if (parsed.latencies.ttft_ms.p95 !== 380.0) {
    throw new Error(`Test 2 Failed: TTFT P95 mismatch: ${parsed.latencies.ttft_ms.p95}`);
  }
  if (parsed.latencies.itl_ms.p95 !== 30.0) {
    throw new Error(`Test 2 Failed: ITL P95 mismatch: ${parsed.latencies.itl_ms.p95}`);
  }
  if (parsed.reliability.successful_requests !== 98 || parsed.reliability.failed_requests !== 2) {
    throw new Error(`Test 2 Failed: Reliability mismatch: ${JSON.stringify(parsed.reliability)}`);
  }
  if (parsed.goodput_pct < 90) {
    throw new Error(`Test 2 Failed: Expected high goodput for compliant latency: ${parsed.goodput_pct}`);
  }
  console.log(`✓ Test 2 Passed: vLLM metrics fixture parsed with P95 TTFT=${parsed.latencies.ttft_ms.p95}ms, Goodput=${parsed.goodput_pct}%.`);

  // Test 3: Simulated Benchmark Suite Execution
  const runResult = await executeBenchmarkSuite(ragWorkload, { simulated: true });
  if (!runResult.metrics || !runResult.telemetry) {
    throw new Error("Test 3 Failed: Missing metrics or telemetry in simulated execution");
  }
  if (runResult.telemetry.peak_vram_used_gib <= 0) {
    throw new Error(`Test 3 Failed: Invalid peak VRAM: ${runResult.telemetry.peak_vram_used_gib}`);
  }
  console.log(`✓ Test 3 Passed: Simulated benchmark executed. Peak VRAM: ${runResult.telemetry.peak_vram_used_gib} GiB, TTFT P95: ${runResult.metrics.latencies.ttft_ms.p95} ms.`);

  console.log("--- All Benchmark Adapter Tests Passed Successfully! ---");
}

runAdapterTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
