import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChartBar, Cpu } from "@phosphor-icons/react"
import { MODEL_PRESETS, PRECISION_OPTIONS, formatMemory } from "@/lib/llm-calculations"
import { motion } from "framer-motion"
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
      case "fp8":
        qualityRetention = 98.5
        speedup = 2.2
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
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu size={24} className="text-accent" weight="duotone" />
            Model Presets
          </CardTitle>
          <CardDescription>Select a model to compare quantization methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MODEL_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  modelSize === preset.parameters
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
          <CardTitle>Custom Model Size</CardTitle>
          <CardDescription>Or enter a custom model size in billions of parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="custom-model-size">Model Size (Billion Parameters)</Label>
            <Input
              id="custom-model-size"
              type="number"
              value={modelSize}
              onChange={(e) => setModelSize(parseFloat(e.target.value) || 0)}
              min={0.1}
              step={0.1}
              className="font-mono mt-2"
            />
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
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <ChartBar size={24} className="text-accent" weight="duotone" />
                  Quantization Comparison
                </CardTitle>
                <CardDescription>
                  Compare memory usage, quality retention, and speed across quantization methods
                </CardDescription>
              </div>
              <ExportButton data={exportData} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.precision}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-5 rounded-lg border border-border bg-card/80 space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{result.label}</h3>
                      {result.precision === "fp8" && (
                        <Badge variant="secondary" className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          vLLM Standard
                        </Badge>
                      )}
                      {result.precision === "fp16" && (
                        <Badge variant="secondary" className="text-[10px]">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="font-mono text-2xl font-bold text-accent">
                      {formatMemory(result.memory)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-xs">Memory Savings</span>
                        <span className="font-mono font-medium text-xs">
                          {((1 - result.memory / baselineMemory) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={(1 - result.memory / baselineMemory) * 100} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-xs">Quality Retention</span>
                        <span className="font-mono font-medium text-xs">{result.qualityRetention.toFixed(1)}%</span>
                      </div>
                      <Progress value={result.qualityRetention} className="[&>div]:bg-green-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-xs">Speed Improvement</span>
                        <span className="font-mono font-medium text-xs">{result.speedup}×</span>
                      </div>
                      <Progress value={(result.speedup / 4) * 100} className="[&>div]:bg-blue-500" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-semibold mb-3">Quantization Guide</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <strong className="text-accent">FP32:</strong> Maximum quality, largest size. Use for
                  training baseline.
                </div>
                <div>
                  <strong className="text-accent">FP16 / BF16:</strong> Zero quality loss, 50% size reduction.
                  Best general-purpose serving.
                </div>
                <div>
                  <strong className="text-cyan-400">FP8:</strong> Modern datacenter standard (Ada Lovelace &amp; Hopper). Minimal quality loss with 2x throughput on Tensor Cores.
                </div>
                <div>
                  <strong className="text-accent">INT8 / INT4 (AWQ/GPTQ):</strong> Aggressive memory compression for edge devices or low-VRAM workstations.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
