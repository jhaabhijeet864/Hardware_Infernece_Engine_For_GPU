import { useState, useMemo } from 'react'
import { Desktop, Cpu } from '@phosphor-icons/react'
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
  const [filter, setFilter] = useState<'all' | 'workstation' | 'datacenter'>('all')

  const effectiveVram = isMultiGpu && perGpuVRAM ? perGpuVRAM : requiredVRAM

  const gpuRecommendations = useMemo(() => {
    return GPU_DATABASE.map((gpu) => {
      const occupancy = calculateMemoryOccupancy(effectiveVram, gpu.vram)
      const headroomGiB = gpu.vram - effectiveVram
      const isOptimal = occupancy >= 45 && occupancy <= 85
      const isTight = occupancy > 85 && occupancy <= 100
      const isInsufficient = occupancy > 100
      
      return {
        ...gpu,
        occupancy,
        headroomGiB,
        isOptimal,
        isTight,
        isInsufficient,
      }
    })
    .filter((gpu) => {
      if (filter === 'all') return true
      if (filter === 'datacenter') return gpu.iconType === 'datacenter'
      return gpu.iconType !== 'datacenter'
    })
    .sort((a, b) => {
      if (a.isOptimal && !b.isOptimal) return -1
      if (!a.isOptimal && b.isOptimal) return 1
      if (a.isTight && !b.isTight && !b.isOptimal) return -1
      if (a.isInsufficient && !b.isInsufficient) return 1
      if (!a.isInsufficient && b.isInsufficient) return -1
      return Math.abs(75 - a.occupancy) - Math.abs(75 - b.occupancy)
    })
  }, [effectiveVram, filter])

  return (
    <section className="bg-[#11131a] p-5 sm:p-6 rounded-xl border border-border flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-border">
        <div>
          <h3 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>Hardware Compatibility Matrix</span>
            {isMultiGpu && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#181b24] text-primary border border-border font-mono">
                TP={tensorParallelSize}
              </span>
            )}
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Ranked for {effectiveVram.toFixed(1)} GiB allocation per GPU
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-[#181b24] p-0.5 rounded border border-border text-[11px] font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-[#232733] text-white font-medium' : 'text-muted-foreground hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('workstation')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              filter === 'workstation' ? 'bg-[#232733] text-white font-medium' : 'text-muted-foreground hover:text-white'
            }`}
          >
            Rig / Desk
          </button>
          <button
            onClick={() => setFilter('datacenter')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              filter === 'datacenter' ? 'bg-[#232733] text-white font-medium' : 'text-muted-foreground hover:text-white'
            }`}
          >
            Datacenter
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {gpuRecommendations.slice(0, 7).map((gpu) => (
          <div
            key={gpu.id}
            className="p-3 rounded-lg bg-[#0e1017] border border-border hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded bg-[#181b24] border border-border text-slate-300">
                  {gpu.iconType === 'datacenter' ? <Desktop size={14} /> : <Cpu size={14} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{gpu.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {gpu.vram} GB {gpu.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                  gpu.isOptimal
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : gpu.isTight
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {gpu.isOptimal ? 'OPTIMAL' : gpu.isTight ? 'TIGHT' : 'INSUFFICIENT'}
                </span>
                <span className="text-xs font-mono font-bold text-foreground w-12 text-right">
                  {gpu.occupancy > 999 ? '>999%' : `${gpu.occupancy.toFixed(0)}%`}
                </span>
              </div>
            </div>

            {/* Occupancy bar */}
            <div className="w-full bg-[#181b24] rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  gpu.isOptimal
                    ? 'bg-emerald-400'
                    : gpu.isTight
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, gpu.occupancy)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground mt-1.5">
              <span>
                {gpu.headroomGiB >= 0
                  ? `Headroom: +${gpu.headroomGiB.toFixed(1)} GiB buffer`
                  : `Deficit: ${gpu.headroomGiB.toFixed(1)} GiB shortage`}
              </span>
              <span>{gpu.iconType === 'datacenter' ? 'SXM / PCIe Enterprise' : 'PCIe Workstation'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
