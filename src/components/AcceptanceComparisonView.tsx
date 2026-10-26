import React, { useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Speedometer,
  Pulse,
  ArrowsLeftRight,
  ShieldCheck,
} from "@phosphor-icons/react";
import { computeBenchmarkDeltas } from "@/lib/engine/delta-analysis";
import type { QualificationRunBundle } from "../../cli/bundle-builder";

interface AcceptanceComparisonViewProps {
  bundle: QualificationRunBundle;
}

export const AcceptanceComparisonView: React.FC<AcceptanceComparisonViewProps> = ({ bundle }) => {
  const deltas = useMemo(() => computeBenchmarkDeltas(bundle), [bundle]);
  const isPassed = bundle.qualification_verdict.overall === "PASSED";

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Verdict Banner */}
      <div
        className={`p-5 rounded-xl border transition-all ${
          isPassed
            ? "bg-[#0d1713] border-emerald-500/40"
            : "bg-[#190e10] border-red-500/40"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                isPassed ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              {isPassed ? <CheckCircle size={26} weight="fill" /> : <XCircle size={26} weight="fill" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Hardware Qualification Verdict: {bundle.qualification_verdict.overall}
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isPassed ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}
                >
                  {isPassed ? "Qualified for Deployment" : "Disqualified"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1 max-w-3xl">
                {bundle.qualification_verdict.recommendation}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end text-xs font-mono text-muted-foreground">
            <span className="text-slate-300 font-medium">{bundle.metadata.qualification_profile}</span>
            <span className="text-slate-400 truncate max-w-xs">{bundle.metadata.system_hash}</span>
          </div>
        </div>

        {/* 4-Point Checklist Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-border/60">
          {bundle.qualification_verdict.checks.map((check, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                check.passed
                  ? "bg-[#0b1410] border-emerald-500/25 text-emerald-300"
                  : "bg-[#180a0c] border-red-500/25 text-red-300"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{check.criterion}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{check.actual}</span>
              </div>
              {check.passed ? (
                <CheckCircle size={16} weight="bold" className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={16} weight="bold" className="text-red-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Analytical vs. Measured Memory Delta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 p-5 rounded-xl bg-[#11131a] border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ArrowsLeftRight size={15} className="text-primary" />
                VRAM Memory Footprint: Analytical vs. Measured
              </h4>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b24] border border-border text-slate-300 font-medium">
                Δ {deltas.memory.deltaGiB} GiB ({deltas.memory.variancePct > 0 ? `+${deltas.memory.variancePct}%` : `${deltas.memory.variancePct}%`})
              </span>
            </div>

            {/* Side by side comparison cards */}
            <div className="grid grid-cols-2 gap-3.5 mb-5">
              <div className="p-3.5 rounded-lg bg-[#0e1017] border border-border">
                <span className="text-[11px] text-muted-foreground uppercase font-mono font-medium block mb-1">
                  Analytical Baseline
                </span>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {deltas.memory.analyticalTypicalGiB}{" "}
                  <span className="text-sm font-normal text-muted-foreground">GiB</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                  Peak Stress: <strong className="text-slate-300">{deltas.memory.analyticalPeakGiB} GiB</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e1017] border border-primary/30">
                <span className="text-[11px] text-primary uppercase font-mono font-medium block mb-1">
                  Measured Live Telemetry
                </span>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {deltas.memory.measuredPeakGiB}{" "}
                  <span className="text-sm font-normal text-muted-foreground">GiB</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                  Idle Baseline: <strong className="text-slate-300">{deltas.memory.measuredIdleGiB} GiB</strong>
                </p>
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Physical GPU VRAM Utilization</span>
                <span className="text-foreground font-bold">
                  {deltas.memory.measuredPeakGiB} / {deltas.memory.physicalCapacityGiB} GiB ({deltas.memory.capacityUsedPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#181b24] rounded-full overflow-hidden border border-border">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    deltas.memory.capacityUsedPct > 95
                      ? "bg-red-500"
                      : "bg-emerald-400"
                  }`}
                  style={{ width: `${Math.min(100, deltas.memory.capacityUsedPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>0 GiB</span>
                <span>Headroom: <strong className="text-foreground">{deltas.memory.headroomGiB} GiB</strong></span>
                <span>{deltas.memory.physicalCapacityGiB} GiB</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-mono mt-5 pt-3 border-t border-border">
            <strong className="text-foreground">Calibration Insight:</strong> {deltas.memory.calibrationInsight}
          </p>
        </div>

        {/* 3. Reliability & Goodput Gauge */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-[#11131a] border border-border flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <ShieldCheck size={15} className="text-primary" />
              SLA Compliance &amp; Goodput
            </h4>

            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#0e1017] border border-border mb-3.5">
              <div className="text-4xl font-mono font-bold text-foreground mb-0.5">
                <span className={deltas.goodput.goodputPct >= 95 ? "text-emerald-400" : "text-amber-400"}>
                  {deltas.goodput.goodputPct}%
                </span>
              </div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                SLO Goodput
              </p>
              <p className="text-[11px] text-muted-foreground font-mono text-center mt-0.5">
                Requests satisfying both TTFT and ITL boundaries
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-[#0e1017] border border-border text-center font-mono">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                  Successful Requests
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {deltas.goodput.successfulRequests}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0e1017] border border-border text-center font-mono">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                  CUDA OOM Events
                </span>
                <span
                  className={`text-base font-bold ${
                    deltas.goodput.oomEvents === 0 ? "text-slate-400" : "text-red-400"
                  }`}
                >
                  {deltas.goodput.oomEvents}
                </span>
              </div>
            </div>
          </div>

          {/* Hardware Telemetry stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border text-center font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground block">Peak Temp</span>
              <span
                className={`text-xs font-bold ${
                  deltas.telemetry.isThrottled ? "text-red-400" : "text-foreground"
                }`}
              >
                {deltas.telemetry.peakTemperatureC}°C
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Avg Power</span>
              <span className="text-xs font-bold text-foreground">{deltas.telemetry.averagePowerW} W</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">GPU Load</span>
              <span className="text-xs font-bold text-primary">
                {deltas.telemetry.peakGpuUtilizationPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Latency Distribution Percentiles vs. Target SLA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* TTFT Card */}
        <div className="p-5 rounded-xl bg-[#11131a] border border-border">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Speedometer size={15} className="text-primary" />
              Time-to-First-Token (TTFT)
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                deltas.latency.ttftPassed
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}
            >
              {deltas.latency.ttftPassed
                ? `+${deltas.latency.ttftMarginMs}ms Headroom`
                : `${deltas.latency.ttftMarginMs}ms SLA Breach`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3.5 text-center font-mono">
            <div className="p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-[10px] text-muted-foreground block">P50 (Median)</span>
              <span className="text-xs font-bold text-foreground">{deltas.latency.actualTtftMedian}ms</span>
            </div>
            <div className="p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-[10px] text-muted-foreground block">P90</span>
              <span className="text-xs font-bold text-foreground">
                {bundle.measured_results.latencies.ttft_ms.p90}ms
              </span>
            </div>
            <div className="p-2 rounded bg-[#0e1017] border border-primary/30">
              <span className="text-[10px] text-primary block font-semibold">P95 (SLA)</span>
              <span className="text-xs font-bold text-foreground">{deltas.latency.actualTtftP95}ms</span>
            </div>
            <div className="p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-[10px] text-muted-foreground block">P99</span>
              <span className="text-xs font-bold text-foreground">{deltas.latency.actualTtftP99}ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>Customer SLA Gate: &lt; {deltas.latency.targetTtftMs} ms</span>
            <span className={deltas.latency.ttftPassed ? "text-emerald-400" : "text-red-400"}>
              {deltas.latency.ttftPassed ? "✓ Compliant" : "✗ Non-compliant"}
            </span>
          </div>
        </div>

        {/* ITL Card */}
        <div className="p-5 rounded-xl bg-[#11131a] border border-border">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Pulse size={15} className="text-primary" />
              Inter-Token Latency (ITL / TPOT)
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                deltas.latency.itlPassed
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}
            >
              {deltas.latency.itlPassed
                ? `+${deltas.latency.itlMarginMs}ms Headroom`
                : `${deltas.latency.itlMarginMs}ms SLA Breach`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3.5 text-center font-mono">
            <div className="p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-[10px] text-muted-foreground block">P50 (Median)</span>
              <span className="text-xs font-bold text-foreground">{deltas.latency.actualItlMedian}ms</span>
            </div>
            <div className="p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-[10px] text-muted-foreground block">P90</span>
              <span className="text-xs font-bold text-foreground">
                {bundle.measured_results.latencies.itl_ms.p90}ms
              </span>
            </div>
            <div className="p-2 rounded bg-[#0e1017] border border-primary/30">
              <span className="text-[10px] text-primary block font-semibold">P95 (SLA)</span>
              <span className="text-xs font-bold text-foreground">{deltas.latency.actualItlP95}ms</span>
            </div>
            <div className="p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-[10px] text-muted-foreground block">P99</span>
              <span className="text-xs font-bold text-foreground">{deltas.latency.actualItlP99}ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>Customer SLA Gate: &lt; {deltas.latency.targetItlMs} ms</span>
            <span className={deltas.latency.itlPassed ? "text-emerald-400" : "text-red-400"}>
              {deltas.latency.itlPassed ? "✓ Compliant" : "✗ Non-compliant"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
