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
import { Lightning, ChartBar, ShieldCheck, SealCheck, Desktop } from '@phosphor-icons/react'
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
    <div className="min-h-screen bg-background grid-pattern flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full p-6 gap-6 overflow-y-auto">
        {/* Navigation Tabs */}
        <nav
          role="tablist"
          aria-label="Calculator modes"
          className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-card p-1 rounded-xl border border-border w-full max-w-5xl mx-auto mb-2"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'inference'}
            aria-controls="tabpanel-inference"
            id="tab-inference"
            onClick={() => setActiveTab('inference')}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-lg relative overflow-hidden group transition-all min-h-[44px] ${
              activeTab === 'inference'
                ? 'bg-primary/20 border border-primary/50 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-surface-highlight'
            }`}
          >
            {activeTab === 'inference' && (
              <div className="absolute inset-0 bg-primary/10 blur-sm group-hover:bg-primary/20 transition-all" />
            )}
            <span className="relative z-10 font-bold tracking-wide flex items-center gap-1.5 text-xs sm:text-sm">
              <ShieldCheck size={18} weight="duotone" className="text-cyan-400 shrink-0" aria-hidden="true" />
              <span>1. Workload Sizing</span>
            </span>
            {activeTab === 'inference' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-primary shadow-[0_0_10px_oklch(0.59_0.24_305)]" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'acceptance'}
            aria-controls="tabpanel-acceptance"
            id="tab-acceptance"
            onClick={() => setActiveTab('acceptance')}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-lg relative overflow-hidden group transition-all min-h-[44px] ${
              activeTab === 'acceptance'
                ? 'bg-primary/20 border border-primary/50 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-surface-highlight'
            }`}
          >
            {activeTab === 'acceptance' && (
              <div className="absolute inset-0 bg-primary/10 blur-sm group-hover:bg-primary/20 transition-all" />
            )}
            <span className="relative z-10 font-bold tracking-wide flex items-center gap-1.5 text-xs sm:text-sm">
              <SealCheck size={18} weight="duotone" className="text-emerald-400 shrink-0" aria-hidden="true" />
              <span>2. Acceptance Reports</span>
              {qualificationBundle && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    qualificationBundle.qualification_verdict.overall === 'PASSED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {qualificationBundle.qualification_verdict.overall === 'PASSED' ? 'PASS' : 'FAIL'}
                </span>
              )}
            </span>
            {activeTab === 'acceptance' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'decision-matrix'}
            aria-controls="tabpanel-decision-matrix"
            id="tab-decision-matrix"
            onClick={() => setActiveTab('decision-matrix')}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-lg relative overflow-hidden group transition-all min-h-[44px] ${
              activeTab === 'decision-matrix'
                ? 'bg-primary/20 border border-primary/50 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-surface-highlight'
            }`}
          >
            {activeTab === 'decision-matrix' && (
              <div className="absolute inset-0 bg-primary/10 blur-sm group-hover:bg-primary/20 transition-all" />
            )}
            <span className="relative z-10 font-bold tracking-wide flex items-center gap-1.5 text-xs sm:text-sm">
              <Desktop size={18} weight="duotone" className="text-cyan-300 shrink-0" aria-hidden="true" />
              <span>3. OEM Matrix</span>
            </span>
            {activeTab === 'decision-matrix' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            )}
          </button>
          
          <button
            role="tab"
            aria-selected={activeTab === 'training'}
            aria-controls="tabpanel-training"
            id="tab-training"
            onClick={() => setActiveTab('training')}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-lg relative overflow-hidden transition-all min-h-[44px] ${
              activeTab === 'training'
                ? 'bg-primary/20 border border-primary/50 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-surface-highlight'
            }`}
          >
            {activeTab === 'training' && (
              <div className="absolute inset-0 bg-primary/10 blur-sm transition-all" />
            )}
            <span className="relative z-10 font-medium tracking-wide flex items-center gap-1.5 text-xs sm:text-sm">
              <Lightning size={18} weight="duotone" className="text-amber-400 shrink-0" aria-hidden="true" />
              <span>Fine-Tuning</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Exp</span>
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
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-lg relative overflow-hidden transition-all min-h-[44px] ${
              activeTab === 'quantization'
                ? 'bg-primary/20 border border-primary/50 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-surface-highlight'
            }`}
          >
            {activeTab === 'quantization' && (
              <div className="absolute inset-0 bg-primary/10 blur-sm transition-all" />
            )}
            <span className="relative z-10 font-medium tracking-wide flex items-center gap-1.5 text-xs sm:text-sm">
              <ChartBar size={18} weight="duotone" className="text-purple-400 shrink-0" aria-hidden="true" />
              <span>Quantization</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Exp</span>
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

            {/* OEM & Partner Hardware Decision Matrix */}
            <div className="lg:col-span-12">
              <PartnerDecisionMatrix workload={workload} />
            </div>

            {/* Quick action bridge to acceptance reports */}
            <div className="lg:col-span-12 p-4 rounded-xl bg-surface-dark/90 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(34,211,238,0.08)]">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                  <SealCheck size={22} weight="duotone" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Have you benchmarked physical hardware?</p>
                  <p className="text-xs text-muted-foreground">
                    Ingest <code className="text-cyan-300 font-mono">qualification-run.json</code> from <code className="text-primary font-mono">npx hw-qual run</code> to compare empirical telemetry and export official delivery acceptance certificates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('acceptance')}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
              >
                <span>Inspect Acceptance Reports</span>
                <span>→</span>
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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

        {/* OEM Decision Matrix Tab (Phase 5) */}
        {activeTab === 'decision-matrix' && (
          <motion.div
            id="tabpanel-decision-matrix"
            role="tabpanel"
            aria-labelledby="tab-decision-matrix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
