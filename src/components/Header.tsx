import { useState } from 'react'
import { Cpu, TerminalWindow, FileCode, Check, Copy } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function Header() {
  const [copied, setCopied] = useState(false)
  const cliSnippet = 'npx hw-qual run --workload rag-enterprise --output qualification-run.json'

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliSnippet)
    setCopied(true)
    toast.success('CLI benchmark command copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07080c]/85 border-b border-white/[0.08] px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative size-9 rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.02] border border-white/15 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <Cpu size={19} weight="duotone" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-cyan-400 blur-[2px]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white text-sm sm:text-base font-semibold tracking-tight">
                Hardware Qualification Engine
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                v2.0 PRO
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] font-mono hidden sm:block">
              NVIDIA Workstation &amp; Serving Cluster Sizing • vLLM / TensorRT-LLM Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Target Environment Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-zinc-400 text-[11px]">CUDA 12.9 Target:</span>
            <span className="text-zinc-200 font-semibold text-[11px]">Ampere / Ada / Hopper</span>
          </div>

          {/* CLI Runner Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Physical Benchmark CLI Instructions"
              >
                <TerminalWindow size={15} className="text-cyan-400" />
                <span className="hidden sm:inline">CLI Benchmark</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl scale-card border-white/10 text-foreground p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5 text-base font-semibold text-white">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <TerminalWindow size={18} />
                  </div>
                  Physical Workstation Benchmark CLI
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 font-mono mt-1">
                  Execute empirical benchmarks on physical NVIDIA workstations to generate verified qualification bundles.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    <span>Quick Execution Command</span>
                    <span className="text-cyan-400">vLLM 0.7.x Target</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#07080c] border border-white/10 font-mono text-xs text-cyan-300 flex items-center justify-between gap-3 overflow-x-auto shadow-inner">
                    <code>{cliSnippet}</code>
                    <button
                      onClick={handleCopyCli}
                      className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white shrink-0 transition-colors"
                      title="Copy command"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-400 bg-white/[0.02] p-3.5 rounded-lg border border-white/[0.06]">
                  <p className="font-semibold text-zinc-200 text-xs">Qualification Pipeline:</p>
                  <ol className="list-decimal list-inside space-y-1.5 font-mono text-[11px] text-zinc-300">
                    <li>Discovers local NVIDIA GPUs, PCIe links, driver, host RAM, and CPU telemetry.</li>
                    <li>Runs target concurrency and sequence load sweeps against local vLLM.</li>
                    <li>Computes SHA-256 hardware hash and outputs <code className="text-cyan-400">qualification-run.json</code>.</li>
                    <li>Ingest the bundle into the dashboard to generate procurement acceptance certificates.</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* GitHub / Documentation Link */}
          <a
            href="https://github.com/jhaabhijeet864/Hardware_Infernece_Engine_For_GPU"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all shadow-sm active:scale-95"
          >
            <FileCode size={15} />
            <span className="hidden sm:inline">Docs</span>
          </a>
        </div>
      </div>
    </header>
  )
}
