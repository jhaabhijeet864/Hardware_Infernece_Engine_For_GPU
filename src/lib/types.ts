export type PrecisionType = 'fp32' | 'fp16' | 'int8' | 'int4' | 'gptq'

export type TabMode = 'inference' | 'training' | 'quantization'

  parameters: number
  color: str
}
export interface Cal
  contextLength: number
  gradient: string
 

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
  isInsufficien
}

export interface GPURecommendation {

  name: string

  utilization: number


