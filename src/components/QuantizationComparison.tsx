import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChartBar, Cpu } from "@phosphor-icons/react"
import { MODEL_PRESETS, PRECISION_OPTIONS, formatMemory } from "@/lib/llm-calculations"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"

interface QuantizationResult {
  precision: string
  label: string
  memory: number
  qualityRetention: number
  speedup: number
}

export function QuantizationComparison() {
  const [modelSize, setModelSize] = useState<number>(7)

  const handlePresetClick = (preset: typeof MODEL_PRESETS[0]) => {
    setModelSize(preset.parameters)
  }

  const results: QuantizationResult[] = PRECISION_OPTIONS.map((option) => {
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

  const baselineMemory = results[0].memory

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
            <CardTitle className="flex items-center gap-2">
              <ChartBar size={24} className="text-accent" weight="duotone" />
              Quantization Comparison
            </CardTitle>
            <CardDescription>
              Compare memory usage, quality retention, and speed across quantization methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.precision}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-6 rounded-lg border border-border bg-card/80 space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{result.label}</h3>
                      {result.precision === "fp16" && (
                        <Badge variant="secondary" className="text-xs">
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
                        <span className="text-muted-foreground">Memory Savings</span>
                        <span className="font-mono font-medium">
                          {((1 - result.memory / baselineMemory) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={(1 - result.memory / baselineMemory) * 100} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Quality Retention</span>
                        <span className="font-mono font-medium">{result.qualityRetention.toFixed(1)}%</span>
                      </div>
                      <Progress value={result.qualityRetention} className="[&>div]:bg-green-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Speed Improvement</span>
                        <span className="font-mono font-medium">{result.speedup}×</span>
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
                  <strong className="text-accent">FP16:</strong> Negligible quality loss, 50% size reduction.
                  Best for most use cases.
                </div>
                <div>
                  <strong className="text-accent">INT8:</strong> Good quality, 75% size reduction. Suitable
                  for resource-constrained environments.
                </div>
                <div>
                  <strong className="text-accent">INT4:</strong> Acceptable quality, 87.5% size reduction.
                  Best for edge devices or limited VRAM.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
