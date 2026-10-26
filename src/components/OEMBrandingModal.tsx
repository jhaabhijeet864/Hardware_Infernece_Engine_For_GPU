import React, { useState } from "react";
import {
  X,
  Check,
  Buildings,
  Certificate,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import {
  OEMBrandingConfig,
  DEFAULT_OEM_BRANDING,
  CHINESE_MANUFACTURING_PILOT_BRANDING,
  validateBrandingConfig,
} from "@/lib/engine/branding";

interface OEMBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: OEMBrandingConfig;
  onSave: (newBranding: OEMBrandingConfig) => void;
}

export const OEMBrandingModal: React.FC<OEMBrandingModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSave,
}) => {
  const [formState, setFormState] = useState<OEMBrandingConfig>(branding);

  if (!isOpen) return null;

  const handleSave = () => {
    const validated = validateBrandingConfig(formState);
    onSave(validated);
    onClose();
  };

  const handleApplyPreset = (preset: OEMBrandingConfig) => {
    setFormState({ ...preset });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-xl bg-[#11131a] border border-border rounded-xl shadow-lg p-5 sm:p-6 overflow-hidden flex flex-col gap-5 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded bg-[#181b24] text-primary border border-border flex items-center justify-center">
              <Buildings size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                OEM Partner Co-Branding
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                Hardware vendor identity and qualification delivery terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#181b24] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Template:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset(CHINESE_MANUFACTURING_PILOT_BRANDING)}
            className="px-2.5 py-1 rounded bg-[#0e1017] hover:bg-[#161922] border border-border text-foreground text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Certificate size={13} className="text-primary" />
            <span>Shenzhen Hardware Partner</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(DEFAULT_OEM_BRANDING)}
            className="px-2.5 py-1 rounded bg-[#0e1017] hover:bg-[#161922] border border-border text-foreground text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowsClockwise size={13} className="text-primary" />
            <span>Default Apex AI Labs</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs font-mono">
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">
              Partner / Manufacturer Name
            </label>
            <input
              type="text"
              value={formState.partnerName}
              onChange={(e) => setFormState({ ...formState, partnerName: e.target.value })}
              className="w-full bg-[#0e1017] border border-border rounded py-1.5 px-3 text-foreground font-mono text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">
              Partner Subtitle / Tagline
            </label>
            <input
              type="text"
              value={formState.partnerTagline}
              onChange={(e) => setFormState({ ...formState, partnerTagline: e.target.value })}
              className="w-full bg-[#0e1017] border border-border rounded py-1.5 px-3 text-foreground font-mono text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">
                Facility / Lab Location
              </label>
              <input
                type="text"
                value={formState.facilityLocation}
                onChange={(e) => setFormState({ ...formState, facilityLocation: e.target.value })}
                className="w-full bg-[#0e1017] border border-border rounded py-1.5 px-3 text-foreground font-mono text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">
                Lead Certifier Title
              </label>
              <input
                type="text"
                value={formState.certifierTitle}
                onChange={(e) => setFormState({ ...formState, certifierTitle: e.target.value })}
                className="w-full bg-[#0e1017] border border-border rounded py-1.5 px-3 text-foreground font-mono text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">
              Delivery Acceptance Warranty Clause
            </label>
            <textarea
              rows={3}
              value={formState.warrantyClause}
              onChange={(e) => setFormState({ ...formState, warrantyClause: e.target.value })}
              className="w-full bg-[#0e1017] border border-border rounded py-1.5 px-3 text-foreground font-mono text-xs focus:outline-none focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#181b24] hover:bg-[#202532] text-foreground text-xs font-mono transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded bg-primary hover:bg-sky-400 text-black text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} weight="bold" />
            <span>Apply Branding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
