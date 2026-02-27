export type PrecisionType = 'fp32' | 'fp16' | 'int8' | 'int4' | 'gptq'

export interface ModelPreset {
  id: string
  gradient: st

  parameters: number
  contextLength
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
  isInsufficient: 
  total: number


export interface GPURecommendation {
  id: string

  vram: number

  utilization: number






