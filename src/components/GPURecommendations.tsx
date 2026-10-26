import { useMemo } from 'react'
import { Desktop, Warning, FunnelSimple, CheckCircle, Cpu } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { GPU_DATABASE } from '@/lib/constants'
import { calculateMemoryOccupancy } from '@/lib/calculator'

interface GPURecommendationsProps {
  requiredVRAM: number
  perGpuVRAM?: number
  tensorParallelSize?: number
}

export function GPURecommendations({
  requiredVRAM,
  perGpuVRAM,
  tensorParallelSize = 1,
}: GPURecommendationsProps) {
  const isMultiGpu = tensorParallelSize > 1

  const gpuRecommendations = useMemo(() => {
    return GPU_DATABASE.map((gpu) => {
      // If multi-GPU, compare against total cluster VRAM
      const occupancy = calculateMemoryOccupancy(requiredVRAM, gpu.vram)
      const isOptimal = occupancy >= 45 && occupancy <= 85
      const isTight = occupancy > 85 && occupancy <= 100
      const isInsufficient = occupancy > 100
      
      return {
        ...gpu,
        occupancy,
        isOptimal,
        isTight,
        isInsufficient,
      }
    }).sort((a, b) => {
      if (a.isOptimal && !b.isOptimal) return -1
      if (!a.isOptimal && b.isOptimal) return 1
      if (a.isTight && !b.isTight && !b.isOptimal) return -1
      if (a.isInsufficient && !b.isInsufficient) return 1
      if (!a.isInsufficient && b.isInsufficient) return -1
      return Math.abs(75 - a.occupancy) - Math.abs(75 - b.occupancy)
    })
  }, [requiredVRAM])

  return (
    <section className="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Hardware Matchmaker</span>
            {isMultiGpu && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                TP={tensorParallelSize} Cluster
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isMultiGpu && perGpuVRAM
              ? `Ranked for ${requiredVRAM.toFixed(1)} GiB total (${perGpuVRAM.toFixed(1)} GiB per GPU)`
              : 'Ranked by estimated memory headroom'}
          </p>
        </div>
        <button className="text-muted-foreground hover:text-white transition-colors" title="Filter GPUs">
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
                : gpu.isTight
                ? 'bg-card border-amber-500/40 hover:bg-surface-highlight'
                : gpu.isInsufficient
                ? 'bg-card border-red-500/30 hover:bg-surface-highlight'
                : 'bg-card border-border hover:bg-surface-highlight'
            }`}
          >
            {gpu.isOptimal && (
              <div className="absolute right-0 top-0 bg-emerald-500/90 text-background text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1">
                <CheckCircle size={10} weight="bold" />
                FITS MEMORY
              </div>
            )}
            {gpu.isTight && (
              <div className="absolute right-0 top-0 bg-amber-500/90 text-background text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                TIGHT MARGIN
              </div>
            )}
            {gpu.isInsufficient && (
              <div className="absolute right-0 top-0 bg-red-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                INSUFFICIENT VRAM
              </div>
            )}
            
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${
                  gpu.isOptimal
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : gpu.isTight
                    ? 'bg-amber-500/20 text-amber-400'
                    : gpu.isInsufficient
                    ? 'bg-red-500/20 text-red-400'
                    : gpu.iconType === 'datacenter'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {gpu.isInsufficient ? (
                    <Warning size={18} weight="duotone" />
                  ) : gpu.iconType === 'datacenter' ? (
                    <Desktop size={18} weight="duotone" />
                  ) : (
                    <Cpu size={18} weight="duotone" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-primary transition-colors">
                    {gpu.name}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {gpu.vram} GB {gpu.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-mono font-bold ${
                  gpu.isOptimal
                    ? 'text-emerald-400'
                    : gpu.isTight
                    ? 'text-amber-400'
                    : gpu.isInsufficient
                    ? 'text-red-400'
                    : 'text-white'
                }`}>
                  {gpu.occupancy > 999 ? '>999%' : `${gpu.occupancy.toFixed(0)}%`}
                </span>
                <p className="text-[10px] text-muted-foreground">Occupancy</p>
              </div>
            </div>
            
            <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  gpu.isOptimal
                    ? 'bg-emerald-500'
                    : gpu.isTight
                    ? 'bg-amber-500'
                    : gpu.isInsufficient
                    ? 'bg-red-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, gpu.occupancy)}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
