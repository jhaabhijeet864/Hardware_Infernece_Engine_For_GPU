# Architectural Research: Serving Benchmark Adapters & Hardware Telemetry

## 1. Executive Summary
To transform the calculator into an enterprise hardware qualification product for local AI workstations and servers (NVIDIA RTX 4090, RTX 6000 Ada, L40S, A100, H100), the system requires an empirical validation layer. Rather than writing a custom load generator from scratch, the system wraps and standardizes around battle-tested industry tools:
1. **Primary Serving Adapter**: `vllm bench serve` (native online-serving benchmark engine built into vLLM).
2. **Enterprise Secondary Adapter**: NVIDIA `GenAI-Perf` (part of NVIDIA Triton / NIM perf-analyzer ecosystem).
3. **Hardware Telemetry Daemon**: Direct NVML / `nvidia-smi` polling to capture true memory watermarks and thermal/power throttling during test runs.

---

## 2. Target Hardware & Runtime Ecosystem
- **Hardware Class**: NVIDIA Ada Lovelace (RTX 4090, RTX 6000 Ada, L40S) and Hopper/Ampere (A100, H100).
- **Execution Environment**: Linux (Ubuntu 22.04/24.04 LTS) and Windows Subsystem for Linux 2 (WSL2) with NVIDIA Container Toolkit / CUDA 12.x+.
- **Serving Backends**:
  - `vllm` (v0.6.x+): Industry standard for high-throughput PagedAttention serving.
  - `tensorrt-llm` / `Triton`: Optimized enterprise runtime for peak token latency.

---

## 3. Telemetry & Environment Capture Specification

Before and during benchmark execution, the local adapter captures machine provenance:

### 3.1 Static System Metadata
- **GPU Topology**:
  - Query: `nvidia-smi --query-gpu=name,uuid,driver_version,memory.total,power.limit,pcie.link.gen.current,pcie.link.width.current --format=csv,noheader,nounits`
  - Attributes: Exact GPU model string, PCIe bandwidth, total physical VRAM (in binary GiB and decimal GB), driver revision.
- **Host System**:
  - CPU: Model name, physical cores, logical threads.
  - System Memory: Total RAM (GiB), swap size.
  - Software Stack: OS release, kernel version, CUDA version, PyTorch version, vLLM version.

### 3.2 Dynamic Telemetry Daemon
While the benchmark runs, an asynchronous telemetry sampler polls at 100ms intervals:
- `memory.used` (MiB) → Tracks model weight load vs. KV-cache allocation vs. peak activation spike.
- `utilization.gpu` (%) & `utilization.memory` (%)
- `temperature.gpu` (°C) & `power.draw` (W) → Detects thermal or power throttling that could distort SLA measurements.

---

## 4. Serving Benchmark Execution (`vllm bench serve`)

### 4.1 CLI Argument Mapping
The adapter maps the user's workload specification directly to `vllm bench serve`:

```bash
vllm bench serve \
  --backend vllm \
  --model <model-id-or-path> \
  --dataset-name random \
  --random-input-len <prompt_tokens_p50> \
  --random-output-len <gen_tokens_p50> \
  --num-prompts <total_test_requests> \
  --request-rate <concurrency_or_qps> \
  --save-result \
  --save-detailed \
  --result-dir ./qualification_artifacts \
  --result-filename raw_benchmark_metrics.json
```

### 4.2 Metrics Captured from Standard JSON Output
`vllm bench serve` exports rich per-request and aggregated metrics:
- **Time to First Token (TTFT)**: Mean, median, P90, P95, P99, Max (ms).
- **Time per Output Token (TPOT) / Inter-Token Latency (ITL)**: Mean, median, P90, P95, P99, Max (ms/token).
- **Request Latency (E2E)**: Total round-trip time from request dispatch to final token.
- **Throughput**:
  - Request throughput (requests/sec)
  - Output token throughput (generation tokens/sec)
  - Total token throughput (prompt + generation tokens/sec)
- **Goodput**: Percentage of requests satisfying strict latency criteria (e.g., TTFT < 500ms and ITL < 35ms).
- **Error Tracking**: Unhandled exceptions, HTTP 500/503 errors, CUDA Out-Of-Memory (OOM) failures.

---

## 5. Standardized Qualification Bundle Schema (`qualification-run.json`)

The output bundle packages both the empirical serving results and the analytical estimation for side-by-side verification:

