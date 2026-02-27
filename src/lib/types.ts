export type PrecisionType = 'fp32' | 'fp16' | 'int8' | 'int4' | 'gptq'

export type TabMode = 'inference' | 'training' | 'quantization'

  name: string
  parameters: number
  precision: PrecisionType
  contextLength: number
  contextLength: number
  flashAttention: boolean


  overhead: number
}
export interface 
  name: string
  type: string
 






