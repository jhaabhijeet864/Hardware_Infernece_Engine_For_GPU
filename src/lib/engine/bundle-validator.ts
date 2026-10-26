import type { QualificationRunBundle } from "../../cli/bundle-builder";

export interface ValidationResult {
  valid: boolean;
  bundle?: QualificationRunBundle;
  errors: string[];
}

/**
 * Validates a loaded or uploaded object against the qualification-run.json specification.
 */
export function validateQualificationBundle(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Bundle payload is not a valid JSON object."] };
  }

  const b = data as Partial<QualificationRunBundle>;

  // 1. Metadata check
  if (!b.metadata || typeof b.metadata !== "object") {
    errors.push("Missing required 'metadata' section.");
  } else {
    if (!b.metadata.run_id) errors.push("Missing 'metadata.run_id'.");
    if (!b.metadata.timestamp) errors.push("Missing 'metadata.timestamp'.");
    if (!b.metadata.system_hash) errors.push("Missing 'metadata.system_hash'.");
  }

  // 2. Environment check
  if (!b.environment || typeof b.environment !== "object") {
    errors.push("Missing required 'environment' section.");
  } else {
    if (!b.environment.gpu || typeof b.environment.gpu !== "object") {
      errors.push("Missing 'environment.gpu' specification.");
    } else {
      if (!b.environment.gpu.model) errors.push("Missing 'environment.gpu.model'.");
      if (typeof b.environment.gpu.total_vram_gib !== "number") {
        errors.push("Missing or invalid numeric 'environment.gpu.total_vram_gib'.");
      }
    }
  }

  // 3. Workload Spec check
  if (!b.workload_spec || typeof b.workload_spec !== "object") {
    errors.push("Missing required 'workload_spec' section.");
  } else {
    if (!b.workload_spec.modelId) errors.push("Missing 'workload_spec.modelId'.");
    if (typeof b.workload_spec.concurrency !== "number") {
      errors.push("Missing or invalid numeric 'workload_spec.concurrency'.");
    }
    if (!b.workload_spec.sla || typeof b.workload_spec.sla !== "object") {
      errors.push("Missing 'workload_spec.sla' targets.");
    }
  }

  // 4. Measured Results check
  if (!b.measured_results || typeof b.measured_results !== "object") {
    errors.push("Missing required 'measured_results' section.");
  } else {
    if (!b.measured_results.telemetry || typeof b.measured_results.telemetry.peak_vram_used_gib !== "number") {
      errors.push("Missing or invalid 'measured_results.telemetry.peak_vram_used_gib'.");
    }
    if (!b.measured_results.latencies || typeof b.measured_results.latencies !== "object") {
      errors.push("Missing 'measured_results.latencies' distribution.");
    } else {
      if (!b.measured_results.latencies.ttft_ms?.p95 && b.measured_results.latencies.ttft_ms?.p95 !== 0) {
        errors.push("Missing 'measured_results.latencies.ttft_ms.p95'.");
      }
      if (!b.measured_results.latencies.itl_ms?.p95 && b.measured_results.latencies.itl_ms?.p95 !== 0) {
        errors.push("Missing 'measured_results.latencies.itl_ms.p95'.");
      }
    }
  }

  // 5. Verdict check
  if (!b.qualification_verdict || typeof b.qualification_verdict !== "object") {
    errors.push("Missing required 'qualification_verdict' section.");
  } else {
    if (b.qualification_verdict.overall !== "PASSED" && b.qualification_verdict.overall !== "FAILED") {
      errors.push("Invalid 'qualification_verdict.overall': must be 'PASSED' or 'FAILED'.");
    }
    if (!Array.isArray(b.qualification_verdict.checks) || b.qualification_verdict.checks.length === 0) {
      errors.push("Missing qualification checklist array in 'qualification_verdict.checks'.");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    bundle: data as QualificationRunBundle,
    errors: [],
  };
}
