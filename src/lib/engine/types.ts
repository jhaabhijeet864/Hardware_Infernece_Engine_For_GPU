export type AttentionMechanism = 'MHA' | 'GQA' | 'MQA' | 'MLA'

export type PrecisionFormat = 'FP32' | 'FP16' | 'BF16' | 'INT8' | 'INT4' | 'FP8'

export type EstimationStatus = 
  | 'Analytical Estimate' 
  | 'Calibrated Estimate' 
  | 'Measured Result' 
  | 'Unsupported'

export type MemoryFitVerdict = 
  | 'Comfortable Fit' 
  | 'Tight Fit' 
  | 'High Risk of OOM' 
  | 'Insufficient VRAM (OOM)'

export interface ModelArchitecture {
  id: string
  name: string
  family: 'llama' | 'mistral' | 'gemma' | 'qwen' | 'deepseek' | 'phi' | 'custom'
  paramCountTotalB: number
  paramCountActiveB?: number // For MoE models
  numLayers: number // L
  numAttentionHeads: number // H_Q
  numKeyValueHeads: number // H_KV
  headDimension: number // D_head
  vocabSize: number
  contextWindowMax: number
  attentionType: AttentionMechanism
  description: string
  sourceConfigUrl?: string
}

export interface WorkloadEstimationInput {
  model: ModelArchitecture | string // ModelArchitecture or model ID from registry
  precision: PrecisionFormat
  contextLength: number
  batchSize?: number // Concurrency (concurrent active streams), default 1
  kvCachePrecision?: PrecisionFormat
  cudaRuntimeOverheadGiB?: number
  tensorParallelSize?: number // Number of GPUs in Tensor Parallel shard (e.g. 1, 2, 4, 8)
}

export interface ComponentMemoryBreakdown {
  weightsGiB: number
  weightsGB: number
  kvCacheGiB: number
  kvCacheGB: number
  activationOverheadGiB: number
  activationOverheadGB: number
  cudaContextGiB: number
  cudaContextGB: number
  totalVRAMRequiredGiB: number
  totalVRAMRequiredGB: number
  tensorParallelSize: number
  perGpuVRAMRequiredGiB: number
  perGpuVRAMRequiredGB: number
}

export interface WorkloadEstimationResult {
  memory: ComponentMemoryBreakdown
  status: EstimationStatus
  model: ModelArchitecture
  precision: PrecisionFormat
  kvCachePrecision: PrecisionFormat
  contextLength: number
  batchSize: number
  tensorParallelSize: number
  assumptions: string[]
  warnings: string[]
  formulaSummary: {
    kvCacheFormula: string
    weightsFormula: string
  }
}
