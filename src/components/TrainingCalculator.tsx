import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Lightning, Database, Info } from "@phosphor-icons/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  calculateTrainingMemory,
  formatMemory,
  getRecommendedGPUs,
  MODEL_PRESETS,
  PRECISION_OPTIONS,
  OPTIMIZER_OPTIONS,
  TRAINING_METHODS,
  type TrainingParams,
} from "@/lib/llm-calculations"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"

export function TrainingCalculator() {
  const [params, setParams] = useState<TrainingParams>({
    parameters: 7,
    precision: "fp16",
    batchSize: 1,
    gradientAccumulation: 4,
    optimizer: "adamw",
    method: "lora",
  })

  const memory = calculateTrainingMemory(params)
  const recommendedGPUs = getRecommendedGPUs(memory.total)

  const handlePresetClick = (preset: typeof MODEL_PRESETS[0]) => {
    setParams({ ...params, parameters: preset.parameters })
  }

  const trainingMethod = TRAINING_METHODS.find((m) => m.value === params.method)

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightning size={24} className="text-accent" weight="duotone" />
            Model Presets
          </CardTitle>
          <CardDescription>Quick-select popular models for training</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MODEL_PRESETS.slice(0, 6).map((preset) => (
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
          <CardTitle>Training Configuration</CardTitle>
          <CardDescription>Configure parameters for training or fine-tuning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Training Method</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TRAINING_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setParams({ ...params, method: method.value })}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    params.method === method.value
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card border-border hover:border-accent/50"
                  }`}
                >
                  <div className="font-semibold">{method.label}</div>
                  <div className="text-xs opacity-70 mt-1">{method.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="training-parameters" className="flex items-center gap-2">
                Model Size (Billion Parameters)
              </Label>
              <Input
                id="training-parameters"
                type="number"
                value={params.parameters}
                onChange={(e) => setParams({ ...params, parameters: parseFloat(e.target.value) || 0 })}
                min={0.1}
                step={0.1}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-precision">Precision</Label>
              <Select
                value={params.precision}
                onValueChange={(value) => setParams({ ...params, precision: value })}
              >
                <SelectTrigger id="training-precision">
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

            <div className="space-y-2">
              <Label htmlFor="optimizer">Optimizer</Label>
              <Select
                value={params.optimizer}
                onValueChange={(value) => setParams({ ...params, optimizer: value })}
              >
                <SelectTrigger id="optimizer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIMIZER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchSize" className="flex items-center gap-2">
                Batch Size
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Number of samples processed together per step</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="batchSize"
                type="number"
                value={params.batchSize}
                onChange={(e) => setParams({ ...params, batchSize: parseInt(e.target.value) || 1 })}
                min={1}
                max={128}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gradientAccumulation" className="flex items-center gap-2">
                Gradient Accumulation Steps
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Number of steps to accumulate gradients before updating weights
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <span className="font-mono text-sm text-muted-foreground">{params.gradientAccumulation}</span>
            </div>
            <Slider
              id="gradientAccumulation"
              value={[params.gradientAccumulation]}
              onValueChange={([value]) => setParams({ ...params, gradientAccumulation: value })}
              min={1}
              max={32}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>8</span>
              <span>16</span>
              <span>32</span>
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
              Training Memory Requirements
            </CardTitle>
            {trainingMethod && (
              <CardDescription>
                Using {trainingMethod.label}: {trainingMethod.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model Weights</span>
                <span className="font-mono font-medium">{formatMemory(memory.modelWeights)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Gradients</span>
                <span className="font-mono font-medium">{formatMemory(memory.gradients || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Optimizer States</span>
                <span className="font-mono font-medium">{formatMemory(memory.optimizerStates || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Activations</span>
                <span className="font-mono font-medium">{formatMemory(memory.activations || 0)}</span>
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
                  This configuration requires more VRAM than common GPUs. Try LoRA/QLoRA or reduce batch
                  size.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
