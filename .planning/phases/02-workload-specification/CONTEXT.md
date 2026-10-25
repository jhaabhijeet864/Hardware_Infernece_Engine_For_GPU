# Phase 2: Workload Specification & UI Flow - Context

**Gathered:** 2026-10-25
**Status:** Ready for planning
**Target Hardware:** NVIDIA Workstations/Servers (RTX 4090, RTX 6000 Ada, L40S, A100, H100)
**Core Milestone:** Milestone 1 - Foundation & Scientific Integrity

<domain>
## Phase Boundary
Replace toy parameter-only inputs with a structured, enterprise-grade **Workload Specification**. The user defines actual deployment demands: Model ID, Quantization, Serving Runtime (vLLM, TensorRT-LLM, Ollama), Prompt Length distribution (P50/P99), Generation Length (P50/P99), Active Stream Concurrency (distinguished from total registered users), and Target Latency SLAs (TTFT and ITL). The output evaluates analytical feasibility and produces a machine-executable `workload-benchmark-spec.json` ready for physical benchmarking.
</domain>

<decisions>
## Implementation Decisions

### 1. Workload Schema & Standard Presets (`src/lib/engine/workload.ts`)
- Define strict TypeScript schema `WorkloadSpecification`:
  - `workloadId`: string
  - `name`: string
  - `modelId`: string
  - `runtime`: `'vllm' | 'tensorrt-llm' | 'ollama' | 'tgi'`
  - `precision`: `'FP16' | 'BF16' | 'INT8' | 'FP8' | 'INT4'`
  - `kvCacheDtype`: `'auto' | 'fp8' | 'int8' | 'fp16'`
  - `promptTokensP50`: number
  - `promptTokensP99`: number
  - `generationTokensP50`: number
  - `generationTokensP99`: number
  - `concurrency`: number (simultaneous active requests)
  - `sla`: { maxTtftMs: number; maxItlMs: number; minTokensPerSec?: number }
- Provide 4 real-world enterprise workload presets:
  1. **Enterprise RAG & Document QA**: Prompt P50: 3,500 tokens, Gen: 400 tokens, Concurrency: 8, SLA TTFT < 600ms, ITL < 35ms.
  2. **Customer Support Chatbot**: Prompt P50: 600 tokens, Gen: 150 tokens, Concurrency: 32, SLA TTFT < 300ms, ITL < 25ms.
  3. **Coding Assistant & Code Completion**: Prompt P50: 8,000 tokens, Gen: 800 tokens, Concurrency: 4, SLA TTFT < 800ms, ITL < 30ms.
  4. **Agentic Reasoning & Planning**: Prompt P50: 2,048 tokens, Gen: 1,500 tokens, Concurrency: 2, SLA TTFT < 500ms, ITL < 30ms.

### 2. Workload Builder Component (`src/components/WorkloadBuilder.tsx`)
- Tabbed/Accordion configuration interface:
  - **Workload Archetype**: Instant selection from standard enterprise presets.
  - **Traffic & Concurrency**: Clear separation between active concurrent streams (e.g. 4-16) vs total registered users (e.g. 500) to avoid unrealistic VRAM over-allocation.
  - **Sequence Lengths**: Explicit prompt tokens vs generation tokens (P50 and P99 upper bounds).
  - **Serving Runtime & Quantization**: Runtime selector and quantization options.
  - **SLA Criteria**: Max TTFT (ms) and Max ITL (ms) targets.

### 3. Workload Benchmark Export (`workload-benchmark-spec.json`)
- Add a "Export Benchmark Config" button generating a standardized JSON artifact ready for direct ingestion by the Phase 3 `hw-qual-cli` runner.
- Display a clear analytical feasibility pre-check:
  - Calculated Peak VRAM for P50 & P99 sequence lengths.
  - Stated qualification status: *"Analytical feasibility verified. Empirical benchmark required on physical hardware to validate SLA compliance."*
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md` — Core vision for local AI hardware qualification
- `.planning/REQUIREMENTS.md` — WKL-01 and WKL-02 requirements
- `.planning/research/BENCHMARK_ADAPTER_ARCHITECTURE.md` — Specification format and vLLM mapping
- NVIDIA GenAI-Perf and vLLM benchmarking documentation
</canonical_refs>
