import React, { useState, useRef } from "react";
import { UploadSimple, WarningCircle, HardDrives } from "@phosphor-icons/react";
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
        toast.success(`Benchmark run '${res.bundle.metadata.run_id}' loaded successfully`);
      } else {
        setValidationErrors(res.errors);
        toast.error("Invalid qualification run bundle format");
      }
    } catch {
      setValidationErrors(["Failed to parse JSON file: Syntax error or corrupted file."]);
      toast.error("Malformed JSON file");
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
    <div className="flex flex-col gap-5">
      {/* Active Run Header Bar if loaded */}
      {activeBundle && (
        <div className="scale-card rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div
              className={`size-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shadow-sm ${
                activeBundle.qualification_verdict.overall === "PASSED"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
              }`}
            >
              {activeBundle.qualification_verdict.overall === "PASSED" ? "PASS" : "FAIL"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {activeBundle.environment.gpu.model}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 font-mono text-zinc-300">
                  {activeBundle.environment.gpu.total_vram_gib} GiB VRAM
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Run ID: <code className="text-zinc-300">{activeBundle.metadata.run_id}</code> • {new Date(activeBundle.metadata.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-mono font-medium rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-zinc-200 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <UploadSimple size={15} className="text-cyan-400" />
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
        className={`relative p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragging
            ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(56,189,248,0.25)]"
            : "border-white/10 hover:border-white/25 scale-card-interactive"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="size-12 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <UploadSimple size={24} weight="duotone" />
        </div>

        <p className="text-sm font-semibold text-white mb-1.5">
          Drop <span className="font-mono text-cyan-400 font-bold">qualification-run.json</span> here or click to browse
        </p>
        <p className="text-xs text-zinc-400 font-mono max-w-md">
          Ingest empirical benchmark files exported by <code className="text-zinc-200 font-semibold px-1 py-0.5 rounded bg-white/[0.06] border border-white/10">npx hw-qual run</code> to verify hardware tolerance.
        </p>
      </div>

      {/* Validation Error Banner */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200">
          <div className="flex items-center gap-2 font-semibold text-xs mb-2 text-red-400 font-mono">
            <WarningCircle size={16} weight="bold" />
            <span>Schema Validation Failed</span>
          </div>
          <ul className="text-xs space-y-1 list-disc list-inside text-red-300 font-mono text-[11px]">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preset Reference Benchmarks */}
      <div className="scale-card rounded-2xl p-5 sm:p-6 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <HardDrives size={16} className="text-cyan-400" />
            Empirical Benchmark Presets
          </span>
          <span className="text-[11px] text-zinc-400 font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">3 Fixtures</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => {
              setValidationErrors([]);
              onBundleSelect(SAMPLE_RUN_RAG_4090_PASS);
              toast.success("Loaded RTX 4090 RAG benchmark run");
            }}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
              activeBundle?.metadata.run_id === SAMPLE_RUN_RAG_4090_PASS.metadata.run_id
                ? "scale-card-active"
                : "scale-card-interactive"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">RTX 4090 Workstation</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                PASS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Llama 3.1 8B • 8 streams</p>
            <p className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1.5 border-t border-white/[0.04]">P95 TTFT: 281ms • 17.8 GiB</p>
          </button>

          <button
            onClick={() => {
              setValidationErrors([]);
              onBundleSelect(SAMPLE_RUN_CHATBOT_2050_FAIL);
              toast.warning("Loaded RTX 2050 Chatbot benchmark run (OOM Rejection)");
            }}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
              activeBundle?.metadata.run_id === SAMPLE_RUN_CHATBOT_2050_FAIL.metadata.run_id
                ? "scale-card-active"
                : "scale-card-interactive"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">RTX 2050 Laptop</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-mono font-bold border border-red-500/30">
                FAIL (OOM)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Llama 3.2 3B • 32 streams</p>
            <p className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1.5 border-t border-white/[0.04]">Exceeds 4 GiB VRAM limit</p>
          </button>

          <button
            onClick={() => {
              setValidationErrors([]);
              onBundleSelect(SAMPLE_RUN_CODE_L40S_PASS);
              toast.success("Loaded L40S Server benchmark run");
            }}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
              activeBundle?.metadata.run_id === SAMPLE_RUN_CODE_L40S_PASS.metadata.run_id
                ? "scale-card-active"
                : "scale-card-interactive"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">NVIDIA L40S Server</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                PASS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Qwen 2.5 14B • 4 streams</p>
            <p className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1.5 border-t border-white/[0.04]">P95 TTFT: 510ms • 22.4 GiB</p>
          </button>
        </div>
      </div>
    </div>
  );
};
