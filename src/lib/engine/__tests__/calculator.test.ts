import { calculateKVCacheBytes, calculateWeightBytes, calculateInferenceWorkload } from '../calculator'
import { MODEL_REGISTRY } from '../registry'
import { bytesToGiB, bytesToGB } from '../units'

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

// 4. Test Case 4: DeepSeek-V3 & DeepSeek-R1 MLA Verification
{
  const deepseek = MODEL_REGISTRY['deepseek-r1']
  assert(deepseek.attentionType === 'MLA', 'DeepSeek-R1 must use MLA attention')
  const kvBytes = calculateKVCacheBytes(deepseek, 4096, 1, 'FP16')
  // DeepSeek MLA: 61 layers * 576 latent dim * 4096 * 1 * 2 bytes = 287,834,112 bytes (~0.268 GiB)
  const kvGiB = bytesToGiB(kvBytes)
  assertCloseTo(kvGiB, 0.27, 0.02, 'DeepSeek-R1 MLA KV cache at 4k context should be ~0.27 GiB')
  console.log(`✓ Test 4 Passed: DeepSeek-R1 MLA calculation verified (${kvGiB} GiB for 4k context).`)
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

// 6. Test Case 6: Tensor Parallelism (TP=2) Sharding
{
  const singleGpu = calculateInferenceWorkload({
    model: 'llama-3.1-70b',
    precision: 'FP16',
    contextLength: 4096,
    batchSize: 4,
    tensorParallelSize: 1,
    cudaRuntimeOverheadGiB: 0.8,
  })

  const dualGpu = calculateInferenceWorkload({
    model: 'llama-3.1-70b',
    precision: 'FP16',
    contextLength: 4096,
    batchSize: 4,
    tensorParallelSize: 2,
    cudaRuntimeOverheadGiB: 0.8,
  })

  assert(dualGpu.tensorParallelSize === 2, 'Result must reflect TP=2')
  // Per-GPU required VRAM should be significantly lower than single GPU total VRAM
  assert(dualGpu.memory.perGpuVRAMRequiredGiB < singleGpu.memory.totalVRAMRequiredGiB * 0.6, 'Per GPU VRAM with TP=2 must be ~55% of single GPU')
  console.log(`✓ Test 6 Passed: Tensor Parallelism (TP=2) verified. Single: ${singleGpu.memory.totalVRAMRequiredGiB.toFixed(1)} GiB -> Per-GPU: ${dualGpu.memory.perGpuVRAMRequiredGiB.toFixed(1)} GiB.`)
}

// 7. Test Case 7: FP8 KV-Cache Precision Reduction
{
  const fp16Kv = calculateInferenceWorkload({
    model: 'llama-3.1-8b',
    precision: 'FP16',
    kvCachePrecision: 'FP16',
    contextLength: 16384,
    batchSize: 4,
  })

  const fp8Kv = calculateInferenceWorkload({
    model: 'llama-3.1-8b',
    precision: 'FP16',
    kvCachePrecision: 'FP8',
    contextLength: 16384,
    batchSize: 4,
  })

  assertCloseTo(fp8Kv.memory.kvCacheGiB, fp16Kv.memory.kvCacheGiB / 2, 0.05, 'FP8 KV Cache must be exactly half of FP16')
  console.log(`✓ Test 7 Passed: FP8 KV-Cache verified. FP16: ${fp16Kv.memory.kvCacheGiB} GiB -> FP8: ${fp8Kv.memory.kvCacheGiB} GiB.`)
}

console.log('--- All 7 Mathematical Verification Tests Passed Successfully! ---')
