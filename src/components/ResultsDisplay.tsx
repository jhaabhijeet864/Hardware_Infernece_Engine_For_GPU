import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { TriangleAlert, Timer, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { MemoryBreakdown } from '@/lib/types'
import { EnhancedMemoryBreakdown } from '@/lib/calculator'
import { WorkloadMemorySizing } from '@/lib/engine'

const VRAM_WARNING_THRESHOLD_GIB = 1000

interface ResultsDisplayProps {
  memoryBreakdown: MemoryBreakdown | EnhancedMemoryBreakdown
  workloadSizing?: WorkloadMemorySizing
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, { stiffness: 300, damping: 30 })
  const displayValue = useTransform(springValue, (v) => v.toFixed(2))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  useEffect(() => {
    return displayValue.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = v
      }
    })
  }, [displayValue])

  return <span ref={ref}>{value.toFixed(2)}</span>
}

export function ResultsDisplay({ memoryBreakdown, workloadSizing }: ResultsDisplayProps) {
  const totalGiB = workloadSizing ? workloadSizing.typicalMemory.totalVRAMRequiredGiB : memoryBreakdown.total
  const peakGiB = workloadSizing ? workloadSizing.peakMemory.totalVRAMRequiredGiB : undefined

  const showVramWarning = totalGiB > VRAM_WARNING_THRESHOLD_GIB
  const enhanced = memoryBreakdown as EnhancedMemoryBreakdown
  const status = enhanced.status || 'Analytical Estimate'
  const decimalGB = (totalGiB * 1.07374).toFixed(2)

  const weights = workloadSizing ? workloadSizing.typicalMemory.weightsGiB : memoryBreakdown.modelWeights
  const kvCache = workloadSizing ? workloadSizing.typicalMemory.kvCacheGiB : memoryBreakdown.kvCache
  const overhead = workloadSizing 
    ? parseFloat((workloadSizing.typicalMemory.activationOverheadGiB + workloadSizing.typicalMemory.cudaContextGiB).toFixed(2))
    : memoryBreakdown.overhead

  return (
    <section className="bg-gradient-to-b from-border to-card/50 p-[1px] rounded-2xl shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-primary/20 opacity-50" />
      <div className="bg-card relative rounded-[15px] p-6 h-full flex flex-col">
        {/* Header Badge */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Qualification Pre-Check
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {status}
          </span>
        </div>

        {showVramWarning && (
          <Alert className="mb-4 border-amber-500 bg-amber-500/10 text-amber-300">
            <TriangleAlert className="size-4" />
            <AlertTitle>Exceeds Single-Node Memory Limits</AlertTitle>
            <AlertDescription className="text-amber-200/80">
              Requirement of {totalGiB} GiB exceeds standard server memory limits. Multi-GPU tensor parallelism (vLLM pipeline/tensor parallel) or quantization required.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Primary Sizing Display */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex flex-col items-center justify-center py-4 mb-4 relative text-center"
        >
          <motion.div
            key={totalGiB}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-5xl sm:text-6xl font-mono font-bold text-white relative z-10 flex items-baseline gap-2 result-glow"
            aria-label={`${totalGiB} gibibytes total VRAM required`}
          >
            <span className="text-accent">
              <AnimatedNumber value={totalGiB} />
            </span>
            <span className="text-xl text-muted-foreground font-normal" aria-hidden="true">GiB</span>
          </motion.div>
          <p className="text-muted-foreground text-xs mt-1">
            Typical Operating Memory (P50) ≈ <span className="font-mono text-slate-300">{decimalGB} GB</span>
          </p>

          {peakGiB && (
            <div className="mt-2 text-[11px] font-mono text-amber-400/90 bg-amber-950/30 px-2.5 py-0.5 rounded-full border border-amber-800/40">
              Peak Stress Bound (P99): <span className="font-bold text-amber-300">{peakGiB} GiB</span>
            </div>
          )}
          
          <div className="absolute inset-0 border border-accent/10 rounded-full scale-150 opacity-20 animate-pulse" aria-hidden="true" />
        </div>
        
        {/* Memory Breakdown */}
        <div className="space-y-2 mt-auto">
          <div className="flex justify-between items-center p-2 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-xs text-card-foreground">Model Weights</span>
            </div>
            <span className="font-mono text-white font-bold text-xs">{weights} GiB</span>
          </div>
          
          <div className="flex justify-between items-center p-2 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-xs text-card-foreground">KV Cache (Context)</span>
            </div>
            <span className="font-mono text-white font-bold text-xs">{kvCache} GiB</span>
          </div>
          
          <div className="flex justify-between items-center p-2 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-pink-500" aria-hidden="true" />
              <span className="text-xs text-card-foreground">CUDA Context & Buffer</span>
            </div>
            <span className="font-mono text-white font-bold text-xs">{overhead} GiB</span>
          </div>

          {workloadSizing && (
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-border/80 text-[11px] text-muted-foreground space-y-1.5 mt-2">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Timer size={13} className="text-cyan-400" />
                  Target SLA Criteria
                </span>
                <span className="font-mono text-[10px] text-cyan-300">
                  TTFT &lt; {workloadSizing.workload.sla.maxTtftMs}ms • ITL &lt; {workloadSizing.workload.sla.maxItlMs}ms
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-start gap-1">
                <ShieldCheck size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>{workloadSizing.qualificationRecommendation}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
