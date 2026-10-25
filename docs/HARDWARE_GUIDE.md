# Hardware Qualification & GPU Sizing Guide

This guide assists infrastructure architects, ML engineers, and developers in matching Large Language Model workloads to the right hardware accelerators.

---

## 1. Accelerator Categories

### 1.1 Datacenter & Cloud Accelerators
Designed for high concurrency, multi-tenant serving, and massive distributed training workloads:
* **NVIDIA Hopper / Blackwell (H100 SXM, H200 SXM, B200)**:
  - Extreme memory bandwidth (3.35 TB/s - 8.0 TB/s via HBM3 / HBM3e).
  - Native FP8 Tensor Cores and Transformer Engine hardware acceleration.
  - High-speed NVLink interconnects (900 GB/s - 1.8 TB/s) for low-latency Tensor Parallelism (TP).
* **AMD Instinct (MI300X, MI325X)**:
  - Industry-leading VRAM capacity (192 GB - 256 GB HBM3e) enabling serving large 70B models on a single accelerator.
  - 5.3 TB/s - 6.0 TB/s memory bandwidth via ROCm stack.

### 1.2 Workstation & Prosumer GPUs
Ideal for local testing, specialized single-node deployments, and cost-efficient enterprise clusters:
* **NVIDIA RTX 6000 Ada Generation**: 48 GB GDDR6 with ECC, 960 GB/s bandwidth.
* **NVIDIA RTX 4090 / 5090**: 24 GB - 32 GB GDDR6X/GDDR7. Cost-effective for 8B models or quantized 70B inference.

### 1.3 Unified Memory Systems
CPU and GPU share a single physical memory pool:
* **Apple Silicon (M2/M3/M4 Max & Ultra)**: Up to 128 GB - 192 GB unified memory with 400 - 800 GB/s bandwidth. Capable of loading massive models locally at competitive energy efficiency.
* **NVIDIA GH200 / GB200 Grace Hopper**: Unified CPU+GPU coherent memory up to 480 GB - 576 GB.

---

## 2. Capacity vs. Memory Bandwidth

When sizing hardware for LLMs, two physical bottlenecks exist:

### A. Memory Capacity (GB / GiB)
* **What it determines**: Can the model load, and what is the maximum concurrent context window?
* **Bottleneck Phase**: Out-Of-Memory (OOM) crashes occur when $\text{Weights} + \text{KV Cache} + \text{Overhead} > \text{VRAM}$.

### B. Memory Bandwidth (GB/s or TB/s)
* **What it determines**: Generation throughput (tokens per second per user).
* **Why**: LLM autoregressive token generation is memory-bandwidth bound. To generate a single token, all model weights must be streamed through the chip:

$$\text{Theoretical Max Tokens/Sec} \approx \frac{\text{Memory Bandwidth (Bytes/s)}}{\text{Model Weight Memory (Bytes)}}$$

* **Example**: An 8B model in FP16 ($16\text{ GB}$) running on an RTX 4090 ($1,008\text{ GB/s}$):
  $$\text{Max Throughput} \approx \frac{1,008}{16} \approx 63\text{ tokens/sec}$$

---

## 3. GPU Matchmaker Headroom Categories

Our calculator evaluates hardware suitability using strict operational margins:

* 🟢 **Optimal Match (50% – 85% Occupancy)**:
  - Plenty of headroom for runtime spikes, KV cache growth, and unexpected context extensions.
  - Zero risk of OOM under standard loads.
* 🟡 **Tight Fit (85% – 100% Occupancy)**:
  - The model fits, but context length, concurrency, or beam search could trigger OOM under peak load.
  - Recommended only with strict PagedAttention memory caps (`gpu_memory_utilization = 0.90`).
* 🔴 **Insufficient Memory (> 100% Occupancy)**:
  - Workload exceeds physical memory capacity. Multi-GPU Tensor Parallelism (TP) or heavier quantization (e.g., INT4/AWQ) is mandatory.

---

## 4. OOM Troubleshooting Checklist

If your deployment crashes with CUDA Out of Memory:
1. **Reduce Maximum Context**: Lower runtime max model sequence length.
2. **Enable KV Cache Quantization**: Convert FP16 KV cache to FP8 or INT8 to cut KV memory by 50%.
3. **Adjust Memory Utilization**: In vLLM, lower `--gpu-memory-utilization` from 0.95 to 0.85 to allow headroom for CUDA workspace.
4. **Enable FlashAttention / PagedAttention**: Prevents quadratic activation spikes and memory fragmentation.
