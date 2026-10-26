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
    <header className="flex items-center justify-between border-b border-border bg-[#0d0f16] px-5 py-3.5 z-40 sticky top-0">
      <div className="flex items-center gap-3.5">
        <div className="size-8 rounded bg-[#181b24] border border-[#2b3040] flex items-center justify-center text-primary shadow-sm">
          <Cpu size={18} weight="bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-sm sm:text-base font-semibold tracking-tight">
              Hardware Qualification Suite
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181b24] border border-border text-muted-foreground font-medium">
              v2.0
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] font-mono hidden sm:block">
            Local Workstation & Serving Rig Telemetry • vLLM / TensorRT-LLM
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Node Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#13161f] border border-border text-xs font-mono">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="text-muted-foreground">Target:</span>
          <span className="text-foreground font-medium">NVIDIA CUDA 12.9</span>
        </div>

        {/* CLI Quick Reference Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-[#181b24] hover:bg-[#202532] text-foreground border border-border transition-colors cursor-pointer"
              title="CLI Runner Instructions"
            >
              <TerminalWindow size={15} />
              <span className="hidden sm:inline">CLI Runner</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-[#11131a] border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <TerminalWindow size={18} className="text-primary" />
                Physical Hardware Benchmark CLI
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                Execute empirical telemetry benchmarks on physical NVIDIA workstations and generate cryptographic acceptance bundles.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
                  Quick Benchmark Command
                </label>
                <div className="p-3 rounded bg-[#08090d] border border-border font-mono text-xs text-primary flex items-center justify-between gap-2 overflow-x-auto">
                  <code>{cliSnippet}</code>
                  <button
                    onClick={handleCopyCli}
                    className="p-1.5 rounded hover:bg-[#181b24] text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                    title="Copy command"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">How It Works:</p>
                <ol className="list-decimal list-inside space-y-1 font-mono text-[11px] text-slate-300">
                  <li>Discovers local NVIDIA GPUs, PCIe links, driver, host RAM, and CPU telemetry.</li>
                  <li>Executes target concurrency and sequence load sweeps against local vLLM.</li>
                  <li>Computes hardware hash and packages results into <code className="text-primary">qualification-run.json</code>.</li>
                  <li>Drag &amp; drop the bundle into this dashboard to generate delivery certificates.</li>
                </ol>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Documentation / Repo Link */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-[#181b24] hover:bg-[#202532] text-foreground border border-border transition-colors"
        >
          <FileCode size={15} />
          <span className="hidden sm:inline">Docs</span>
        </a>
      </div>
    </header>
  )
}
