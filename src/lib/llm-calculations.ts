export interface ModelPreset {
  name: string
  parameters: number
  description: string
}

export interface GPUOption {
  name: string
  vram: number
  tier: string
}

export interface InferenceParams {
  parameters: number
  precision: string
  contextLength: number
}

export interface TrainingParams {
  parameters: number
  precision: string
  batchSize: number
  gradientAccumulation: number
  optimizer: string
  method: string
}

export interface MemoryBreakdown {
  modelWeights: number
  kvCache?: number
  overhead: number
  gradients?: number
  optimizerStates?: number
  activations?: number
  total: number
}

export const MODEL_PRESETS: ModelPreset[] = [
  { name: "Llama 3.3 70B", parameters: 70, description: "Meta's flagship model" },
  { name: "Llama 3.2 3B", parameters: 3, description: "Efficient small model" },
  { name: "Llama 3.1 8B", parameters: 8, description: "Balanced performance" },
  { name: "Mistral 7B", parameters: 7, description: "High quality 7B model" },
  { name: "Mixtral 8x7B", parameters: 47, description: "MoE architecture" },
  { name: "Gemma 2 9B", parameters: 9, description: "Google's open model" },
  { name: "Gemma 2 27B", parameters: 27, description: "Larger Gemma variant" },
  { name: "Phi-4 14B", parameters: 14, description: "Microsoft's reasoning model" },
  { name: "Qwen 2.5 7B", parameters: 7, description: "Alibaba's model" },
  { name: "DeepSeek-V3", parameters: 685, description: "Massive MoE model" },
]

export const GPU_OPTIONS: GPUOption[] = [
  { name: "RTX 4090", vram: 24, tier: "Consumer High-End" },
  { name: "RTX 4080", vram: 16, tier: "Consumer High-End" },
  { name: "RTX 4070 Ti", vram: 12, tier: "Consumer Mid-Range" },
  { name: "RTX 3090", vram: 24, tier: "Consumer Previous Gen" },
  { name: "A100 40GB", vram: 40, tier: "Data Center" },
  { name: "A100 80GB", vram: 80, tier: "Data Center" },
  { name: "H100 80GB", vram: 80, tier: "Data Center Premium" },
  { name: "L40S", vram: 48, tier: "Data Center" },
  { name: "A6000", vram: 48, tier: "Workstation" },
  { name: "Mac M3 Max", vram: 128, tier: "Unified Memory" },
]

export const PRECISION_OPTIONS = [
  { value: "fp32", label: "FP32 (32-bit)", bytesPerParam: 4 },
  { value: "fp16", label: "FP16 (16-bit)", bytesPerParam: 2 },
  { value: "int8", label: "INT8 (8-bit)", bytesPerParam: 1 },
  { value: "int4", label: "INT4 (4-bit)", bytesPerParam: 0.5 },
]

export const OPTIMIZER_OPTIONS = [
  { value: "adam", label: "Adam", stateMultiplier: 2 },
  { value: "adamw", label: "AdamW", stateMultiplier: 2 },
  { value: "sgd", label: "SGD", stateMultiplier: 0 },
  { value: "sgd_momentum", label: "SGD + Momentum", stateMultiplier: 1 },
]

export const TRAINING_METHODS = [
  { value: "full", label: "Full Fine-Tune", description: "Train all parameters" },
  { value: "lora", label: "LoRA", description: "Low-Rank Adaptation" },
  { value: "qlora", label: "QLoRA", description: "Quantized LoRA" },
]

export function calculateInferenceMemory(params: InferenceParams): MemoryBreakdown {
  const precision = PRECISION_OPTIONS.find(p => p.value === params.precision)
  if (!precision) throw new Error("Invalid precision")

  const modelWeights = params.parameters * precision.bytesPerParam
  
  const kvCache = (params.contextLength * params.parameters * 0.00002 * 2) * 
                  (precision.bytesPerParam / 4)
  
  const overhead = modelWeights * 0.1

  const total = modelWeights + kvCache + overhead

  return {
    modelWeights,
    kvCache,
    overhead,
    total,
  }
}

export function calculateTrainingMemory(params: TrainingParams): MemoryBreakdown {
  const precision = PRECISION_OPTIONS.find(p => p.value === params.precision)
  const optimizer = OPTIMIZER_OPTIONS.find(o => o.value === params.optimizer)
  
  if (!precision || !optimizer) throw new Error("Invalid parameters")

  let modelWeights = params.parameters * precision.bytesPerParam
  let gradients = params.parameters * precision.bytesPerParam
  let optimizerStates = params.parameters * optimizer.stateMultiplier * 4
  let activations = params.batchSize * params.parameters * 0.0001 * 4
  
  if (params.method === "lora") {
    const loraParams = params.parameters * 0.01
    gradients = loraParams * precision.bytesPerParam
    optimizerStates = loraParams * optimizer.stateMultiplier * 4
    activations = activations * 0.5
  } else if (params.method === "qlora") {
    modelWeights = params.parameters * 0.5
    const loraParams = params.parameters * 0.01
    gradients = loraParams * precision.bytesPerParam
    optimizerStates = loraParams * optimizer.stateMultiplier * 4
    activations = activations * 0.3
  }

  const overhead = modelWeights * 0.15

  const total = modelWeights + gradients + optimizerStates + activations + overhead

  return {
    modelWeights,
    gradients,
    optimizerStates,
    activations,
    overhead,
    total,
  }
}

export function formatMemory(gb: number): string {
  if (gb < 1) return `${Math.round(gb * 1024)} MB`
  return `${gb.toFixed(2)} GB`
}

export function getRecommendedGPUs(requiredMemory: number): GPUOption[] {
  return GPU_OPTIONS
    .filter(gpu => gpu.vram >= requiredMemory)
    .sort((a, b) => a.vram - b.vram)
    .slice(0, 5)
}
