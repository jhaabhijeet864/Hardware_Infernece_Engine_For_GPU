import React, { useState } from "react";
import {
  X,
  Check,
  Sparkle,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col gap-6 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Buildings size={20} weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                OEM Partner Co-Branding Settings
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                Customize certificate branding for hardware supplier factory deliveries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-highlight text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mr-2">
            <Sparkle size={14} className="text-amber-400" />
            Quick Presets:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset(CHINESE_MANUFACTURING_PILOT_BRANDING)}
            className="px-3 py-1.5 rounded-lg bg-surface-dark hover:bg-surface-highlight border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <Certificate size={14} />
            <span>Shenzhen Hardware Partner</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(DEFAULT_OEM_BRANDING)}
            className="px-3 py-1.5 rounded-lg bg-surface-dark hover:bg-surface-highlight border border-border text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <ArrowsClockwise size={14} />
            <span>Default Apex AI Labs</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Partner / Manufacturer Name
            </label>
            <input
              type="text"
              value={formState.partnerName}
              onChange={(e) => setFormState({ ...formState, partnerName: e.target.value })}
              className="w-full bg-surface-dark border border-border rounded-lg py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Partner Subtitle / Tagline
            </label>
            <input
              type="text"
              value={formState.partnerTagline}
              onChange={(e) => setFormState({ ...formState, partnerTagline: e.target.value })}
              className="w-full bg-surface-dark border border-border rounded-lg py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                QA Facility / Laboratory Location
              </label>
              <input
                type="text"
                value={formState.facilityLocation}
                onChange={(e) => setFormState({ ...formState, facilityLocation: e.target.value })}
                className="w-full bg-surface-dark border border-border rounded-lg py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Lead Auditor / Certifier Title
              </label>
              <input
                type="text"
                value={formState.certifierTitle}
                onChange={(e) => setFormState({ ...formState, certifierTitle: e.target.value })}
                className="w-full bg-surface-dark border border-border rounded-lg py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Official Warranty &amp; Delivery Acceptance Clause
            </label>
            <textarea
              rows={3}
              value={formState.warrantyClause}
              onChange={(e) => setFormState({ ...formState, warrantyClause: e.target.value })}
              className="w-full bg-surface-dark border border-border rounded-lg py-2 px-3 text-white font-mono text-xs focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Appears on the printed physical delivery certificate included in shipping boxes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-dark hover:bg-surface-highlight border border-border text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(182,66,240,0.4)] flex items-center gap-1.5"
          >
            <Check size={16} weight="bold" />
            <span>Apply Co-Branding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
