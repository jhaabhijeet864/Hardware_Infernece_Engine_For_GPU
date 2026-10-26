import { computeBenchmarkDeltas } from "../src/delta-analysis";
import {
  SAMPLE_RUN_RAG_4090_PASS,
  SAMPLE_RUN_CHATBOT_2050_FAIL,
} from "../../../src/lib/fixtures/sample-runs";

async function runDeltaTests() {
  console.log("--- Starting Delta Analysis Verification Tests ---");

  // Test 1: Compliant Run Deltas
  const passDelta = computeBenchmarkDeltas(SAMPLE_RUN_RAG_4090_PASS);
  if (passDelta.memory.capacityUsedPct !== 74) {
    throw new Error(`Test 1 Failed: Expected 74% capacity used, got ${passDelta.memory.capacityUsedPct}%`);
  }
  if (!passDelta.latency.ttftPassed || !passDelta.latency.itlPassed) {
    throw new Error("Test 1 Failed: Expected latency SLAs to pass on compliant sample.");
  }
  if (passDelta.latency.ttftMarginMs <= 0) {
    throw new Error(`Test 1 Failed: Expected positive TTFT margin, got ${passDelta.latency.ttftMarginMs}`);
  }
  console.log(`✓ Test 1 Passed: Delta analysis verified. VRAM Delta: ${passDelta.memory.deltaGiB} GiB (${passDelta.memory.variancePct}%), TTFT Margin: +${passDelta.latency.ttftMarginMs}ms.`);

  // Test 2: Failed Run Deltas
  const failDelta = computeBenchmarkDeltas(SAMPLE_RUN_CHATBOT_2050_FAIL);
  if (failDelta.memory.capacityUsedPct !== 100) {
    throw new Error(`Test 2 Failed: Expected 100% capacity used on OOM, got ${failDelta.memory.capacityUsedPct}%`);
  }
  if (failDelta.latency.ttftPassed || failDelta.latency.itlPassed) {
    throw new Error("Test 2 Failed: Expected latency SLAs to fail on overloaded run.");
  }
  if (failDelta.goodput.oomEvents !== 18) {
    throw new Error(`Test 2 Failed: Expected 18 OOM events, got ${failDelta.goodput.oomEvents}`);
  }
  console.log(`✓ Test 2 Passed: Failed workload delta verified. VRAM Exhausted: 100%, OOMs: ${failDelta.goodput.oomEvents}, Goodput: ${failDelta.goodput.goodputPct}%.`);

  console.log("--- All Delta Analysis Tests Passed Successfully! ---");
}

runDeltaTests().catch((err) => {
  console.error("Delta verification failed:", err);
  process.exit(1);
});
