import { PrecisionType, MemoryBreakdown, CalculatorConfig } from './types'

const BYTES_PER_BILLION = 1_000_000_000
const GB_CONVERSION = 1_073_741_824

const PRECISION_BITS: Record<PrecisionType, number> = {
  fp32: 32,
  fp16: 16,
  int8: 8,
  int4: 4,
  gptq: 4.5,
}

export function calculateMemoryRequirements(config: CalculatorConfig): MemoryBreakdown {
  const { parameters, precision, contextLength, kvCacheQuantization, flashAttention } = config
  
  const bitsPerParam = PRECISION_BITS[precision]
  const bytesPerParam = bitsPerParam / 8
  
  const modelWeightsBytes = parameters * BYTES_PER_BILLION * bytesPerParam
  const modelWeightsGB = modelWeightsBytes / GB_CONVERSION
  
  const kvBitsPerToken = kvCacheQuantization ? 8 : 16
  const kvBytesPerToken = kvBitsPerToken / 8
  const numLayers = Math.round(parameters * 32 / 7)
  const hiddenSize = Math.round(parameters * 4096 / 7)
  const kvCacheBytes = 2 * numLayers * contextLength * hiddenSize * kvBytesPerToken
  let kvCacheGB = kvCacheBytes / GB_CONVERSION
  
  if (flashAttention) {
    kvCacheGB *= 0.7
  }
  
  const overheadGB = Math.max(0.3, modelWeightsGB * 0.02)
  
  const totalGB = modelWeightsGB + kvCacheGB + overheadGB
  
  return {
    modelWeights: parseFloat(modelWeightsGB.toFixed(1)),
    kvCache: parseFloat(kvCacheGB.toFixed(1)),
    overhead: parseFloat(overheadGB.toFixed(1)),
    total: parseFloat(totalGB.toFixed(1)),
  }
}

export function formatMemory(gb: number): string {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(1)} TB`
  }
  return `${gb.toFixed(1)} GB`
}

export function calculateUtilization(required: number, available: number): number {
  return Math.round((required / available) * 100)
}
