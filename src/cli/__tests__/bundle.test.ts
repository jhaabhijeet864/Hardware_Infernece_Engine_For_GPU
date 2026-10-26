import { buildQualificationBundle } from "../bundle-builder";
import { captureSystemEnvironment } from "../env-capture";
import { generateSyntheticBenchmark } from "../vllm-adapter";
import { WORKLOAD_ARCHETYPES } from "../../lib/engine/workload";

async function runBundleTests() {
  console.log("--- Starting Qualification Bundle & Verdict Verification Tests ---");

  const ragWorkload = WORKLOAD_ARCHETYPES.find((a) => a.id === "enterprise-rag");
  if (!ragWorkload) throw new Error("Could not find enterprise-rag archetype");

  // Test 1: Compliant Run -> Overall PASSED
  const env = captureSystemEnvironment({ simulated: true });
  const { metrics, telemetry } = generateSyntheticBenchmark(ragWorkload, {
    baselineVramGiB: 0.85,
    peakVramGiB: 18.2, // fits in 24GB RTX 4090
  });

  const bundle = buildQualificationBundle(ragWorkload, env, telemetry, metrics, {
    profile: "OEM Test Bench",
  });

  if (bundle.qualification_verdict.overall !== "PASSED") {
    throw new Error(`Test 1 Failed: Expected PASSED verdict, got ${bundle.qualification_verdict.overall}`);
  }
  if (!bundle.metadata.system_hash.startsWith("sha256-")) {
    throw new Error("Test 1 Failed: Missing system hash in bundle metadata");
  }
  if (bundle.qualification_verdict.checks.length !== 4) {
    throw new Error(`Test 1 Failed: Expected 4 qualification checks, got ${bundle.qualification_verdict.checks.length}`);
  }
  console.log("✓ Test 1 Passed: Compliant workload generates PASSED verdict with all 4 checks passed.");

  // Test 2: Memory Exceeded -> Overall FAILED
  const oomTelemetry = {
    ...telemetry,
    peak_vram_used_gib: 32.5, // Exceeds 24GB capacity
  };
  const failedBundle = buildQualificationBundle(ragWorkload, env, oomTelemetry, metrics);

  if (failedBundle.qualification_verdict.overall !== "FAILED") {
    throw new Error("Test 2 Failed: Expected FAILED verdict for peak memory exceeding capacity");
  }
  const memCheck = failedBundle.qualification_verdict.checks.find((c) => c.criterion.includes("Memory Fit"));
  if (!memCheck || memCheck.passed !== false) {
    throw new Error("Test 2 Failed: Memory Fit check should have failed");
  }
  console.log("✓ Test 2 Passed: Over-capacity memory correctly triggers FAILED qualification verdict.");

  // Test 3: SLA Violation -> Overall FAILED
  const slowMetrics = {
    ...metrics,
    latencies: {
      ...metrics.latencies,
      ttft_ms: { ...metrics.latencies.ttft_ms, p95: 1250 }, // exceeds 600ms target
    },
  };
  const slaFailedBundle = buildQualificationBundle(ragWorkload, env, telemetry, slowMetrics);
  if (slaFailedBundle.qualification_verdict.overall !== "FAILED") {
    throw new Error("Test 3 Failed: Expected FAILED verdict for TTFT SLA violation");
  }
  console.log("✓ Test 3 Passed: SLA violation (TTFT P95 > 600ms) correctly triggers FAILED qualification verdict.");

  console.log("--- All Qualification Bundle Tests Passed Successfully! ---");
}

runBundleTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
