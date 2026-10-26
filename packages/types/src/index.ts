// Domain types for the Hardware-Inference ecosystem

export type AttentionMechanism = 'MHA' | 'GQA' | 'MQA' | 'MLA';

export type PrecisionFormat = 'FP32' | 'FP16' | 'BF16' | 'INT8' | 'INT4' | 'FP8';

export type EstimationStatus = 
  | 'Analytical Estimate' 
  | 'Calibrated Estimate' 
  | 'Measured Result' 
  | 'Unsupported';

export type MemoryFitVerdict = 
  | 'Comfortable Fit' 
  | 'Tight Fit' 
  | 'High Risk of OOM' 
  | 'Insufficient VRAM (OOM)';

export type ModelFamily = 
  | 'llama' 
  | 'mistral' 
  | 'gemma' 
  | 'qwen' 
  | 'deepseek' 
  | 'phi' 
  | 'custom';

export interface ModelArchitecture {
  id: string;
  name: string;
  family: ModelFamily;
  paramCountTotalB: number;
  paramCountActiveB?: number;
  numLayers: number;
  numAttentionHeads: number;
  numKeyValueHeads: number;
  headDimension: number;
  vocabSize: number;
  contextWindowMax: number;
  attentionType: AttentionMechanism;
  description: string;
  sourceConfigUrl?: string;
}

export interface ComponentMemoryBreakdown {
  weightsGiB: number;
  weightsGB: number;
  kvCacheGiB: number;
  kvCacheGB: number;
  activationOverheadGiB: number;
  activationOverheadGB: number;
  cudaContextGiB: number;
  cudaContextGB: number;
  totalVRAMRequiredGiB: number;
  totalVRAMRequiredGB: number;
}

export interface WorkloadEstimationInput {
  model: ModelArchitecture | string;
  precision: PrecisionFormat;
  contextLength: number;
  batchSize?: number;
  kvCachePrecision?: PrecisionFormat;
  cudaRuntimeOverheadGiB?: number;
}

export interface WorkloadEstimationResult {
  memory: ComponentMemoryBreakdown;
  status: EstimationStatus;
  model: ModelArchitecture;
  precision: PrecisionFormat;
  architectureDetails: {
    kvCachePerTokenBytes: number;
    gqaFactor: number;
    mlaLatentBytes?: number;
  };
}

export type ServingRuntime = 'vllm' | 'tensorrt-llm' | 'ollama' | 'tgi';

export interface SlaTarget {
  maxTtftMs: number;
  maxItlMs: number;
  minTokensPerSec?: number;
}

export interface WorkloadSpecification {
  id: string;
  name: string;
  description: string;
  modelId: string;
  runtime: ServingRuntime;
  precision: PrecisionFormat;
  kvCachePrecision: PrecisionFormat;
  promptTokensP50: number;
  promptTokensP99: number;
  generationTokensP50: number;
  generationTokensP99: number;
  concurrency: number;
  registeredUsersEstimated?: number;
  sla: SlaTarget;
}

export interface WorkloadMemorySizing {
  workload: WorkloadSpecification;
  typicalTotalTokens: number;
  peakTotalTokens: number;
  typicalMemory: ComponentMemoryBreakdown;
  peakMemory: ComponentMemoryBreakdown;
  qualificationRecommendation: string;
}

export interface GPUHardwareProfile {
  id: string;
  name: string;
  vendor: 'NVIDIA' | 'AMD' | 'Apple' | 'Intel';
  vramGiB: number;
  memoryBandwidthGBs: number;
  memoryType: 'GDDR6' | 'GDDR6X' | 'GDDR7' | 'HBM2e' | 'HBM3' | 'HBM3e' | 'Unified';
  tdpWatts: number;
  recommendedServingEngines: ServingRuntime[];
}

export interface MemoryOccupancyResult {
  occupancyPct: number;
  headroomGiB: number;
  verdict: MemoryFitVerdict;
  isComfortable: boolean;
  isTight: boolean;
  isInsufficient: boolean;
}

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

export interface TelemetrySummary {
  idle_vram_gib: number;
  peak_vram_used_gib: number;
  peak_gpu_utilization_pct: number;
  peak_temperature_c: number;
  average_power_w: number;
  samples_count: number;
  duration_ms: number;
  is_simulated: boolean;
}

export interface LatencyDistribution {
  median: number;
  p90: number;
  p95: number;
  p99: number;
  mean?: number;
}

export interface ThroughputMetrics {
  requests_per_sec: number;
  generation_tokens_per_sec: number;
  total_tokens_per_sec: number;
}

export interface ReliabilityMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  oom_events: number;
}

export interface ParsedBenchmarkResults {
  latencies: {
    ttft_ms: LatencyDistribution;
    itl_ms: LatencyDistribution;
    e2e_request_ms?: LatencyDistribution;
  };
  throughput: ThroughputMetrics;
  reliability: ReliabilityMetrics;
  goodput_pct: number;
  duration_s: number;
  benchmark_tool: string;
}

export interface QualificationCheck {
  criterion: string;
  actual: string;
  passed: boolean;
}

export interface QualificationVerdict {
  overall: 'PASSED' | 'FAILED';
  checks: QualificationCheck[];
  recommendation: string;
}

export interface QualificationRunBundle {
  $schema: string;
  metadata: {
    run_id: string;
    timestamp: string;
    qualification_profile: string;
    system_hash: string;
  };
  environment: {
    gpu: GpuEnvironmentSpec;
    host: HostEnvironmentSpec;
    runtime: {
      engine: string;
      version: string;
      kv_cache_dtype: string;
      enforce_eager: boolean;
    };
    is_simulated: boolean;
  };
  workload_spec: WorkloadSpecification;
  analytical_estimate: {
    typical_vram_gib: number;
    peak_vram_gib: number;
    weights_gib: number;
    typical_kv_cache_gib: number;
    peak_kv_cache_gib: number;
    cuda_overhead_gib: number;
    status: string;
    plausibility: string;
  };
  measured_results: {
    telemetry: TelemetrySummary;
    latencies: ParsedBenchmarkResults['latencies'];
    throughput: ParsedBenchmarkResults['throughput'];
    reliability: ParsedBenchmarkResults['reliability'];
    goodput_pct: number;
  };
  qualification_verdict: QualificationVerdict;
}
