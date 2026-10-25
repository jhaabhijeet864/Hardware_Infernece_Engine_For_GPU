import { useMemo } from 'react'
import { VideoCamera, Desktop, Warning, FunnelSimple, DeviceMobile, CheckCircle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { GPU_DATABASE } from '@/lib/constants'
import { calculateMemoryOccupancy } from '@/lib/calculator'

interface GPURecommendationsProps {
  requiredVRAM: number
}

export function GPURecommendations({ requiredVRAM }: GPURecommendationsProps) {
  const gpuRecommendations = useMemo(() => {
    return GPU_DATABASE.map((gpu) => {
      const occupancy = calculateMemoryOccupancy(requiredVRAM, gpu.vram)
      const isOptimal = occupancy >= 50 && occupancy <= 85
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
          <h3 className="text-lg font-bold text-white">Hardware Matchmaker</h3>
          <p className="text-xs text-muted-foreground">Ranked by estimated memory headroom</p>
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
                    : gpu.iconType === 'unified'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {gpu.isInsufficient ? (
                    <Warning size={18} weight="duotone" />
                  ) : gpu.iconType === 'datacenter' ? (
                    <Desktop size={18} weight="duotone" />
                  ) : gpu.iconType === 'unified' ? (
                    <DeviceMobile size={18} weight="duotone" />
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
                      {gpu.vram} GB VRAM
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
                    : gpu.isTight
                    ? 'text-amber-400'
                    : gpu.isInsufficient
                    ? 'text-red-400'
                    : gpu.occupancy < 50
                    ? 'text-accent'
                    : 'text-primary'
                }`}>
                  {gpu.occupancy}%
                </p>
                <p className="text-[10px] text-muted-foreground">Memory Occupancy</p>
              </div>
            </div>
            
            <div className="w-full bg-surface-highlight h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(gpu.occupancy, 100)}%` }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  gpu.isOptimal
                    ? 'bg-emerald-500'
                    : gpu.isTight
                    ? 'bg-amber-500'
                    : gpu.isInsufficient
                    ? 'bg-red-500'
                    : gpu.occupancy < 50
                    ? 'bg-accent'
                    : 'bg-primary'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-cyan-400 shrink-0" />
        <span>Occupancy is an analytical estimate. Hardware acceptance requires empirical runtime validation.</span>
      </div>
    </section>
  )
}
