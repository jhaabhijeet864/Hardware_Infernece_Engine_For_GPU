export type PrecisionType = 'fp32' | 'fp16' | 'int8' | 'int4' | 'gptq'

export interface ModelPreset {
  id: string
  name: string
  shortName: string
  parameters: number
  color: string
  gradient: string
}

export interface CalculatorConfig {
  parameters: number
  precision: PrecisionType
  contextLength: number
  kvCacheQuantization: boolean
  flashAttention: boolean
}

export interface MemoryBreakdown {
  modelWeights: number
  kvCache: number
  overhead: number
  total: number
}

export interface GPURecommendation {
  id: string
  name: string
  vram: number
  type: string
  utilization: number
  isOptimal: boolean
  isInsufficient: boolean
  iconType: 'consumer' | 'datacenter'
}

export type TabMode = 'inference' | 'training' | 'quantization'
