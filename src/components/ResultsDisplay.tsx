import { TriangleAlert, Cpu, Sparkle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { MemoryBreakdown } from '@/lib/types'
import { EnhancedMemoryBreakdown } from '@/lib/calculator'
import { WorkloadMemorySizing } from '@/lib/engine'

interface ResultsDisplayProps {
  memoryBreakdown: MemoryBreakdown | EnhancedMemoryBreakdown
  workloadSizing?: WorkloadMemorySizing
}

export function ResultsDisplay({ memoryBreakdown, workloadSizing }: ResultsDisplayProps) {
  const totalGiB = workloadSizing ? workloadSizing.typicalMemory.totalVRAMRequiredGiB : memoryBreakdown.total
  const peakGiB = workloadSizing ? workloadSizing.peakMemory.totalVRAMRequiredGiB : undefined
  const tp = workloadSizing?.typicalMemory.tensorParallelSize ?? 1
  const perGpuPeak = workloadSizing?.peakMemory.perGpuVRAMRequiredGiB

  const showSingleGpuWarning = tp === 1 && totalGiB > 80
  const enhanced = memoryBreakdown as EnhancedMemoryBreakdown
  const status = enhanced.status || 'Analytical Estimate'
  const decimalGB = (totalGiB * 1.07374).toFixed(1)

  const weights = workloadSizing ? workloadSizing.typicalMemory.weightsGiB : memoryBreakdown.modelWeights
  const kvCache = workloadSizing ? workloadSizing.typicalMemory.kvCacheGiB : memoryBreakdown.kvCache
  const overhead = workloadSizing 
    ? parseFloat((workloadSizing.typicalMemory.activationOverheadGiB + workloadSizing.typicalMemory.cudaContextGiB).toFixed(2))
    : memoryBreakdown.overhead

  // Calculate percentages for segmented bar
  const totalSafe = Math.max(0.1, totalGiB)
  const pctWeights = Math.min(100, Math.max(5, (weights / totalSafe) * 100))
  const pctKv = Math.min(100 - pctWeights, Math.max(5, (kvCache / totalSafe) * 100))
  const pctOverhead = Math.max(0, 100 - pctWeights - pctKv)

  // Standard GPU envelope classification
  const requiredTarget = tp > 1 && perGpuPeak ? perGpuPeak : (peakGiB ?? totalGiB)
  let envelopeLabel = 'Fits Consumer 24GB (RTX 4090 / 3090)'
  let envelopeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  let envelopeDetail = 'Fits standard 24 GiB workstation frame with headroom'

  if (requiredTarget > 80) {
    envelopeLabel = 'Requires Multi-Node or TP ≥ 4 Cluster'
    envelopeColor = 'text-red-400 bg-red-500/10 border-red-500/30'
    envelopeDetail = 'Exceeds single 80GB datacenter GPU'
  } else if (requiredTarget > 48) {
    envelopeLabel = 'Requires 80GB Datacenter GPU (H100 / A100)'
    envelopeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    envelopeDetail = 'Exceeds 48GB workstation memory envelope'
  } else if (requiredTarget > 24) {
    envelopeLabel = 'Requires 48GB Workstation (RTX 6000 Ada / L40S)'
    envelopeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    envelopeDetail = `P99 peak (${requiredTarget.toFixed(1)} GiB) exceeds 24GB consumer headroom`
  }

  return (
    <section className="scale-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
      {/* Top Header Badge */}
      <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em]">
            Memory Footprint Telemetry
          </h3>
          {tp > 1 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
              TP={tp} Shard
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          {status}
        </span>
      </div>

      {showSingleGpuWarning && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-200 rounded-xl">
          <TriangleAlert className="size-4 text-amber-400" />
          <AlertTitle className="text-xs font-bold font-mono">Exceeds Single GPU Capacity</AlertTitle>
          <AlertDescription className="text-amber-200/80 text-[11px] font-mono">
            Workload requires {totalGiB.toFixed(1)} GiB, exceeding standard single GPU VRAM. Multi-GPU Tensor Parallelism (TP ≥ 2) is required.
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Readout */}
      <div className="text-center py-3 relative">
        <div className="text-5xl sm:text-6xl font-mono font-medium tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent flex items-baseline justify-center gap-2">
          <span>{totalGiB.toFixed(2)}</span>
          <span className="text-xl font-normal text-zinc-400 font-mono">GiB</span>
        </div>
        <p className="text-xs text-zinc-400 font-mono mt-1.5">
          Typical Operating VRAM (P50) ≈ <strong className="text-white">{decimalGB} GB</strong>
        </p>

        {tp > 1 && perGpuPeak && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs font-mono text-cyan-200">
            <Cpu size={14} className="text-cyan-400" />
            <span>Per-GPU Allocation: <strong className="text-white font-bold">{perGpuPeak.toFixed(1)} GiB / GPU</strong></span>
          </div>
        )}

        {peakGiB && (
          <div className="mt-2 text-[11px] font-mono text-zinc-400">
            Peak Stress Bound (P99): <strong className="text-zinc-200">{peakGiB.toFixed(2)} GiB</strong>
          </div>
        )}
      </div>

      {/* Segmented Memory Progress Bar */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span className="uppercase tracking-wider">VRAM Allocation Distribution</span>
          <span className="text-white font-bold">{totalGiB.toFixed(1)} GiB</span>
        </div>
        <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-white/[0.04] p-0.5 border border-white/[0.08] shadow-inner gap-0.5">
          <div
            style={{ width: `${pctWeights}%` }}
            className="h-full rounded-l-full bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.4)] transition-all duration-300"
            title={`Weights: ${weights.toFixed(1)} GiB (${pctWeights.toFixed(0)}%)`}
          />
          <div
            style={{ width: `${pctKv}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 shadow-[0_0_10px_rgba(129,140,248,0.4)] transition-all duration-300"
            title={`KV Cache: ${kvCache.toFixed(1)} GiB (${pctKv.toFixed(0)}%)`}
          />
          <div
            style={{ width: `${pctOverhead}%` }}
            className="h-full rounded-r-full bg-gradient-to-r from-zinc-600 to-zinc-500 transition-all duration-300"
            title={`Overhead: ${overhead.toFixed(1)} GiB (${pctOverhead.toFixed(0)}%)`}
          />
        </div>

        {/* Legend Chips */}
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="size-1.5 rounded-full bg-cyan-400" />
              <span>Weights</span>
            </div>
            <span className="font-semibold text-white">{weights.toFixed(1)} GiB</span>
          </div>

          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="size-1.5 rounded-full bg-purple-400" />
              <span>KV Cache</span>
            </div>
            <span className="font-semibold text-white">{kvCache.toFixed(2)} GiB</span>
          </div>

          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="size-1.5 rounded-full bg-zinc-400" />
              <span>Context/Overhead</span>
            </div>
            <span className="font-semibold text-white">{overhead.toFixed(2)} GiB</span>
          </div>
        </div>
      </div>

      {/* Target Hardware Envelope Card */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${envelopeColor}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 shrink-0">
            <Sparkle className="size-4" />
          </div>
          <div>
            <p className="text-xs font-mono font-bold tracking-wide uppercase">{envelopeLabel}</p>
            <p className="text-[11px] font-mono opacity-80 mt-0.5">{envelopeDetail}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
