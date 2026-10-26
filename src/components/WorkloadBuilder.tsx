import { useState } from 'react'
import {
  DownloadSimple,
  Copy,
  Check,
  Cpu,
  Sliders,
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
    <section className="scale-card rounded-2xl p-6 sm:p-7 flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide uppercase font-mono text-white">
              Workload Specification
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
              EMPIRICAL SIZING
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Analytical parameter bounds, concurrency dynamics &amp; target latency constraints
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCommand}
            className="text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border-white/[0.08] hover:border-white/20 transition-all cursor-pointer rounded-lg active:scale-95"
          >
            {copied ? <Check size={13} className="text-emerald-400 mr-1.5" /> : <Copy size={13} className="mr-1.5" />}
            Copy CLI
          </Button>
          <Button
            size="sm"
            onClick={handleExportJson}
            className="text-xs font-mono bg-white text-black hover:bg-zinc-200 font-bold cursor-pointer rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.12)] transition-all active:scale-95"
          >
            <DownloadSimple size={13} weight="bold" className="mr-1.5" />
            Export Spec
          </Button>
        </div>
      </div>

      {/* Enterprise Archetypes */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
          <Label className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em] block">
            Workload Deployment Profiles
          </Label>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span>Rig Template:</span>
            <select
              aria-label="Partner Machine Rig"
              className="bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 text-xs rounded-lg px-2.5 py-1 font-mono cursor-pointer transition-colors focus:outline-none focus:border-cyan-400"
              onChange={(e) => handlePartnerRigSelect(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled className="bg-[#0e1118] text-zinc-400">Select Turnkey Hardware...</option>
              {PARTNER_MACHINE_PROFILES.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0e1118] text-white">
                  {p.name} ({p.gpu.count}x GPU • {p.gpu.totalVramGiB} GiB)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WORKLOAD_ARCHETYPES.map((arch) => {
            const isSelected = workload.id === arch.id
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => handleArchetypeSelect(arch)}
                className={`p-3.5 rounded-xl text-left transition-all duration-200 relative cursor-pointer border ${
                  isSelected
                    ? 'scale-card-active'
                    : 'scale-card-interactive'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-white truncate">{arch.name}</span>
                  {isSelected ? (
                    <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] shrink-0" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-white/20 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                  {arch.description}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-white/[0.06] pt-2">
                  <span>Batch: <strong className="text-zinc-200">{arch.concurrency}</strong></span>
                  <span>Context: <strong className="text-zinc-200">{arch.promptTokensP50 + arch.generationTokensP50}t</strong></span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Model, Runtime, and Precisions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model Selection */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
          <div>
            <Label className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
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
              <SelectTrigger className="w-full bg-white/[0.04] border-white/10 rounded-lg text-white font-mono text-xs hover:border-white/20 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="scale-card border-white/10 text-white">
                {Object.values(MODEL_REGISTRY).map((m) => (
                  <SelectItem key={m.id} value={m.id} className="font-mono text-xs focus:bg-white/10">
                    {m.name} ({m.paramCountTotalB}B • {m.attentionType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeModel && (
            <p className="text-[10px] text-zinc-400 mt-2 font-mono truncate pt-1 border-t border-white/[0.04]">
              {activeModel.numLayers}L • {activeModel.numKeyValueHeads} KV • {activeModel.headDimension}d
            </p>
          )}
        </div>

        {/* Runtime Selection */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
          <div>
            <Label className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
              Serving Runtime
            </Label>
            <Select
              value={workload.runtime}
              onValueChange={(val) => onChange({ ...workload, runtime: val as ServingRuntime })}
            >
              <SelectTrigger className="w-full bg-white/[0.04] border-white/10 rounded-lg text-white font-mono text-xs hover:border-white/20 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="scale-card border-white/10 text-white">
                <SelectItem value="vllm" className="font-mono text-xs focus:bg-white/10">vLLM (PagedAttention)</SelectItem>
                <SelectItem value="tensorrt-llm" className="font-mono text-xs focus:bg-white/10">TensorRT-LLM (Low Latency)</SelectItem>
                <SelectItem value="ollama" className="font-mono text-xs focus:bg-white/10">Ollama / llama.cpp</SelectItem>
                <SelectItem value="tgi" className="font-mono text-xs focus:bg-white/10">HuggingFace TGI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-cyan-400/80 mt-2 font-mono pt-1 border-t border-white/[0.04]">
            vLLM Bench Target
          </p>
        </div>

        {/* Weight Precision */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
          <div>
            <Label className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
              Weight Precision
            </Label>
            <Select
              value={workload.precision}
              onValueChange={(val) => onChange({ ...workload, precision: val as PrecisionFormat })}
            >
              <SelectTrigger className="w-full bg-white/[0.04] border-white/10 rounded-lg text-white font-mono text-xs hover:border-white/20 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="scale-card border-white/10 text-white">
                <SelectItem value="FP16" className="font-mono text-xs focus:bg-white/10">FP16 (2 bytes/param)</SelectItem>
                <SelectItem value="BF16" className="font-mono text-xs focus:bg-white/10">BF16 (2 bytes/param)</SelectItem>
                <SelectItem value="INT8" className="font-mono text-xs focus:bg-white/10">INT8 (1 byte/param)</SelectItem>
                <SelectItem value="FP8" className="font-mono text-xs focus:bg-white/10">FP8 (1 byte/param)</SelectItem>
                <SelectItem value="INT4" className="font-mono text-xs focus:bg-white/10">INT4 / AWQ (0.5 bytes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 font-mono pt-1 border-t border-white/[0.04]">
            Weights: <span className="text-zinc-200 font-semibold">{sizing.typicalMemory.weightsGiB.toFixed(1)} GiB</span>
          </p>
        </div>

        {/* KV Cache Precision */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
          <div>
            <Label className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
              KV Cache Precision
            </Label>
            <Select
              value={workload.kvCachePrecision}
              onValueChange={(val) => onChange({ ...workload, kvCachePrecision: val as PrecisionFormat })}
            >
              <SelectTrigger className="w-full bg-white/[0.04] border-white/10 rounded-lg text-white font-mono text-xs hover:border-white/20 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="scale-card border-white/10 text-white">
                <SelectItem value="FP16" className="font-mono text-xs focus:bg-white/10">FP16 (Full Precision)</SelectItem>
                <SelectItem value="BF16" className="font-mono text-xs focus:bg-white/10">BF16 (16-bit KV)</SelectItem>
                <SelectItem value="FP8" className="font-mono text-xs focus:bg-white/10">FP8 (Paged Cache fp8)</SelectItem>
                <SelectItem value="INT8" className="font-mono text-xs focus:bg-white/10">INT8 (Quantized KV)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 font-mono pt-1 border-t border-white/[0.04]">
            KV Allocation: <span className="text-zinc-200 font-semibold">{sizing.typicalMemory.kvCacheGiB.toFixed(2)} GiB</span>
          </p>
        </div>
      </div>

      {/* Tensor Parallelism (TP) Cluster Configuration */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={15} className="text-cyan-400" />
              <span>Tensor Parallelism Shard (TP GPUs)</span>
            </Label>
            {isLargeModel && currentTp === 1 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-semibold">
                TP ≥ 2 Recommended
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-zinc-400">
            Cluster Mode: <strong className="text-white">TP = {currentTp}</strong> {currentTp > 1 ? `(${currentTp}x Multi-GPU)` : '(Single GPU)'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {[1, 2, 4, 8].map((tpOption) => {
            const isSelected = currentTp === tpOption
            return (
              <button
                key={tpOption}
                type="button"
                onClick={() => onChange({ ...workload, tensorParallelSize: tpOption })}
                className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-white/[0.1] border-cyan-400/50 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                TP = {tpOption}
                <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">
                  {tpOption === 1 ? '1x GPU' : `${tpOption}x GPUs`}
                </span>
              </button>
            )
          })}
        </div>

        {currentTp > 1 && (
          <div className="text-[11px] text-zinc-300 bg-white/[0.03] p-3 rounded-lg border border-white/[0.06] font-mono flex justify-between items-center">
            <span>Per-GPU Allocation: <strong className="text-cyan-300">{sizing.peakMemory.perGpuVRAMRequiredGiB.toFixed(1)} GiB</strong></span>
            <span className="text-zinc-400">Total Cluster Footprint: <strong className="text-white">{sizing.peakMemory.totalVRAMRequiredGiB.toFixed(1)} GiB</strong></span>
          </div>
        )}
      </div>

      {/* Traffic & Concurrency */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sliders size={15} className="text-cyan-400" />
            <span>Concurrent Active Streams (Batch Size B)</span>
          </Label>
          <span className="font-mono text-xs text-white bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/10 font-bold">
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

        <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
          <span>Active concurrent generation streams in flight</span>
          <span className="text-zinc-300">
            ~{workload.concurrency * 25} to {workload.concurrency * 40} registered enterprise seats
          </span>
        </div>
      </div>

      {/* Sequence Length Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prompt Tokens */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-mono font-semibold text-white">Input Prompt Tokens</Label>
            <span className="font-mono text-xs text-zinc-300">
              P50: <strong className="text-white">{workload.promptTokensP50}t</strong> • P99: <strong className="text-white">{workload.promptTokensP99}t</strong>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>Typical Prompt (P50)</span>
              <span className="text-zinc-200">{workload.promptTokensP50} tokens</span>
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

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>Peak Prompt Stress (P99)</span>
              <span className="text-cyan-300">{workload.promptTokensP99} tokens</span>
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
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-mono font-semibold text-white">Output Generation Tokens</Label>
            <span className="font-mono text-xs text-zinc-300">
              P50: <strong className="text-white">{workload.generationTokensP50}t</strong> • P99: <strong className="text-white">{workload.generationTokensP99}t</strong>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>Typical Output (P50)</span>
              <span className="text-zinc-200">{workload.generationTokensP50} tokens</span>
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

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>Peak Output Stress (P99)</span>
              <span className="text-cyan-300">{workload.generationTokensP99} tokens</span>
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
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkle size={15} className="text-amber-400" />
            <span>Target Service Level Objective (SLA Targets)</span>
          </Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-zinc-400">Max TTFT (Time To First Token)</span>
              <span className="text-emerald-400 font-semibold">&lt; {workload.sla.maxTtftMs} ms</span>
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
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-zinc-400">Max ITL (Inter-Token Latency)</span>
              <span className="text-cyan-400 font-semibold">&lt; {workload.sla.maxItlMs} ms/token</span>
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

      {/* Modern Scale Terminal Block */}
      <div className="rounded-xl bg-[#06080c] border border-white/10 p-4 space-y-2.5 shadow-2xl">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500/80" />
              <span className="size-2.5 rounded-full bg-amber-500/80" />
              <span className="size-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-zinc-400 text-[11px] ml-1">vllm-serve.sh</span>
          </div>
          <button
            onClick={handleCopyCommand}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-mono"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <div className="font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all py-1">
          <span className="text-cyan-400 font-bold">$</span> {bundle.runnerTarget.cliCommand}
        </div>
      </div>
    </section>
  )
}
