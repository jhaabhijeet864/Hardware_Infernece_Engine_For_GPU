import { captureSystemEnvironment, computeSystemHash } from "../env-capture";
import { GpuTelemetrySampler } from "../telemetry";

async function runEnvCaptureTests() {
  console.log("--- Starting Hardware Environment & Telemetry Verification Tests ---");

  // Test 1: Simulated Environment Capture
  const env = captureSystemEnvironment({ simulated: true });
  if (!env.gpu.model.includes("RTX 4090")) {
    throw new Error(`Test 1 Failed: Expected RTX 4090 model, got ${env.gpu.model}`);
  }
  if (!env.is_simulated) {
    throw new Error("Test 1 Failed: is_simulated should be true for simulated capture");
  }
  if (!env.system_hash.startsWith("sha256-") || env.system_hash.length < 20) {
    throw new Error(`Test 1 Failed: Invalid system hash: ${env.system_hash}`);
  }
  console.log("✓ Test 1 Passed: Simulated environment captured with valid SHA-256 machine hash.");

  // Test 2: Deterministic System Hash
  const hash1 = computeSystemHash(env.gpu, env.host);
  const hash2 = computeSystemHash(env.gpu, env.host);
  if (hash1 !== hash2 || hash1 !== env.system_hash) {
    throw new Error(`Test 2 Failed: System hash is not deterministic: ${hash1} vs ${hash2}`);
  }
  console.log("✓ Test 2 Passed: Cryptographic system fingerprint is deterministic.");

  // Test 3: Telemetry Sampler (Simulated)
  const sampler = new GpuTelemetrySampler({
    intervalMs: 50,
    simulated: true,
    expectedPeakVramGiB: 18.2,
  });

  sampler.start();
  await new Promise((resolve) => setTimeout(resolve, 250));
  const summary = sampler.stop();

  if (summary.samples_count < 2) {
    throw new Error(`Test 3 Failed: Expected at least 2 samples, got ${summary.samples_count}`);
  }
  if (summary.peak_vram_used_gib <= summary.idle_vram_gib) {
    throw new Error(`Test 3 Failed: Peak VRAM (${summary.peak_vram_used_gib}) should exceed idle VRAM (${summary.idle_vram_gib})`);
  }
  if (summary.peak_gpu_utilization_pct <= 0) {
    throw new Error(`Test 3 Failed: Invalid GPU utilization: ${summary.peak_gpu_utilization_pct}`);
  }
  console.log(`✓ Test 3 Passed: Telemetry sampler recorded ${summary.samples_count} samples. Peak VRAM: ${summary.peak_vram_used_gib} GiB.`);

  console.log("--- All Environment & Telemetry Tests Passed Successfully! ---");
}

runEnvCaptureTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
