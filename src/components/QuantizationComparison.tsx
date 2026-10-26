import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChartBar, Cpu } from "@phosphor-icons/react"
import { MODEL_PRESETS, PRECISION_OPTIONS, formatMemory } from "@/lib/llm-calculations"
import { Progress } from "@/components/ui/progress"
import { ExportButton } from "@/components/ExportButton"
import type { ExportData, QuantizationResults } from "@/lib/export-utils"

function generateQuantizationResults(modelSize: number): QuantizationResults {
  const comparisons = PRECISION_OPTIONS.map((option) => {
    const memory = modelSize * option.bytesPerParam
    let qualityRetention = 100
    let speedup = 1

    switch (option.value) {
      case "fp32":
        qualityRetention = 100
        speedup = 1
        break
      case "fp16":
        qualityRetention = 99.5
        speedup = 1.8
        break
      case "int8":
        qualityRetention = 97
        speedup = 2.5
        break
      case "int4":
        qualityRetention = 93
        speedup = 3.5
        break
    }

    return {
      precision: option.value,
      label: option.label,
      memory,
      qualityRetention,
      speedup,
    }
  })

  return {
    modelSize,
    comparisons,
  }
}

export function QuantizationComparison() {
  const [modelSize, setModelSize] = useState<number>(7)

  const handlePresetClick = (preset: typeof MODEL_PRESETS[0]) => {
    setModelSize(preset.parameters)
  }

  const quantResults = generateQuantizationResults(modelSize)
  const results = quantResults.comparisons
  const baselineMemory = results[0].memory

  const exportData: ExportData = {
    calculatorType: "quantization",
    timestamp: new Date().toISOString(),
    params: { modelSize },
    results: quantResults,
  }

  return (
    <div className="space-y-5">
      <Card className="bg-[#11131a] border-border text-foreground">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Cpu size={16} className="text-primary" />
            <span>Model Presets</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-mono">
            Select a target baseline parameter size to evaluate quantization trade-offs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 font-mono">
            {MODEL_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-1.5 rounded border text-xs transition-colors cursor-pointer ${
                  modelSize === preset.parameters
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
          <CardTitle className="text-sm font-semibold">Custom Parameter Sizing</CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-mono">
            Directly specify model parameter count in billions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1.5 font-mono text-xs">
            <Label htmlFor="custom-model-size" className="text-muted-foreground uppercase text-[10px] tracking-wider">
              Model Size (Billion Parameters)
            </Label>
            <Input
              id="custom-model-size"
              type="number"
              value={modelSize}
              onChange={(e) => setModelSize(parseFloat(e.target.value) || 0)}
              min={0.1}
              step={0.1}
              className="bg-[#0e1017] border-border font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#11131a] border-border text-foreground">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ChartBar size={16} className="text-primary" />
                <span>Quantization &amp; Precision Matrix</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Comparative analysis of memory compression, perplexity retention, and compute speedup
              </CardDescription>
            </div>
            <ExportButton data={exportData} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {results.map((result) => (
              <div
                key={result.precision}
                className="p-4 rounded-lg border border-border bg-[#0e1017] space-y-3 font-mono"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs text-foreground">{result.label}</h3>
                  {result.precision === "fp8" && (
                    <Badge variant="outline" className="text-[10px] bg-[#181b24] text-primary border-primary/40">
                      vLLM / Ada
                    </Badge>
                  )}
                  {result.precision === "fp16" && (
                    <Badge variant="outline" className="text-[10px] bg-[#181b24] text-slate-300 border-border">
                      Baseline
                    </Badge>
                  )}
                </div>

                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatMemory(result.memory)}
                </div>

                <div className="space-y-2.5 pt-1 text-[11px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Memory Savings</span>
                      <span className="font-bold text-foreground">
                        {((1 - result.memory / baselineMemory) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={(1 - result.memory / baselineMemory) * 100} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Quality Retention</span>
                      <span className="font-bold text-emerald-400">
                        {result.qualityRetention.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.qualityRetention} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Inference Speedup</span>
                      <span className="font-bold text-primary">{result.speedup}×</span>
                    </div>
                    <Progress value={(result.speedup / 4) * 100} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3.5 rounded-lg bg-[#0e1017] border border-border font-mono text-xs text-muted-foreground">
            <h4 className="font-semibold text-foreground mb-2 uppercase text-[10px] tracking-wider">
              Serving Architecture Guidelines
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] leading-relaxed">
              <div>
                <strong className="text-slate-200">FP16 / BF16:</strong> Full numerical fidelity (2 bytes/param). Optimal baseline for validation and training.
              </div>
              <div>
                <strong className="text-primary">FP8:</strong> Native Ada Lovelace &amp; Hopper Tensor Core instruction format. Cuts memory in half with near-zero perplexity degradation.
              </div>
              <div>
                <strong className="text-slate-200">INT8 (SmoothQuant):</strong> 1 byte/param weight compression. Well suited for compute-bound batch inference.
              </div>
              <div>
                <strong className="text-slate-200">INT4 (AWQ / GPTQ):</strong> 0.5 bytes/param aggressive compression. Enables 70B models on dual 24GB workstation GPUs.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
