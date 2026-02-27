import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { MemoryBreakdown } from '@/lib/types'

interface ResultsDisplayProps {
  memoryBreakdown: MemoryBreakdown
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, { stiffness: 300, damping: 30 })
  const displayValue = useTransform(springValue, (v) => v.toFixed(1))
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

  return <span ref={ref}>{value.toFixed(1)}</span>
}

export function ResultsDisplay({ memoryBreakdown }: ResultsDisplayProps) {
  return (
    <section className="bg-gradient-to-b from-border to-card/50 p-[1px] rounded-2xl shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-primary/20 opacity-50" />
      <div className="bg-card relative rounded-[15px] p-6 h-full flex flex-col">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
          Estimation Result
        </h3>
        
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex flex-col items-center justify-center py-6 mb-6 relative"
        >
          <motion.div
            key={memoryBreakdown.total}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-5xl sm:text-6xl font-mono font-bold text-white relative z-10 flex items-baseline gap-2 result-glow"
            aria-label={`${memoryBreakdown.total} gigabytes total VRAM required`}
          >
            <span className="text-accent">
              <AnimatedNumber value={memoryBreakdown.total} />
            </span>
            <span className="text-xl text-muted-foreground font-normal" aria-hidden="true">GB</span>
          </motion.div>
          <p className="text-muted-foreground text-sm mt-2">Total VRAM Required</p>
          
          <div className="absolute inset-0 border border-accent/10 rounded-full scale-150 opacity-20 animate-pulse" aria-hidden="true" />
        </div>
        
        <div className="space-y-3 mt-auto">
          <div className="flex justify-between items-center p-3 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm text-card-foreground">Model Weights</span>
            </div>
            <span className="font-mono text-white font-bold">{memoryBreakdown.modelWeights} GB</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-sm text-card-foreground">KV Cache (Context)</span>
            </div>
            <span className="font-mono text-white font-bold">{memoryBreakdown.kvCache} GB</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-pink-500" aria-hidden="true" />
              <span className="text-sm text-card-foreground">CUDA Overhead</span>
            </div>
            <span className="font-mono text-white font-bold">{memoryBreakdown.overhead} GB</span>
          </div>
        </div>
      </div>
    </section>
  )
}
