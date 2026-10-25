# Phase 3: Local Benchmark Runner CLI (`hw-qual-cli`) - Context

**Gathered:** 2026-10-25
**Status:** Ready for planning
**Target Hardware:** NVIDIA Workstations & Servers (RTX 4090, RTX 6000 Ada, L40S, A100, H100)
**Core Milestone:** Milestone 1 - Foundation & Scientific Integrity

<domain>
## Phase Boundary
Build the executable local benchmark runner (`hw-qual-cli`) in `src/cli/`. This CLI runs directly on customer or partner machines (Linux / WSL2 / Windows), captures hardware environment provenance (`nvidia-smi` GPU topology, driver, CUDA, host RAM, CPU), executes or controls the serving benchmark (`vllm bench serve`), samples live memory watermarks at 100ms intervals, and outputs the standardized `qualification-run.json` artifact for downstream acceptance reporting.
</domain>

<decisions>
## Implementation Decisions

### 1. CLI Architecture & Execution Runtime
- Located in `src/cli/` with a bin script `bin/hw-qual.js` registered in `package.json`.
- Pure TypeScript executed via `tsx` or compiled JavaScript with Node 20+.
- Supports two modes of execution:
  - **Live Benchmark Mode**: Invokes local `vllm bench serve` subprocess against a running vLLM server instance while actively monitoring GPU memory.
  - **Trace Ingestion / Simulated Mode**: Ingests existing `vllm bench serve` or GenAI-Perf output files or runs controlled simulated traces for hardware where live model serving is performed separately.

### 2. Environment Capture (`src/cli/env-capture.ts`)
- Executes:
  `nvidia-smi --query-gpu=name,uuid,driver_version,memory.total,power.limit,pcie.link.gen.current,pcie.link.width.current --format=csv,noheader,nounits`
- Gathers CPU model, physical/logical core counts, total system RAM (GiB), OS release, kernel, and CUDA compiler version.
- Computes unique `machine_fingerprint` (SHA-256 hash of system identifiers) to ensure audit reproducibility.

### 3. Memory & Telemetry Sampler (`src/cli/telemetry.ts`)
- Background polling daemon running at 100ms intervals during test execution.
- Samples:
  - `memory.used` (MiB/GiB)
  - `utilization.gpu` (%)
  - `temperature.gpu` (°C)
  - `power.draw` (W)
- Records:
  - Idle VRAM baseline (prior to test)
  - Model weights load watermark
  - Peak transient memory spike
  - Final steady-state allocation

### 4. Qualification Result Bundle (`qualification-run.json`)
- Conforms to the specification defined in `.planning/research/BENCHMARK_ADAPTER_ARCHITECTURE.md`.
- Combines:
  1. `metadata`: run ID, timestamp, system hash, qualification profile
  2. `environment`: GPU specs, driver version, host environment
  3. `workload_spec`: model, runtime, prompt/gen token lengths, concurrency, target SLAs
  4. `analytical_estimate`: baseline predictions from `@engine`
  5. `measured_results`: live telemetry peak VRAM, TTFT percentiles (P50, P90, P95, P99), ITL, throughput, error counts
  6. `qualification_verdict`: automated evaluation against criteria (Memory Fit, TTFT SLA, ITL SLA, 0 OOM errors).
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md` — Local runner and physical machine acceptance vision
- `.planning/REQUIREMENTS.md` — RUN-01 through RUN-05
- `.planning/research/BENCHMARK_ADAPTER_ARCHITECTURE.md` — Telemetry and vLLM integration architecture
- vLLM online-serving benchmark documentation (`vllm bench serve`)
</canonical_refs>
