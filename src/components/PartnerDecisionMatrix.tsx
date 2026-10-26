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
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-[#11131a] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Desktop size={18} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              OEM &amp; Turnkey Hardware Decision Matrix
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Pre-qualified physical machine architectures evaluated for <strong>{workload.name}</strong> ({workload.modelId})
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            {matching.optimal.length} Optimal
          </span>
          <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            {matching.plausible.length} Plausible
          </span>
        </div>
      </div>

      {/* Optimal Configurations Section */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          <CheckCircle size={15} className="text-emerald-400" />
          <span>Recommended Architectures (Comfortable VRAM &amp; SLA Margin)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {matching.optimal.map((profile: PartnerMachineProfile) => {
            const headroomGiB = profile.gpu.totalVramGiB - sizing.peakMemory.totalVRAMRequiredGiB;
            return (
              <div
                key={profile.id}
                className="p-4 rounded-lg bg-[#0e1017] border border-border hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Cpu size={15} className="text-primary" />
                        <span>{profile.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{profile.targetMarket}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                      Procurement Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/60 text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">ACCELERATOR</span>
                      <span className="font-medium text-foreground">{profile.gpu.count}x {profile.gpu.model}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">TOTAL VRAM</span>
                      <span className="font-medium text-foreground">{profile.gpu.totalVramGiB} GiB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">EXPECTED TTFT</span>
                      <span className="font-medium text-emerald-400">&lt; {profile.targetSlaGuidance.expectedTtftMs} ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">POWER &amp; PSU</span>
                      <span className="font-medium text-slate-300">{profile.gpu.powerLimitW}W ({profile.host.recommendedPsuW}W PSU)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Form Factor: <strong className="text-foreground capitalize">{profile.formFactor}</strong></span>
                  <span className="text-emerald-400 font-medium">Headroom: +{headroomGiB.toFixed(1)} GiB</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alternative / Scale-out Configurations */}
      {matching.plausible.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            <Warning size={15} className="text-amber-400" />
            <span>Alternative High-Density Options (Plausible)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {matching.plausible.map((profile: PartnerMachineProfile) => {
              const headroomGiB = profile.gpu.totalVramGiB - sizing.peakMemory.totalVRAMRequiredGiB;
              return (
                <div
                  key={profile.id}
                  className="p-4 rounded-lg bg-[#0e1017] border border-border hover:border-amber-500/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <Cpu size={15} className="text-amber-400" />
                          <span>{profile.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{profile.targetMarket}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                        Tight Headroom
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/60 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">GPU CONFIG</span>
                        <span className="font-medium text-foreground">{profile.gpu.count}x {profile.gpu.model}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">TOTAL VRAM</span>
                        <span className="font-medium text-foreground">{profile.gpu.totalVramGiB} GiB</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">EXPECTED TTFT</span>
                        <span className="font-medium text-slate-300">&lt; {profile.targetSlaGuidance.expectedTtftMs} ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">MAX STREAMS</span>
                        <span className="font-medium text-foreground">{profile.maxConcurrencyEstimate} streams</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Form Factor: <strong className="text-foreground capitalize">{profile.formFactor}</strong></span>
                    <span className="text-amber-400 font-medium">Headroom: +{headroomGiB.toFixed(1)} GiB</span>
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
