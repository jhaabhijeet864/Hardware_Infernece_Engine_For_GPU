import {
  getAllPartnerProfiles,
  getPartnerProfileById,
  matchProfilesForWorkload,
} from "../partner-matrix";
import { WORKLOAD_ARCHETYPES } from "../workload";

async function runPartnerMatrixTests() {
  console.log("--- Starting Partner Machine Matrix Verification Tests ---");

  // Test 1: Hardware sanity checks
  const profiles = getAllPartnerProfiles();
  if (profiles.length < 4) {
    throw new Error(`Test 1 Failed: Expected at least 4 partner profiles, found ${profiles.length}`);
  }

  for (const p of profiles) {
    if (p.gpu.totalVramGiB <= 0 || p.gpu.powerLimitW <= 0) {
      throw new Error(`Test 1 Failed: Invalid specs on profile ${p.id}`);
    }
    if (!["workstation", "rackmount-server", "edge-appliance"].includes(p.formFactor)) {
      throw new Error(`Test 1 Failed: Invalid form factor ${p.formFactor} on ${p.id}`);
    }
  }
  console.log(`✓ Test 1 Passed: All ${profiles.length} partner machine configurations verified with physical specs.`);

  // Test 2: Profile lookup
  const dual4090 = getPartnerProfileById("dual-rtx-4090-workstation");
  if (!dual4090 || dual4090.gpu.count !== 2 || dual4090.gpu.totalVramGiB !== 48.0) {
    throw new Error("Test 2 Failed: dual-rtx-4090-workstation profile lookup failed or has invalid specs.");
  }
  console.log("✓ Test 2 Passed: Partner profile lookup and attribute extraction verified.");

  // Test 3: Workload matching for Enterprise RAG
  const ragWorkload = WORKLOAD_ARCHETYPES.find((a) => a.id === "enterprise-rag")!;
  const matchResult = matchProfilesForWorkload(ragWorkload);

  if (matchResult.optimal.length === 0 && matchResult.plausible.length === 0) {
    throw new Error("Test 3 Failed: No partner profiles matched Enterprise RAG.");
  }
  const hasHighVramMatch = [...matchResult.optimal, ...matchResult.plausible].some(
    (p) => p.gpu.totalVramGiB >= 24.0
  );
  if (!hasHighVramMatch) {
    throw new Error("Test 3 Failed: Workload requires at least 24GB, but none matched.");
  }
  console.log(`✓ Test 3 Passed: Workload matching verified. Optimal: ${matchResult.optimal.length}, Plausible: ${matchResult.plausible.length}.`);

  console.log("--- All Partner Machine Matrix Tests Passed Successfully! ---");
}

runPartnerMatrixTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
