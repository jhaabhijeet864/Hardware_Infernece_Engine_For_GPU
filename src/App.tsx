import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { WorkloadBuilder } from '@/components/WorkloadBuilder'
import { ResultsDisplay } from '@/components/ResultsDisplay'
import { GPURecommendations } from '@/components/GPURecommendations'
import { TrainingCalculator } from '@/components/TrainingCalculator'
import { QuantizationComparison } from '@/components/QuantizationComparison'
import { Header } from '@/components/Header'
import { Lightning, ChartBar, ShieldCheck } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { calculateMemoryRequirements } from '@/lib/calculator'
import {
  WORKLOAD_ARCHETYPES,
  calculateWorkloadMemory,
  WorkloadSpecification,
} from '@/lib/engine'
import type { TabMode, CalculatorConfig } from '@/lib/types'

function App() {
  const [activeTab, setActiveTab] = useKV<TabMode>('active-tab', 'inference')
  const [workload, setWorkload] = useKV<WorkloadSpecification>(
    'active-workload-spec',
    WORKLOAD_ARCHETYPES[0]
  )

  const [legacyConfig] = useKV<CalculatorConfig>('calculator-config', {
    parameters: 8,
    precision: 'fp16',
    contextLength: 8192,
    kvCacheQuantization: false,
    flashAttention: true,
  })

  // Synchronize workload changes to legacy breakdown for fallback components
  const workloadSizing = useMemo(() => {
    const active = workload || WORKLOAD_ARCHETYPES[0]
    return calculateWorkloadMemory(active)
  }, [workload])

  const memoryBreakdown = useMemo(() => {
    if (!legacyConfig) return { modelWeights: 0, kvCache: 0, overhead: 0, total: 0 }
    return calculateMemoryRequirements(legacyConfig, workload?.modelId)
  }, [legacyConfig, workload?.modelId])

  if (!activeTab || !workload) {
    return null
  }

  return (
    <div className="min-h-screen bg-background grid-pattern flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full p-6 gap-6 overflow-y-auto">
        {/* Navigation Tabs */}
        <nav
          role="tablist"
          aria-label="Calculator modes"
          className="grid grid-cols-3 gap-1 bg-card p-1 rounded-xl border border-border w-full max-w-2xl mx-auto mb-2"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'inference'}
            aria-controls="tabpanel-inference"
            id="tab-inference"
            onClick={() => setActiveTab('inference')}
            className={`flex flex-col items-center justify-center py-3 rounded-lg relative overflow-hidden group transition-all min-h-[44px] ${
              activeTab === 'inference'
                ? 'bg-primary/20 border border-primary/50 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-surface-highlight'
            }`}
          >
            {activeTab === 'inference' && (
              <div className="absolute inset-0 bg-primary/10 blur-sm group-hover:bg-primary/20 transition-all" />
            )}
            <span className="relative z-10 font-bold tracking-wide flex items-center gap-2">
              <ShieldCheck size={20} weight="duotone" className="text-cyan-400" aria-hidden="true" />
              <span>Workload Qualification</span>
            </span>
            {activeTab === 'inference' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-primary shadow-[0_0_10px_oklch(0.59_0.24_305)]" />
            )}
          </button>
          
          <button
            role="tab"
            aria-selected={activeTab === 'training'}
            aria-controls="tabpanel-training"
            id="tab-training"
            onClick={() => setActiveTab('training')}
            className={`flex flex-col items-center justify-center py-3 rounded-lg relative overflow-hidden transition-all min-h-[44px] ${
              activeTab === 'training'
                ? 'bg-primary/20 border border-primary/50 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-surface-highlight'
            }`}
          >
            {activeTab === 'training' && (
              <div className="absolute inset-0 bg-primary/10 blur-sm transition-all" />
            )}
            <span className="relative z-10 font-medium tracking-wide flex items-center gap-2">
              <Lightning size={20} weight="duotone" className="text-amber-400" aria-hidden="true" />
              <span>Fine-Tuning Sizing</span>
            </span>
            {activeTab === 'training' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-primary shadow-[0_0_10px_oklch(0.59_0.24_305)]" />
            )}
          </button>
          
          <button
            role="tab"
            aria-selected={activeTab === 'quantization'}
            aria-controls="tabpanel-quantization"
            id="tab-quantization"
            onClick={() => setActiveTab('quantization')}
            className={`flex flex-col items-center justify-center py-3 rounded-lg relative overflow-hidden transition-all min-h-[44px] ${
              activeTab === 'quantization'
                ? 'bg-primary/20 border border-primary/50 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-surface-highlight'
            }`}
          >
            {activeTab === 'quantization' && (
              <div className="absolute inset-0 bg-primary/10 blur-sm transition-all" />
            )}
            <span className="relative z-10 font-medium tracking-wide flex items-center gap-2">
              <ChartBar size={20} weight="duotone" className="text-purple-400" aria-hidden="true" />
              <span>Quantization Trade-offs</span>
            </span>
            {activeTab === 'quantization' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-primary shadow-[0_0_10px_oklch(0.59_0.24_305)]" />
            )}
          </button>
        </nav>

        {/* Inference / Workload Qualification View */}
        {activeTab === 'inference' && (
          <div
            id="tabpanel-inference"
            role="tabpanel"
            aria-labelledby="tab-inference"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-7 flex flex-col gap-6">
              <WorkloadBuilder
                workload={workload}
                onChange={setWorkload}
              />
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <ResultsDisplay
                memoryBreakdown={memoryBreakdown}
                workloadSizing={workloadSizing}
              />
              
              <GPURecommendations
                requiredVRAM={workloadSizing.peakMemory.totalVRAMRequiredGiB}
              />
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <motion.div
            id="tabpanel-training"
            role="tabpanel"
            aria-labelledby="tab-training"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TrainingCalculator />
          </motion.div>
        )}

        {/* Quantization Tab */}
        {activeTab === 'quantization' && (
          <motion.div
            id="tabpanel-quantization"
            role="tabpanel"
            aria-labelledby="tab-quantization"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <QuantizationComparison />
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            Local AI Hardware Qualification Suite • Target: NVIDIA Workstations &amp; Serving Rigs (vLLM / TensorRT-LLM)
          </p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-highlight border border-border">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Engine v2.0 Active
            </span>
          </div>
        </footer>
      </div>
      
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default App
