import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModelPresetSelector } from '@/components/ModelPresetSelector'
import { ConfigurationPanel } from '@/components/ConfigurationPanel'
import { ResultsDisplay } from '@/components/ResultsDisplay'
import { GPURecommendations } from '@/components/GPURecommendations'
import { Header } from '@/components/Header'
import { Cpu, Lightning, ChartBar } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { calculateMemoryRequirements } from '@/lib/calculator'
import type { TabMode, CalculatorConfig } from '@/lib/types'

function App() {
  const [activeTab, setActiveTab] = useKV<TabMode>('active-tab', 'inference')
  const [selectedPresetId, setSelectedPresetId] = useKV('selected-preset-id', 'llama3-8b')
  
  const [config, setConfig] = useKV<CalculatorConfig>('calculator-config', {
    parameters: 8,
    precision: 'fp16',
    contextLength: 8192,
    kvCacheQuantization: false,
    flashAttention: true,
  })

  const memoryBreakdown = useMemo(() => {
    return calculateMemoryRequirements(config)
  }, [config])

  return (
    <div className="min-h-screen bg-background grid-pattern flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full p-6 gap-6 overflow-y-auto">
        <nav className="grid grid-cols-3 gap-1 bg-card p-1 rounded-xl border border-border w-full max-w-2xl mx-auto mb-4">
          <button
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
              <Cpu size={20} weight="duotone" className="sm:hidden" />
              <span className="hidden sm:inline">Inference</span>
              <span className="sm:hidden">Infer</span>
            </span>
            {activeTab === 'inference' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-primary shadow-[0_0_10px_oklch(0.59_0.24_305)]" />
            )}
          </button>
          
          <button
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
              <Lightning size={20} weight="duotone" className="sm:hidden" />
              <span className="hidden sm:inline">Training</span>
              <span className="sm:hidden">Train</span>
            </span>
            {activeTab === 'training' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-primary shadow-[0_0_10px_oklch(0.59_0.24_305)]" />
            )}
          </button>
          
          <button
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
              <ChartBar size={20} weight="duotone" className="sm:hidden" />
              <span className="hidden sm:inline">Quantization</span>
              <span className="sm:hidden">Quant</span>
            </span>
            {activeTab === 'quantization' && (
              <div className="absolute bottom-0 h-[2px] w-1/3 bg-primary shadow-[0_0_10px_oklch(0.59_0.24_305)]" />
            )}
          </button>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <ModelPresetSelector
              selectedId={selectedPresetId}
              onSelect={(preset) => {
                setSelectedPresetId(preset.id)
                setConfig((prev) => ({ ...prev, parameters: preset.parameters }))
              }}
            />
            
            <ConfigurationPanel
              config={config}
              onChange={setConfig}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <ResultsDisplay
              memoryBreakdown={memoryBreakdown}
            />
            
            <GPURecommendations
              requiredVRAM={memoryBreakdown.total}
            />
          </div>
        </div>

        <footer className="mt-8 pt-6 border-t border-border/50">
          <p className="text-center text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Memory calculations are estimates based on standard architectures. Actual requirements may
            vary depending on implementation details and optimizations.
          </p>
        </footer>
      </div>
      
      <Toaster />
    </div>
  )
}

export default App
