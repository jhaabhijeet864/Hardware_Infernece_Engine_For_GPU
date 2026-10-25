import { WorkloadSpecification, WorkloadMemorySizing } from './workload'

export interface BenchmarkSpecBundle {
  schemaVersion: '1.0'
  generatedAt: string
  workload: WorkloadSpecification
  sizing: {
    typicalTotalTokens: number
    peakTotalTokens: number
    typicalVRAMRequiredGiB: number
    peakVRAMRequiredGiB: number
  }
  runnerTarget: {
    runtime: string
    cliCommand: string
    cliArgs: string[]
  }
  acceptanceCriteria: {
    maxPeakVramGiB: number
    maxTtftP95Ms: number
    maxItlP95Ms: number
    minGoodputPct: number
    maxAllowedOomErrors: number
  }
}

export function generateBenchmarkSpecBundle(sizing: WorkloadMemorySizing): BenchmarkSpecBundle {
  const { workload, typicalMemory, peakMemory } = sizing

  // Map to vLLM bench serve arguments
  const numTestPrompts = Math.max(50, workload.concurrency * 10)
  const cliArgs = [
    'bench',
    'serve',
    '--backend',
    workload.runtime === 'tensorrt-llm' ? 'tensorrtllm' : 'vllm',
    '--model',
    workload.modelId,
    '--dataset-name',
    'random',
    '--random-input-len',
    workload.promptTokensP50.toString(),
    '--random-output-len',
    workload.generationTokensP50.toString(),
    '--request-rate',
    workload.concurrency.toString(),
    '--num-prompts',
    numTestPrompts.toString(),
    '--save-result',
    '--save-detailed',
    '--result-dir',
    './qualification_artifacts',
    '--result-filename',
    `qualification-${workload.id}-${Date.now()}.json`,
  ]

  const cliCommand = `vllm ${cliArgs.join(' ')}`

  return {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    workload,
    sizing: {
      typicalTotalTokens: sizing.typicalTotalTokens,
      peakTotalTokens: sizing.peakTotalTokens,
      typicalVRAMRequiredGiB: typicalMemory.totalVRAMRequiredGiB,
      peakVRAMRequiredGiB: peakMemory.totalVRAMRequiredGiB,
    },
    runnerTarget: {
      runtime: workload.runtime,
      cliCommand,
      cliArgs,
    },
    acceptanceCriteria: {
      maxPeakVramGiB: parseFloat((peakMemory.totalVRAMRequiredGiB * 1.05).toFixed(2)),
      maxTtftP95Ms: workload.sla.maxTtftMs,
      maxItlP95Ms: workload.sla.maxItlMs,
      minGoodputPct: 95.0,
      maxAllowedOomErrors: 0,
    },
  }
}

export function downloadJsonFile(filename: string, data: object): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
