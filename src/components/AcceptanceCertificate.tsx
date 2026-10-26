import React, { useState } from "react";
import {
  Printer,
  DownloadSimple,
  Copy,
  SealCheck,
  WarningOctagon,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Gear,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  OEMBrandingConfig,
  DEFAULT_OEM_BRANDING,
} from "@/lib/engine/branding";
import { OEMBrandingModal } from "./OEMBrandingModal";
import type { QualificationRunBundle } from "../../cli/bundle-builder";

interface AcceptanceCertificateProps {
  bundle: QualificationRunBundle;
  branding?: OEMBrandingConfig;
  onBrandingChange?: (branding: OEMBrandingConfig) => void;
}

export const AcceptanceCertificate: React.FC<AcceptanceCertificateProps> = ({
  bundle,
  branding: externalBranding,
  onBrandingChange,
}) => {
  const [internalBranding, setInternalBranding] = useState<OEMBrandingConfig>(
    externalBranding || DEFAULT_OEM_BRANDING
  );
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

  const branding = externalBranding || internalBranding;
  const setBranding = (b: OEMBrandingConfig) => {
    setInternalBranding(b);
    onBrandingChange?.(b);
  };

  const [serialNumber, setSerialNumber] = useState("SN-HW-4090-2026-X99");
  const [inspectorName, setInspectorName] = useState(branding.certifierTitle);
  const [partnerOrg, setPartnerOrg] = useState(branding.partnerName);

  const isPassed = bundle.qualification_verdict.overall === "PASSED";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `qualification-certificate-${bundle.metadata.run_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Certificate JSON artifact downloaded");
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(bundle.metadata.system_hash);
    toast.success("Hardware SHA-256 fingerprint copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action Bar (Hidden on print) */}
      <div className="print:hidden scale-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <SealCheck size={18} weight="duotone" />
          </div>
          <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-zinc-300">
            Hardware Acceptance Dossier &amp; Certificate
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBrandingModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Gear size={14} className="text-zinc-400" />
            <span>OEM Branding</span>
          </button>

          <button
            onClick={handleCopyHash}
            className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Copy size={14} className="text-zinc-400" />
            <span>Copy Hash</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <DownloadSimple size={14} className="text-zinc-400" />
            <span>JSON Dossier</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-mono font-bold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
          >
            <Printer size={15} weight="bold" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* The Printable Certificate Document */}
      <div
        id="qualification-certificate"
        className="scale-card rounded-2xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden print:p-0 print:border-none print:shadow-none print:bg-white print:text-black"
      >
        <div className="border border-white/10 rounded-xl p-6 sm:p-8 relative bg-black/40 print:border-slate-300 print:bg-transparent">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10 print:border-slate-300">
            <div>
              <div className="flex items-center gap-3.5 mb-2">
                <div className="size-10 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-cyan-400 print:bg-slate-900 shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                  <ShieldCheck size={22} weight="duotone" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 print:text-blue-800 print:border-slate-400 uppercase tracking-widest font-semibold">
                      {branding.partnerName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 print:text-slate-600">
                      • {branding.facilityLocation}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white print:text-black">
                    Hardware Qualification Certificate
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono print:text-slate-600 mt-0.5">
                    {branding.partnerTagline}
                  </p>
                </div>
              </div>
            </div>

            {/* Official Stamp */}
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 self-start md:self-auto font-mono ${
                isPassed
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] print:border-emerald-600 print:text-emerald-700"
                  : "bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] print:border-red-600 print:text-red-700"
              }`}
            >
              {isPassed ? <SealCheck size={34} weight="fill" /> : <WarningOctagon size={34} weight="fill" />}
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest block opacity-75">
                  OFFICIAL VERDICT
                </span>
                <span className="text-base font-bold tracking-wider uppercase">
                  {isPassed ? "QUALIFIED" : "DISQUALIFIED"}
                </span>
              </div>
            </div>
          </div>

          {/* Certificate Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-white/10 text-xs font-mono print:border-slate-200">
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] uppercase text-zinc-400 block print:text-slate-500">
                Certificate ID
              </span>
              <span className="font-bold text-white print:text-black">{bundle.metadata.run_id}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] uppercase text-zinc-400 block print:text-slate-500">
                Timestamp (UTC)
              </span>
              <span className="font-bold text-white print:text-black">
                {new Date(bundle.metadata.timestamp).toISOString().replace("T", " ").slice(0, 19)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] uppercase text-zinc-400 block print:text-slate-500">
                Profile
              </span>
              <span className="font-bold text-white print:text-black">
                {bundle.metadata.qualification_profile}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] uppercase text-zinc-400 block print:text-slate-500">
                Execution Mode
              </span>
              <span className="font-bold text-white print:text-black">
                {bundle.environment.is_simulated ? "Simulated Trace" : "Physical Hardware Execution"}
              </span>
            </div>
          </div>

          {/* Section 1: Physical Machine Specifications */}
          <div className="py-6 border-b border-white/10 print:border-slate-200">
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-400 print:text-blue-700 mb-3.5">
              1. Physical Machine Provenance &amp; System Fingerprint
            </h3>

            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs flex flex-wrap items-center justify-between gap-2 mb-4 print:bg-slate-100 print:border-slate-300">
              <span className="text-zinc-400 print:text-slate-600">Hardware SHA-256 Hash:</span>
              <span className="text-cyan-300 font-semibold print:text-black break-all">
                {bundle.metadata.system_hash}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">GPU Model</span>
                <span className="font-semibold text-white print:text-black">{bundle.environment.gpu.model}</span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Total VRAM</span>
                <span className="font-semibold text-white print:text-black">
                  {bundle.environment.gpu.total_vram_gib} GiB
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">PCIe Link</span>
                <span className="font-semibold text-white print:text-black">
                  {bundle.environment.gpu.pcie_link || "Gen 4 x16"}
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">NVIDIA Driver / CUDA</span>
                <span className="font-semibold text-white print:text-black">
                  v{bundle.environment.gpu.driver_version} / {bundle.environment.gpu.cuda_version}
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Host CPU</span>
                <span className="font-semibold text-white print:text-black truncate" title={bundle.environment.host.cpu}>
                  {bundle.environment.host.cpu}
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Host System RAM</span>
                <span className="font-semibold text-white print:text-black">{bundle.environment.host.ram_gib} GiB</span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Operating System</span>
                <span className="font-semibold text-white print:text-black truncate" title={bundle.environment.host.os}>
                  {bundle.environment.host.os}
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Serving Runtime</span>
                <span className="font-semibold text-white print:text-black">
                  {bundle.environment.runtime.engine} v{bundle.environment.runtime.version}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Workload & SLA Requirements */}
          <div className="py-6 border-b border-white/10 print:border-slate-200">
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-400 print:text-blue-700 mb-3.5">
              2. Tested Customer Workload &amp; Service Level Objectives
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Model ID</span>
                <span className="font-semibold text-white print:text-black">{bundle.workload_spec.modelId}</span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Precision / KV</span>
                <span className="font-semibold text-white print:text-black">
                  {bundle.workload_spec.precision} / {bundle.workload_spec.kvCachePrecision}
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Prompt / Gen Tokens</span>
                <span className="font-semibold text-white print:text-black">
                  {bundle.workload_spec.promptTokensP50} / {bundle.workload_spec.generationTokensP50}
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Streams</span>
                <span className="font-semibold text-white print:text-black">
                  {bundle.workload_spec.concurrency} streams
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">TTFT SLA Threshold</span>
                <span className="font-semibold text-emerald-400 print:text-black">
                  &lt; {bundle.workload_spec.sla.maxTtftMs} ms
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">ITL SLA Threshold</span>
                <span className="font-semibold text-cyan-400 print:text-black">
                  &lt; {bundle.workload_spec.sla.maxItlMs} ms
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Throughput Target</span>
                <span className="font-semibold text-white print:text-black">
                  &gt; {bundle.workload_spec.sla.minTokensPerSec || 25} tokens/s
                </span>
              </div>
              <div className="p-3 rounded-xl scale-card-interactive print:border-slate-200">
                <span className="text-[10px] text-zinc-400 block print:text-slate-500">Registered Users</span>
                <span className="font-semibold text-white print:text-black">
                  ~{bundle.workload_spec.registeredUsersEstimated || 100}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: 4-Point Audit Checklist */}
          <div className="py-6 border-b border-white/10 print:border-slate-200">
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-400 print:text-blue-700 mb-3.5">
              3. Empirical Benchmark Results &amp; Verification Checks
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 print:border-slate-300">
                    <th className="py-2.5 font-bold uppercase text-[10px]">Audit Criterion</th>
                    <th className="py-2.5 font-bold uppercase text-[10px]">Target Requirement</th>
                    <th className="py-2.5 font-bold uppercase text-[10px]">Empirical Measured</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] print:divide-slate-200">
                  {bundle.qualification_verdict.checks.map((check, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-semibold text-white print:text-black">{check.criterion}</td>
                      <td className="py-3 text-zinc-400 print:text-slate-600">Standard Spec</td>
                      <td className="py-3 font-bold text-zinc-200 print:text-black">{check.actual}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            check.passed
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800"
                              : "bg-red-500/10 text-red-400 border border-red-500/30 print:bg-red-100 print:text-red-800"
                          }`}
                        >
                          {check.passed ? <CheckCircle size={13} weight="bold" /> : <XCircle size={13} weight="bold" />}
                          {check.passed ? "PASSED" : "FAILED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 mt-4 text-xs font-mono text-zinc-300 print:bg-slate-50 print:border-slate-200 print:text-black">
              <strong className="text-white">Technical Qualification Summary:</strong> {bundle.qualification_verdict.recommendation}
            </div>
          </div>

          {/* Section 4: Factory Delivery Sign-Off */}
          <div className="pt-6">
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-400 print:text-blue-700 mb-3.5">
              4. Factory Delivery Acceptance &amp; Quality Sign-Off
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono mb-6">
              <div>
                <label className="text-[10px] uppercase text-zinc-400 block mb-1.5 print:text-slate-500">
                  Machine Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-white font-mono focus:outline-none focus:border-cyan-400 print:bg-transparent print:border-b print:border-black print:text-black transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-zinc-400 block mb-1.5 print:text-slate-500">
                  Lead QA / Testing Engineer
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-white font-mono focus:outline-none focus:border-cyan-400 print:bg-transparent print:border-b print:border-black print:text-black transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-zinc-400 block mb-1.5 print:text-slate-500">
                  Integration Partner Facility
                </label>
                <input
                  type="text"
                  value={partnerOrg}
                  onChange={(e) => setPartnerOrg(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-white font-mono focus:outline-none focus:border-cyan-400 print:bg-transparent print:border-b print:border-black print:text-black transition-colors"
                />
              </div>
            </div>

            {/* OEM Warranty & Performance Terms */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] font-mono text-zinc-300 print:bg-slate-50 print:border-slate-300 print:text-slate-700 mb-5">
              <strong className="text-white print:text-black block mb-1">OEM Performance Warranty Terms:</strong>
              {branding.warrantyClause}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 text-xs font-mono text-zinc-400 print:text-black">
              <div>
                <p className="text-[11px] text-zinc-300">
                  Generated via Local AI Hardware Qualification Suite v2.0
                </p>
                <p className="text-[10px] opacity-75">
                  Reproducible test specification conforming to vLLM online-serving benchmark protocol.
                </p>
              </div>

              <div className="text-right">
                <div className="w-56 h-8 border-b border-white/20 print:border-black mb-1" />
                <span className="text-[10px] uppercase tracking-wider block text-zinc-400 print:text-black">
                  Authorized Sign-Off: {branding.certifierTitle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OEMBrandingModal
        isOpen={isBrandingModalOpen}
        branding={branding}
        onSave={setBranding}
        onClose={() => setIsBrandingModalOpen(false)}
      />
    </div>
  );
};
