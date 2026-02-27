import { SlidersHorizontal, CaretDown } from '@phosphor-icons/react'
import { TriangleAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PRECISION_OPTIONS, CONTEXT_LENGTH_OPTIONS } from '@/lib/constants'
import type { CalculatorConfig, PrecisionType } from '@/lib/types'

const MAX_PARAMETERS = 1000
const MAX_CONTEXT = 131072

interface ConfigurationPanelProps {
  config: CalculatorConfig
  onChange: (update: (prev: CalculatorConfig) => CalculatorConfig) => void
}

export function ConfigurationPanel({ config, onChange }: ConfigurationPanelProps) {
  const contextIndex = CONTEXT_LENGTH_OPTIONS.findIndex((v) => v === config.contextLength)
  const safeContextIndex = contextIndex === -1 ? CONTEXT_LENGTH_OPTIONS.findIndex((v) => v >= config.contextLength) || 0 : contextIndex
  const showParamWarning = config.parameters > MAX_PARAMETERS
  const showContextWarning = config.contextLength >= MAX_CONTEXT
  
  return (
    <section className="glass-panel p-6 rounded-2xl flex-1">
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
        <SlidersHorizontal size={20} weight="duotone" className="text-primary" />
        Configuration
      </h2>
      
      <div className="space-y-6">
        {showParamWarning && (
          <Alert className="border-[oklch(0.73_0.14_195)] bg-[oklch(0.73_0.14_195)]/10 text-[oklch(0.73_0.14_195)]">
            <TriangleAlert className="size-4" />
            <AlertTitle>Extreme Parameter Count</AlertTitle>
            <AlertDescription className="text-[oklch(0.73_0.14_195)]/80">
              Models above {MAX_PARAMETERS}B parameters are rare research systems. Calculations may reflect impractical hardware requirements.
            </AlertDescription>
          </Alert>
        )}

        {showContextWarning && (
          <Alert className="border-[oklch(0.59_0.24_305)] bg-[oklch(0.59_0.24_305)]/10 text-[oklch(0.59_0.24_305)]">
            <TriangleAlert className="size-4" />
            <AlertTitle>Maximum Context Length</AlertTitle>
            <AlertDescription className="text-[oklch(0.59_0.24_305)]/80">
              128k context requires significant VRAM. Consider enabling KV Cache Quantization and Flash Attention 2 to reduce memory usage.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Parameters (Billion)
            </Label>
            <div className="relative">
              <Input
                id="parameters"
                type="number"
                min="0.1"
                max="1000"
                step="0.1"
                value={config.parameters}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (!isNaN(value) && value > 0) {
                    onChange((prev) => ({ ...prev, parameters: value }))
                  }
                }}
                className="w-full bg-surface-highlight border-border rounded-lg py-2.5 px-3 text-white font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-8"
              />
              <span className="absolute right-3 top-2.5 text-muted-foreground font-mono text-sm pointer-events-none">
                B
              </span>
            </div>
          </div>
          
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Precision (Weights)
            </Label>
            <Select
              value={config.precision}
              onValueChange={(value) => {
                onChange((prev) => ({ ...prev, precision: value as PrecisionType }))
              }}
            >
              <SelectTrigger className="w-full bg-surface-highlight border-border rounded-lg py-2.5 px-3 text-white font-mono focus:border-primary focus:ring-1 focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRECISION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="font-mono">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Context Length
            </Label>
            <span className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded text-sm">
              {config.contextLength.toLocaleString()}
            </span>
          </div>
          <div className="relative pt-1 pb-6">
            <Slider
              value={[safeContextIndex]}
              onValueChange={([index]) => {
                onChange((prev) => ({ ...prev, contextLength: CONTEXT_LENGTH_OPTIONS[index] }))
              }}
              min={0}
              max={CONTEXT_LENGTH_OPTIONS.length - 1}
              step={1}
              className="w-full"
            />
            <div className="absolute w-full flex justify-between text-[10px] text-muted-foreground font-mono mt-2">
              <span>512</span>
              <span>2k</span>
              <span>4k</span>
              <span>8k</span>
              <span>16k</span>
              <span>32k</span>
              <span>64k</span>
              <span>128k</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-highlight/50 border border-transparent hover:border-border transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">KV Cache Quantization</span>
              <span className="text-[10px] text-muted-foreground">Reduce memory for long context</span>
            </div>
            <Switch
              checked={config.kvCacheQuantization}
              onCheckedChange={(checked) => {
                onChange((prev) => ({ ...prev, kvCacheQuantization: checked }))
              }}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-highlight/50 border border-transparent hover:border-border transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Flash Attention 2</span>
              <span className="text-[10px] text-muted-foreground">Optimize memory overhead</span>
            </div>
            <Switch
              checked={config.flashAttention}
              onCheckedChange={(checked) => {
                onChange((prev) => ({ ...prev, flashAttention: checked }))
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
