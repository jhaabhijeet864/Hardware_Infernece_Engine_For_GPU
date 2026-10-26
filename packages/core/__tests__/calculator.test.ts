import { calculateKVCacheBytes, calculateWeightBytes, calculateInferenceWorkload } from '../src/calculator'
import { MODEL_REGISTRY } from '../src/registry'
import { bytesToGiB, bytesToGB } from '../src/units'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertCloseTo(actual: number, expected: number, tolerance: number = 0.05, message: string = '') {
  const diff = Math.abs(actual - expected)
  if (diff > tolerance) {
    throw new Error(`Assertion failed: ${message} (expected ~${expected}, got ${actual}, diff: ${diff.toFixed(4)})`)
  }
}

console.log('--- Starting Engine Mathematical Verification Tests ---')

// 1. Test Case 1: Llama 3.1 8B Exact KV Cache Math
{
  const llama8b = MODEL_REGISTRY['llama-3.1-8b']
  // Architecture: 32 layers, 8 KV heads, 128 head dim
  // At 8192 context length, FP16 (2 bytes), batch size 1:
  // 2 * 32 * 8 * 128 * 8192 * 1 * 2 = 1,073,741,824 bytes = exactly 1.00 GiB
  const kvBytes = calculateKVCacheBytes(llama8b, 8192, 1, 'FP16')
  const kvGiB = bytesToGiB(kvBytes)
  const kvGB = bytesToGB(kvBytes)
  
  assert(kvBytes === 1073741824, `Llama 3.1 8B 8k context should be exactly 1,073,741,824 bytes, got ${kvBytes}`)
  assert(kvGiB === 1.0, `Llama 3.1 8B 8k context should be 1.00 GiB, got ${kvGiB}`)
  assertCloseTo(kvGB, 1.07, 0.01, 'Llama 3.1 8B 8k context should be ~1.07 decimal GB')
  console.log('✓ Test 1 Passed: Llama 3.1 8B KV-Cache matches exact 1.00 GiB formula at 8k context.')
}

// 2. Test Case 2: GQA vs MHA Compression
{
  const llama8b = MODEL_REGISTRY['llama-3.1-8b']
  const gqaBytes = calculateKVCacheBytes(llama8b, 4096, 1, 'FP16')
  // Simulated MHA with 32 KV heads (4x more KV heads than GQA)
  const mhaArch = { ...llama8b, numKeyValueHeads: 32 }
  const mhaBytes = calculateKVCacheBytes(mhaArch, 4096, 1, 'FP16')
  
  assert(mhaBytes === gqaBytes * 4, 'MHA (32 KV heads) must produce exactly 4x the KV cache of GQA (8 KV heads)')
  console.log('✓ Test 2 Passed: GQA produces verified 4x KV memory reduction compared to MHA.')
}

// 3. Test Case 3: Weights Precision Scaling
{
  const llama8b = MODEL_REGISTRY['llama-3.1-8b']
  const fp16WeightBytes = calculateWeightBytes(llama8b.paramCountTotalB, 'FP16')
  const int8WeightBytes = calculateWeightBytes(llama8b.paramCountTotalB, 'INT8')
  const int4WeightBytes = calculateWeightBytes(llama8b.paramCountTotalB, 'INT4')
  
  assert(fp16WeightBytes === 8.03 * 1e9 * 2, 'FP16 weights must be exactly 16.06 GB')
  assert(int8WeightBytes === fp16WeightBytes / 2, 'INT8 weights must be exactly half of FP16')
  assert(int4WeightBytes === fp16WeightBytes / 4, 'INT4 weights must be exactly one-fourth of FP16')
  
  const fp16GiB = bytesToGiB(fp16WeightBytes)
  assertCloseTo(fp16GiB, 14.96, 0.05, 'Llama 3.1 8B FP16 weights should be ~14.96 GiB')
  console.log(`✓ Test 3 Passed: Weights scale accurately across precisions (FP16: ${fp16GiB} GiB).`)
}

// 4. Test Case 4: DeepSeek-V3 MLA Verification
{
  const deepseek = MODEL_REGISTRY['deepseek-v3']
  const kvBytes = calculateKVCacheBytes(deepseek, 4096, 1, 'FP16')
  // DeepSeek MLA: 61 layers * 576 latent dim * 4096 * 1 * 2 bytes = 287,834,112 bytes (~0.268 GiB)
  const kvGiB = bytesToGiB(kvBytes)
  assertCloseTo(kvGiB, 0.27, 0.02, 'DeepSeek-V3 MLA KV cache at 4k context should be ~0.27 GiB')
  console.log(`✓ Test 4 Passed: DeepSeek-V3 MLA calculation verified (${kvGiB} GiB for 4k context).`)
}

// 5. Test Case 5: Full Workload Inference Calculation
{
  const result = calculateInferenceWorkload({
    model: 'llama-3.1-8b',
    precision: 'FP16',
    contextLength: 8192,
    batchSize: 1,
    cudaRuntimeOverheadGiB: 0.8,
  })
  
  assert(result.status === 'Analytical Estimate', 'Status must be Analytical Estimate')
  assertCloseTo(result.memory.weightsGiB, 14.96, 0.05, 'Weights GiB')
  assert(result.memory.kvCacheGiB === 1.0, 'KV Cache GiB')
  assert(result.memory.cudaContextGiB === 0.8, 'CUDA Context GiB')
  assert(result.memory.totalVRAMRequiredGiB > 16.8 && result.memory.totalVRAMRequiredGiB < 17.5, 'Total VRAM range')
  console.log(`✓ Test 5 Passed: Full workload estimation passed. Total VRAM: ${result.memory.totalVRAMRequiredGiB} GiB.`)
}

console.log('--- All 5 Mathematical Verification Tests Passed Successfully! ---')
