import { useKV } from "@github/spark/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Database, Info, GraphicsCard } from "@phosphor-icons/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  calculateInferenceMemory,
  formatMemory,
  getRecommendedGPUs,
  MODEL_PRESETS,
  PRECISION_OPTIONS,
  type InferenceParams,
} from "@/lib/llm-calculations"
import { motion } from "framer-motion"
import { ExportButton } from "@/components/ExportButton"
import type { ExportData } from "@/lib/export-utils"
import { CloudPricingCard } from "@/components/CloudPricingCard"
import { saveCalculationToHistory, type CalculationEntry } from "@/components/HistoricalTracking"
import { useEffect, useMemo } from "react"

export function InferenceCalculator() {
  const [params, setParams] = useKV<InferenceParams>("inference-params", {
    parameters: 7,
    precision: "fp16",
    contextLength: 4096,
  })

  const [, setHistory] = useKV<CalculationEntry[]>("calculation-history", [])

  const currentParams = useMemo(() => params ?? {
    parameters: 7,
    precision: "fp16",
    contextLength: 4096,
  }, [params])

  const memory = calculateInferenceMemory(currentParams)
  const recommendedGPUs = getRecommendedGPUs(memory.total)

  useEffect(() => {
    const entry = saveCalculationToHistory({
      type: "inference",
      params: currentParams,
      totalMemory: memory.total,
      gpuRecommendation: recommendedGPUs[0]?.name,
    })

    setHistory((current) => {
      if (!current) return [entry]
      const filtered = current.filter((e) => e.timestamp > Date.now() - 60000)
      if (filtered.length === 0 || filtered[0].totalMemory !== entry.totalMemory) {
        return [entry, ...current].slice(0, 50)
      }
      return current
    })
  }, [currentParams, memory.total, recommendedGPUs, setHistory])

  const handlePresetClick = (preset: typeof MODEL_PRESETS[0]) => {
    setParams((current) => current ? { ...current, parameters: preset.parameters } : { parameters: preset.parameters, precision: "fp16", contextLength: 4096 })
  }

  const exportData: ExportData = {
    calculatorType: "inference",
    timestamp: new Date().toISOString(),
    params,
    results: memory,
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-border/50 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <GraphicsCard size={20} className="text-accent sm:w-6 sm:h-6" weight="duotone" />
            Model Presets
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Quick-select popular models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {MODEL_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg border transition-all min-h-[44px] ${
                  params.parameters === preset.parameters
                    ? "bg-accent text-accent-foreground border-accent glow-accent"
                    : "bg-card border-border hover:border-accent/50 text-foreground hover:bg-card/80"
                }`}
              >
                <div className="text-xs sm:text-sm font-medium">{preset.name}</div>
                <div className="text-[10px] sm:text-xs opacity-70">{preset.parameters}B params</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Model Configuration</CardTitle>
          <CardDescription>Configure model parameters for inference</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="parameters" className="flex items-center gap-2">
                Model Size (Billion Parameters)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The number of parameters in the model (in billions)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="parameters"
                type="number"
                value={currentParams.parameters}
                onChange={(e) => setParams((current) => current ? { ...current, parameters: parseFloat(e.target.value) || 0 } : { parameters: parseFloat(e.target.value) || 0, precision: "fp16", contextLength: 4096 })}
                min={0.1}
                step={0.1}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precision">Precision</Label>
              <Select
                value={currentParams.precision}
                onValueChange={(value) => setParams((current) => current ? { ...current, precision: value } : { parameters: 7, precision: value, contextLength: 4096 })}
              >
                <SelectTrigger id="precision">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRECISION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="contextLength" className="flex items-center gap-2">
                Context Length
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Maximum number of tokens the model can process at once</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <span className="font-mono text-sm text-muted-foreground">
                {currentParams.contextLength.toLocaleString()} tokens
              </span>
            </div>
            <Slider
              id="contextLength"
              value={[currentParams.contextLength]}
              onValueChange={([value]) => setParams((current) => current ? { ...current, contextLength: value } : { parameters: 7, precision: "fp16", contextLength: value })}
              min={512}
              max={131072}
              step={512}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>512</span>
              <span>8K</span>
              <span>32K</span>
              <span>64K</span>
              <span>128K</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        key={memory.total}
      >
        <Card className="border-accent/30 bg-card/50 backdrop-blur-sm glow-accent">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Database size={20} className="text-accent sm:w-6 sm:h-6" weight="duotone" />
                Memory Requirements
              </CardTitle>
              <ExportButton data={exportData} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-muted-foreground">Model Weights</span>
                <span className="font-mono font-medium">{formatMemory(memory.modelWeights)}</span>
              </div>
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-muted-foreground">KV Cache</span>
                <span className="font-mono font-medium">{formatMemory(memory.kvCache || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-muted-foreground">Overhead</span>
                <span className="font-mono font-medium">{formatMemory(memory.overhead)}</span>
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-base sm:text-lg font-semibold">Total VRAM Required</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-accent">
                  {formatMemory(memory.total)}
                </span>
              </div>
            </div>

            {recommendedGPUs.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm sm:text-base">Recommended GPUs</h4>
                  <div className="space-y-2">
                    {recommendedGPUs.map((gpu) => (
                      <div
                        key={gpu.name}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="font-medium text-sm sm:text-base">{gpu.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {gpu.vram} GB
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-xs self-start sm:self-center">
                          {gpu.tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {recommendedGPUs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Memory Usage</span>
                        <span className="font-mono">
                          {((memory.total / recommendedGPUs[0].vram) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={(memory.total / recommendedGPUs[0].vram) * 100} />
                    </div>
                  )}
                </div>
              </>
            )}

            {recommendedGPUs.length === 0 && (
              <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                <p className="text-xs sm:text-sm text-destructive">
                  This model requires more VRAM than common GPUs. Consider using quantization or model
                  sharding.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {recommendedGPUs.length > 0 && recommendedGPUs[0] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <CloudPricingCard
            gpu={recommendedGPUs[0]}
            utilizationPercent={(memory.total / recommendedGPUs[0].vram) * 100}
          />
        </motion.div>
      )}
    </div>
  )
}
