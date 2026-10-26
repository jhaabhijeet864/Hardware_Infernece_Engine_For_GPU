import { WorkloadSpecification, calculateWorkloadMemory } from "./workload";

export type MachineFormFactor = "workstation" | "rackmount-server" | "edge-appliance";

export interface PartnerMachineProfile {
  id: string;
  name: string;
  formFactor: MachineFormFactor;
  targetMarket: string;
  gpu: {
    model: string;
    count: number;
    totalVramGiB: number;
    vramPerGpuGiB: number;
    pcieLink: string;
    powerLimitW: number;
    thermalThrottleLimitC: number;
  };
  host: {
    cpuClass: string;
    recommendedRamGiB: number;
    recommendedPsuW: number;
    operatingSystem: string;
  };
  recommendedWorkloads: string[];
  maxConcurrencyEstimate: number;
  targetSlaGuidance: {
    expectedTtftMs: number;
    expectedItlMs: number;
  };
}

export const PARTNER_MACHINE_PROFILES: PartnerMachineProfile[] = [
  {
    id: "single-rtx-4090-entry",
    name: "Apex Studio RTX 4090 Workstation",
    formFactor: "workstation",
    targetMarket: "SMB AI Prototyping & Departmental Serving",
    gpu: {
      model: "NVIDIA GeForce RTX 4090",
      count: 1,
      totalVramGiB: 24.0,
      vramPerGpuGiB: 24.0,
      pcieLink: "Gen 4 x16",
      powerLimitW: 450,
      thermalThrottleLimitC: 84,
    },
    host: {
      cpuClass: "AMD Ryzen 9 7950X or Intel Core i9-14900K",
      recommendedRamGiB: 64.0,
      recommendedPsuW: 1000,
      operatingSystem: "Ubuntu 24.04 LTS / WSL2",
    },
    recommendedWorkloads: ["enterprise-rag", "customer-support"],
    maxConcurrencyEstimate: 8,
    targetSlaGuidance: {
      expectedTtftMs: 250,
      expectedItlMs: 26,
    },
  },
  {
    id: "dual-rtx-4090-workstation",
    name: "Apex Dual-4090 AI Workstation",
    formFactor: "workstation",
    targetMarket: "High-Throughput Local Enterprise RAG & Multi-User Copilots",
    gpu: {
      model: "NVIDIA GeForce RTX 4090",
      count: 2,
      totalVramGiB: 48.0,
      vramPerGpuGiB: 24.0,
      pcieLink: "Gen 4 x16 (Bifurcated x8/x8 or dual x16 on Threadripper)",
      powerLimitW: 900,
      thermalThrottleLimitC: 84,
    },
    host: {
      cpuClass: "AMD Ryzen Threadripper 7960X 24-Core",
      recommendedRamGiB: 128.0,
      recommendedPsuW: 1600,
      operatingSystem: "Ubuntu 24.04 LTS / Debian 12",
    },
    recommendedWorkloads: ["enterprise-rag", "code-assistant", "customer-support"],
    maxConcurrencyEstimate: 24,
    targetSlaGuidance: {
      expectedTtftMs: 280,
      expectedItlMs: 22,
    },
  },
  {
    id: "rtx-6000-ada-pro",
    name: "Apex Precision 6000 Ada Workstation",
    formFactor: "workstation",
    targetMarket: "Mission-Critical Enterprise Lab & Engineering Systems",
    gpu: {
      model: "NVIDIA RTX 6000 Ada Generation",
      count: 1,
      totalVramGiB: 48.0,
      vramPerGpuGiB: 48.0,
      pcieLink: "Gen 4 x16",
      powerLimitW: 300,
      thermalThrottleLimitC: 85,
    },
    host: {
      cpuClass: "Intel Xeon w7-2495X or Threadripper PRO 7965WX",
      recommendedRamGiB: 128.0,
      recommendedPsuW: 1200,
      operatingSystem: "Red Hat Enterprise Linux 9 / Ubuntu 22.04 LTS",
    },
    recommendedWorkloads: ["code-assistant", "agentic-reasoner", "enterprise-rag"],
    maxConcurrencyEstimate: 16,
    targetSlaGuidance: {
      expectedTtftMs: 310,
      expectedItlMs: 24,
    },
  },
  {
    id: "l40s-enterprise-server",
    name: "Apex Server L40S 2U Rackmount",
    formFactor: "rackmount-server",
    targetMarket: "Enterprise Datacenter Online-Serving & RAG Inference",
    gpu: {
      model: "NVIDIA L40S",
      count: 2,
      totalVramGiB: 96.0,
      vramPerGpuGiB: 48.0,
      pcieLink: "Gen 4 x16",
      powerLimitW: 700,
      thermalThrottleLimitC: 82,
    },
    host: {
      cpuClass: "Dual Intel Xeon Platinum 8468 or AMD EPYC 9354",
      recommendedRamGiB: 256.0,
      recommendedPsuW: 2400,
      operatingSystem: "Ubuntu 24.04 LTS Server with NVIDIA Container Toolkit",
    },
    recommendedWorkloads: ["code-assistant", "agentic-reasoner", "customer-support", "enterprise-rag"],
    maxConcurrencyEstimate: 48,
    targetSlaGuidance: {
      expectedTtftMs: 220,
      expectedItlMs: 18,
    },
  },
  {
    id: "a100-80gb-datacenter",
    name: "Apex Cloud A100 SXM 4U Server",
    formFactor: "rackmount-server",
    targetMarket: "High-Bandwidth Enterprise LLM Reasoning & Large Concurrency",
    gpu: {
      model: "NVIDIA A100-SXM4-80GB",
      count: 1,
      totalVramGiB: 80.0,
      vramPerGpuGiB: 80.0,
      pcieLink: "SXM4 NVLink (600 GB/s inter-GPU)",
      powerLimitW: 400,
      thermalThrottleLimitC: 80,
    },
    host: {
      cpuClass: "AMD EPYC 7763 64-Core Processor",
      recommendedRamGiB: 512.0,
      recommendedPsuW: 3000,
      operatingSystem: "Ubuntu 22.04 LTS / DGX OS",
    },
    recommendedWorkloads: ["agentic-reasoner", "code-assistant", "enterprise-rag"],
    maxConcurrencyEstimate: 64,
    targetSlaGuidance: {
      expectedTtftMs: 180,
      expectedItlMs: 15,
    },
  },
];

