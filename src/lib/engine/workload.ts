import { PrecisionFormat, ComponentMemoryBreakdown } from './types'
import { MODEL_REGISTRY, getModelArchitecture } from './registry'
import { calculateInferenceWorkload } from './calculator'

export type ServingRuntime = 'vllm' | 'tensorrt-llm' | 'ollama' | 'tgi'

export interface SlaTarget {
  maxTtftMs: number
  maxItlMs: number
  minTokensPerSec?: number
}

export interface WorkloadSpecification {
  id: string
  name: string
  description: string
  modelId: string
  runtime: ServingRuntime
  precision: PrecisionFormat
  kvCachePrecision: PrecisionFormat
  promptTokensP50: number
  promptTokensP99: number
  generationTokensP50: number
  generationTokensP99: number
  concurrency: number // Active concurrent generating streams
  registeredUsersEstimated?: number
  sla: SlaTarget
}

export interface WorkloadMemorySizing {
  workload: WorkloadSpecification
  typicalTotalTokens: number // P50 prompt + P50 gen
  peakTotalTokens: number // P99 prompt + P99 gen
  typicalMemory: ComponentMemoryBreakdown
  peakMemory: ComponentMemoryBreakdown
  qualificationRecommendation: string
}

export const WORKLOAD_ARCHETYPES: WorkloadSpecification[] = [
  {
    id: 'enterprise-rag',
    name: 'Enterprise RAG & Document QA',
    description: 'Long enterprise document ingestion with dense search context and focused synthesis.',
    modelId: 'llama-3.1-8b',
    runtime: 'vllm',
    precision: 'FP16',
    kvCachePrecision: 'FP16',
    promptTokensP50: 3500,
    promptTokensP99: 8000,
    generationTokensP50: 400,
    generationTokensP99: 1000,
    concurrency: 8,
    registeredUsersEstimated: 250,
    sla: {
      maxTtftMs: 600,
      maxItlMs: 35,
      minTokensPerSec: 28,
    },
  },
  {
    id: 'customer-support',
    name: 'Customer Support Chatbot',
    description: 'High-concurrency conversational assistant handling simultaneous user queries with fast response times.',
    modelId: 'llama-3.2-3b',
    runtime: 'vllm',
    precision: 'FP16',
    kvCachePrecision: 'FP16',
    promptTokensP50: 600,
    promptTokensP99: 1500,
    generationTokensP50: 150,
    generationTokensP99: 300,
    concurrency: 32,
    registeredUsersEstimated: 1000,
    sla: {
      maxTtftMs: 300,
      maxItlMs: 25,
      minTokensPerSec: 40,
    },
  },
  {
    id: 'code-assistant',
    name: 'Developer Code Assistant',
    description: 'Large repository context windows with multi-file code completions and diff generations.',
    modelId: 'qwen-2.5-14b',
    runtime: 'vllm',
    precision: 'INT8',
    kvCachePrecision: 'INT8',
    promptTokensP50: 8000,
    promptTokensP99: 16000,
    generationTokensP50: 800,
    generationTokensP99: 2048,
    concurrency: 4,
    registeredUsersEstimated: 80,
    sla: {
      maxTtftMs: 800,
      maxItlMs: 30,
      minTokensPerSec: 33,
    },
  },
  {
    id: 'agentic-reasoner',
    name: 'Autonomous Agentic Reasoner',
    description: 'Deep chain-of-thought exploration, tool calling, and structured JSON planning.',
    modelId: 'llama-3.3-70b',
    runtime: 'vllm',
    precision: 'INT4',
    kvCachePrecision: 'INT8',
    promptTokensP50: 2048,
    promptTokensP99: 6000,
    generationTokensP50: 1500,
    generationTokensP99: 3000,
    concurrency: 2,
    registeredUsersEstimated: 30,
    sla: {
      maxTtftMs: 700,
      maxItlMs: 35,
      minTokensPerSec: 28,
    },
  },
]

/**
 * Calculates dual-boundary memory sizing (P50 typical operating vs P99 peak stress).
 */
export function calculateWorkloadMemory(workload: WorkloadSpecification): WorkloadMemorySizing {
  const modelArch = getModelArchitecture(workload.modelId)
  
  const typicalTotalTokens = workload.promptTokensP50 + workload.generationTokensP50
  const peakTotalTokens = workload.promptTokensP99 + workload.generationTokensP99

  // Typical operating estimation
  const typicalResult = calculateInferenceWorkload({
    model: modelArch,
    precision: workload.precision,
    contextLength: typicalTotalTokens,
    batchSize: workload.concurrency,
    kvCachePrecision: workload.kvCachePrecision,
    cudaRuntimeOverheadGiB: 0.8,
  })

  // Peak stress estimation (all streams hit P99 context simultaneously)
  const peakResult = calculateInferenceWorkload({
    model: modelArch,
    precision: workload.precision,
    contextLength: peakTotalTokens,
    batchSize: workload.concurrency,
    kvCachePrecision: workload.kvCachePrecision,
    cudaRuntimeOverheadGiB: 0.8,
  })

  let recommendation = 'Plausible memory fit. Empirical benchmark recommended before purchase approval.'
  if (peakResult.memory.totalVRAMRequiredGiB > 80) {
    recommendation = 'Workload requires multi-GPU server (e.g. 2x or 4x 80GB datacenter GPUs with tensor parallelism).'
  } else if (peakResult.memory.totalVRAMRequiredGiB > 24) {
    recommendation = 'Exceeds single 24GB consumer GPU. Workstation with 48GB (L40S / RTX 6000 Ada) or dual 24GB required.'
  }

  return {
    workload,
    typicalTotalTokens,
    peakTotalTokens,
    typicalMemory: typicalResult.memory,
    peakMemory: peakResult.memory,
    qualificationRecommendation: recommendation,
  }
}
