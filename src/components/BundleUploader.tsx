import React, { useState, useRef } from "react";
import { UploadSimple, WarningCircle, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { validateQualificationBundle } from "@/lib/engine/bundle-validator";
import {
  SAMPLE_RUN_RAG_4090_PASS,
  SAMPLE_RUN_CHATBOT_2050_FAIL,
  SAMPLE_RUN_CODE_L40S_PASS,
} from "@/lib/fixtures/sample-runs";
import type { QualificationRunBundle } from "../../cli/bundle-builder";

interface BundleUploaderProps {
  activeBundle: QualificationRunBundle | null;
  onBundleSelect: (bundle: QualificationRunBundle) => void;
}

export const BundleUploader: React.FC<BundleUploaderProps> = ({
  activeBundle,
  onBundleSelect,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processJsonText = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      const res = validateQualificationBundle(parsed);
      if (res.valid && res.bundle) {
        setValidationErrors([]);
        onBundleSelect(res.bundle);
        toast.success(`Benchmark run '${res.bundle.metadata.run_id}' loaded successfully!`);
      } else {
        setValidationErrors(res.errors);
        toast.error("Invalid qualification run bundle format.");
      }
    } catch {
      setValidationErrors(["Failed to parse JSON file: Syntax error or corrupted file."]);
      toast.error("Malformed JSON file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processJsonText(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processJsonText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Active Run Header Bar if loaded */}
      {activeBundle && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-highlight/70 border border-border">
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                activeBundle.qualification_verdict.overall === "PASSED"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-red-500/20 text-red-400 border border-red-500/40"
              }`}
            >
              {activeBundle.qualification_verdict.overall === "PASSED" ? "PASS" : "FAIL"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  {activeBundle.environment.gpu.model}
                </p>
                <span className="text-xs px-2 py-0.5 rounded bg-surface-dark border border-border font-mono text-cyan-300">
                  {activeBundle.environment.gpu.total_vram_gib} GiB VRAM
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {activeBundle.metadata.run_id} • {new Date(activeBundle.metadata.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-dark hover:bg-surface-highlight border border-border text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <UploadSimple size={14} />
              <span>Upload New Run</span>
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragging
            ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(182,66,240,0.2)]"
            : "border-border/70 hover:border-primary/50 bg-card/60 hover:bg-card"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="size-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-3">
          <UploadSimple size={24} weight="duotone" />
        </div>

        <p className="text-sm font-semibold text-white mb-1">
          Drop <span className="font-mono text-cyan-300">qualification-run.json</span> here or click to browse
        </p>
        <p className="text-xs text-muted-foreground max-w-md">
          Ingest raw benchmark files exported by <code className="text-primary font-mono">npx hw-qual run</code> to generate verified acceptance reports.
        </p>
      </div>

      {/* Validation Error Banner */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200">
          <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-red-400">
            <WarningCircle size={18} weight="bold" />
            <span>Schema Validation Failed</span>
          </div>
          <ul className="text-xs space-y-1 list-disc list-inside text-red-300">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preset Reference Benchmarks */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkle size={14} className="text-amber-400" />
            Or Load Verified Reference Benchmark
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">3 Pre-loaded Fixtures</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => {
              setValidationErrors([]);
              onBundleSelect(SAMPLE_RUN_RAG_4090_PASS);
              toast.success("Loaded RTX 4090 RAG benchmark run");
            }}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeBundle?.metadata.run_id === SAMPLE_RUN_RAG_4090_PASS.metadata.run_id
                ? "bg-primary/15 border-primary"
                : "bg-surface-highlight/40 border-border hover:border-slate-600 hover:bg-surface-highlight"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">RTX 4090 Workstation</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                PASSED
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Llama 3.1 8B • 8 streams</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">P95 TTFT: 281ms • 17.8 GiB</p>
          </button>

          <button
            onClick={() => {
              setValidationErrors([]);
              onBundleSelect(SAMPLE_RUN_CHATBOT_2050_FAIL);
              toast.warning("Loaded RTX 2050 Chatbot benchmark run (OOM Rejection)");
            }}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeBundle?.metadata.run_id === SAMPLE_RUN_CHATBOT_2050_FAIL.metadata.run_id
                ? "bg-primary/15 border-primary"
                : "bg-surface-highlight/40 border-border hover:border-slate-600 hover:bg-surface-highlight"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">RTX 2050 Laptop</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                FAILED (OOM)
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Llama 3.2 3B • 32 streams</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">Exceeds 4 GiB VRAM limit</p>
          </button>

          <button
            onClick={() => {
              setValidationErrors([]);
              onBundleSelect(SAMPLE_RUN_CODE_L40S_PASS);
              toast.success("Loaded L40S Server benchmark run");
            }}
            className={`p-3 rounded-lg border text-left transition-all ${
              activeBundle?.metadata.run_id === SAMPLE_RUN_CODE_L40S_PASS.metadata.run_id
                ? "bg-primary/15 border-primary"
                : "bg-surface-highlight/40 border-border hover:border-slate-600 hover:bg-surface-highlight"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">NVIDIA L40S Server</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                PASSED
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Qwen 2.5 14B • 4 streams</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">P95 TTFT: 510ms • 22.4 GiB</p>
          </button>
        </div>
      </div>
    </div>
  );
};