export function getAllPartnerProfiles(): PartnerMachineProfile[] {
  return [...PARTNER_MACHINE_PROFILES];
}

export function getPartnerProfileById(id: string): PartnerMachineProfile | undefined {
  return PARTNER_MACHINE_PROFILES.find((p) => p.id === id);
}

/**
 * Matches partner hardware configurations against a specified customer workload.
 */
export function matchProfilesForWorkload(workload: WorkloadSpecification): {
  optimal: PartnerMachineProfile[];
  plausible: PartnerMachineProfile[];
  insufficient: PartnerMachineProfile[];
} {
  const sizing = calculateWorkloadMemory(workload);
  const peakVram = sizing.peakMemory.totalVRAMRequiredGiB;
  const typicalVram = sizing.typicalMemory.totalVRAMRequiredGiB;

  const optimal: PartnerMachineProfile[] = [];
  const plausible: PartnerMachineProfile[] = [];
  const insufficient: PartnerMachineProfile[] = [];

  for (const profile of PARTNER_MACHINE_PROFILES) {
    const totalVram = profile.gpu.totalVramGiB;
    if (totalVram < typicalVram) {
      insufficient.push(profile);
    } else if (totalVram >= peakVram * 1.25 && profile.maxConcurrencyEstimate >= workload.concurrency) {
      optimal.push(profile);
    } else {
      plausible.push(profile);
    }
  }

  return { optimal, plausible, insufficient };
}
