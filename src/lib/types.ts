export type PrecisionType = 'fp32' | 'fp16' | 'int8' | 'int4' | 'gptq'

export type TabMode = 'inference' | 'training' | 'quantization'

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
  iconType: 'consumer' | 'datacenter' | 'unified'
  utilization: number
  isOptimal: boolean
  isInsufficient: boolean
}


