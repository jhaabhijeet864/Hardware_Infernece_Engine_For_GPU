import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Cpu, Database, Info, GraphicsCard } from "@phosphor-icons/react"
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

export function InferenceCalculator() {
  const [params, setParams] = useState<InferenceParams>({
    parameters: 7,
    precision: "fp16",
    contextLength: 4096,
  })

  const memory = calculateInferenceMemory(params)
  const recommendedGPUs = getRecommendedGPUs(memory.total)

  const handlePresetClick = (preset: typeof MODEL_PRESETS[0]) => {
    setParams({ ...params, parameters: preset.parameters })
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraphicsCard size={24} className="text-accent" weight="duotone" />
            Model Presets
          </CardTitle>
          <CardDescription>Quick-select popular models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MODEL_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  params.parameters === preset.parameters
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card border-border hover:border-accent/50 text-foreground"
                }`}
              >
                <div className="text-sm font-medium">{preset.name}</div>
                <div className="text-xs opacity-70">{preset.parameters}B params</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
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
                value={params.parameters}
                onChange={(e) => setParams({ ...params, parameters: parseFloat(e.target.value) || 0 })}
                min={0.1}
                step={0.1}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precision">Precision</Label>
              <Select
                value={params.precision}
                onValueChange={(value) => setParams({ ...params, precision: value })}
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
                {params.contextLength.toLocaleString()} tokens
              </span>
            </div>
            <Slider
              id="contextLength"
              value={[params.contextLength]}
              onValueChange={([value]) => setParams({ ...params, contextLength: value })}
              min={512}
              max={32768}
              step={512}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>512</span>
              <span>8K</span>
              <span>16K</span>
              <span>32K</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-accent/30 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={24} className="text-accent" weight="duotone" />
              Memory Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model Weights</span>
                <span className="font-mono font-medium">{formatMemory(memory.modelWeights)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">KV Cache</span>
                <span className="font-mono font-medium">{formatMemory(memory.kvCache || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overhead</span>
                <span className="font-mono font-medium">{formatMemory(memory.overhead)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total VRAM Required</span>
                <span className="font-mono text-2xl font-bold text-accent">
                  {formatMemory(memory.total)}
                </span>
              </div>
            </div>

            {recommendedGPUs.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold">Recommended GPUs</h4>
                  <div className="space-y-2">
                    {recommendedGPUs.map((gpu) => (
                      <div
                        key={gpu.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{gpu.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {gpu.vram} GB
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {gpu.tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {recommendedGPUs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-sm">
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
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                <p className="text-sm text-destructive">
                  This model requires more VRAM than common GPUs. Consider using quantization or model
                  sharding.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
