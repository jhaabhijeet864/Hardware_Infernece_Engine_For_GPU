import type { InferenceParams, TrainingParams, MemoryBreakdown } from "./llm-calculations"
import { formatMemory, getRecommendedGPUs } from "./llm-calculations"

export interface ExportData {
  calculatorType: "inference" | "training" | "quantization"
  timestamp: string
  params: InferenceParams | TrainingParams | { modelSize: number }
  results: MemoryBreakdown | QuantizationResults
}

export interface QuantizationResults {
  modelSize: number
  comparisons: Array<{
    precision: string
    label: string
    memory: number
    qualityRetention: number
    speedup: number
  }>
}

export function generateShareableLink(data: ExportData): string {
  const encoded = btoa(JSON.stringify(data))
  const url = new URL(window.location.href)
  url.searchParams.set("shared", encoded)
  return url.toString()
}

export function parseSharedLink(): ExportData | null {
  const url = new URL(window.location.href)
  const shared = url.searchParams.get("shared")
  
  if (!shared) return null
  
  try {
    const decoded = atob(shared)
    return JSON.parse(decoded) as ExportData
  } catch {
    return null
  }
}

export async function generatePDF(data: ExportData): Promise<void> {
  const content = generatePDFContent(data)
  
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    throw new Error("Unable to open print window. Please allow popups.")
  }
  
  printWindow.document.write(content)
  printWindow.document.close()
  
  printWindow.onload = () => {
    printWindow.print()
  }
}

