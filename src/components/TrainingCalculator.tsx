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
import { Progress } from "@/components/ui/progress"
import { ExportButton } from "@/components/ExportButton"
import type { ExportData } from "@/lib/export-utils"

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

  const exportData: ExportData = {
    calculatorType: "training",
    timestamp: new Date().toISOString(),
    params,
    results: memory,
  }

  return (
    <div className="space-y-5">
      <div className="p-3.5 rounded-lg bg-[#14120a] border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start gap-2.5">
        <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 uppercase tracking-wide text-[10px] block mb-0.5">
            Experimental Analytical Estimation
          </span>
          Training memory requirements are analytical approximations. Actual memory varies based on framework execution (PyTorch FSDP / DeepSpeed ZeRO-3), activation checkpointing, and gradient accumulation sequence packing.
        </div>
      </div>

      <Card className="bg-[#11131a] border-border text-foreground">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lightning size={16} className="text-amber-400" />
            <span>Model Presets</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-mono">
            Quick-select target parameter counts for training / fine-tuning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 font-mono">
            {MODEL_PRESETS.slice(0, 6).map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-1.5 rounded border text-xs transition-colors cursor-pointer ${
                  params.parameters === preset.parameters
                    ? "bg-[#181b24] text-white border-primary font-bold shadow-sm"
                    : "bg-[#0e1017] border-border text-muted-foreground hover:text-white hover:border-slate-500"
                }`}
              >
                <span className="font-semibold">{preset.name}</span>{" "}
                <span className="text-[10px] text-muted-foreground">({preset.parameters}B)</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#11131a] border-border text-foreground">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Training Configuration</CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-mono">
            Configure fine-tuning hyperparameters and memory optimization techniques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Training Method
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TRAINING_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setParams({ ...params, method: method.value })}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    params.method === method.value
                      ? "bg-[#181b24] border-primary text-foreground shadow-sm"
                      : "bg-[#0e1017] border-border text-muted-foreground hover:border-slate-500 hover:text-white"
                  }`}
                >
                  <div className="font-semibold text-xs text-foreground font-mono">{method.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {method.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs font-mono">
            <div className="space-y-1.5">
              <Label htmlFor="training-parameters" className="text-muted-foreground uppercase text-[10px] tracking-wider">
                Model Size (Billion Params)
              </Label>
              <Input
                id="training-parameters"
                type="number"
                value={params.parameters}
                onChange={(e) => setParams({ ...params, parameters: parseFloat(e.target.value) || 0 })}
                min={0.1}
                step={0.1}
                className="bg-[#0e1017] border-border font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="training-precision" className="text-muted-foreground uppercase text-[10px] tracking-wider">
                Precision
              </Label>
              <Select
                value={params.precision}
                onValueChange={(value) => setParams({ ...params, precision: value })}
              >
                <SelectTrigger id="training-precision" className="bg-[#0e1017] border-border font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#11131a] border-border text-foreground font-mono text-xs">
                  {PRECISION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="optimizer" className="text-muted-foreground uppercase text-[10px] tracking-wider">
                Optimizer
              </Label>
              <Select
                value={params.optimizer}
                onValueChange={(value) => setParams({ ...params, optimizer: value })}
              >
                <SelectTrigger id="optimizer" className="bg-[#0e1017] border-border font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#11131a] border-border text-foreground font-mono text-xs">
                  {OPTIMIZER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchSize" className="text-muted-foreground uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Batch Size</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={12} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#11131a] border-border text-foreground text-xs font-mono">
                      Samples per micro-step
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
                className="bg-[#0e1017] border-border font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <Label htmlFor="gradientAccumulation" className="text-muted-foreground uppercase text-[10px] tracking-wider">
                Gradient Accumulation Steps
              </Label>
              <span className="text-foreground font-bold">{params.gradientAccumulation}</span>
            </div>
            <Slider
              id="gradientAccumulation"
              value={[params.gradientAccumulation]}
              onValueChange={([value]) => setParams({ ...params, gradientAccumulation: value })}
              min={1}
              max={32}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#11131a] border-border text-foreground">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Database size={16} className="text-primary" />
                <span>Training Memory Footprint</span>
              </CardTitle>
              {trainingMethod && (
                <CardDescription className="text-xs text-muted-foreground font-mono">
                  Method: {trainingMethod.label} • {trainingMethod.description}
                </CardDescription>
              )}
            </div>
            <ExportButton data={exportData} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-muted-foreground">Model Weights</span>
              <span className="font-bold text-foreground">{formatMemory(memory.modelWeights)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-muted-foreground">Gradients</span>
              <span className="font-bold text-foreground">{formatMemory(memory.gradients || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-muted-foreground">Optimizer States</span>
              <span className="font-bold text-foreground">{formatMemory(memory.optimizerStates || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-muted-foreground">Activations</span>
              <span className="font-bold text-foreground">{formatMemory(memory.activations || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#0e1017] border border-border">
              <span className="text-muted-foreground">CUDA &amp; Runtime Overhead</span>
              <span className="font-bold text-foreground">{formatMemory(memory.overhead)}</span>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#181b24] border border-border">
                <span className="text-sm font-semibold text-foreground">Total VRAM Required</span>
                <span className="font-mono text-xl font-bold text-primary">
                  {formatMemory(memory.total)}
                </span>
              </div>
            </div>
          </div>

          {recommendedGPUs.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Matching Hardware Configurations
              </h4>
              <div className="space-y-2">
                {recommendedGPUs.map((gpu) => (
                  <div
                    key={gpu.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e1017] border border-border"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-medium text-foreground">{gpu.name}</span>
                      <Badge variant="outline" className="font-mono text-[10px] bg-[#181b24] border-border text-slate-300">
                        {gpu.vram} GB
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono bg-[#181b24] text-muted-foreground">
                      {gpu.tier}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Primary GPU Memory Occupancy</span>
                  <span className="font-bold text-foreground">
                    {((memory.total / recommendedGPUs[0].vram) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={(memory.total / recommendedGPUs[0].vram) * 100} />
              </div>
            </div>
          )}

          {recommendedGPUs.length === 0 && (
            <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-center font-mono text-xs text-red-300">
              Configuration exceeds single GPU memory limits. Switch to LoRA/QLoRA or apply DeepSpeed ZeRO-3 offloading.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
