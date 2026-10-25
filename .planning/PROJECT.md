# Project: Hardware Inference & Local AI Qualification Suite

## Vision & Core Promise
**"Tell us the AI workload you need to run. We help you select a suitable configuration, benchmark the actual machine, and produce a reproducible acceptance report."**

Transforming the initial VRAM calculator prototype into an enterprise-grade workload validation and hardware qualification platform for local AI hardware (workstations, edge servers, and datacenter rigs).

## Target Customers
- **Primary**: Hardware suppliers, OEMs, and system integrators selling on-premise AI workstations and servers who need to prove that a machine will meet specific customer SLAs (TTFT, ITL, concurrency) before purchase and delivery.
- **Secondary**: Enterprise ML/Infra teams purchasing and sizing on-premise inference deployments.

## Core Problem
Existing calculators only ask "Does an 8B model fit in 24 GB VRAM?", which ignores:
1. Serving performance (time-to-first-token, inter-token latency, throughput, concurrency).
2. Model architecture nuances (GQA/MQA KV-cache sizing, context length scaling).
3. Runtime variations (vLLM, Ollama, TensorRT-LLM, FlashAttention, PagedAttention).
4. Physical machine proof (absence of reproducible benchmark reports for sales or factory acceptance).

## Architecture & Product Strategy
- **Web Interface (React + Vite + Tailwind CSS)**: Workload specification, analytical estimation with explicit assumptions, benchmark configuration generator, and interactive comparison report viewer.
- **Standalone Estimation Engine (`@engine/core`)**: Decoupled, versioned, independently testable package with exact architectural formulas ($2 \times L \times H_{\text{KV}} \times D_{\text{head}} \times T \times B \times s$), unambiguous GiB units, and clear labeling (`Analytical`, `Calibrated`, `Measured`, `Unsupported`).
- **Local Benchmark Runner CLI (`hw-qual-cli`)**: Lightweight local runner wrapping standard serving benchmarks (`vllm bench serve`, NVIDIA GenAI-Perf) to collect actual hardware telemetry, latency distributions, and OOM boundaries.
- **Reproducible Acceptance Reports**: Standardized export (JSON + print-ready PDF/HTML) detailing system specs, driver versions, runtime arguments, test workload, and pass/fail criteria against target SLAs.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Retain React + Tailwind UI | Existing UI has high visual appeal and component foundation; avoid throwaway redesign. | Preserved & repurposed |
| Decouple Math from React | Calculation logic must be testable via automated test suites and runnable in CLI without DOM dependencies. | Planned (Phase 1) |
| Architecture-aware KV Cache | Parameter count alone cannot accurately estimate KV memory; layer count, KV heads, and head dimensions are required. | Planned (Phase 1) |
| Replace "Utilization" & "Best Match" | Vague labels mislead buyers. Use explicit metric labels (e.g. "Estimated Memory Occupancy", "Qualified against SLA"). | Planned (Phase 1) |
| Standard Runtime Benchmark Wrapper | Instead of inventing synthetic benchmarking math, wrap battle-tested tools (`vllm bench serve`, `GenAI-Perf`). | Planned (Phase 3) |
| Explicit Units (GiB vs GB) | Memory in hardware specs is often decimal GB while VRAM allocations are binary GiB; precision prevents OOM errors. | Planned (Phase 1) |
| Label Training/Quantization as Experimental | Broad training multipliers without optimizer state breakdown lack empirical rigor for hardware qualification. | Planned (Phase 1) |

## Requirements

### Validated (Existing Prototype Foundation)
- ✓ Model and precision selector UI components — existing
- ✓ Basic memory breakdown visualization (Weights + Cache + Overhead) — existing
- ✓ GPU catalog database and card renderers — existing
- ✓ Responsive dark theme with Tailwind CSS & Radix UI primitives — existing

### Active (Qualification Platform Scope)
- [ ] **Engine Isolation**: Extract memory math into an isolated, unit-tested module with strict typing and architectural metadata.
- [ ] **Exact KV Math**: Implement $2 \times L \times H_{\text{KV}} \times D_{\text{head}} \times T \times B \times s$ with explicit support for Multi-Head Attention (MHA), Grouped-Query Attention (GQA), and Multi-Query Attention (MQA).
- [ ] **Status Classification**: Replace arbitrary confidence with explicit states: `Analytical Estimate`, `Calibrated Estimate`, `Measured Result`, `Unsupported`.
- [ ] **Workload Specification**: UI and schema capturing model revision, input/output token lengths, concurrent requests (vs total users), arrival rate, and target SLA (TTFT / ITL).
- [ ] **Benchmark Adapter**: Local CLI script capable of executing `vllm bench serve` or equivalent, recording driver/hardware specs, latencies, and memory.
- [ ] **Acceptance Report Generator**: Standardized report generator providing hardware qualification pass/fail status and audit trail.

### Out of Scope (For Initial Qualification Milestone)
- Full-scale distributed multi-node cluster benchmarking (focus on single-node workstation/server first).
- Complex custom training memory estimators (label training as experimental or secondary).
- Proprietary closed-source accelerator support prior to vendor SDK/hardware access.

## Evolution
This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-10-25 after initialization*
