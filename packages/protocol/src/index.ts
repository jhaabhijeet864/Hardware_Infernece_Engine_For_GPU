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

// Cryptographic Verification Helpers
export function isCommandTimestampValid(timestamp: number, maxSkewMs: number = 5000): boolean {
  return Math.abs(Date.now() - timestamp) <= maxSkewMs;
}
