import { useKV } from "@github/spark/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CopySimple, ArrowsLeftRight } from "@phosphor-icons/react"
import {
  calculateInferenceMemory,
  formatMemory,
  getRecommendedGPUs,
  MODEL_PRESETS,
  PRECISION_OPTIONS,
  type InferenceParams,
} from "@/lib/llm-calculations"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function ComparisonMode() {
  const [configA, setConfigA] = useKV<InferenceParams>("comparison-config-a", {
    parameters: 7,
    precision: "fp16",
    contextLength: 4096,
  })

  const [configB, setConfigB] = useKV<InferenceParams>("comparison-config-b", {
    parameters: 13,
    precision: "int8",
    contextLength: 4096,
  })

  if (!configA || !configB) return null

  const memoryA = calculateInferenceMemory(configA)
  const memoryB = calculateInferenceMemory(configB)
  const gpuA = getRecommendedGPUs(memoryA.total)[0]
  const gpuB = getRecommendedGPUs(memoryB.total)[0]

  const difference = memoryB.total - memoryA.total
  const percentDiff = ((difference / memoryA.total) * 100).toFixed(1)

  const handleSwap = () => {
    setConfigA((current) => current ? configB : configB)
    setConfigB((current) => current ? configA : configA)
  }

  const handleCopyAtoB = () => {
    setConfigB((current) => current ? configA : configA)
  }

  const handleCopyBtoA = () => {
    setConfigA((current) => current ? configB : configB)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-accent/30 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowsLeftRight size={24} className="text-accent" weight="duotone" />
                Configuration Comparison
              </CardTitle>
              <CardDescription>Compare two model configurations side-by-side</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSwap} className="gap-2">
              <ArrowsLeftRight size={18} weight="duotone" />
              Swap
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Configuration A</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAtoB}
                  className="gap-2 text-xs"
                >
                  <CopySimple size={16} weight="duotone" />
                  Copy to B
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="configA-parameters" className="text-xs sm:text-sm">Model Size (B)</Label>
                <Input
                  id="configA-parameters"
                  type="number"
                  value={configA.parameters}
                  onChange={(e) =>
                    setConfigA((current) =>
                      current ? { ...current, parameters: parseFloat(e.target.value) || 0 } : { parameters: parseFloat(e.target.value) || 0, precision: "fp16", contextLength: 4096 }
                    )
                  }
                  min={0.1}
                  step={0.1}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="configA-precision" className="text-xs sm:text-sm">Precision</Label>
                <Select
                  value={configA.precision}
                  onValueChange={(value) =>
                    setConfigA((current) =>
                      current ? { ...current, precision: value } : { parameters: 7, precision: value, contextLength: 4096 }
                    )
                  }
                >
                  <SelectTrigger id="configA-precision">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="configA-context" className="text-xs sm:text-sm">Context Length</Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {configA.contextLength.toLocaleString()}
                  </span>
                </div>
                <Slider
                  id="configA-context"
                  value={[configA.contextLength]}
                  onValueChange={([value]) =>
                    setConfigA((current) =>
                      current ? { ...current, contextLength: value } : { parameters: 7, precision: "fp16", contextLength: value }
                    )
                  }
                  min={512}
                  max={32768}
                  step={512}
                  className="py-4"
                />
              </div>

              <Separator />

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total VRAM</span>
                  <span className="font-mono font-bold text-primary text-lg">
                    {formatMemory(memoryA.total)}
                  </span>
                </div>
                {gpuA && (
                  <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{gpuA.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {gpuA.vram} GB
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-accent/30 bg-card/80 backdrop-blur-sm h-full">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Configuration B</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyBtoA}
                  className="gap-2 text-xs"
                >
                  <CopySimple size={16} weight="duotone" />
                  Copy to A
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="configB-parameters" className="text-xs sm:text-sm">Model Size (B)</Label>
                <Input
                  id="configB-parameters"
                  type="number"
                  value={configB.parameters}
                  onChange={(e) =>
                    setConfigB((current) =>
                      current ? { ...current, parameters: parseFloat(e.target.value) || 0 } : { parameters: parseFloat(e.target.value) || 0, precision: "fp16", contextLength: 4096 }
                    )
                  }
                  min={0.1}
                  step={0.1}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="configB-precision" className="text-xs sm:text-sm">Precision</Label>
                <Select
                  value={configB.precision}
                  onValueChange={(value) =>
                    setConfigB((current) =>
                      current ? { ...current, precision: value } : { parameters: 13, precision: value, contextLength: 4096 }
                    )
                  }
                >
                  <SelectTrigger id="configB-precision">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="configB-context" className="text-xs sm:text-sm">Context Length</Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {configB.contextLength.toLocaleString()}
                  </span>
                </div>
                <Slider
                  id="configB-context"
                  value={[configB.contextLength]}
                  onValueChange={([value]) =>
                    setConfigB((current) =>
                      current ? { ...current, contextLength: value } : { parameters: 13, precision: "int8", contextLength: value }
                    )
                  }
                  min={512}
                  max={32768}
                  step={512}
                  className="py-4"
                />
              </div>

              <Separator />

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total VRAM</span>
                  <span className="font-mono font-bold text-accent text-lg">
                    {formatMemory(memoryB.total)}
                  </span>
                </div>
                {gpuB && (
                  <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{gpuB.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {gpuB.vram} GB
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        key={`${memoryA.total}-${memoryB.total}`}
      >
        <Card className="border-accent/30 bg-card/50 backdrop-blur-sm glow-accent">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Comparison Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Config A</div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-primary">
                  {formatMemory(memoryA.total)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col items-center justify-center">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Difference</div>
                <div className={`font-mono text-xl sm:text-2xl font-bold ${difference > 0 ? "text-destructive" : "text-green-500"}`}>
                  {difference > 0 ? "+" : ""}
                  {formatMemory(Math.abs(difference))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {difference > 0 ? "+" : ""}
                  {percentDiff}%
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Config B</div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-accent">
                  {formatMemory(memoryB.total)}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-primary">Configuration A Details</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Model Weights:</span>
                    <span className="font-mono">{formatMemory(memoryA.modelWeights)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KV Cache:</span>
                    <span className="font-mono">{formatMemory(memoryA.kvCache || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead:</span>
                    <span className="font-mono">{formatMemory(memoryA.overhead)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-accent">Configuration B Details</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Model Weights:</span>
                    <span className="font-mono">{formatMemory(memoryB.modelWeights)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KV Cache:</span>
                    <span className="font-mono">{formatMemory(memoryB.kvCache || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead:</span>
                    <span className="font-mono">{formatMemory(memoryB.overhead)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
