import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { TriangleAlert, Cpu } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { MemoryBreakdown } from '@/lib/types'
import { EnhancedMemoryBreakdown } from '@/lib/calculator'

const VRAM_WARNING_THRESHOLD_GIB = 1000

interface ResultsDisplayProps {
  memoryBreakdown: MemoryBreakdown | EnhancedMemoryBreakdown
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

export function ResultsDisplay({ memoryBreakdown }: ResultsDisplayProps) {
  const showVramWarning = memoryBreakdown.total > VRAM_WARNING_THRESHOLD_GIB
  const enhanced = memoryBreakdown as EnhancedMemoryBreakdown
  const status = enhanced.status || 'Analytical Estimate'
  const decimalGB = (memoryBreakdown.total * 1.07374).toFixed(2)

  return (
    <section className="bg-gradient-to-b from-border to-card/50 p-[1px] rounded-2xl shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-primary/20 opacity-50" />
      <div className="bg-card relative rounded-[15px] p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Estimation Result
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
              Requirement of {memoryBreakdown.total} GiB exceeds standard server memory limits. Multi-GPU tensor parallelism (vLLM pipeline/tensor parallel) or quantization required.
            </AlertDescription>
          </Alert>
        )}
        
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex flex-col items-center justify-center py-5 mb-5 relative"
        >
          <motion.div
            key={memoryBreakdown.total}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-5xl sm:text-6xl font-mono font-bold text-white relative z-10 flex items-baseline gap-2 result-glow"
            aria-label={`${memoryBreakdown.total} gibibytes total VRAM required`}
          >
            <span className="text-accent">
              <AnimatedNumber value={memoryBreakdown.total} />
            </span>
            <span className="text-xl text-muted-foreground font-normal" aria-hidden="true">GiB</span>
          </motion.div>
          <p className="text-muted-foreground text-xs mt-1">
            Total VRAM Required ≈ <span className="font-mono text-slate-300">{decimalGB} GB</span> (decimal)
          </p>
          
          <div className="absolute inset-0 border border-accent/10 rounded-full scale-150 opacity-20 animate-pulse" aria-hidden="true" />
        </div>
        
        <div className="space-y-2.5 mt-auto">
          <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-xs text-card-foreground">Model Weights</span>
            </div>
            <span className="font-mono text-white font-bold text-sm">{memoryBreakdown.modelWeights} GiB</span>
          </div>
          
          <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-xs text-card-foreground">KV Cache (Context)</span>
            </div>
            <span className="font-mono text-white font-bold text-sm">{memoryBreakdown.kvCache} GiB</span>
          </div>
          
          <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-pink-500" aria-hidden="true" />
              <span className="text-xs text-card-foreground">CUDA Context & Working Buffer</span>
            </div>
            <span className="font-mono text-white font-bold text-sm">{memoryBreakdown.overhead} GiB</span>
          </div>

          {enhanced.architectureName && (
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-border/60 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Cpu size={13} className="text-cyan-400" />
                  {enhanced.architectureName}
                </span>
                <span className="font-mono text-[10px] text-slate-400">Exact KV Math</span>
              </div>
              {enhanced.kvFormula && (
                <p className="font-mono text-[10px] text-slate-400 overflow-x-auto truncate">
                  KV = {enhanced.kvFormula}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
