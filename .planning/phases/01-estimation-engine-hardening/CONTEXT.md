# Phase 1: Estimation Engine Hardening & Scientific Integrity - Context

**Gathered:** 2026-10-25
**Status:** Ready for planning
**Target Hardware:** NVIDIA-based workstations/servers (RTX 4090, RTX 6000 Ada, L40S, A100, H100)

<domain>
## Phase Boundary
Deliver a mathematically sound, architecture-aware calculation engine decoupled from React, enforce unambiguous GiB units, establish status labeling (`Analytical Estimate`, `Calibrated Estimate`, `Measured Result`, `Unsupported`), and update the existing UI to eliminate misleading labels like "GPU Utilization" and arbitrary "BEST MATCH".
</domain>

<decisions>
## Implementation Decisions

### Engine Architecture & Location
- The calculation engine will be placed in `src/lib/engine/`.
- Pure TypeScript, zero React/DOM imports, zero browser dependencies. Can be imported in CLI tools and Node test runners.
- Architecture-aware KV cache formula:
  $$M_{\text{KV}} \approx 2 \times L \times H_{\text{KV}} \times D_{\text{head}} \times T \times B \times s$$
  where $L$ = num_layers, $H_{\text{KV}}$ = num_key_value_heads, $D_{\text{head}}$ = head_dim, $T$ = token_length, $B$ = batch_size/concurrency, and $s$ = bytes_per_element (2 for FP16/BF16, 1 for INT8, 0.5 for INT4).
- Model architecture registry containing verified configurations for:
  - Meta Llama 3 / 3.1 / 3.2 / 3.3 (1B, 3B, 8B, 70B)
  - Mistral 7B v0.1/v0.3
  - Mixtral 8x7B (MoE total parameters vs active)
  - Gemma 2 (2B, 9B, 27B)
  - Qwen 2.5 (7B, 14B, 32B, 72B)
  - DeepSeek-V3
  - Microsoft Phi-3 / Phi-4

### Units and Classification
- Units must be explicit: binary Gibibytes (GiB, $1024^3$ bytes) vs decimal Gigabytes (GB, $10^9$ bytes).
- All calculation internals use bytes; formatters output explicit `GiB` or `GB`.
- Every estimate returns a status tag:
  - `Analytical Estimate`: Derived strictly from architectural formulas and explicit assumptions.
  - `Calibrated Estimate`: Adjusted with empirical offsets for verified runtime configurations.
  - `Measured Result`: Sourced directly from physical benchmark telemetry.
  - `Unsupported`: Returned when architectural parameters or runtime behaviors cannot be reliably computed.

### UI Corrections
- Replace "GPU Utilization" with "Estimated Memory Occupancy".
- Replace "BEST MATCH" with explicit criterion badge (e.g. "Fits Memory", "Within Budget", "Performance Unmeasured").
- Add visible "Experimental" badges to Training and Quantization calculators.
- Expose model architectural specs (Layers, KV Heads, Head Dim) in the UI details panel.

### Verification & Testing
- Unit test suite testing engine calculations against HuggingFace transformers KV cache tensor shapes and real model configs.
- Run tests in CI / npm test script.
</decisions>

<canonical_refs>
## Canonical References
- `PRD.md` — Original project UI requirements
- `.planning/PROJECT.md` — Pivot strategy to local AI hardware qualification
- `.planning/REQUIREMENTS.md` — ENG-01 through ENG-05 requirements
- `.planning/research/BENCHMARK_ADAPTER_ARCHITECTURE.md` — Benchmark adapter design
- Hugging Face Transformers KV Cache documentation (`transformers.cache_utils`)
</canonical_refs>
