import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InferenceCalculator } from "@/components/InferenceCalculator"
import { TrainingCalculator } from "@/components/TrainingCalculator"
import { QuantizationComparison } from "@/components/QuantizationComparison"
import { GraphicsCard, Lightning, ChartBar } from "@phosphor-icons/react"

function App() {
  const [activeTab, setActiveTab] = useState("inference")

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-7xl">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
              <GraphicsCard size={32} className="text-accent" weight="duotone" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              LLM Hardware Calculator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Calculate VRAM and RAM requirements for running and training local LLMs. Get accurate
            hardware recommendations for your deployment needs.
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-card/50 border border-border">
            <TabsTrigger
              value="inference"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <GraphicsCard size={20} weight="duotone" />
              <span className="hidden sm:inline">Inference</span>
            </TabsTrigger>
            <TabsTrigger
              value="training"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Lightning size={20} weight="duotone" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger
              value="quantization"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <ChartBar size={20} weight="duotone" />
              <span className="hidden sm:inline">Quantization</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inference" className="mt-6">
            <InferenceCalculator />
          </TabsContent>

          <TabsContent value="training" className="mt-6">
            <TrainingCalculator />
          </TabsContent>

          <TabsContent value="quantization" className="mt-6">
            <QuantizationComparison />
          </TabsContent>
        </Tabs>

        <footer className="mt-16 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Memory calculations are estimates based on standard architectures. Actual requirements may
            vary depending on implementation details and optimizations.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
