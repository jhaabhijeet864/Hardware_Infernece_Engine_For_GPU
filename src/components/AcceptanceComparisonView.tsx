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
        className={`p-6 sm:p-7 rounded-2xl border transition-all relative overflow-hidden ${
          isPassed
            ? "bg-[#091512]/80 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            : "bg-[#180a0d]/80 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                isPassed
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {isPassed ? <CheckCircle size={28} weight="fill" /> : <XCircle size={28} weight="fill" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                  Qualification Verdict: {bundle.qualification_verdict.overall}
                </h3>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isPassed
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}
                >
                  {isPassed ? "Certified for Serving" : "Disqualified"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-mono mt-1 max-w-3xl leading-relaxed">
                {bundle.qualification_verdict.recommendation}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end text-xs font-mono text-zinc-400">
            <span className="text-white font-medium">{bundle.metadata.qualification_profile}</span>
            <span className="text-zinc-400 truncate max-w-xs text-[11px] mt-0.5">{bundle.metadata.system_hash}</span>
          </div>
        </div>

        {/* 4-Point Checklist Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/[0.08]">
          {bundle.qualification_verdict.checks.map((check, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${
                check.passed
                  ? "bg-emerald-500/[0.06] border-emerald-500/25 text-emerald-300"
                  : "bg-red-500/[0.06] border-red-500/25 text-red-300"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white">{check.criterion}</span>
                <span className="text-[11px] font-mono opacity-80">{check.actual}</span>
              </div>
              {check.passed ? (
                <CheckCircle size={17} weight="bold" className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={17} weight="bold" className="text-red-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Analytical vs. Measured Memory Delta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 scale-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <ArrowsLeftRight size={16} className="text-cyan-400" />
                VRAM Footprint: Analytical vs. Measured
              </h4>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-white font-medium">
                Δ {deltas.memory.deltaGiB} GiB ({deltas.memory.variancePct > 0 ? `+${deltas.memory.variancePct}%` : `${deltas.memory.variancePct}%`})
              </span>
            </div>

            {/* Side by side comparison cards */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-4 rounded-xl scale-card-interactive">
                <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold tracking-wider block mb-1">
                  Analytical Baseline
                </span>
                <div className="text-3xl font-bold font-mono text-white">
                  {deltas.memory.analyticalTypicalGiB}{" "}
                  <span className="text-sm font-normal text-zinc-400">GiB</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                  Peak Stress: <strong className="text-zinc-200">{deltas.memory.analyticalPeakGiB} GiB</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl scale-card-interactive border-cyan-400/40">
                <span className="text-[10px] text-cyan-300 uppercase font-mono font-semibold tracking-wider block mb-1">
                  Measured Live Telemetry
                </span>
                <div className="text-3xl font-bold font-mono text-cyan-300">
                  {deltas.memory.measuredPeakGiB}{" "}
                  <span className="text-sm font-normal text-zinc-400">GiB</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                  Idle Baseline: <strong className="text-zinc-200">{deltas.memory.measuredIdleGiB} GiB</strong>
                </p>
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Physical GPU VRAM Allocation</span>
                <span className="text-white font-bold">
                  {deltas.memory.measuredPeakGiB} / {deltas.memory.physicalCapacityGiB} GiB ({deltas.memory.capacityUsedPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.08] p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    deltas.memory.capacityUsedPct > 95
                      ? "bg-gradient-to-r from-red-500 to-rose-400"
                      : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  }`}
                  style={{ width: `${Math.min(100, deltas.memory.capacityUsedPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono pt-1">
                <span>0 GiB</span>
                <span>Buffer Headroom: <strong className="text-emerald-400">+{deltas.memory.headroomGiB} GiB</strong></span>
                <span>{deltas.memory.physicalCapacityGiB} GiB</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 font-mono mt-6 pt-3.5 border-t border-white/[0.06]">
            <strong className="text-white">Calibration Insight:</strong> {deltas.memory.calibrationInsight}
          </p>
        </div>

        {/* 3. Reliability & Goodput Gauge */}
        <div className="lg:col-span-5 scale-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.08]">
              <ShieldCheck size={16} className="text-cyan-400" />
              SLA Compliance &amp; Goodput
            </h4>

            <div className="flex flex-col items-center justify-center p-5 rounded-xl scale-card-interactive mb-4">
              <div className="text-5xl font-mono font-bold mb-1">
                <span className={deltas.goodput.goodputPct >= 95 ? "text-emerald-400" : "text-amber-400"}>
                  {deltas.goodput.goodputPct}%
                </span>
              </div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                SLO Goodput
              </p>
              <p className="text-[11px] text-zinc-400 font-mono text-center mt-1">
                Requests satisfying both TTFT and ITL SLA boundaries
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center font-mono">
                <span className="text-[10px] uppercase text-zinc-400 font-semibold block mb-0.5">
                  Successful Requests
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  {deltas.goodput.successfulRequests}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center font-mono">
                <span className="text-[10px] uppercase text-zinc-400 font-semibold block mb-0.5">
                  CUDA OOM Events
                </span>
                <span
                  className={`text-lg font-bold ${
                    deltas.goodput.oomEvents === 0 ? "text-zinc-400" : "text-red-400"
                  }`}
                >
                  {deltas.goodput.oomEvents}
                </span>
              </div>
            </div>
          </div>

          {/* Hardware Telemetry stats */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-3.5 border-t border-white/[0.06] text-center font-mono">
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 block">Peak Temp</span>
              <span
                className={`text-xs font-bold ${
                  deltas.telemetry.isThrottled ? "text-red-400" : "text-white"
                }`}
              >
                {deltas.telemetry.peakTemperatureC}°C
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 block">Avg Power</span>
              <span className="text-xs font-bold text-white">{deltas.telemetry.averagePowerW} W</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 block">GPU Load</span>
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
        <div className="scale-card rounded-2xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <Speedometer size={16} className="text-cyan-400" />
              Time-to-First-Token (TTFT)
            </h4>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
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

          <div className="grid grid-cols-4 gap-2.5 mb-4 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">P50</span>
              <span className="text-xs font-bold text-white">{deltas.latency.actualTtftMedian}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">P90</span>
              <span className="text-xs font-bold text-white">
                {bundle.measured_results.latencies.ttft_ms.p90}ms
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-cyan-400/40">
              <span className="text-[10px] text-cyan-300 block font-semibold">P95 (SLA)</span>
              <span className="text-xs font-bold text-white">{deltas.latency.actualTtftP95}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">P99</span>
              <span className="text-xs font-bold text-white">{deltas.latency.actualTtftP99}ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Customer SLA Gate: &lt; {deltas.latency.targetTtftMs} ms</span>
            <span className={deltas.latency.ttftPassed ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
              {deltas.latency.ttftPassed ? "✓ Compliant" : "✗ Non-compliant"}
            </span>
          </div>
        </div>

        {/* ITL Card */}
        <div className="scale-card rounded-2xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <Pulse size={16} className="text-cyan-400" />
              Inter-Token Latency (ITL / TPOT)
            </h4>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
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

          <div className="grid grid-cols-4 gap-2.5 mb-4 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">P50</span>
              <span className="text-xs font-bold text-white">{deltas.latency.actualItlMedian}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">P90</span>
              <span className="text-xs font-bold text-white">
                {bundle.measured_results.latencies.itl_ms.p90}ms
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-cyan-400/40">
              <span className="text-[10px] text-cyan-300 block font-semibold">P95 (SLA)</span>
              <span className="text-xs font-bold text-white">{deltas.latency.actualItlP95}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">P99</span>
              <span className="text-xs font-bold text-white">{deltas.latency.actualItlP99}ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Customer SLA Gate: &lt; {deltas.latency.targetItlMs} ms</span>
            <span className={deltas.latency.itlPassed ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
              {deltas.latency.itlPassed ? "✓ Compliant" : "✗ Non-compliant"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
