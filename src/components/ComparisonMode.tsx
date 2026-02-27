import { useKV } from "@github/spark/hooks"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, S
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
} from "@/lib/llm-calculations"

  const 
    precision: "fp16",
  })
  const [configB, set
    precision: "int8
  })
  if (!configA || !configB) ret
  const memoryA = calculateInferenceMe


  const percentDiff = ((difference / memoryA.total) * 100).toFixed(1)
  const handleSwap
    setConfigA((curren
  }
  co

  const handleCopyBtoA = () => {
  }
  return (
      <Card className="b
    

  if (!configA || !configB) return null

  const memoryA = calculateInferenceMemory(configA)
  const memoryB = calculateInferenceMemory(configB)
  const gpuA = getRecommendedGPUs(memoryA.total)[0]
  const gpuB = getRecommendedGPUs(memoryB.total)[0]

  const difference = memoryB.total - memoryA.total
  const percentDiff = ((difference / memoryA.total) * 100).toFixed(1)

  const handleSwap = () => {
    const tempA = configA
    setConfigA((current) => current ? configB : configB)
    setConfigB((current) => current ? tempA : tempA)
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
            </div>
            <Button
              <div className="s
              size="sm"
                  id="configA-para
              className="gap-2"
             
              <Swap size={16} weight="duotone" />
                  
            </Button>
          </div>
        </CardHeader>
             

                <Label htmlFor="configA-precision" className=
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Configuration A</CardTitle>
                       
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAtoB}
                  className="gap-2 text-xs"
                >
                  <CopySimple size={16} weight="duotone" />
                  Copy to B
                  </span>
                  va
                  onClick
                >
                  Copy to A
              </div>
            <CardConte
                <Label htmlFor="configB-p
                  type="number"
                  value={configB.parameters}
                    setConfigB((cu
                    )
                  min={0.1}
                  cla
              </div
              <div classNam
                <Select
                  onValueChange={(value
                  
                  }

                  </SelectTrigger>
                    {PRECISION_OPTIONS.map((option) => (
                       
                    ))}
                </Select>

                <div className="flex items-center justify-between">
                  <sp
                  <
                <
                  value={[configB.contextLength]}
                    setConfigB((cur
                    )
                  min={512}
                  step={512}
                />


                <div cl
                  <span className=
                  </span>
                {gpu

                      <Badge variant="out
                      </Badge>
                  </div>
              </div>
          </Card>
      </div>
      <motion.div
        animate={{ opac
        key={`${memoryA.total}-${memor
        <Card className="border-accent/30 bg-card
            <CardTitle>Comparison Results</Ca
          <CardContent className="space-y-4
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div 
                </d

                <div classNam
                  {differenc
                </div>
                  
                </di

                <div classN

              </div>


              <div className="space-y-2">
                <div className="space-y-1 text-mu
                    <span
                  </di
                    <span>
                  </div>
                    <span>Overhead:</span>
                  </div>
              </div>
              <div className="space-y-
                <div className
                    <span>
                  </div>
                  
                  </
                    <span>
                 
              </div>

      </motion.div>
  )
























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

                  <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{gpuB.name}</span>

                        {gpuB.vram} GB

                    </div>

                )}

            </CardContent>

        </motion.div>



        initial={{ opacity: 0, y: 20 }}

        transition={{ duration: 0.4 }}
        key={`${memoryA.total}-${memoryB.total}`}
      >
        <Card className="border-accent/30 bg-card/50 backdrop-blur-sm glow-accent">
          <CardHeader>

          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Config A</div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-primary">
                  {formatMemory(memoryA.total)}

              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col items-center justify-center">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Difference</div>
                <div className={`font-mono text-xl sm:text-2xl font-bold ${difference > 0 ? "text-destructive" : "text-green-500"}`}>
                  {difference > 0 ? "+" : ""}
                  {formatMemory(Math.abs(difference))}

                <div className="text-xs text-muted-foreground mt-1">
                  {difference > 0 ? "+" : ""}
                  {percentDiff}%
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Config B</div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-accent">

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

                  <div className="flex justify-between">

                    <span className="font-mono">{formatMemory(memoryA.kvCache || 0)}</span>

                  <div className="flex justify-between">

                    <span className="font-mono">{formatMemory(memoryA.overhead)}</span>

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

        </Card>

    </div>

}
