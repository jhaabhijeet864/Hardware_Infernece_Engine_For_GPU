import {
  ModelArchitecture,
  PrecisionFormat,
  WorkloadEstimationInput,
  WorkloadEstimationResult,
  ComponentMemoryBreakdown,
  EstimationStatus,
} from './types'
import { bytesToGiB, bytesToGB } from './units'
import { getModelArchitecture, createFallbackArchitecture } from './registry'

export const PRECISION_BYTES: Record<PrecisionFormat, number> = {
  FP32: 4,
  FP16: 2,
  BF16: 2,
  INT8: 1,
  FP8: 1,
  INT4: 0.5,
}

/**
 * Computes model weight storage in bytes.
 * ParamCount is in billions (10^9).
 */
export function calculateWeightBytes(paramCountB: number, precision: PrecisionFormat): number {
  const bytesPerParam = PRECISION_BYTES[precision]
  return paramCountB * 1_000_000_000 * bytesPerParam
}

/**
 * Computes exact KV cache memory in bytes based on model architecture parameters:
 * M_KV = 2 * L * H_KV * D_head * T * B * s
 *
 * For MLA (Multi-Head Latent Attention in DeepSeek-V3):
 * KV is projected into a compressed latent space (latent_dim 512 + rope_dim 64 = 576 dims per layer).
 */
export function calculateKVCacheBytes(
  arch: ModelArchitecture,
  contextLength: number,
  batchSize: number = 1,
  kvPrecision: PrecisionFormat = 'FP16'
): number {
  const bytesPerElem = PRECISION_BYTES[kvPrecision]

  if (arch.attentionType === 'MLA') {
    // DeepSeek MLA latent vector dimension (512 latent + 64 rope per layer)
    const mlaDimPerLayer = 576
    return arch.numLayers * mlaDimPerLayer * contextLength * batchSize * bytesPerElem
  }

  // Standard MHA / GQA / MQA:
  // Factor of 2 accounts for Keys and Values
  return (
    2 *
    arch.numLayers *
    arch.numKeyValueHeads *
    arch.headDimension *
    contextLength *
    batchSize *
    bytesPerElem
  )
}

/**
 * Calculates inference memory requirements with explicit mathematical formulas and full breakdown.
 */
export function calculateInferenceWorkload(input: WorkloadEstimationInput): WorkloadEstimationResult {
  const batchSize = Math.max(1, input.batchSize ?? 1)
  const contextLength = Math.max(1, input.contextLength)
  const precision = input.precision
  const kvCachePrecision = input.kvCachePrecision ?? precision

  let arch: ModelArchitecture
  let isFallback = false

  if (typeof input.model === 'string') {
    try {
      arch = getModelArchitecture(input.model)
    } catch {
      // Fallback if parameter string like '7b' or unknown ID
      const numMatch = input.model.match(/(\d+(\.\d+)?)/)
      const paramB = numMatch ? parseFloat(numMatch[1]) : 7
      arch = createFallbackArchitecture(paramB, input.model)
      isFallback = true
    }
  } else {
    arch = input.model
    if (arch.family === 'custom') {
      isFallback = true
    }
  }

  const assumptions: string[] = []
  const warnings: string[] = []

  let status: EstimationStatus = 'Analytical Estimate'

  if (isFallback) {
    status = 'Analytical Estimate'
    warnings.push(
      `Uncalibrated architecture: using analytical GQA baseline (${arch.numLayers} layers, ${arch.numKeyValueHeads} KV heads, ${arch.headDimension} head dim).`
    )
  }

  // 1. Model Weights
  const weightsBytes = calculateWeightBytes(arch.paramCountTotalB, precision)
  assumptions.push(
    `Weights: ${arch.paramCountTotalB}B parameters × ${PRECISION_BYTES[precision]} bytes/param (${precision})`
  )

  // 2. KV Cache
  const kvCacheBytes = calculateKVCacheBytes(arch, contextLength, batchSize, kvCachePrecision)
  if (arch.attentionType === 'MLA') {
    assumptions.push(
      `KV Cache (MLA): ${arch.numLayers} layers × 576 latent dim × ${contextLength} tokens × batch ${batchSize} × ${PRECISION_BYTES[kvCachePrecision]} bytes`
    )
  } else {
    assumptions.push(
      `KV Cache (${arch.attentionType}): 2 × ${arch.numLayers} layers × ${arch.numKeyValueHeads} KV heads × ${arch.headDimension} head dim × ${contextLength} tokens × batch ${batchSize} × ${PRECISION_BYTES[kvCachePrecision]} bytes`
    )
  }

  // Check if context exceeds model native window
  if (contextLength > arch.contextWindowMax) {
    warnings.push(
      `Context length (${contextLength.toLocaleString()} tokens) exceeds model native context window (${arch.contextWindowMax.toLocaleString()} tokens). RoPE scaling or sequence compression required.`
    )
  }

  // 3. Activation Overhead (PagedAttention / FlashAttention inference buffer)
  // Typically 1.5% to 3% of weights + small runtime tensor buffer
  const activationOverheadBytes = Math.max(150 * 1024 * 1024, weightsBytes * 0.02)
  assumptions.push(`Activation buffer: ~2% working memory for intermediate tensor allocations`)

  // 4. CUDA Runtime & Driver Context Overhead
  // Default ~750 MiB to 1.0 GiB for PyTorch/CUDA runtime context
  const cudaContextGiB = input.cudaRuntimeOverheadGiB ?? 0.8
  const cudaContextBytes = cudaContextGiB * 1024 * 1024 * 1024
  assumptions.push(`CUDA Runtime & Driver Context: ${cudaContextGiB.toFixed(2)} GiB baseline`)

  // Total
  const totalBytes = weightsBytes + kvCacheBytes + activationOverheadBytes + cudaContextBytes

  const memory: ComponentMemoryBreakdown = {
    weightsGiB: bytesToGiB(weightsBytes),
    weightsGB: bytesToGB(weightsBytes),
    kvCacheGiB: bytesToGiB(kvCacheBytes),
    kvCacheGB: bytesToGB(kvCacheBytes),
    activationOverheadGiB: bytesToGiB(activationOverheadBytes),
    activationOverheadGB: bytesToGB(activationOverheadBytes),
    cudaContextGiB: parseFloat(cudaContextGiB.toFixed(2)),
    cudaContextGB: bytesToGB(cudaContextBytes),
    totalVRAMRequiredGiB: bytesToGiB(totalBytes),
    totalVRAMRequiredGB: bytesToGB(totalBytes),
  }

  return {
    memory,
    status,
    model: arch,
    precision,
    kvCachePrecision,
    contextLength,
    batchSize,
    assumptions,
    warnings,
    formulaSummary: {
      kvCacheFormula:
        arch.attentionType === 'MLA'
          ? 'Layers × 576 × Context × Batch × BytesPerToken'
          : '2 × Layers × KV_Heads × Head_Dim × Context × Batch × BytesPerToken',
      weightsFormula: 'Param_Count × Bytes_Per_Param',
    },
  }
}
