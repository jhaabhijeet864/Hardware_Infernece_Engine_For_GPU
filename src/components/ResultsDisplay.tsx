import { TriangleAlert, Cpu } from 'lucide-react'
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
  let envelopeLabel = 'Fits Consumer 24GB'
  let envelopeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (requiredTarget > 80) {
    envelopeLabel = 'Requires Multi-Node or TP ≥ 4'
    envelopeColor = 'text-red-400 bg-red-500/10 border-red-500/20'
  } else if (requiredTarget > 48) {
    envelopeLabel = 'Requires 80GB Datacenter GPU'
    envelopeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  } else if (requiredTarget > 24) {
    envelopeLabel = 'Requires 48GB Workstation GPU'
    envelopeColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20'
  }

  return (
    <section className="bg-[#11131a] p-5 sm:p-6 rounded-xl border border-border flex flex-col justify-between space-y-5">
      {/* Top Header Badge */}
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Memory Footprint Telemetry
          </h3>
          {tp > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#181b24] text-primary border border-border font-mono font-medium">
              TP={tp} Cluster
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#181b24] text-slate-300 border border-border">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          {status}
        </span>
      </div>

      {showSingleGpuWarning && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-300">
          <TriangleAlert className="size-4" />
          <AlertTitle className="text-xs font-bold font-mono">Exceeds Single GPU Capacity</AlertTitle>
          <AlertDescription className="text-amber-200/80 text-[11px] font-mono">
            Workload requires {totalGiB.toFixed(1)} GiB, exceeding standard single GPU VRAM. Multi-GPU Tensor Parallelism (TP ≥ 2) is required.
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Readout */}
      <div className="text-center py-2">
        <div className="text-4xl sm:text-5xl font-mono font-bold text-foreground tracking-tight flex items-baseline justify-center gap-2">
          <span>{totalGiB.toFixed(2)}</span>
          <span className="text-lg font-normal text-muted-foreground font-mono">GiB</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          Typical Operating VRAM (P50) ≈ <strong className="text-slate-300">{decimalGB} GB</strong>
        </p>

        {tp > 1 && perGpuPeak && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181b24] border border-border text-xs font-mono text-slate-300">
            <Cpu size={13} className="text-primary" />
            <span>Per-GPU Allocation: <strong className="text-white">{perGpuPeak.toFixed(1)} GiB / GPU</strong></span>
          </div>
        )}

        {peakGiB && (
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Peak Stress Bound (P99): <strong className="text-foreground">{peakGiB.toFixed(2)} GiB</strong>
          </div>
        )}
      </div>

      {/* Segmented Memory Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
          <span>VRAM Allocation Breakdown</span>
          <span className="text-foreground font-semibold">{totalGiB.toFixed(1)} GiB</span>
        </div>
        <div className="h-3 w-full rounded overflow-hidden flex bg-[#181b24] border border-border">
          <div
            style={{ width: `${pctWeights}%` }}
            className="bg-sky-400 transition-all duration-300"
            title={`Weights: ${weights.toFixed(1)} GiB (${pctWeights.toFixed(0)}%)`}
          />
          <div
            style={{ width: `${pctKv}%` }}
            className="bg-indigo-400 transition-all duration-300"
            title={`KV Cache: ${kvCache.toFixed(1)} GiB (${pctKv.toFixed(0)}%)`}
          />
          <div
            style={{ width: `${pctOverhead}%` }}
            className="bg-purple-400 transition-all duration-300"
            title={`Overhead: ${overhead.toFixed(1)} GiB (${pctOverhead.toFixed(0)}%)`}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-sky-400" /> Weights ({weights.toFixed(1)}G)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-indigo-400" /> KV Cache ({kvCache.toFixed(1)}G)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-purple-400" /> Overhead ({overhead.toFixed(1)}G)
          </span>
        </div>
      </div>

      {/* Hardware Envelope Badge */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
        <span className="text-muted-foreground">Hardware Ceiling:</span>
        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${envelopeColor}`}>
          {envelopeLabel}
        </span>
      </div>
    </section>
  )
}
