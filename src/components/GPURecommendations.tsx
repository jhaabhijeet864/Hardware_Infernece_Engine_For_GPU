import { useMemo } from 'react'
import { VideoCamera, Server, Warning, FunnelSimple } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { GPU_DATABASE } from '@/lib/constants'
import { calculateUtilization } from '@/lib/calculator'
import type { GPURecommendation } from '@/lib/types'

interface GPURecommendationsProps {
  requiredVRAM: number
}

export function GPURecommendations({ requiredVRAM }: GPURecommendationsProps) {
  const gpuRecommendations = useMemo<GPURecommendation[]>(() => {
    return GPU_DATABASE.map((gpu) => {
      const utilization = calculateUtilization(requiredVRAM, gpu.vram)
      const isOptimal = utilization >= 60 && utilization <= 85
      const isInsufficient = utilization > 100
      
      return {
        ...gpu,
        utilization,
        isOptimal,
        isInsufficient,
      }
    }).sort((a, b) => {
      if (a.isOptimal && !b.isOptimal) return -1
      if (!a.isOptimal && b.isOptimal) return 1
      if (a.isInsufficient && !b.isInsufficient) return 1
      if (!a.isInsufficient && b.isInsufficient) return -1
      return Math.abs(75 - a.utilization) - Math.abs(75 - b.utilization)
    })
  }, [requiredVRAM])

  return (
    <section className="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Recommended GPUs</h3>
        <button className="text-muted-foreground hover:text-white transition-colors">
          <FunnelSimple size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] lg:max-h-none">
        {gpuRecommendations.slice(0, 6).map((gpu, index) => (
          <motion.div
            key={gpu.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`p-3 rounded-xl border relative overflow-hidden group cursor-pointer transition-colors ${
              gpu.isOptimal
                ? 'bg-card border-emerald-500/50 hover:bg-surface-highlight'
                : gpu.isInsufficient
                ? 'bg-card border-red-500/30 hover:bg-surface-highlight'
                : 'bg-card border-border hover:bg-surface-highlight'
            }`}
          >
            {gpu.isOptimal && (
              <div className="absolute right-0 top-0 bg-emerald-500 text-background text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                BEST MATCH
              </div>
            )}
            
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${
                  gpu.isOptimal
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : gpu.isInsufficient
                    ? 'bg-red-500/20 text-red-400'
                    : gpu.iconType === 'datacenter'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {gpu.isInsufficient ? (
                    <Warning size={18} weight="duotone" />
                  ) : gpu.iconType === 'datacenter' ? (
                    <Server size={18} weight="duotone" />
                  ) : (
                    <VideoCamera size={18} weight="duotone" />
                  )}
                </div>
                <div>
                  <p className={`font-bold text-sm ${
                    gpu.isOptimal || !gpu.isInsufficient ? 'text-white' : 'text-muted-foreground'
                  }`}>
                    {gpu.name}
                  </p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                    <span className="px-1.5 py-0.5 bg-surface-highlight rounded border border-border text-white">
                      {gpu.vram}GB VRAM
                    </span>
                    {gpu.type && (
                      <span className="px-1.5 py-0.5 bg-surface-highlight rounded border border-border">
                        {gpu.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono font-bold text-sm ${
                  gpu.isOptimal
                    ? 'text-emerald-400'
                    : gpu.isInsufficient
                    ? 'text-red-400'
                    : gpu.utilization < 50
                    ? 'text-accent'
                    : 'text-primary'
                }`}>
                  {gpu.utilization}%
                </p>
                {!gpu.isInsufficient && (
                  <p className="text-[10px] text-muted-foreground">Utilization</p>
                )}
              </div>
            </div>
            
            <div className="w-full bg-surface-highlight h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(gpu.utilization, 100)}%` }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  gpu.isOptimal
                    ? 'bg-emerald-500'
                    : gpu.isInsufficient
                    ? 'bg-red-500'
                    : gpu.utilization < 50
                    ? 'bg-accent'
                    : 'bg-primary'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
