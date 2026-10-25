import { WORKLOAD_ARCHETYPES, calculateWorkloadMemory } from '../workload'
import { generateBenchmarkSpecBundle } from '../exporter'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

console.log('--- Starting Workload Specification Verification Tests ---')

// Test 1: Enterprise RAG Archetype
{
  const rag = WORKLOAD_ARCHETYPES.find(w => w.id === 'enterprise-rag')!
  assert(!!rag, 'Enterprise RAG archetype must exist')
  
  const sizing = calculateWorkloadMemory(rag)
  assert(sizing.typicalTotalTokens === 3900, 'Typical total tokens = 3500 + 400 = 3900')
  assert(sizing.peakTotalTokens === 9000, 'Peak total tokens = 8000 + 1000 = 9000')
  assert(sizing.peakMemory.totalVRAMRequiredGiB > sizing.typicalMemory.totalVRAMRequiredGiB, 'Peak stress VRAM > typical VRAM')
  assert(sizing.typicalMemory.weightsGiB > 14.5 && sizing.typicalMemory.weightsGiB < 15.5, 'Llama 3.1 8B FP16 weights ~14.96 GiB')
  
  console.log(`✓ Test 1 Passed: Enterprise RAG sized at ${sizing.typicalMemory.totalVRAMRequiredGiB} GiB typical, ${sizing.peakMemory.totalVRAMRequiredGiB} GiB peak.`)
}

// Test 2: Concurrency Linear Scaling
{
  const baseWorkload = { ...WORKLOAD_ARCHETYPES[0] }
  const sizing4 = calculateWorkloadMemory({ ...baseWorkload, concurrency: 4 })
  const sizing8 = calculateWorkloadMemory({ ...baseWorkload, concurrency: 8 })

  // KV cache must double when concurrency doubles from 4 to 8
  const kv4 = sizing4.typicalMemory.kvCacheGiB
  const kv8 = sizing8.typicalMemory.kvCacheGiB
  assert(Math.abs(kv8 - kv4 * 2) < 0.05, `KV cache must scale 2x from 4 to 8 concurrency (got ${kv4} vs ${kv8})`)

  // Weights must remain identical regardless of concurrency
  assert(sizing4.typicalMemory.weightsGiB === sizing8.typicalMemory.weightsGiB, 'Weights must remain unchanged under concurrency')
  console.log('✓ Test 2 Passed: Concurrency scales KV cache linearly while keeping weights constant.')
}

// Test 3: Benchmark Bundle Exporter
{
  const rag = WORKLOAD_ARCHETYPES[0]
  const sizing = calculateWorkloadMemory(rag)
  const bundle = generateBenchmarkSpecBundle(sizing)

  assert(bundle.schemaVersion === '1.0', 'Bundle schemaVersion must be 1.0')
  assert(bundle.runnerTarget.runtime === 'vllm', 'Target runtime must be vllm')
  assert(bundle.runnerTarget.cliCommand.includes('vllm bench serve'), 'CLI command must invoke vllm bench serve')
  assert(bundle.acceptanceCriteria.maxAllowedOomErrors === 0, 'Zero OOM errors required for acceptance')
  console.log('✓ Test 3 Passed: Benchmark bundle generated with valid CLI invocation syntax.')
}

console.log('--- All Workload Specification Tests Passed! ---')
