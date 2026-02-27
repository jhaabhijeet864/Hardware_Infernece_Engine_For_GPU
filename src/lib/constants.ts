import { ModelPreset, GPURecommendation } from './types'

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'llama3-8b',
    name: 'Llama 3',
    shortName: 'L',
    parameters: 8,
    color: 'blue',
    gradient: 'from-blue-600 to-blue-400',
  },
  {
    id: 'mistral-7b',
    name: 'Mistral',
    shortName: 'M',
    parameters: 7,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-400',
  },
  {
    id: 'gemma-7b',
    name: 'Gemma',
    shortName: 'G',
    parameters: 7,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    id: 'phi3-mini',
    name: 'Phi-3',
    shortName: 'P',
    parameters: 3.8,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
  },
]

export const GPU_DATABASE: Omit<GPURecommendation, 'utilization' | 'isOptimal' | 'isInsufficient'>[] = [
  {
    id: 'rtx-4090',
    name: 'NVIDIA RTX 4090',
    vram: 24,
    type: 'GDDR6X',
    iconType: 'consumer',
  },
  {
    id: 'rtx-4090d',
    name: 'NVIDIA RTX 4090 D',
    vram: 24,
    type: 'GDDR6X',
    iconType: 'consumer',
  },
  {
    id: 'rtx-4080',
    name: 'NVIDIA RTX 4080',
    vram: 16,
    type: 'GDDR6X',
    iconType: 'consumer',
  },
  {
    id: 'rtx-4070',
    name: 'NVIDIA RTX 4070',
    vram: 12,
    type: 'GDDR6X',
    iconType: 'consumer',
  },
  {
    id: 'rtx-3090',
    name: 'NVIDIA RTX 3090',
    vram: 24,
    type: 'GDDR6X',
    iconType: 'consumer',
  },
  {
    id: 'rtx-3080',
    name: 'NVIDIA RTX 3080',
    vram: 10,
    type: 'GDDR6X',
    iconType: 'consumer',
  },
  {
    id: 'a6000',
    name: 'NVIDIA RTX A6000',
    vram: 48,
    type: 'GDDR6',
    iconType: 'datacenter',
  },
  {
    id: 'a100-80gb',
    name: 'NVIDIA A100',
    vram: 80,
    type: 'HBM2e',
    iconType: 'datacenter',
  },
  {
    id: 'a100-40gb',
    name: 'NVIDIA A100',
    vram: 40,
    type: 'HBM2e',
    iconType: 'datacenter',
  },
  {
    id: 'h100',
    name: 'NVIDIA H100',
    vram: 80,
    type: 'HBM3',
    iconType: 'datacenter',
  },
  {
    id: 'h200',
    name: 'NVIDIA H200',
    vram: 141,
    type: 'HBM3e',
    iconType: 'datacenter',
  },
  {
    id: 'mi300x',
    name: 'AMD MI300X',
    vram: 192,
    type: 'HBM3',
    iconType: 'datacenter',
  },
  {
    id: 'l40s',
    name: 'NVIDIA L40S',
    vram: 48,
    type: 'GDDR6',
    iconType: 'datacenter',
  },
  {
    id: 'mac-m2-ultra',
    name: 'Apple M2 Ultra',
    vram: 192,
    type: 'Unified',
    iconType: 'unified',
  },
  {
    id: 'mac-m3-max',
    name: 'Apple M3 Max',
    vram: 128,
    type: 'Unified',
    iconType: 'unified',
  },
]

export const CONTEXT_LENGTH_OPTIONS = [512, 2048, 4096, 8192, 16384, 32768, 65536, 131072]

export const PRECISION_OPTIONS = [
  { value: 'fp32', label: 'FP32 (Full Precision)' },
  { value: 'fp16', label: 'FP16 (Half Precision)' },
  { value: 'int8', label: 'INT8 (Quantized)' },
  { value: 'int4', label: 'INT4 (Quantized)' },
  { value: 'gptq', label: 'GPTQ-4bit' },
]