```json
{
  "$schema": "https://hardware-inference.schema.json/v1/qualification-run.json",
  "metadata": {
    "run_id": "qual-20261025-4090-llama3-01",
    "timestamp": "2026-10-25T16:58:00Z",
    "qualification_profile": "Standard Workstation Pre-Sales Acceptance",
    "system_hash": "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "environment": {
    "gpu": {
      "model": "NVIDIA GeForce RTX 4090",
      "count": 1,
      "total_vram_gib": 24.0,
      "driver_version": "550.54.14",
      "cuda_version": "12.4",
      "pcie_link": "Gen 4 x16"
    },
    "host": {
      "cpu": "AMD Ryzen 9 7950X 16-Core Processor",
      "ram_gib": 64.0,
      "os": "Linux 6.8.0-40-generic (Ubuntu 24.04 LTS)"
    },
    "runtime": {
      "engine": "vllm",
      "version": "0.6.3",
      "kv_cache_dtype": "auto",
      "enforce_eager": false
    }
  },
  "workload_spec": {
    "model_id": "meta-llama/Meta-Llama-3.1-8B-Instruct",
    "architecture": {
      "param_count_b": 8.03,
      "layers": 32,
      "kv_heads": 8,
      "head_dim": 128
    },
    "quantization": "FP16",
    "prompt_tokens_p50": 1024,
    "generation_tokens_p50": 256,
    "concurrency_limit": 4,
    "sla_targets": {
      "max_ttft_ms": 600,
      "max_itl_ms": 40,
      "min_tokens_per_sec": 25.0
    }
  },
  "analytical_estimate": {
    "weights_gib": 14.96,
    "kv_cache_gib": 0.50,
    "cuda_runtime_overhead_gib": 1.20,
    "total_estimated_gib": 16.66,
    "status": "Analytical Estimate",
    "plausibility": "Fits VRAM"
  },
  "measured_results": {
    "telemetry": {
      "peak_vram_used_gib": 17.82,
      "idle_vram_gib": 0.85,
      "peak_gpu_utilization_pct": 98.4,
      "peak_temperature_c": 64.0
    },
    "latencies": {
      "ttft_ms": { "median": 210.4, "p90": 340.2, "p99": 480.1 },
      "itl_ms": { "median": 22.8, "p90": 28.4, "p99": 35.1 },
      "e2e_request_ms": { "median": 6050.2, "p90": 7600.0, "p99": 9100.0 }
    },
    "throughput": {
      "requests_per_sec": 1.65,
      "generation_tokens_per_sec": 422.4,
      "total_tokens_per_sec": 2112.0
    },
    "reliability": {
      "total_requests": 100,
      "successful_requests": 100,
      "failed_requests": 0,
      "oom_events": 0
    }
  },
  "qualification_verdict": {
    "overall": "PASSED",
    "checks": [
      { "criterion": "Memory Fit (Peak < 24.0 GiB)", "actual": "17.82 GiB", "passed": true },
      { "criterion": "TTFT SLA (P95 < 600 ms)", "actual": "395.0 ms", "passed": true },
      { "criterion": "ITL SLA (P95 < 40 ms)", "actual": "31.2 ms", "passed": true },
      { "criterion": "Zero OOM Failures", "actual": "0 failures", "passed": true }
    ],
    "recommendation": "Qualified for production deployment of this workload."
  }
}
```

---

## 6. Acceptance Certificate & Commercial Reporting Architecture

1. **Analytical vs. Measured Delta Analysis**:
   - The web app displays prediction error: $\Delta VRAM = |VRAM_{\text{analytical}} - VRAM_{\text{measured}}|$.
   - Over time, deltas feed calibration factors for specific GPU/runtime combinations (`Calibrated Estimate`).
2. **Export Engine**:
   - Print-ready PDF / HTML certificate containing cryptographic run hash, system specs, latency percentiles, and OEM pass/fail badge.
   - Ready for inclusion in OEM shipping boxes and pre-sales proposals.

---

## 7. Next Steps for Implementation
1. **Engine Decoupling (Phase 1)**: Build `@engine/core` in TypeScript with exact $2 \times L \times H_{\text{KV}} \times D_{\text{head}} \times T \times B \times s$ math, tested against HuggingFace transformers KV cache shapes.
2. **Adapter Package (Phase 3)**: Develop `hw-qual-cli` (Node/Python script) with `vllm bench serve` subprocess management and NVML telemetry polling.
