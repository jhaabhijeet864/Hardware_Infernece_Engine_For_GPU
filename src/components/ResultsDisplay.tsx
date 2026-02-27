import { motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { MemoryBreakdown } from '@/lib/types'

const VRAM_WARNING_THRESHOLD_GB = 1000

interface ResultsDisplayProps {
  memoryBreakdown: MemoryBreakdown
}

export function ResultsDisplay({ memoryBreakdown }: ResultsDisplayProps) {
  const showVramWarning = memoryBreakdown.total > VRAM_WARNING_THRESHOLD_GB

  return (
    <section className="bg-gradient-to-b from-border to-card/50 p-[1px] rounded-2xl shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-primary/20 opacity-50" />
      <div className="bg-card relative rounded-[15px] p-6 h-full flex flex-col">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
          Estimation Result
        </h3>

        {showVramWarning && (
          <Alert className="mb-4 border-[oklch(0.59_0.24_305)] bg-[oklch(0.59_0.24_305)]/10 text-[oklch(0.59_0.24_305)]">
            <TriangleAlert className="size-4" />
            <AlertTitle>Exceeds Practical GPU Limits</AlertTitle>
            <AlertDescription className="text-[oklch(0.59_0.24_305)]/80">
              Requirement of {memoryBreakdown.total} GB exceeds 1,000 GB. Consider quantization, model sharding, or a multi-node setup.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col items-center justify-center py-6 mb-6 relative">
          <motion.div
            key={memoryBreakdown.total}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="text-5xl sm:text-6xl font-mono font-bold text-white relative z-10 flex items-baseline gap-2 result-glow"
          >
            <span className="text-accent">{memoryBreakdown.total}</span>
            <span className="text-xl text-muted-foreground font-normal">GB</span>
          </motion.div>
          <p className="text-muted-foreground text-sm mt-2">Total VRAM Required</p>
          
          <div className="absolute inset-0 border border-accent/10 rounded-full scale-150 opacity-20 animate-pulse" />
        </div>
        
        <div className="space-y-3 mt-auto">
          <div className="flex justify-between items-center p-3 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary" />
              <span className="text-sm text-card-foreground">Model Weights</span>
            </div>
            <span className="font-mono text-white font-bold">{memoryBreakdown.modelWeights} GB</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-accent" />
              <span className="text-sm text-card-foreground">KV Cache (Context)</span>
            </div>
            <span className="font-mono text-white font-bold">{memoryBreakdown.kvCache} GB</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-surface-highlight border border-border">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-pink-500" />
              <span className="text-sm text-card-foreground">CUDA Overhead</span>
            </div>
            <span className="font-mono text-white font-bold">{memoryBreakdown.overhead} GB</span>
          </div>
        </div>
      </div>
    </section>
  )
}
