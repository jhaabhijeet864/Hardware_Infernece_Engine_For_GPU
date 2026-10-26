import React, { useMemo } from 'react';
import {
  Desktop,
  CheckCircle,
  Warning,
  Cpu,
} from '@phosphor-icons/react';
import {
  WorkloadSpecification,
  matchProfilesForWorkload,
  PartnerMachineProfile,
  calculateWorkloadMemory,
} from '@/lib/engine';

interface PartnerDecisionMatrixProps {
  workload: WorkloadSpecification;
}

export const PartnerDecisionMatrix: React.FC<PartnerDecisionMatrixProps> = ({ workload }) => {
  const sizing = useMemo(() => calculateWorkloadMemory(workload), [workload]);
  const matching = useMemo(() => matchProfilesForWorkload(workload), [workload]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="scale-card rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <Desktop size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                OEM &amp; Turnkey Hardware Decision Matrix
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Pre-qualified physical machine architectures evaluated for <strong className="text-zinc-200">{workload.name}</strong> ({workload.modelId})
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            {matching.optimal.length} Optimal
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            {matching.plausible.length} Plausible
          </span>
        </div>
      </div>

      {/* Optimal Configurations Section */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em]">
          <CheckCircle size={16} className="text-emerald-400" weight="fill" />
          <span>Recommended Architectures (Comfortable VRAM &amp; SLA Margin)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matching.optimal.map((profile: PartnerMachineProfile) => {
            const headroomGiB = profile.gpu.totalVramGiB - sizing.peakMemory.totalVRAMRequiredGiB;
            return (
              <div
                key={profile.id}
                className="scale-card-interactive p-5 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <Cpu size={16} className="text-cyan-400" />
                        <span>{profile.name}</span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">{profile.targetMarket}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                      Procurement Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-white/[0.06] text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">ACCELERATOR</span>
                      <span className="font-semibold text-white">{profile.gpu.count}x {profile.gpu.model}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">TOTAL VRAM</span>
                      <span className="font-semibold text-cyan-300">{profile.gpu.totalVramGiB} GiB</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">EXPECTED TTFT</span>
                      <span className="font-semibold text-emerald-400">&lt; {profile.targetSlaGuidance.expectedTtftMs} ms</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">POWER &amp; PSU</span>
                      <span className="font-medium text-zinc-300">{profile.gpu.powerLimitW}W ({profile.host.recommendedPsuW}W PSU)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">Form Factor: <strong className="text-white capitalize">{profile.formFactor}</strong></span>
                  <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    +{headroomGiB.toFixed(1)} GiB Buffer
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alternative / Scale-out Configurations */}
      {matching.plausible.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em]">
            <Warning size={16} className="text-amber-400" weight="fill" />
            <span>Alternative High-Density Options (Plausible)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matching.plausible.map((profile: PartnerMachineProfile) => {
              const headroomGiB = profile.gpu.totalVramGiB - sizing.peakMemory.totalVRAMRequiredGiB;
              return (
                <div
                  key={profile.id}
                  className="scale-card-interactive p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          <Cpu size={16} className="text-amber-400" />
                          <span>{profile.name}</span>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">{profile.targetMarket}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                        Tight Headroom
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-white/[0.06] text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">GPU CONFIG</span>
                        <span className="font-semibold text-white">{profile.gpu.count}x {profile.gpu.model}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">TOTAL VRAM</span>
                        <span className="font-semibold text-zinc-200">{profile.gpu.totalVramGiB} GiB</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">EXPECTED TTFT</span>
                        <span className="font-medium text-amber-300">&lt; {profile.targetSlaGuidance.expectedTtftMs} ms</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">MAX STREAMS</span>
                        <span className="font-semibold text-white">{profile.maxConcurrencyEstimate} streams</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Form Factor: <strong className="text-white capitalize">{profile.formFactor}</strong></span>
                    <span className="text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      +{headroomGiB.toFixed(1)} GiB Margin
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
