import { useState, useMemo } from 'react'
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
      const isInsufficient = occupancy > 100
      const isTight = occupancy > 85 && occupancy <= 100
      const isOptimal = occupancy >= 40 && occupancy <= 85
      const isSurplus = occupancy < 40

      let statusLabel = 'OPTIMAL'
      let statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'

      if (isInsufficient) {
        statusLabel = 'INSUFFICIENT'
        statusColor = 'bg-red-500/10 text-red-400 border-red-500/30'
        barColor = 'bg-gradient-to-r from-red-500 to-rose-400'
      } else if (isTight) {
        statusLabel = 'TIGHT'
        statusColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        barColor = 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
      } else if (isSurplus) {
        statusLabel = 'SURPLUS'
        statusColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
        barColor = 'bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
      }
      
      return {
        ...gpu,
        occupancy,
        headroomGiB,
        isOptimal,
        isTight,
        isInsufficient,
        isSurplus,
        statusLabel,
        statusColor,
        barColor,
      }
    })
    .filter((gpu) => {
      if (filter === 'all') return true
      if (filter === 'datacenter') return gpu.iconType === 'datacenter'
      return gpu.iconType !== 'datacenter'
    })
    .sort((a, b) => {
      const score = (g: typeof a) => {
        if (g.isOptimal) return 0
        if (g.isSurplus) return 1
        if (g.isTight) return 2
        return 3
      }
      if (score(a) !== score(b)) return score(a) - score(b)
      return a.occupancy - b.occupancy
    })
  }, [effectiveVram, filter])

  return (
    <section className="scale-card rounded-2xl p-6 sm:p-7 flex flex-col space-y-5">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <span>Hardware Compatibility Matrix</span>
            {isMultiGpu && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
                TP={tensorParallelSize}
              </span>
            )}
          </h3>
          <p className="text-[11px] text-zinc-400 font-mono mt-1">
            Evaluated against <strong className="text-white">{effectiveVram.toFixed(1)} GiB</strong> allocation per GPU
          </p>
        </div>

        {/* Clean Filter Controls */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white/[0.12] text-white font-semibold border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('workstation')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'workstation'
                ? 'bg-white/[0.12] text-white font-semibold border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Workstation
          </button>
          <button
            type="button"
            onClick={() => setFilter('datacenter')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'datacenter'
                ? 'bg-white/[0.12] text-white font-semibold border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Datacenter
          </button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {gpuRecommendations.slice(0, 7).map((gpu) => (
          <div
            key={gpu.id}
            className="p-3.5 rounded-xl scale-card-interactive"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-white">{gpu.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-300">
                  {gpu.vram} GB {gpu.type}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${gpu.statusColor}`}>
                  {gpu.statusLabel}
                </span>
                <span className="text-xs font-mono font-bold text-white w-12 text-right">
                  {gpu.occupancy > 999 ? '>999%' : `${gpu.occupancy.toFixed(0)}%`}
                </span>
              </div>
            </div>

            {/* Occupancy bar */}
            <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden p-[1px] border border-white/[0.05]">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${gpu.barColor}`}
                style={{ width: `${Math.min(100, gpu.occupancy)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mt-2">
              <span>
                {gpu.headroomGiB >= 0
                  ? <span className="text-emerald-400 font-medium">+ {gpu.headroomGiB.toFixed(1)} GiB headroom</span>
                  : <span className="text-red-400 font-medium">- {Math.abs(gpu.headroomGiB).toFixed(1)} GiB shortage</span>}
              </span>
              <span className="text-zinc-400">{gpu.iconType === 'datacenter' ? 'SXM / PCIe Enterprise' : 'PCIe Workstation'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
