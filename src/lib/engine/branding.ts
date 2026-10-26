export interface OEMBrandingConfig {
  partnerName: string;
  partnerTagline: string;
  facilityLocation: string;
  warrantyClause: string;
  certifierTitle: string;
  badgeText: string;
  accentColor: "cyan" | "emerald" | "purple";
}

export const DEFAULT_OEM_BRANDING: OEMBrandingConfig = {
  partnerName: "Apex AI Compute Labs",
  partnerTagline: "Hardware Validation & Factory Acceptance Suite",
  facilityLocation: "Shenzhen Advanced AI Integration Facility #4",
  warrantyClause:
    "This machine has undergone automated stress qualification using vLLM online-serving benchmarks and live NVML telemetry. Performance is certified to meet agreed customer SLA bounds under standard operating conditions.",
  certifierTitle: "Lead AI Infrastructure Systems Auditor",
  badgeText: "OEM VERIFIED",
  accentColor: "cyan",
};

export const CHINESE_MANUFACTURING_PILOT_BRANDING: OEMBrandingConfig = {
  partnerName: "Shenzhen Precision AI Hardware Co.",
  partnerTagline: "Factory Acceptance & Workload Performance Certification",
  facilityLocation: "Bao'an High-Tech Industrial Park, Building 7, Shenzhen",
  warrantyClause:
    "Physical hardware rig verified and certified compliant with target enterprise LLM serving workloads. VRAM memory stability, latency percentiles, and zero OOM tolerance confirmed prior to factory dispatch.",
  certifierTitle: "Factory Quality Assurance Director",
  badgeText: "FACTORY CERTIFIED",
  accentColor: "emerald",
};

export function validateBrandingConfig(branding: Partial<OEMBrandingConfig>): OEMBrandingConfig {
  return {
    partnerName: branding.partnerName?.trim() || DEFAULT_OEM_BRANDING.partnerName,
    partnerTagline: branding.partnerTagline?.trim() || DEFAULT_OEM_BRANDING.partnerTagline,
    facilityLocation: branding.facilityLocation?.trim() || DEFAULT_OEM_BRANDING.facilityLocation,
    warrantyClause: branding.warrantyClause?.trim() || DEFAULT_OEM_BRANDING.warrantyClause,
    certifierTitle: branding.certifierTitle?.trim() || DEFAULT_OEM_BRANDING.certifierTitle,
    badgeText: branding.badgeText?.trim() || DEFAULT_OEM_BRANDING.badgeText,
    accentColor: branding.accentColor || DEFAULT_OEM_BRANDING.accentColor,
  };
}
