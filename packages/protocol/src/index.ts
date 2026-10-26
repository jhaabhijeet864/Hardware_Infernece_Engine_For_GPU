import { z } from 'zod';

export const GpuMetricSchema = z.object({
  index: z.number().int().nonnegative(),
  name: z.string(),
  vramTotalBytes: z.number().nonnegative(),
  vramUsedBytes: z.number().nonnegative(),
  vramFreeBytes: z.number().nonnegative(),
  temperatureC: z.number().nullable().optional(),
  powerDrawWatts: z.number().nullable().optional(),
  powerLimitWatts: z.number().nullable().optional(),
  utilizationGpuPct: z.number().min(0).max(100).nullable().optional(),
  fanSpeedPct: z.number().min(0).max(100).nullable().optional(),
  sensorBackend: z.enum(['NVML', 'DXGI', 'Metal', 'Simulated']),
  isDegraded: z.boolean().default(false),
});

export const HostSystemMetricSchema = z.object({
  os: z.enum(['windows', 'macos', 'linux']),
  ramTotalBytes: z.number().nonnegative(),
  ramUsedBytes: z.number().nonnegative(),
  cpuUtilizationPct: z.number().min(0).max(100),
});

export const ActiveInferenceJobSchema = z.object({
  modelId: z.string(),
  runtime: z.enum(['vllm', 'tensorrt-llm', 'ollama', 'tgi', 'simulated']),
  tokensPerSecond: z.number().optional(),
  activeStreams: z.number().int().nonnegative(),
  kvCacheOccupancyPct: z.number().min(0).max(100),
});

export const GpuTelemetryFrameSchema = z.object({
  rigId: z.string().uuid(),
  timestamp: z.number().int().positive(),
  gpus: z.array(GpuMetricSchema),
  hostSystem: HostSystemMetricSchema,
  activeInferenceJob: ActiveInferenceJobSchema.nullable().optional(),
});

export type GpuMetric = z.infer<typeof GpuMetricSchema>;
export type HostSystemMetric = z.infer<typeof HostSystemMetricSchema>;
export type ActiveInferenceJob = z.infer<typeof ActiveInferenceJobSchema>;
export type GpuTelemetryFrame = z.infer<typeof GpuTelemetryFrameSchema>;

// Rig Pairing Handshake Protocol
export const RigPairingRequestSchema = z.object({
  pairingCode: z.string().length(6), // 6-digit PIN
  clientPublicKey: z.string().min(32),
  clientDeviceName: z.string(),
});

export const RigPairingResponseSchema = z.object({
  success: z.boolean(),
  rigId: z.string().uuid(),
  rigName: z.string(),
  rigPublicKey: z.string(),
  sessionToken: z.string(),
  expiresAt: z.number(),
});

export type RigPairingRequest = z.infer<typeof RigPairingRequestSchema>;
export type RigPairingResponse = z.infer<typeof RigPairingResponseSchema>;

// Emergency Kill Switch Protocol
export const EmergencyHaltCommandSchema = z.object({
  rigId: z.string().uuid(),
  commandId: z.string().uuid(),
  timestamp: z.number().int().positive(),
  issuedByUserId: z.string(),
  reason: z.string().default('Operator manual emergency halt'),
  purgeVram: z.boolean().default(true),
  signature: z.string(), // HMAC-SHA256 signature
});

export type EmergencyHaltCommand = z.infer<typeof EmergencyHaltCommandSchema>;

// Fleet & Rig Presence
export type RigStatus = 'IDLE' | 'BENCHMARKING' | 'THROTTLED' | 'OFFLINE';

export const RigRegistrationRequestSchema = z.object({
  hardwareUuid: z.string().min(1),
  systemHash: z.string().min(1),
  name: z.string().min(1),
  gpuModel: z.string().min(1),
  gpuCount: z.number().int().positive().default(1),
  vramTotalBytes: z.number().positive(),
  driverVersion: z.string().default('Unknown'),
  cudaVersion: z.string().default('Unknown'),
  pcieLink: z.string().default('Gen 4 x16'),
  hostCpu: z.string().default('Unknown CPU'),
  hostRamBytes: z.number().positive().default(34359738368),
  partnerOrg: z.string().default('Shenzhen Precision AI Hardware Co.'),
});
export type RigRegistrationRequest = z.infer<typeof RigRegistrationRequestSchema>;

export const RigSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  hardwareUuid: z.string(),
  systemHash: z.string(),
  gpuModel: z.string(),
  gpuCount: z.number().int(),
  vramTotalBytes: z.number(),
  vramTotalGiB: z.number(),
  status: z.enum(['IDLE', 'BENCHMARKING', 'THROTTLED', 'OFFLINE']),
  isOnline: z.boolean(),
  lastHeartbeatAt: z.number(),
  currentJobId: z.string().nullable().optional(),
  partnerOrg: z.string(),
});
export type RigSummary = z.infer<typeof RigSummarySchema>;

// Qualification Job Dispatch & Progress
export const QualificationJobDispatchSchema = z.object({
  jobId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  targetRigId: z.string().uuid(),
  workloadArchetype: z.string().default('enterprise-rag'),
  modelId: z.string().default('meta-llama/Llama-3.1-8B-Instruct'),
  precision: z.string().default('FP16'),
  promptTokens: z.number().int().positive().default(4096),
  genTokens: z.number().int().positive().default(512),
  concurrency: z.number().int().positive().default(8),
  sla: z.object({
    maxTtftMs: z.number().positive().default(500),
    maxItlMs: z.number().positive().default(35),
  }),
  timeoutSeconds: z.number().int().positive().default(600),
});
export type QualificationJobDispatch = z.infer<typeof QualificationJobDispatchSchema>;

export const JobProgressEventSchema = z.object({
  jobId: z.string().uuid(),
  rigId: z.string().uuid(),
  status: z.enum(['INITIALIZING', 'WARMUP', 'BENCHMARKING', 'COMPLETED', 'FAILED', 'ABORTED']),
  progressPct: z.number().min(0).max(100),
  currentTtftMs: z.number().optional(),
  currentItlMs: z.number().optional(),
  currentVramGiB: z.number().optional(),
  logMessage: z.string().optional(),
  timestamp: z.number().int().positive(),
});
export type JobProgressEvent = z.infer<typeof JobProgressEventSchema>;

// Cryptographic Verification Helpers
export function isCommandTimestampValid(timestamp: number, maxSkewMs: number = 5000): boolean {
  return Math.abs(Date.now() - timestamp) <= maxSkewMs;
}
