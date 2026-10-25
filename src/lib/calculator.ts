import { PrecisionType, MemoryBreakdown, CalculatorConfig } from './types'
import {
  calculateInferenceWorkload,
  PrecisionFormat,
  WorkloadEstimationResult,
} from './engine'
import { MODEL_REGISTRY, createFallbackArchitecture } from './engine/registry'

// Map legacy UI precision keys to standard engine PrecisionFormat
export const PRECISION_MAP: Record<PrecisionType, PrecisionFormat> = {
  fp32: 'FP32',
  fp16: 'FP16',
  int8: 'INT8',
  int4: 'INT4',
  gptq: 'INT4',
}

// Preset ID mapping to exact registry IDs
const PRESET_ID_MAP: Record<string, string> = {
  'llama3-8b': 'llama-3.1-8b',
  'llama3-70b': 'llama-3.1-70b',
  'mistral-7b': 'mistral-7b',
  'gemma-7b': 'gemma-2-9b',
  'phi3-mini': 'phi-3-mini',
}

export interface EnhancedMemoryBreakdown extends MemoryBreakdown {
  status: string
  assumptions: string[]
  warnings: string[]
  weightsGiB: number
  kvCacheGiB: number
  overheadGiB: number
  totalGiB: number
  architectureName?: string
  kvFormula?: string
}

export function calculateDetailedMemoryRequirements(
  config: CalculatorConfig,
  presetId?: string
): WorkloadEstimationResult {
  const precisionFormat: PrecisionFormat = PRECISION_MAP[config.precision] || 'FP16'
  const kvPrecision: PrecisionFormat = config.kvCacheQuantization ? 'INT8' : precisionFormat

  let modelArch = presetId && PRESET_ID_MAP[presetId] 
    ? MODEL_REGISTRY[PRESET_ID_MAP[presetId]] 
    : undefined

  if (!modelArch) {
    // Check if parameters match known presets
    const match = Object.values(MODEL_REGISTRY).find(
      m => Math.abs(m.paramCountTotalB - config.parameters) < 0.5
    )
    modelArch = match || createFallbackArchitecture(config.parameters)
  }

  return calculateInferenceWorkload({
    model: modelArch,
    precision: precisionFormat,
    contextLength: config.contextLength,
    batchSize: 1,
    kvCachePrecision: kvPrecision,
    cudaRuntimeOverheadGiB: 0.8,
  })
}

export function calculateMemoryRequirements(config: CalculatorConfig, presetId?: string): EnhancedMemoryBreakdown {
  const result = calculateDetailedMemoryRequirements(config, presetId)
  const mem = result.memory

  const overhead = parseFloat((mem.activationOverheadGiB + mem.cudaContextGiB).toFixed(2))

  return {
    modelWeights: mem.weightsGiB,
    kvCache: mem.kvCacheGiB,
    overhead: overhead,
    total: mem.totalVRAMRequiredGiB,
    // Enhanced fields with unambiguous GiB units and provenance
    status: result.status,
    assumptions: result.assumptions,
    warnings: result.warnings,
    weightsGiB: mem.weightsGiB,
    kvCacheGiB: mem.kvCacheGiB,
    overheadGiB: overhead,
    totalGiB: mem.totalVRAMRequiredGiB,
    architectureName: result.model.name,
    kvFormula: result.formulaSummary.kvCacheFormula,
  }
}

export function formatMemory(gib: number): string {
  if (gib >= 1000) {
    return `${(gib / 1024).toFixed(1)} TiB`
  }
  return `${gib.toFixed(1)} GiB`
}

/**
 * Calculates percentage of physical VRAM occupied by the required workload.
 * (Replaces ambiguous "GPU Utilization" label)
 */
export function calculateMemoryOccupancy(requiredGiB: number, availableVRAMGiB: number): number {
  if (availableVRAMGiB <= 0) return 0
  return Math.round((requiredGiB / availableVRAMGiB) * 100)
}

/**
 * Backwards compatibility alias for calculateMemoryOccupancy
 */
export const calculateUtilization = calculateMemoryOccupancy
