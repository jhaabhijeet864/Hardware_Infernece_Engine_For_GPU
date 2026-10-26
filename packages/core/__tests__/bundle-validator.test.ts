import { validateQualificationBundle } from "../bundle-validator";
import {
  SAMPLE_RUN_RAG_4090_PASS,
  SAMPLE_RUN_CHATBOT_2050_FAIL,
  SAMPLE_RUN_CODE_L40S_PASS,
} from "../../fixtures/sample-runs";

async function runValidatorTests() {
  console.log("--- Starting Bundle Validator Verification Tests ---");

  // Test 1: All built-in sample fixtures pass validation
  const r1 = validateQualificationBundle(SAMPLE_RUN_RAG_4090_PASS);
  if (!r1.valid || !r1.bundle) {
    throw new Error(`Test 1 Failed: Sample RAG bundle invalid: ${r1.errors.join(", ")}`);
  }

  const r2 = validateQualificationBundle(SAMPLE_RUN_CHATBOT_2050_FAIL);
  if (!r2.valid || !r2.bundle) {
    throw new Error(`Test 1 Failed: Sample Chatbot bundle invalid: ${r2.errors.join(", ")}`);
  }

  const r3 = validateQualificationBundle(SAMPLE_RUN_CODE_L40S_PASS);
  if (!r3.valid || !r3.bundle) {
    throw new Error(`Test 1 Failed: Sample Code bundle invalid: ${r3.errors.join(", ")}`);
  }
  console.log("✓ Test 1 Passed: All 3 standard qualification sample fixtures pass validation.");

  // Test 2: Incomplete payload rejection
  const badPayload = {
    metadata: { run_id: "test" },
  };
  const rBad = validateQualificationBundle(badPayload);
  if (rBad.valid) {
    throw new Error("Test 2 Failed: Incomplete payload was incorrectly marked valid.");
  }
  if (rBad.errors.length < 3) {
    throw new Error(`Test 2 Failed: Expected multiple validation errors, got ${rBad.errors.length}`);
  }
  console.log(`✓ Test 2 Passed: Incomplete payload rejected with ${rBad.errors.length} explicit field errors.`);

  // Test 3: Invalid verdict rejection
  const badVerdict = {
    ...SAMPLE_RUN_RAG_4090_PASS,
    qualification_verdict: {
      overall: "MAYBE",
      checks: [],
    },
  };
  const rVerdict = validateQualificationBundle(badVerdict);
  if (rVerdict.valid) {
    throw new Error("Test 3 Failed: Invalid verdict string was accepted.");
  }
  console.log("✓ Test 3 Passed: Invalid verdict string rejected.");

  console.log("--- All Bundle Validator Tests Passed Successfully! ---");
}

runValidatorTests().catch((err) => {
  console.error("Validator verification failed:", err);
  process.exit(1);
});
