import { useMemo } from 'react'
import { useKV } from '@/hooks/useKV'
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
import { motion, AnimatePresence } from 'framer-motion'
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

  const tabs: { id: TabMode; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    {
      id: 'inference',
      label: 'Workload Sizing',
      icon: <SlidersHorizontal size={15} weight="bold" />,
    },
    {
      id: 'acceptance',
      label: 'Acceptance Reports',
      icon: <SealCheck size={15} weight="bold" />,
      badge: qualificationBundle ? (qualificationBundle.qualification_verdict.overall === 'PASSED' ? 'PASS' : 'FAIL') : undefined,
      badgeColor: qualificationBundle?.qualification_verdict.overall === 'PASSED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30',
    },
    {
      id: 'decision-matrix',
      label: 'OEM Matrix',
      icon: <Desktop size={15} weight="bold" />,
    },
    {
      id: 'training',
      label: 'Fine-Tuning',
      icon: <Lightning size={15} weight="bold" />,
    },
    {
      id: 'quantization',
      label: 'Quantization',
      icon: <ChartBar size={15} weight="bold" />,
    },
  ]

  return (
    <div className="min-h-screen scale-ambient-bg flex flex-col text-foreground selection:bg-cyan-500/20 selection:text-cyan-200">
      <Header />
      
      <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 gap-7">
        {/* Scale AI Style Segmented Floating Nav Bar */}
        <nav
          role="tablist"
          aria-label="Calculator modes"
          className="flex items-center justify-between p-1.5 rounded-2xl bg-[#0c0f18]/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] w-full max-w-4xl mx-auto overflow-x-auto"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 text-xs font-medium cursor-pointer shrink-0 relative ${
                  isActive
                    ? 'bg-white/[0.1] text-white border border-white/[0.14] shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-zinc-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold tracking-wider uppercase border ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Inference / Workload Qualification View */}
        {activeTab === 'inference' && (
          <div
            id="tabpanel-inference"
            role="tabpanel"
            aria-labelledby="tab-inference"
            className="grid grid-cols-1 lg:grid-cols-12 gap-7"
          >
            <div className="lg:col-span-7 flex flex-col gap-7">
              <WorkloadBuilder
                workload={workload}
                onChange={setWorkload}
              />
            </div>

            <div className="lg:col-span-5 flex flex-col gap-7">
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
            <div className="lg:col-span-12 p-5 rounded-2xl scale-card relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-white/[0.08]">
              <div className="absolute -top-12 -right-12 size-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="size-11 rounded-xl bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                  <SealCheck size={22} weight="duotone" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Empirical Workstation Benchmark Verification</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Run <code className="text-cyan-300 font-semibold px-1 py-0.5 rounded bg-white/[0.06] border border-white/10">npx hw-qual run</code> on your physical rig to generate cryptographic hardware acceptance certificates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('acceptance')}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold shrink-0 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
              >
                <span>View Acceptance Reports</span>
                <ArrowRight size={14} weight="bold" />
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-7"
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-7"
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
            initial={{ opacity: 0, y: 8 }}
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <QuantizationComparison />
          </motion.div>
        )}

        {/* Engineering Standards Footer */}
        <footer className="mt-12 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-mono">
          <p className="flex items-center gap-2">
            <span className="text-zinc-300 font-semibold">Scale AI Aesthetic Engine</span>
            <span>•</span>
            <span>NVIDIA Ada, Hopper &amp; Blackwell Architecture Qualification</span>
          </p>
          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-zinc-300">vLLM 0.7.x / TRT-LLM / CUDA 12.9 Qualified</span>
          </div>
        </footer>
      </main>
      
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default App