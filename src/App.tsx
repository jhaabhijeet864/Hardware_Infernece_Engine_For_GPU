import { useKV } from "@github/spark/hooks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InferenceCalculator } from "@/components/InferenceCalculator"
import { TrainingCalculator } from "@/components/TrainingCalculator"
import { QuantizationComparison } from "@/components/QuantizationComparison"
import { GraphicsCard, Lightning, ChartBar } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { Toaster } from "@/components/ui/sonner"

function App() {
  const [activeTab, setActiveTab] = useKV("active-tab", "inference")

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:px-6 md:py-12 max-w-7xl">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8 md:mb-12"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2.5 sm:p-3 rounded-lg bg-accent/10 border border-accent/30 glow-accent">
              <GraphicsCard size={28} className="text-accent sm:w-8 sm:h-8" weight="duotone" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              LLM Hardware Calculator
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
            Calculate VRAM and RAM requirements for running and training local LLMs. Get accurate
            hardware recommendations for your deployment needs.
          </p>
        </motion.header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-card/50 border border-border backdrop-blur-sm">
            <TabsTrigger
              value="inference"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all min-h-[44px]"
            >
              <GraphicsCard size={20} weight="duotone" className="shrink-0" />
              <span className="text-xs sm:text-sm">Inference</span>
            </TabsTrigger>
            <TabsTrigger
              value="training"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all min-h-[44px]"
            >
              <Lightning size={20} weight="duotone" className="shrink-0" />
              <span className="text-xs sm:text-sm">Training</span>
            </TabsTrigger>
            <TabsTrigger
              value="quantization"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all min-h-[44px]"
            >
              <ChartBar size={20} weight="duotone" className="shrink-0" />
              <span className="text-xs sm:text-sm">Quantization</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inference" className="mt-4 sm:mt-6">
            <InferenceCalculator />
          </TabsContent>

          <TabsContent value="training" className="mt-4 sm:mt-6">
            <TrainingCalculator />
          </TabsContent>

          <TabsContent value="quantization" className="mt-4 sm:mt-6">
            <QuantizationComparison />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50">
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
