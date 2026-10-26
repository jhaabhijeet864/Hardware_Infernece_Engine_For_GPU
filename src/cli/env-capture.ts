import { execSync } from "node:child_process";
import * as os from "node:os";
import * as crypto from "node:crypto";

export interface GpuEnvironmentSpec {
  model: string;
  count: number;
  total_vram_gib: number;
  driver_version: string;
  cuda_version: string;
  pcie_link?: string;
  power_limit_w?: number;
  uuid?: string;
}

export interface HostEnvironmentSpec {
  cpu: string;
  cores_physical?: number;
  cores_logical: number;
  ram_gib: number;
  os: string;
  platform: string;
  arch: string;
}

export interface SystemEnvironment {
  gpu: GpuEnvironmentSpec;
  host: HostEnvironmentSpec;
  system_hash: string;
  is_simulated: boolean;
}

export interface CaptureOptions {
  simulated?: boolean;
  mockGpu?: Partial<GpuEnvironmentSpec>;
}

/**
 * Computes a deterministic SHA-256 hash of system identifiers for audit provenance.
 */
export function computeSystemHash(gpu: GpuEnvironmentSpec, host: HostEnvironmentSpec): string {
  const payload = [
    gpu.model,
    gpu.uuid || "no-uuid",
    gpu.driver_version,
    gpu.total_vram_gib.toFixed(2),
    host.cpu,
    host.cores_logical,
    host.ram_gib.toFixed(2),
    host.os,
    host.platform,
    host.arch,
  ].join("::");

  return `sha256-${crypto.createHash("sha256").update(payload).digest("hex")}`;
}

/**
 * Probes nvidia-smi to query physical GPU hardware specs and driver version.
 */
function queryNvidiaGpus(): {
  gpus: Array<{
    name: string;
    uuid: string;
    driver_version: string;
    memory_total_mib: number;
    power_limit_w: number;
    pcie_gen: string;
    pcie_width: string;
  }>;
  driverVersion: string;
} | null {
  try {
    const raw = execSync(
      "nvidia-smi --query-gpu=name,uuid,driver_version,memory.total,power.limit,pcie.link.gen.current,pcie.link.width.current --format=csv,noheader,nounits",
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }
    ).trim();

    if (!raw) return null;

    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    const parsedGpus = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        name: parts[0] || "NVIDIA GPU",
        uuid: parts[1] || "",
        driver_version: parts[2] || "Unknown",
        memory_total_mib: parseFloat(parts[3]) || 0,
        power_limit_w: parseFloat(parts[4]) || 0,
        pcie_gen: parts[5] || "",
        pcie_width: parts[6] || "",
      };
    });

    return {
      gpus: parsedGpus,
      driverVersion: parsedGpus[0].driver_version,
    };
  } catch {
    return null;
  }
}

/**
 * Detects CUDA compiler/driver capability via nvcc or nvidia-smi header.
 */
function queryCudaVersion(): string {
  try {
    const rawNvcc = execSync("nvcc --version", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3000,
    });
    const match = rawNvcc.match(/release\s+([\d.]+)/i);
    if (match?.[1]) return match[1];
  } catch {
    // nvcc might not be on PATH, try nvidia-smi header
  }

  try {
    const rawSmi = execSync("nvidia-smi", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3000,
    });
    const match = rawSmi.match(/CUDA Version:\s*([\d.]+)/i);
    if (match?.[1]) return match[1];
  } catch {
    // ignore
  }

  return "12.4"; // Standard vLLM default baseline
}

/**
 * Gathers host CPU, Memory, and Operating System details.
 */
export function captureHostEnvironment(): HostEnvironmentSpec {
  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model || "Generic CPU";
  const totalRamBytes = os.totalmem();
  const ramGiB = Number((totalRamBytes / (1024 ** 3)).toFixed(2));

  return {
    cpu: cpuModel,
    cores_logical: cpus.length,
    ram_gib: ramGiB,
    os: `${os.type()} ${os.release()}`,
    platform: os.platform(),
    arch: os.arch(),
  };
}

/**
 * Captures complete physical or simulated hardware specification for qualification.
 */
export function captureSystemEnvironment(options?: CaptureOptions): SystemEnvironment {
  const host = captureHostEnvironment();

  if (options?.simulated) {
    const gpu: GpuEnvironmentSpec = {
      model: options.mockGpu?.model || "NVIDIA GeForce RTX 4090",
      count: options.mockGpu?.count ?? 1,
      total_vram_gib: options.mockGpu?.total_vram_gib ?? 24.0,
      driver_version: options.mockGpu?.driver_version || "550.54.14 (Simulated)",
      cuda_version: options.mockGpu?.cuda_version || "12.4",
      pcie_link: options.mockGpu?.pcie_link || "Gen 4 x16",
      power_limit_w: options.mockGpu?.power_limit_w ?? 450,
      uuid: options.mockGpu?.uuid || "GPU-SIMULATED-4090-0001",
    };

    return {
      gpu,
      host,
      system_hash: computeSystemHash(gpu, host),
      is_simulated: true,
    };
  }

  const physicalGpuProbe = queryNvidiaGpus();

  if (physicalGpuProbe && physicalGpuProbe.gpus.length > 0) {
    const primary = physicalGpuProbe.gpus[0];
    const cudaVer = queryCudaVersion();
    const totalVramGiB = Number((primary.memory_total_mib / 1024).toFixed(2));
    const pcieLink = primary.pcie_gen && primary.pcie_width ? `Gen ${primary.pcie_gen} x${primary.pcie_width}` : "Gen 4 x16";

    const gpu: GpuEnvironmentSpec = {
      model: primary.name,
      count: physicalGpuProbe.gpus.length,
      total_vram_gib: totalVramGiB,
      driver_version: primary.driver_version,
      cuda_version: cudaVer,
      pcie_link: pcieLink,
      power_limit_w: primary.power_limit_w,
      uuid: primary.uuid,
    };

    return {
      gpu,
      host,
      system_hash: computeSystemHash(gpu, host),
      is_simulated: false,
    };
  }

  // Fallback when nvidia-smi is not available (e.g. CI, non-NVIDIA local dev)
  const defaultSimulatedGpu: GpuEnvironmentSpec = {
    model: options?.mockGpu?.model || "NVIDIA GeForce RTX 4090",
    count: options?.mockGpu?.count ?? 1,
    total_vram_gib: options?.mockGpu?.total_vram_gib ?? 24.0,
    driver_version: options?.mockGpu?.driver_version || "550.54.14 (Fallback/Simulated)",
    cuda_version: options?.mockGpu?.cuda_version || "12.4",
    pcie_link: options?.mockGpu?.pcie_link || "Gen 4 x16",
    power_limit_w: options?.mockGpu?.power_limit_w ?? 450,
    uuid: options?.mockGpu?.uuid || "GPU-FALLBACK-DEV-0001",
  };

  return {
    gpu: defaultSimulatedGpu,
    host,
    system_hash: computeSystemHash(defaultSimulatedGpu, host),
    is_simulated: true,
  };
}
