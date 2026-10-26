import React, { useMemo } from 'react';
import {
  Desktop,
  CheckCircle,
  Warning,
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
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Desktop size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-white">OEM &amp; Partner Hardware Decision Matrix</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pre-qualified physical machine architectures evaluated for <strong>{workload.name}</strong> ({workload.modelId})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            {matching.optimal.length} Optimal Configurations
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            {matching.plausible.length} Plausible
          </span>
        </div>
      </div>

      {/* Optimal Configurations Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Recommended Architectures (Comfortable SLA &amp; VRAM Margin)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matching.optimal.map((profile: PartnerMachineProfile) => {
            const headroomGiB = profile.gpu.totalVramGiB - sizing.peakMemory.totalVRAMRequiredGiB;
            return (
              <div
                key={profile.id}
                className="p-5 rounded-xl bg-card border border-emerald-500/40 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-bl-lg">
                  READY FOR PROCUREMENT
                </div>

                <div>
                  <div className="text-base font-bold text-white">{profile.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{profile.targetMarket}</div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/50 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">ACCELERATOR</span>
                      <span className="font-semibold text-slate-200">{profile.gpu.count}x {profile.gpu.model}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">TOTAL VRAM</span>
                      <span className="font-semibold text-cyan-400">{profile.gpu.totalVramGiB} GiB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">EXPECTED TTFT</span>
                      <span className="font-semibold text-emerald-400">&lt; {profile.targetSlaGuidance.expectedTtftMs} ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">POWER &amp; PSU</span>
                      <span className="font-semibold text-amber-400">{profile.gpu.powerLimitW}W ({profile.host.recommendedPsuW}W PSU)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Form Factor: <strong className="text-slate-300 capitalize">{profile.formFactor}</strong></span>
                  <span className="text-emerald-400 font-mono font-medium">Headroom: +{headroomGiB.toFixed(1)} GiB</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alternative / Scale-out Configurations */}
      {matching.plausible.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Warning size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Alternative / High-Density Options (Plausible)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matching.plausible.map((profile: PartnerMachineProfile) => {
              const headroomGiB = profile.gpu.totalVramGiB - sizing.peakMemory.totalVRAMRequiredGiB;
              return (
                <div
                  key={profile.id}
                  className="p-5 rounded-xl bg-card border border-amber-500/30 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-base font-bold text-white">{profile.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{profile.targetMarket}</div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/50 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">GPU CONFIG</span>
                        <span className="font-semibold text-slate-200">{profile.gpu.count}x {profile.gpu.model}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">TOTAL VRAM</span>
                        <span className="font-semibold text-amber-300">{profile.gpu.totalVramGiB} GiB</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">EXPECTED TTFT</span>
                        <span className="font-semibold text-slate-200">&lt; {profile.targetSlaGuidance.expectedTtftMs} ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">EST. MAX CONCURRENCY</span>
                        <span className="font-semibold text-purple-400">{profile.maxConcurrencyEstimate} streams</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Form Factor: <strong className="text-slate-300 capitalize">{profile.formFactor}</strong></span>
                    <span className="text-amber-400 font-mono font-medium">Headroom: +{headroomGiB.toFixed(1)} GiB</span>
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
