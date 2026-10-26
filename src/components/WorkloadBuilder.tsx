import { useState } from 'react'
import {
  SlidersHorizontal,
  DownloadSimple,
  Copy,
  Check,
  Users,
  Timer,
  Sparkle,
  Cpu,
  Desktop,
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
import { PARTNER_MACHINE_PROFILES } from '@/lib/engine/partner-matrix'
import { toast } from 'sonner'

interface WorkloadBuilderProps {
  workload: WorkloadSpecification
  onChange: (spec: WorkloadSpecification) => void
}

export function WorkloadBuilder({ workload, onChange }: WorkloadBuilderProps) {
  const [copied, setCopied] = useState(false)

  const activeModel = MODEL_REGISTRY[workload.modelId] || Object.values(MODEL_REGISTRY)[0]
  const currentTp = workload.tensorParallelSize ?? 1
  const sizing = calculateWorkloadMemory(workload)
  const bundle = generateBenchmarkSpecBundle(sizing)

  const isLargeModel = (activeModel?.paramCountTotalB ?? 0) >= 60

  const handleArchetypeSelect = (archetype: WorkloadSpecification) => {
    onChange({ ...archetype })
    toast.success(`Loaded archetype: ${archetype.name}`)
  }

  const handlePartnerRigSelect = (rigId: string) => {
    const rig = PARTNER_MACHINE_PROFILES.find((p) => p.id === rigId)
    if (!rig) return

    onChange({
      ...workload,
      tensorParallelSize: rig.gpu.count,
      sla: {
        ...workload.sla,
        maxTtftMs: rig.targetSlaGuidance.expectedTtftMs * 2,
        maxItlMs: rig.targetSlaGuidance.expectedItlMs * 1.5,
      },
    })
    toast.success(`Aligned to partner rig: ${rig.name} (${rig.gpu.count}x GPU, TP=${rig.gpu.count})`)
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
        <div className="flex justify-between items-center mb-2.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Enterprise Workload Archetypes
          </Label>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Desktop size={14} className="text-primary" />
            <span>Target Rig:</span>
            <select
              aria-label="Partner Machine Rig"
              className="bg-surface-highlight border border-border/80 text-white text-[11px] rounded px-2 py-0.5 font-mono cursor-pointer"
              onChange={(e) => handlePartnerRigSelect(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Select Partner Rig</option>
              {PARTNER_MACHINE_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.gpu.count}x GPU • {p.gpu.totalVramGiB} GiB)
                </option>
              ))}
            </select>
          </div>
        </div>
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

      {/* Model, Runtime, and Precisions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model Selection */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Target Architecture
          </Label>
          <Select
            value={workload.modelId}
            onValueChange={(val) => {
              const model = MODEL_REGISTRY[val]
              const suggestTp = (model?.paramCountTotalB ?? 0) >= 60 ? Math.max(2, currentTp) : currentTp
              onChange({
                ...workload,
                modelId: val,
                name: `${model?.name || val} Workload`,
                tensorParallelSize: suggestTp,
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
            <p className="text-[10px] text-muted-foreground mt-1.5 font-mono truncate">
              {activeModel.numLayers}L • {activeModel.numKeyValueHeads} KV • {activeModel.headDimension}d
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
              <SelectItem value="vllm" className="font-mono text-xs">vLLM (PagedAttention)</SelectItem>
              <SelectItem value="tensorrt-llm" className="font-mono text-xs">TensorRT-LLM (Low Latency)</SelectItem>
              <SelectItem value="ollama" className="font-mono text-xs">Ollama / llama.cpp</SelectItem>
              <SelectItem value="tgi" className="font-mono text-xs">HuggingFace TGI</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
            Adapter: vllm bench serve
          </p>
        </div>

        {/* Weight Precision */}
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
              <SelectItem value="FP16" className="font-mono text-xs">FP16 (2 bytes/param)</SelectItem>
              <SelectItem value="BF16" className="font-mono text-xs">BF16 (2 bytes/param)</SelectItem>
              <SelectItem value="INT8" className="font-mono text-xs">INT8 (1 byte/param)</SelectItem>
              <SelectItem value="FP8" className="font-mono text-xs">FP8 (1 byte/param)</SelectItem>
              <SelectItem value="INT4" className="font-mono text-xs">INT4 / AWQ (0.5 bytes)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
            Weights: {sizing.typicalMemory.weightsGiB.toFixed(1)} GiB
          </p>
        </div>

        {/* KV Cache Precision Selection */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            KV Cache Precision
          </Label>
          <Select
            value={workload.kvCachePrecision}
            onValueChange={(val) => onChange({ ...workload, kvCachePrecision: val as PrecisionFormat })}
          >
            <SelectTrigger className="w-full bg-surface-highlight border-border rounded-lg text-white font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FP16" className="font-mono text-xs">FP16 (Full Precision KV)</SelectItem>
              <SelectItem value="BF16" className="font-mono text-xs">BF16 (16-bit KV)</SelectItem>
              <SelectItem value="FP8" className="font-mono text-xs">FP8 (vLLM --kv-cache-dtype fp8)</SelectItem>
              <SelectItem value="INT8" className="font-mono text-xs">INT8 (Quantized 8-bit KV)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-mono text-cyan-400">
            KV Cache: {sizing.typicalMemory.kvCacheGiB.toFixed(2)} GiB
          </p>
        </div>
      </div>

      {/* Tensor Parallelism (TP) Cluster Configuration */}
      <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-cyan-400" weight="duotone" />
            <Label className="text-xs font-bold text-white uppercase tracking-wider">
              Tensor Parallelism Shard (TP GPUs)
            </Label>
            {isLargeModel && currentTp === 1 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                Recommendation: TP ≥ 2 for {activeModel?.name}
              </span>
            )}
          </div>
          <span className="font-mono font-bold text-cyan-300 text-sm bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
            TP = {currentTp} {currentTp > 1 ? `(${currentTp}x Multi-GPU)` : '(Single GPU)'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 4, 8].map((tpOption) => {
            const isSelected = currentTp === tpOption
            return (
              <button
                key={tpOption}
                type="button"
                onClick={() => onChange({ ...workload, tensorParallelSize: tpOption })}
                className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-primary/20 border-primary text-white shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-surface-highlight border-border/80 text-muted-foreground hover:text-white hover:border-slate-500'
                }`}
              >
                TP = {tpOption}
                <span className="block text-[9px] font-normal text-muted-foreground">
                  {tpOption === 1 ? '1x GPU' : `${tpOption}x GPUs`}
                </span>
              </button>
            )
          })}
        </div>

        {currentTp > 1 && (
          <div className="text-[11px] text-cyan-300/90 bg-cyan-950/30 p-2 rounded-lg border border-cyan-900/40 font-mono flex justify-between items-center">
            <span>Per-GPU VRAM requirement: <strong>{sizing.peakMemory.perGpuVRAMRequiredGiB.toFixed(1)} GiB</strong></span>
            <span>Total cluster required: {sizing.peakMemory.totalVRAMRequiredGiB.toFixed(1)} GiB</span>
          </div>
        )}
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
            <span className="text-[10px] text-muted-foreground block">Peak Context Stress (P99)</span>
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
            <span className="font-mono text-xs text-accent">
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
