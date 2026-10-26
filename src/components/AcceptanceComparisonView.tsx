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
    <div className="flex flex-col gap-6">
      {/* 1. Verdict Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isPassed
            ? "bg-gradient-to-r from-emerald-950/40 via-card to-card border-emerald-500/40"
            : "bg-gradient-to-r from-red-950/40 via-card to-card border-red-500/40"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                isPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {isPassed ? <CheckCircle size={32} weight="fill" /> : <XCircle size={32} weight="fill" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Hardware Qualification Verdict: {bundle.qualification_verdict.overall}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isPassed ? "Qualified for Deployment" : "Disqualified"}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                {bundle.qualification_verdict.recommendation}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end text-xs font-mono text-muted-foreground">
            <span className="text-slate-400">{bundle.metadata.qualification_profile}</span>
            <span className="text-cyan-400 truncate max-w-xs">{bundle.metadata.system_hash}</span>
          </div>
        </div>

        {/* 4-Point Checklist Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/70">
          {bundle.qualification_verdict.checks.map((check, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                check.passed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : "bg-red-500/10 border-red-500/30 text-red-200"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">{check.criterion}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{check.actual}</span>
              </div>
              {check.passed ? (
                <CheckCircle size={18} weight="bold" className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={18} weight="bold" className="text-red-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Analytical vs. Measured Memory Delta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ArrowsLeftRight size={18} className="text-primary" />
                VRAM Memory Footprint: Analytical vs. Measured
              </h4>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-highlight border border-border text-slate-300">
                Δ {deltas.memory.deltaGiB} GiB ({deltas.memory.variancePct > 0 ? `+${deltas.memory.variancePct}%` : `${deltas.memory.variancePct}%`})
              </span>
            </div>

            {/* Side by side comparison cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-surface-dark border border-border">
                <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">
                  Analytical Baseline
                </span>
                <div className="text-2xl font-bold font-mono text-white">
                  {deltas.memory.analyticalTypicalGiB}{" "}
                  <span className="text-sm font-normal text-muted-foreground">GiB</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Peak Stress: {deltas.memory.analyticalPeakGiB} GiB
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-dark border border-primary/40 shadow-[0_0_15px_rgba(182,66,240,0.1)]">
                <span className="text-xs text-primary uppercase font-bold block mb-1">
                  Measured Live Telemetry
                </span>
                <div className="text-2xl font-bold font-mono text-cyan-300">
                  {deltas.memory.measuredPeakGiB}{" "}
                  <span className="text-sm font-normal text-muted-foreground">GiB</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Idle Baseline: {deltas.memory.measuredIdleGiB} GiB
                </p>
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Physical GPU VRAM Utilization</span>
                <span className="text-white font-bold">
                  {deltas.memory.measuredPeakGiB} / {deltas.memory.physicalCapacityGiB} GiB ({deltas.memory.capacityUsedPct}%)
                </span>
              </div>
              <div className="h-3 w-full bg-surface-dark rounded-full overflow-hidden border border-border p-0.5">
                <div
                  className={`h-full rounded-full transition-all ${
                    deltas.memory.capacityUsedPct > 95
                      ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      : "bg-gradient-to-r from-primary to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  }`}
                  style={{ width: `${Math.min(100, deltas.memory.capacityUsedPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>0 GiB</span>
                <span>Headroom: {deltas.memory.headroomGiB} GiB</span>
                <span>{deltas.memory.physicalCapacityGiB} GiB</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-border/60">
            <strong className="text-white">Calibration Insight:</strong> {deltas.memory.calibrationInsight}
          </p>
        </div>

        {/* 3. Reliability & Goodput Gauge */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-cyan-400" />
              SLA Compliance &amp; Goodput
            </h4>

            <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-surface-dark border border-border mb-4">
              <div className="text-5xl font-mono font-bold text-white mb-1">
                <span className={deltas.goodput.goodputPct >= 95 ? "text-emerald-400" : "text-amber-400"}>
                  {deltas.goodput.goodputPct}%
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Service Level Objective Goodput
              </p>
              <p className="text-[11px] text-muted-foreground text-center mt-1">
                Requests satisfying both TTFT and ITL target boundaries
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-highlight border border-border text-center">
                <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                  Successful
                </span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {deltas.goodput.successfulRequests}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-highlight border border-border text-center">
                <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                  CUDA OOMs
                </span>
                <span
                  className={`text-lg font-mono font-bold ${
                    deltas.goodput.oomEvents === 0 ? "text-slate-300" : "text-red-400"
                  }`}
                >
                  {deltas.goodput.oomEvents}
                </span>
              </div>
            </div>
          </div>

          {/* Hardware Telemetry stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/70 text-center font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground block">Peak Temp</span>
              <span
                className={`text-xs font-bold ${
                  deltas.telemetry.isThrottled ? "text-red-400" : "text-white"
                }`}
              >
                {deltas.telemetry.peakTemperatureC}°C
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Avg Power</span>
              <span className="text-xs font-bold text-white">{deltas.telemetry.averagePowerW} W</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">GPU Load</span>
              <span className="text-xs font-bold text-cyan-400">
                {deltas.telemetry.peakGpuUtilizationPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Latency Distribution Percentiles vs. Target SLA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TTFT Card */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Speedometer size={18} className="text-cyan-400" />
              Time-to-First-Token (TTFT)
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${
                deltas.latency.ttftPassed
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-red-500/20 text-red-400 border border-red-500/40"
              }`}
            >
              {deltas.latency.ttftPassed
                ? `+${deltas.latency.ttftMarginMs}ms Headroom`
                : `${deltas.latency.ttftMarginMs}ms SLA Breach`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4 text-center font-mono">
            <div className="p-2.5 rounded-lg bg-surface-dark border border-border">
              <span className="text-[10px] text-muted-foreground block">P50 (Median)</span>
              <span className="text-sm font-bold text-white">{deltas.latency.actualTtftMedian}ms</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-dark border border-border">
              <span className="text-[10px] text-muted-foreground block">P90</span>
              <span className="text-sm font-bold text-white">
                {bundle.measured_results.latencies.ttft_ms.p90}ms
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-dark border border-cyan-500/40">
              <span className="text-[10px] text-cyan-400 block font-bold">P95 (SLA)</span>
              <span className="text-sm font-bold text-cyan-300">{deltas.latency.actualTtftP95}ms</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-dark border border-border">
              <span className="text-[10px] text-muted-foreground block">P99</span>
              <span className="text-sm font-bold text-white">{deltas.latency.actualTtftP99}ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Customer SLA Gate: &lt; {deltas.latency.targetTtftMs} ms</span>
            <span className={deltas.latency.ttftPassed ? "text-emerald-400" : "text-red-400"}>
              {deltas.latency.ttftPassed ? "✓ Compliant" : "✗ Non-compliant"}
            </span>
          </div>
        </div>

        {/* ITL Card */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Pulse size={18} className="text-primary" />
              Inter-Token Latency (ITL / TPOT)
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${
                deltas.latency.itlPassed
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-red-500/20 text-red-400 border border-red-500/40"
              }`}
            >
              {deltas.latency.itlPassed
                ? `+${deltas.latency.itlMarginMs}ms Headroom`
                : `${deltas.latency.itlMarginMs}ms SLA Breach`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4 text-center font-mono">
            <div className="p-2.5 rounded-lg bg-surface-dark border border-border">
              <span className="text-[10px] text-muted-foreground block">P50 (Median)</span>
              <span className="text-sm font-bold text-white">{deltas.latency.actualItlMedian}ms</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-dark border border-border">
              <span className="text-[10px] text-muted-foreground block">P90</span>
              <span className="text-sm font-bold text-white">
                {bundle.measured_results.latencies.itl_ms.p90}ms
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-dark border border-primary/40">
              <span className="text-[10px] text-primary block font-bold">P95 (SLA)</span>
              <span className="text-sm font-bold text-purple-300">{deltas.latency.actualItlP95}ms</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-dark border border-border">
              <span className="text-[10px] text-muted-foreground block">P99</span>
              <span className="text-sm font-bold text-white">{deltas.latency.actualItlP99}ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
