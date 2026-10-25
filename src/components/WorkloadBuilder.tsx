import { useState } from 'react'
import {
  SlidersHorizontal,
  DownloadSimple,
  Copy,
  Check,
  Users,
  Timer,
  Sparkle,
} from '@phosphor-icons/react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  WorkloadSpecification,
  WORKLOAD_ARCHETYPES,
  ServingRuntime,
  PrecisionFormat,
  calculateWorkloadMemory,
  generateBenchmarkSpecBundle,
  downloadJsonFile,
  MODEL_REGISTRY,
} from '@/lib/engine'
import { toast } from 'sonner'

interface WorkloadBuilderProps {
  workload: WorkloadSpecification
  onChange: (spec: WorkloadSpecification) => void
}

export function WorkloadBuilder({ workload, onChange }: WorkloadBuilderProps) {
  const [copied, setCopied] = useState(false)

  const activeModel = MODEL_REGISTRY[workload.modelId] || Object.values(MODEL_REGISTRY)[0]
  const sizing = calculateWorkloadMemory(workload)
  const bundle = generateBenchmarkSpecBundle(sizing)

  const handleArchetypeSelect = (archetype: WorkloadSpecification) => {
    onChange({ ...archetype })
    toast.success(`Loaded archetype: ${archetype.name}`)
  }

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(bundle.runnerTarget.cliCommand)
    setCopied(true)
    toast.success('Copied vLLM bench serve command to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportJson = () => {
    downloadJsonFile(`workload-${workload.id}-spec.json`, bundle)
    toast.success(`Exported ${workload.id}-spec.json for hardware validation!`)
  }

  return (
    <section className="glass-panel p-6 rounded-2xl flex-1 flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <SlidersHorizontal size={20} weight="duotone" className="text-primary" />
            Workload Specification
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure empirical serving parameters, sequence distributions, and target SLAs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCommand}
            className="text-xs border-border/80 bg-surface-highlight hover:bg-surface-highlight/80 text-white"
          >
            {copied ? <Check size={14} className="text-emerald-400 mr-1" /> : <Copy size={14} className="mr-1" />}
            Copy CLI
          </Button>
          <Button
            size="sm"
            onClick={handleExportJson}
            className="text-xs bg-primary hover:bg-primary/90 text-white font-medium"
          >
            <DownloadSimple size={14} className="mr-1" />
            Export Benchmark Spec
          </Button>
        </div>
      </div>

      {/* Enterprise Archetypes */}
      <div>
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
          Enterprise Workload Archetypes
        </Label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {WORKLOAD_ARCHETYPES.map((arch) => {
            const isSelected = workload.id === arch.id
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => handleArchetypeSelect(arch)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-primary/15 border-primary text-white shadow-lg shadow-primary/10'
                    : 'bg-card border-border/80 text-slate-300 hover:border-slate-500 hover:bg-surface-highlight'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs truncate">{arch.name}</span>
                  {isSelected && <Sparkle size={13} weight="fill" className="text-primary shrink-0 ml-1" />}
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {arch.description}
                </p>
                <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-400 mt-2">
                  <span>Conc: {arch.concurrency}</span>
                  <span>•</span>
                  <span>P50: {arch.promptTokensP50 + arch.generationTokensP50}t</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Model & Serving Runtime Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model Selection */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Target Model Architecture
          </Label>
          <Select
            value={workload.modelId}
            onValueChange={(val) => {
              const model = MODEL_REGISTRY[val]
              onChange({
                ...workload,
                modelId: val,
                name: `${model?.name || val} Custom Workload`,
              })
            }}
          >
            <SelectTrigger className="w-full bg-surface-highlight border-border rounded-lg text-white font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(MODEL_REGISTRY).map((m) => (
                <SelectItem key={m.id} value={m.id} className="font-mono text-xs">
                  {m.name} ({m.paramCountTotalB}B • {m.attentionType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeModel && (
            <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
              {activeModel.numLayers}L • {activeModel.numKeyValueHeads} KV Heads • {activeModel.headDimension} Dim
            </p>
          )}
        </div>

        {/* Runtime Selection */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Serving Engine
          </Label>
          <Select
            value={workload.runtime}
            onValueChange={(val) => onChange({ ...workload, runtime: val as ServingRuntime })}
          >
            <SelectTrigger className="w-full bg-surface-highlight border-border rounded-lg text-white font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vllm" className="font-mono text-xs">vLLM (PagedAttention • High Throughput)</SelectItem>
              <SelectItem value="tensorrt-llm" className="font-mono text-xs">TensorRT-LLM (Peak Low Latency)</SelectItem>
              <SelectItem value="ollama" className="font-mono text-xs">Ollama / llama.cpp (Workstation Dev)</SelectItem>
              <SelectItem value="tgi" className="font-mono text-xs">HuggingFace TGI</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
            CLI Adapter: vllm bench serve
          </p>
        </div>

        {/* Precision Selection */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Weight Precision
          </Label>
          <Select
            value={workload.precision}
            onValueChange={(val) => onChange({ ...workload, precision: val as PrecisionFormat })}
          >
            <SelectTrigger className="w-full bg-surface-highlight border-border rounded-lg text-white font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FP16" className="font-mono text-xs">FP16 (16-bit • 2 bytes/param)</SelectItem>
              <SelectItem value="BF16" className="font-mono text-xs">BF16 (16-bit • 2 bytes/param)</SelectItem>
              <SelectItem value="INT8" className="font-mono text-xs">INT8 (8-bit • 1 byte/param)</SelectItem>
              <SelectItem value="FP8" className="font-mono text-xs">FP8 (8-bit • 1 byte/param)</SelectItem>
              <SelectItem value="INT4" className="font-mono text-xs">INT4 / AWQ (4-bit • 0.5 bytes)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
            KV Cache: {workload.kvCachePrecision}
          </p>
        </div>
      </div>

      {/* Traffic & Concurrency */}
      <div className="p-4 rounded-xl bg-surface-highlight/70 border border-border/80 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-accent" weight="duotone" />
            <Label className="text-xs font-bold text-white uppercase tracking-wider">
              Concurrent Active Streams (Batch Size B)
            </Label>
          </div>
          <span className="font-mono font-bold text-accent text-sm bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            {workload.concurrency} simultaneous requests
          </span>
        </div>

        <Slider
          min={1}
          max={64}
          step={1}
          value={[workload.concurrency]}
          onValueChange={([val]) => onChange({ ...workload, concurrency: val })}
        />

        <div className="text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Concurrency = parallel generation streams in flight.</span>
          <span className="text-slate-400 font-mono">
            Supports ~{workload.concurrency * 25} to {workload.concurrency * 40} registered users
          </span>
        </div>
      </div>

      {/* Sequence Length Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prompt Tokens */}
        <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-semibold text-white">Input Prompt Tokens</Label>
            <span className="font-mono text-xs text-cyan-400">
              P50: {workload.promptTokensP50}t • P99: {workload.promptTokensP99}t
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground block">Typical Prompt (P50)</span>
            <Slider
              min={128}
              max={16384}
              step={128}
              value={[workload.promptTokensP50]}
              onValueChange={([val]) => {
                onChange({
                  ...workload,
                  promptTokensP50: val,
                  promptTokensP99: Math.max(val, workload.promptTokensP99),
                })
              }}
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground block">Peak Prompt Stress (P99)</span>
            <Slider
              min={workload.promptTokensP50}
              max={32768}
              step={256}
              value={[workload.promptTokensP99]}
              onValueChange={([val]) => onChange({ ...workload, promptTokensP99: val })}
            />
          </div>
        </div>

        {/* Generation Tokens */}
        <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-semibold text-white">Output Generation Tokens</Label>
            <span className="font-mono text-xs text-primary">
              P50: {workload.generationTokensP50}t • P99: {workload.generationTokensP99}t
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground block">Typical Output (P50)</span>
            <Slider
              min={32}
              max={2048}
              step={32}
              value={[workload.generationTokensP50]}
              onValueChange={([val]) => {
                onChange({
                  ...workload,
                  generationTokensP50: val,
                  generationTokensP99: Math.max(val, workload.generationTokensP99),
                })
              }}
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground block">Peak Output Stress (P99)</span>
            <Slider
              min={workload.generationTokensP50}
              max={4096}
              step={64}
              value={[workload.generationTokensP99]}
              onValueChange={([val]) => onChange({ ...workload, generationTokensP99: val })}
            />
          </div>
        </div>
      </div>

      {/* Target Service Level Objectives (SLAs) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-border/80">
        <div className="flex items-center gap-2 mb-3">
          <Timer size={18} className="text-cyan-400" weight="duotone" />
          <Label className="text-xs font-bold text-white uppercase tracking-wider">
            Target SLA Acceptance Thresholds
          </Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Max TTFT (Time To First Token)</span>
              <span className="font-mono text-white font-bold">&lt; {workload.sla.maxTtftMs} ms</span>
            </div>
            <Slider
              min={100}
              max={2000}
              step={50}
              value={[workload.sla.maxTtftMs]}
              onValueChange={([val]) =>
                onChange({ ...workload, sla: { ...workload.sla, maxTtftMs: val } })
              }
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Max ITL (Inter-Token Latency)</span>
              <span className="font-mono text-white font-bold">&lt; {workload.sla.maxItlMs} ms/token</span>
            </div>
            <Slider
              min={10}
              max={100}
              step={5}
              value={[workload.sla.maxItlMs]}
              onValueChange={([val]) =>
                onChange({ ...workload, sla: { ...workload.sla, maxItlMs: val } })
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}