function generatePDFContent(data: ExportData): string {
  const { calculatorType, timestamp, params, results } = data
  
  let paramsHTML = ""
  let resultsHTML = ""
  
  if (calculatorType === "inference" && "contextLength" in params) {
    const inferenceParams = params as InferenceParams
    const memoryResults = results as MemoryBreakdown
    const gpus = getRecommendedGPUs(memoryResults.total)
    
    paramsHTML = `
      <div class="section">
        <h2>Configuration</h2>
        <table>
          <tr><td>Model Size</td><td>${inferenceParams.parameters}B parameters</td></tr>
          <tr><td>Precision</td><td>${inferenceParams.precision.toUpperCase()}</td></tr>
          <tr><td>Context Length</td><td>${inferenceParams.contextLength.toLocaleString()} tokens</td></tr>
        </table>
      </div>
    `
    
    resultsHTML = `
      <div class="section">
        <h2>Memory Requirements</h2>
        <table>
          <tr><td>Model Weights</td><td>${formatMemory(memoryResults.modelWeights)}</td></tr>
          <tr><td>KV Cache</td><td>${formatMemory(memoryResults.kvCache || 0)}</td></tr>
          <tr><td>Overhead</td><td>${formatMemory(memoryResults.overhead)}</td></tr>
          <tr class="total"><td><strong>Total VRAM Required</strong></td><td><strong>${formatMemory(memoryResults.total)}</strong></td></tr>
        </table>
      </div>
      
      ${gpus.length > 0 ? `
        <div class="section">
          <h2>Recommended GPUs</h2>
          <table>
            <tr><th>GPU</th><th>VRAM</th><th>Tier</th><th>Utilization</th></tr>
            ${gpus.map(gpu => `
              <tr>
                <td>${gpu.name}</td>
                <td>${gpu.vram} GB</td>
                <td>${gpu.tier}</td>
                <td>${((memoryResults.total / gpu.vram) * 100).toFixed(1)}%</td>
              </tr>
            `).join("")}
          </table>
        </div>
      ` : ""}
    `
  } else if (calculatorType === "training" && "batchSize" in params) {
    const trainingParams = params as TrainingParams
    const memoryResults = results as MemoryBreakdown
    const gpus = getRecommendedGPUs(memoryResults.total)
    
    paramsHTML = `
      <div class="section">
        <h2>Configuration</h2>
        <table>
          <tr><td>Model Size</td><td>${trainingParams.parameters}B parameters</td></tr>
          <tr><td>Training Method</td><td>${trainingParams.method.toUpperCase()}</td></tr>
          <tr><td>Precision</td><td>${trainingParams.precision.toUpperCase()}</td></tr>
          <tr><td>Optimizer</td><td>${trainingParams.optimizer}</td></tr>
          <tr><td>Batch Size</td><td>${trainingParams.batchSize}</td></tr>
          <tr><td>Gradient Accumulation</td><td>${trainingParams.gradientAccumulation} steps</td></tr>
        </table>
      </div>
    `
    
    resultsHTML = `
      <div class="section">
        <h2>Memory Requirements</h2>
        <table>
          <tr><td>Model Weights</td><td>${formatMemory(memoryResults.modelWeights)}</td></tr>
          <tr><td>Gradients</td><td>${formatMemory(memoryResults.gradients || 0)}</td></tr>
          <tr><td>Optimizer States</td><td>${formatMemory(memoryResults.optimizerStates || 0)}</td></tr>
          <tr><td>Activations</td><td>${formatMemory(memoryResults.activations || 0)}</td></tr>
          <tr><td>Overhead</td><td>${formatMemory(memoryResults.overhead)}</td></tr>
          <tr class="total"><td><strong>Total VRAM Required</strong></td><td><strong>${formatMemory(memoryResults.total)}</strong></td></tr>
        </table>
      </div>
      
      ${gpus.length > 0 ? `
        <div class="section">
          <h2>Recommended GPUs</h2>
          <table>
            <tr><th>GPU</th><th>VRAM</th><th>Tier</th><th>Utilization</th></tr>
            ${gpus.map(gpu => `
              <tr>
                <td>${gpu.name}</td>
                <td>${gpu.vram} GB</td>
                <td>${gpu.tier}</td>
                <td>${((memoryResults.total / gpu.vram) * 100).toFixed(1)}%</td>
              </tr>
            `).join("")}
          </table>
        </div>
      ` : ""}
    `
  } else if (calculatorType === "quantization" && "modelSize" in params) {
    const quantResults = results as QuantizationResults
    
    paramsHTML = `
      <div class="section">
        <h2>Configuration</h2>
        <table>
          <tr><td>Model Size</td><td>${quantResults.modelSize}B parameters</td></tr>
        </table>
      </div>
    `
    
    resultsHTML = `
      <div class="section">
        <h2>Quantization Comparison</h2>
        <table>
          <tr>
            <th>Precision</th>
            <th>Memory</th>
            <th>Memory Savings</th>
            <th>Quality Retention</th>
            <th>Speed Improvement</th>
          </tr>
          ${quantResults.comparisons.map((comp, index) => `
            <tr>
              <td><strong>${comp.label}</strong></td>
              <td>${formatMemory(comp.memory)}</td>
              <td>${index === 0 ? "Baseline" : ((1 - comp.memory / quantResults.comparisons[0].memory) * 100).toFixed(0) + "%"}</td>
              <td>${comp.qualityRetention.toFixed(1)}%</td>
              <td>${comp.speedup}×</td>
            </tr>
          `).join("")}
        </table>
      </div>
    `
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>LLM Hardware Calculator - ${calculatorType.charAt(0).toUpperCase() + calculatorType.slice(1)} Results</title>
      <style>
        @media print {
          body { margin: 0; }
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #1a1a1a;
          background: #ffffff;
        }
        
        .header {
          border-bottom: 3px solid #8B5CF6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        h1 {
          margin: 0 0 10px 0;
          color: #8B5CF6;
          font-size: 28px;
        }
        
        .subtitle {
          color: #666;
          font-size: 14px;
          margin: 0;
        }
        
        .timestamp {
          color: #999;
          font-size: 12px;
          margin-top: 5px;
        }
        
        .section {
          margin-bottom: 30px;
          break-inside: avoid;
        }
        
        h2 {
          color: #333;
          font-size: 18px;
          margin-bottom: 15px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 8px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        td, th {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: 600;
          color: #333;
        }
        
        tr.total {
          border-top: 2px solid #8B5CF6;
          background-color: #f9f5ff;
        }
        
        tr.total td {
          padding-top: 15px;
          padding-bottom: 15px;
          font-size: 16px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LLM Hardware Calculator</h1>
        <p class="subtitle">${calculatorType.charAt(0).toUpperCase() + calculatorType.slice(1)} Calculation Results</p>
        <p class="timestamp">Generated: ${new Date(timestamp).toLocaleString()}</p>
      </div>
      
      ${paramsHTML}
      ${resultsHTML}
      
      <div class="footer">
        <p>Memory calculations are estimates based on standard architectures.</p>
        <p>Actual requirements may vary depending on implementation details and optimizations.</p>
      </div>
    </body>
    </html>
  `
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
  }
}
