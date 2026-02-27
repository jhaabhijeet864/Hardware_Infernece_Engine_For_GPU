import { useKV } from "@github/spark/hooks"
import { Label } from "@/components/ui/label"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  formatMemory,
  PRECISION_OPTIONS,
} from "@/lib/llm-calculations"

  const 
    precision: "fp16",
  })
    parameters: 13,
    contextLength: 4

} from "@/lib/llm-calculations"
import { motion } from "framer-motion"

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

            <Button
              size="sm"
              className="gap-2"
              <Swap size={16} weight="duotone" />

        </CardHeader>


          animate={{ opacity
        >
            <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:t
   

                >
                  Copy to B
   

                <Label htmlFor="
                  id="configA-parameters"
   

          
                  min={0.1}
                  className="font-mono"
              </div>
              <div className="space-y-2">
                <
                  onValueChange={(value) =>
                      current ? { ...current, precision: value } : { parameters: 7, pr
                  }
                  <SelectT
                  
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwap}
              className="gap-2"
            >
              <Swap size={16} weight="duotone" />
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
                  <s
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="configA-parameters" className="text-xs sm:text-sm">Model Size (Billions)</Label>
                <Input
                  id="configA-parameters"
                  type="number"
                  value={configA.parameters}
                  onChange={(e) =>
                    setConfigA((current) =>
                      current ? { ...current, parameters: parseFloat(e.target.value) || 0 } : { parameters: parseFloat(e.target.value) || 0, precision: "fp16", contextLength: 4096 }
                  min
                  c
              </div>
              <div className
                <Select
                  
                    

                  <SelectTrigger id="conf
                  </SelectTrigger>
                    {PR
                        {option.label}
                    ))}
                </Select>

                <div 
                  <
                 
                <Slider
                  value={[configB.c
                    setConfigB((cu
                    )
                  min={512}
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                        {gpuB.vram} GB
                    </div>
                )}
            </CardContent
        </motion.div>

        initial={{ opacity: 0, y: 20 }
        transition={{ duration: 0.4 }}
      >
          <CardHeader>
          </CardHeader>
            <div clas
                <di
                  {formatMe
              </div>
              <div className
                <div className={`f
                  
                <div

              </div>

                <div className="font-mono text
                </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:g
                <h4 class
                  <div

                  <div cla
                    <span className="font-mono">{formatMemory(memoryA.kvCache || 0)}</span
                  <div className="flex justify-between">
                    <span className="font-mono">{formatMemory(memoryA.
                </div>

                <h4 className=
                  <div cla
                    <spa
                  
                    
                  <div cla
                 
                </div

        </Card>
    </div>
}




























































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
