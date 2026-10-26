import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { WorkloadBuilder } from '@/components/WorkloadBuilder'
import { ResultsDisplay } from '@/components/ResultsDisplay'
import { GPURecommendations } from '@/components/GPURecommendations'
import { TrainingCalculator } from '@/components/TrainingCalculator'
import { QuantizationComparison } from '@/components/QuantizationComparison'
import { BundleUploader } from '@/components/BundleUploader'
import { AcceptanceComparisonView } from '@/components/AcceptanceComparisonView'
import { AcceptanceCertificate } from '@/components/AcceptanceCertificate'
import { PartnerDecisionMatrix } from '@/components/PartnerDecisionMatrix'
import { Header } from '@/components/Header'
import { Lightning, ChartBar, SlidersHorizontal, SealCheck, Desktop, ArrowRight } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { calculateMemoryRequirements } from '@/lib/calculator'
import {
  WORKLOAD_ARCHETYPES,
  calculateWorkloadMemory,
  WorkloadSpecification,
} from '@/lib/engine'
import { SAMPLE_RUN_RAG_4090_PASS } from '@/lib/fixtures/sample-runs'
import type { QualificationRunBundle } from '../cli/bundle-builder'
import type { TabMode, CalculatorConfig } from '@/lib/types'

function App() {
  const [activeTab, setActiveTab] = useKV<TabMode>('active-tab', 'inference')
  const [workload, setWorkload] = useKV<WorkloadSpecification>(
    'active-workload-spec',
    WORKLOAD_ARCHETYPES[0]
  )
  const [qualificationBundle, setQualificationBundle] = useKV<QualificationRunBundle | null>(
    'active-qualification-bundle',
    SAMPLE_RUN_RAG_4090_PASS
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
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <Header />
      
      <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full p-4 sm:p-6 gap-6">
        {/* Modern Segmented Navigation Bar */}
        <nav
          role="tablist"
          aria-label="Calculator modes"
          className="grid grid-cols-2 sm:grid-cols-5 gap-1 bg-[#10121a] p-1 rounded-lg border border-border w-full max-w-5xl mx-auto shadow-sm"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'inference'}
            aria-controls="tabpanel-inference"
            id="tab-inference"
            onClick={() => setActiveTab('inference')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-xs font-medium cursor-pointer ${
              activeTab === 'inference'
                ? 'bg-[#181b25] text-white border border-[#2b3040] shadow-sm'
                : 'text-muted-foreground hover:text-white hover:bg-[#151720]'
            }`}
          >
            <SlidersHorizontal size={16} className={activeTab === 'inference' ? 'text-primary' : 'text-muted-foreground'} />
            <span>Workload Sizing</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'acceptance'}
            aria-controls="tabpanel-acceptance"
            id="tab-acceptance"
            onClick={() => setActiveTab('acceptance')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-xs font-medium cursor-pointer ${
              activeTab === 'acceptance'
                ? 'bg-[#181b25] text-white border border-[#2b3040] shadow-sm'
                : 'text-muted-foreground hover:text-white hover:bg-[#151720]'
            }`}
          >
            <SealCheck size={16} className={activeTab === 'acceptance' ? 'text-emerald-400' : 'text-muted-foreground'} />
            <span>Acceptance Reports</span>
            {qualificationBundle && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                  qualificationBundle.qualification_verdict.overall === 'PASSED'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {qualificationBundle.qualification_verdict.overall === 'PASSED' ? 'PASS' : 'FAIL'}
              </span>
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'decision-matrix'}
            aria-controls="tabpanel-decision-matrix"
            id="tab-decision-matrix"
            onClick={() => setActiveTab('decision-matrix')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-xs font-medium cursor-pointer ${
              activeTab === 'decision-matrix'
                ? 'bg-[#181b25] text-white border border-[#2b3040] shadow-sm'
                : 'text-muted-foreground hover:text-white hover:bg-[#151720]'
            }`}
          >
            <Desktop size={16} className={activeTab === 'decision-matrix' ? 'text-primary' : 'text-muted-foreground'} />
            <span>OEM Matrix</span>
          </button>
          
          <button
            role="tab"
            aria-selected={activeTab === 'training'}
            aria-controls="tabpanel-training"
            id="tab-training"
            onClick={() => setActiveTab('training')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-xs font-medium cursor-pointer ${
              activeTab === 'training'
                ? 'bg-[#181b25] text-white border border-[#2b3040] shadow-sm'
                : 'text-muted-foreground hover:text-white hover:bg-[#151720]'
            }`}
          >
            <Lightning size={16} className={activeTab === 'training' ? 'text-amber-400' : 'text-muted-foreground'} />
            <span>Fine-Tuning</span>
          </button>
          
          <button
            role="tab"
            aria-selected={activeTab === 'quantization'}
            aria-controls="tabpanel-quantization"
            id="tab-quantization"
            onClick={() => setActiveTab('quantization')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-xs font-medium cursor-pointer ${
              activeTab === 'quantization'
                ? 'bg-[#181b25] text-white border border-[#2b3040] shadow-sm'
                : 'text-muted-foreground hover:text-white hover:bg-[#151720]'
            }`}
          >
            <ChartBar size={16} className={activeTab === 'quantization' ? 'text-purple-400' : 'text-muted-foreground'} />
            <span>Quantization</span>
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

            {/* OEM & Partner Hardware Decision Matrix Preview */}
            <div className="lg:col-span-12">
              <PartnerDecisionMatrix workload={workload} />
            </div>

            {/* Hardware Benchmark Verification Callout */}
            <div className="lg:col-span-12 p-4 rounded-xl bg-[#10121a] border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-[#181b25] text-primary flex items-center justify-center shrink-0 border border-border">
                  <SealCheck size={20} weight="bold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Benchmark Physical Workstation Hardware</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Run <code className="text-primary font-semibold">npx hw-qual run</code> on your target rig and ingest <code className="text-slate-300">qualification-run.json</code> to generate verified acceptance certificates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('acceptance')}
                className="px-3.5 py-1.5 rounded-md bg-[#181b25] hover:bg-[#202532] text-foreground border border-border text-xs font-mono font-medium shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Acceptance Reports</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Acceptance Reports Tab */}
        {activeTab === 'acceptance' && (
          <motion.div
            id="tabpanel-acceptance"
            role="tabpanel"
            aria-labelledby="tab-acceptance"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <BundleUploader
              activeBundle={qualificationBundle}
              onBundleSelect={setQualificationBundle}
            />
            {qualificationBundle && (
              <>
                <AcceptanceComparisonView bundle={qualificationBundle} />
                <AcceptanceCertificate bundle={qualificationBundle} />
              </>
            )}
          </motion.div>
        )}

        {/* OEM Decision Matrix Tab */}
        {activeTab === 'decision-matrix' && (
          <motion.div
            id="tabpanel-decision-matrix"
            role="tabpanel"
            aria-labelledby="tab-decision-matrix"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <PartnerDecisionMatrix workload={workload} />
          </motion.div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <motion.div
            id="tabpanel-training"
            role="tabpanel"
            aria-labelledby="tab-training"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <QuantizationComparison />
          </motion.div>
        )}

        {/* Engineering Standards Footer */}
        <footer className="mt-8 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
          <p>
            Hardware Qualification Engine • Physical Telemetry &amp; Analytical Sizing for NVIDIA Ada, Hopper &amp; Blackwell
          </p>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">vLLM 0.7.x / TRT-LLM Compatible</span>
          </div>
        </footer>
      </main>
      
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default App