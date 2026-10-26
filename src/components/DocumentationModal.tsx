import React from "react";
import {
  BookOpen,
  X,
  Cpu,
  Calculator,
  ShieldCheck,
  Sparkle,
} from "@phosphor-icons/react";

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/80 bg-surface-dark/90">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
              <BookOpen size={22} weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Hardware Inference &amp; Qualification Guide
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                Scientific calculations, mathematical formulas, and benchmark specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-highlight text-muted-foreground hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* KV Cache Formula */}
          <div className="p-4 rounded-xl bg-surface-highlight/60 border border-border/80 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Calculator size={18} className="text-cyan-400" weight="duotone" />
              1. Exact KV Cache Memory Formula (GQA / MHA / MQA)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standard Grouped Query Attention calculates key-value storage per token dynamically based on model architecture parameters:
            </p>
            <div className="bg-black/60 p-3 rounded-lg font-mono text-xs text-cyan-300 border border-cyan-900/40">
              M_KV = 2 × L × H_KV × D_head × T × B × s
            </div>
            <ul className="text-xs space-y-1 list-disc list-inside text-slate-400 font-mono">
              <li><strong className="text-slate-200">L:</strong> Layer count</li>
              <li><strong className="text-slate-200">H_KV:</strong> Key-Value attention heads (e.g., 8 in Llama 3.1 8B)</li>
              <li><strong className="text-slate-200">D_head:</strong> Head dimension (e.g., 128)</li>
              <li><strong className="text-slate-200">T:</strong> Context sequence length (prompt + output tokens)</li>
              <li><strong className="text-slate-200">B:</strong> Active concurrent streams (batch size)</li>
              <li><strong className="text-slate-200">s:</strong> Bytes per element (FP16/BF16: 2B, FP8/INT8: 1B)</li>
            </ul>
          </div>

          {/* DeepSeek MLA */}
          <div className="p-4 rounded-xl bg-surface-highlight/60 border border-border/80 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Sparkle size={18} className="text-accent" weight="duotone" />
              2. DeepSeek Multi-Head Latent Attention (MLA)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              DeepSeek-V3 and DeepSeek-R1 project Keys and Values into a low-rank latent vector (512 latent dimensions + 64 RoPE dimensions = 576 dims per layer), drastically compressing the KV cache footprint compared to standard MHA:
            </p>
            <div className="bg-black/60 p-3 rounded-lg font-mono text-xs text-accent border border-purple-900/40">
              M_MLA = L × 576 × T × B × s
            </div>
          </div>

          {/* Tensor Parallelism */}
          <div className="p-4 rounded-xl bg-surface-highlight/60 border border-border/80 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Cpu size={18} className="text-emerald-400" weight="duotone" />
              3. Multi-GPU Tensor Parallelism (TP) Sharding
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When Tensor Parallelism ($TP \ge 2$) is enabled, model weights and KV cache heads are split across active GPUs:
            </p>
            <div className="bg-black/60 p-3 rounded-lg font-mono text-xs text-emerald-300 border border-emerald-900/40">
              VRAM_per_GPU = (Weights / TP) + (KV_Cache / TP) + (Activations / TP + Buffer) + CUDA_Context
            </div>
          </div>

          {/* SLA Acceptance Criteria */}
          <div className="p-4 rounded-xl bg-surface-highlight/60 border border-border/80 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" weight="duotone" />
              4. Hardware Acceptance SLA Criteria
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hardware Qualification certificates evaluate 4 strict acceptance criteria:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-black/40 border border-border/60">
                <span className="text-cyan-400 block font-bold">1. Memory Headroom</span>
                Peak VRAM &le; Physical GPU Capacity (No OOM errors)
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-border/60">
                <span className="text-emerald-400 block font-bold">2. First Token Latency</span>
                P95 TTFT &le; Target Workload SLA (e.g. &lt; 600 ms)
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-border/60">
                <span className="text-purple-400 block font-bold">3. Generation Pacing</span>
                P95 ITL &le; Target Workload SLA (e.g. &lt; 35 ms/token)
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-border/60">
                <span className="text-amber-400 block font-bold">4. Serving Goodput</span>
                Successful requests meeting latency SLA &ge; 95%
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-surface-dark/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
