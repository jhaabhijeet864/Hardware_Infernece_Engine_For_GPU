import type { QualificationRunBundle } from "@hardware-inference/types";

export interface BenchmarkDeltaSummary {
  memory: {
    analyticalTypicalGiB: number;
    analyticalPeakGiB: number;
    measuredPeakGiB: number;
    measuredIdleGiB: number;
    physicalCapacityGiB: number;
    deltaGiB: number;
    variancePct: number;
    headroomGiB: number;
    capacityUsedPct: number;
    calibrationInsight: string;
  };
  latency: {
    targetTtftMs: number;
    actualTtftP95: number;
    actualTtftMedian: number;
    actualTtftP99: number;
    ttftMarginMs: number;
    ttftPassed: boolean;

    targetItlMs: number;
    actualItlP95: number;
    actualItlMedian: number;
    actualItlP99: number;
    itlMarginMs: number;
    itlPassed: boolean;
  };
  goodput: {
    goodputPct: number;
    successfulRequests: number;
    failedRequests: number;
    oomEvents: number;
  };
  telemetry: {
    peakTemperatureC: number;
    averagePowerW: number;
    peakGpuUtilizationPct: number;
    isThrottled: boolean;
  };
}

/**
 * Computes deep variance and SLA margin analysis comparing analytical models against empirical benchmark data.
 */
export function computeBenchmarkDeltas(bundle: QualificationRunBundle): BenchmarkDeltaSummary {
  const physicalCapacity = bundle.environment.gpu.total_vram_gib;
  const analyticalTypical = bundle.analytical_estimate.typical_vram_gib;
  const analyticalPeak = bundle.analytical_estimate.peak_vram_gib;
  const measuredPeak = bundle.measured_results.telemetry.peak_vram_used_gib;
  const measuredIdle = bundle.measured_results.telemetry.idle_vram_gib;

  const deltaGiB = Number(Math.abs(measuredPeak - analyticalTypical).toFixed(2));
  const variancePct = Number((((measuredPeak - analyticalTypical) / analyticalTypical) * 100).toFixed(1));
  const headroomGiB = Number((physicalCapacity - measuredPeak).toFixed(2));
  const capacityUsedPct = Math.round((measuredPeak / physicalCapacity) * 100);

  let calibrationInsight: string;
  if (Math.abs(variancePct) <= 15) {
    calibrationInsight = "Empirical memory aligns closely with analytical predictions within standard PagedAttention allocation boundaries (±15%).";
  } else if (variancePct > 15) {
    calibrationInsight = `Measured peak VRAM is +${variancePct}% above analytical baseline, typical of transient activation spikes or framework allocator cache.`;
  } else {
    calibrationInsight = `Measured peak VRAM is ${variancePct}% below analytical baseline, indicating aggressive runtime memory optimizations (e.g. KV-cache paging).`;
  }

  const targetTtft = bundle.workload_spec.sla.maxTtftMs;
  const actualTtftP95 = bundle.measured_results.latencies.ttft_ms.p95;
  const actualTtftMedian = bundle.measured_results.latencies.ttft_ms.median;
  const actualTtftP99 = bundle.measured_results.latencies.ttft_ms.p99;
  const ttftMargin = Number((targetTtft - actualTtftP95).toFixed(1));
  const ttftPassed = actualTtftP95 <= targetTtft;

  const targetItl = bundle.workload_spec.sla.maxItlMs;
  const actualItlP95 = bundle.measured_results.latencies.itl_ms.p95;
  const actualItlMedian = bundle.measured_results.latencies.itl_ms.median;
  const actualItlP99 = bundle.measured_results.latencies.itl_ms.p99;
  const itlMargin = Number((targetItl - actualItlP95).toFixed(1));
  const itlPassed = actualItlP95 <= targetItl;

  const temp = bundle.measured_results.telemetry.peak_temperature_c;
  const isThrottled = temp >= 83.0; // NVIDIA thermal throttling threshold

  return {
    memory: {
      analyticalTypicalGiB: analyticalTypical,
      analyticalPeakGiB: analyticalPeak,
      measuredPeakGiB: measuredPeak,
      measuredIdleGiB: measuredIdle,
      physicalCapacityGiB: physicalCapacity,
      deltaGiB,
      variancePct,
      headroomGiB,
      capacityUsedPct,
      calibrationInsight,
    },
    latency: {
      targetTtftMs: targetTtft,
      actualTtftP95,
      actualTtftMedian,
      actualTtftP99,
      ttftMarginMs: ttftMargin,
      ttftPassed,
      targetItlMs: targetItl,
      actualItlP95,
      actualItlMedian,
      actualItlP99,
      itlMarginMs: itlMargin,
      itlPassed,
    },
    goodput: {
      goodputPct: bundle.measured_results.goodput_pct,
      successfulRequests: bundle.measured_results.reliability.successful_requests,
      failedRequests: bundle.measured_results.reliability.failed_requests,
      oomEvents: bundle.measured_results.reliability.oom_events,
    },
    telemetry: {
      peakTemperatureC: temp,
      averagePowerW: bundle.measured_results.telemetry.average_power_w,
      peakGpuUtilizationPct: bundle.measured_results.telemetry.peak_gpu_utilization_pct,
      isThrottled,
    },
  };
}
