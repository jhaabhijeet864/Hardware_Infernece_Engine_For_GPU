import { useState } from 'react'
import {
  SlidersHorizontal,
  DownloadSimple,
  Copy,
  Check,
  Users,
  Timer,
  Cpu,
  Desktop,
  TerminalWindow,
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
    toast.success(`Loaded profile: ${archetype.name}`)
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
    toast.success(`Aligned to rig: ${rig.name} (${rig.gpu.count}x GPU, TP=${rig.gpu.count})`)
  }

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(bundle.runnerTarget.cliCommand)
    setCopied(true)
    toast.success('Copied vLLM bench command to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportJson = () => {
    downloadJsonFile(`workload-${workload.id}-spec.json`, bundle)
    toast.success(`Exported ${workload.id}-spec.json`)
  }

  return (
    <section className="bg-[#11131a] p-5 sm:p-6 rounded-xl border border-border flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-primary" />
            Workload Specification
          </h2>
          <p className="text-xs text-muted-foreground font-mono">
            Analytical parameters, concurrency models, and empirical serving constraints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCommand}
            className="text-xs font-mono border-border bg-[#181b24] hover:bg-[#202532] text-foreground"
          >
            {copied ? <Check size={13} className="text-emerald-400 mr-1.5" /> : <Copy size={13} className="mr-1.5" />}
            Copy CLI
          </Button>
          <Button
            size="sm"
            onClick={handleExportJson}
            className="text-xs font-mono bg-primary hover:bg-sky-400 text-black font-semibold"
          >
            <DownloadSimple size={13} className="mr-1.5" />
            Export Spec
          </Button>
        </div>
      </div>

      {/* Enterprise Archetypes */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2.5">
          <Label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
            Workload Deployment Profiles
          </Label>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Desktop size={14} className="text-primary" />
            <span>Target Rig:</span>
            <select
              aria-label="Partner Machine Rig"
              className="bg-[#181b24] border border-border text-foreground text-xs rounded px-2 py-0.5 font-mono cursor-pointer"
              onChange={(e) => handlePartnerRigSelect(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Select Rig Template</option>
              {PARTNER_MACHINE_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.gpu.count}x GPU • {p.gpu.totalVramGiB} GiB)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {WORKLOAD_ARCHETYPES.map((arch) => {
            const isSelected = workload.id === arch.id
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => handleArchetypeSelect(arch)}
                className={`p-3 rounded-lg border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-[#181b25] border-primary text-foreground shadow-sm'
                    : 'bg-[#13151e] border-border text-slate-300 hover:border-slate-500 hover:bg-[#161924]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs truncate">{arch.name}</span>
                  {isSelected && <span className="size-1.5 rounded-full bg-primary shrink-0 ml-1" />}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                  {arch.description}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 border-t border-border/50 pt-1.5">
                  <span>Batch: <strong className="text-foreground">{arch.concurrency}</strong></span>
                  <span>•</span>
                  <span>P50: <strong className="text-foreground">{arch.promptTokensP50 + arch.generationTokensP50}t</strong></span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Model, Runtime, and Precisions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Model Selection */}
        <div>
          <Label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Model Architecture
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
            <SelectTrigger className="w-full bg-[#181b24] border-border rounded-md text-foreground font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#11131a] border-border text-foreground">
              {Object.values(MODEL_REGISTRY).map((m) => (
                <SelectItem key={m.id} value={m.id} className="font-mono text-xs">
                  {m.name} ({m.paramCountTotalB}B • {m.attentionType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeModel && (
            <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
              {activeModel.numLayers}L • {activeModel.numKeyValueHeads} KV • {activeModel.headDimension}d
            </p>
          )}
        </div>

        {/* Runtime Selection */}
        <div>
          <Label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Serving Runtime
          </Label>
          <Select
            value={workload.runtime}
            onValueChange={(val) => onChange({ ...workload, runtime: val as ServingRuntime })}
          >
            <SelectTrigger className="w-full bg-[#181b24] border-border rounded-md text-foreground font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#11131a] border-border text-foreground">
              <SelectItem value="vllm" className="font-mono text-xs">vLLM (PagedAttention)</SelectItem>
              <SelectItem value="tensorrt-llm" className="font-mono text-xs">TensorRT-LLM (Low Latency)</SelectItem>
              <SelectItem value="ollama" className="font-mono text-xs">Ollama / llama.cpp</SelectItem>
              <SelectItem value="tgi" className="font-mono text-xs">HuggingFace TGI</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono">
            CLI: vllm bench serve
          </p>
        </div>

        {/* Weight Precision */}
        <div>
          <Label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Weight Precision
          </Label>
          <Select
            value={workload.precision}
            onValueChange={(val) => onChange({ ...workload, precision: val as PrecisionFormat })}
          >
            <SelectTrigger className="w-full bg-[#181b24] border-border rounded-md text-foreground font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#11131a] border-border text-foreground">
              <SelectItem value="FP16" className="font-mono text-xs">FP16 (2 bytes/param)</SelectItem>
              <SelectItem value="BF16" className="font-mono text-xs">BF16 (2 bytes/param)</SelectItem>
              <SelectItem value="INT8" className="font-mono text-xs">INT8 (1 byte/param)</SelectItem>
              <SelectItem value="FP8" className="font-mono text-xs">FP8 (1 byte/param)</SelectItem>
              <SelectItem value="INT4" className="font-mono text-xs">INT4 / AWQ (0.5 bytes)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono">
            Weights: {sizing.typicalMemory.weightsGiB.toFixed(1)} GiB
          </p>
        </div>

        {/* KV Cache Precision */}
        <div>
          <Label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            KV Cache Precision
          </Label>
          <Select
            value={workload.kvCachePrecision}
            onValueChange={(val) => onChange({ ...workload, kvCachePrecision: val as PrecisionFormat })}
          >
            <SelectTrigger className="w-full bg-[#181b24] border-border rounded-md text-foreground font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#11131a] border-border text-foreground">
              <SelectItem value="FP16" className="font-mono text-xs">FP16 (Full Precision)</SelectItem>
              <SelectItem value="BF16" className="font-mono text-xs">BF16 (16-bit KV)</SelectItem>
              <SelectItem value="FP8" className="font-mono text-xs">FP8 (Paged Cache fp8)</SelectItem>
              <SelectItem value="INT8" className="font-mono text-xs">INT8 (Quantized KV)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono text-slate-400">
            KV: {sizing.typicalMemory.kvCacheGiB.toFixed(2)} GiB
          </p>
        </div>
      </div>

      {/* Tensor Parallelism (TP) Cluster Configuration */}
      <div className="p-3.5 rounded-lg bg-[#0e1017] border border-border space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-primary" />
            <Label className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
              Tensor Parallelism Shard (TP GPUs)
            </Label>
            {isLargeModel && currentTp === 1 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                TP ≥ 2 Recommended
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-slate-300">
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
                className={`py-1.5 px-3 rounded border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#181b24] border-primary text-white font-bold shadow-sm'
                    : 'bg-[#12141c] border-border text-muted-foreground hover:text-white hover:border-slate-500'
                }`}
              >
                TP = {tpOption}
                <span className="block text-[10px] text-muted-foreground font-normal">
                  {tpOption === 1 ? '1x GPU' : `${tpOption}x GPUs`}
                </span>
              </button>
            )
          })}
        </div>

        {currentTp > 1 && (
          <div className="text-[11px] text-slate-300 bg-[#14161f] p-2.5 rounded border border-border font-mono flex justify-between items-center">
            <span>Per-GPU VRAM requirement: <strong className="text-white">{sizing.peakMemory.perGpuVRAMRequiredGiB.toFixed(1)} GiB</strong></span>
            <span className="text-muted-foreground">Cluster Total: {sizing.peakMemory.totalVRAMRequiredGiB.toFixed(1)} GiB</span>
          </div>
        )}
      </div>

      {/* Traffic & Concurrency */}
      <div className="p-4 rounded-lg bg-[#0e1017] border border-border space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <Label className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
              Concurrent Active Streams (Batch Size B)
            </Label>
          </div>
          <span className="font-mono text-xs text-foreground bg-[#181b24] px-2 py-0.5 rounded border border-border">
            {workload.concurrency} streams
          </span>
        </div>

        <Slider
          min={1}
          max={64}
          step={1}
          value={[workload.concurrency]}
          onValueChange={([val]) => onChange({ ...workload, concurrency: val })}
        />

        <div className="text-[11px] text-muted-foreground font-mono flex items-center justify-between">
          <span>Active concurrent generation streams in flight</span>
          <span className="text-slate-400">
            ~{workload.concurrency * 25} to {workload.concurrency * 40} total registered users
          </span>
        </div>
      </div>

      {/* Sequence Length Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prompt Tokens */}
        <div className="p-4 rounded-lg bg-[#0e1017] border border-border space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-mono font-semibold text-foreground">Input Prompt Tokens</Label>
            <span className="font-mono text-xs text-slate-300">
              P50: {workload.promptTokensP50}t • P99: {workload.promptTokensP99}t
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>Typical Prompt (P50)</span>
              <span>{workload.promptTokensP50} tokens</span>
            </div>
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
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>Peak Prompt Stress (P99)</span>
              <span>{workload.promptTokensP99} tokens</span>
            </div>
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
        <div className="p-4 rounded-lg bg-[#0e1017] border border-border space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-mono font-semibold text-foreground">Output Generation Tokens</Label>
            <span className="font-mono text-xs text-slate-300">
              P50: {workload.generationTokensP50}t • P99: {workload.generationTokensP99}t
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>Typical Output (P50)</span>
              <span>{workload.generationTokensP50} tokens</span>
            </div>
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
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>Peak Output Stress (P99)</span>
              <span>{workload.generationTokensP99} tokens</span>
            </div>
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
      <div className="p-4 rounded-lg bg-[#0e1017] border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-primary" />
          <Label className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
            Target Service Level Objective (SLA)
          </Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-muted-foreground">Max TTFT (Time To First Token)</span>
              <span className="text-foreground font-medium">&lt; {workload.sla.maxTtftMs} ms</span>
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
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-muted-foreground">Max ITL (Inter-Token Latency)</span>
              <span className="text-foreground font-medium">&lt; {workload.sla.maxItlMs} ms/token</span>
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

      {/* AI SDK Terminal Runner Block */}
      <div className="rounded-lg bg-[#08090d] border border-border p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <TerminalWindow size={15} className="text-primary" />
            <span className="text-slate-300">Generated Serving Benchmark Command</span>
          </div>
          <button
            onClick={handleCopyCommand}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[11px]"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <div className="font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-all py-1">
          <span className="text-primary">$</span> {bundle.runnerTarget.cliCommand}
        </div>
      </div>
    </section>
  )
}
