# Hardware-Inference Engine Architecture

This document provides a comprehensive technical overview of the **Hardware-Inference** calculation engine, its mathematical foundations, data structures, and architectural principles.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Web UI Shell                          │
│   (React 19 + Tailwind CSS v4 + Framer Motion + Sonner)     │
└───────────────┬─────────────────────────────▲───────────────┘
                │                             │
    User Inputs │                             │ Memory Sizing Breakdown
    & Archetype │                             │ & GPU Recommendations
                ▼                             │
┌─────────────────────────────────────────────────────────────┐
│                 Calculation Engine Core                     │
│  ├── units.ts       (Exact byte conversions, GiB vs GB)     │
│  ├── registry.ts    (Model architecture parameter tables)   │
│  ├── calculator.ts  (KV-cache, weights, & training math)    │
│  ├── workload.ts    (Concurrency, P50/P99 token sizing)     │
│  └── exporter.ts    (vLLM & GenAI-Perf benchmark bundles)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Mathematical Foundation

### 2.1 Model Weights Memory
Model weights occupy VRAM determined strictly by the total parameter count and storage format precision:

$$\text{Weight Bytes} = \text{Parameters} \times \text{Bytes Per Parameter}$$

| Format | Storage Width (Bytes) | Example (8 Billion Params) |
| :--- | :--- | :--- |
| **FP32** | 4.0 bytes | $32.00\text{ GB } (29.80\text{ GiB})$ |
| **FP16 / BF16** | 2.0 bytes | $16.00\text{ GB } (14.90\text{ GiB})$ |
| **FP8 / INT8** | 1.0 byte | $8.00\text{ GB } (7.45\text{ GiB})$ |
| **INT4 / AWQ / GPTQ** | 0.5 bytes | $4.00\text{ GB } (3.73\text{ GiB})$ |

---

### 2.2 KV-Cache Memory

#### Multi-Head Attention (MHA) & Grouped-Query Attention (GQA)
For each token across all active layers, keys ($K$) and values ($V$) must be stored in GPU VRAM:

$$\text{KV Bytes} = 2 \times L \times n_{\text{kv}} \times d_{\text{head}} \times c \times b \times \text{PrecisionBytes}$$

Where:
- $L$: Number of hidden layers
- $n_{\text{kv}}$: Number of key-value attention heads (in GQA, $n_{\text{kv}} \ll n_{\text{query}}$)
- $d_{\text{head}}$: Head dimension ($\frac{d_{\text{model}}}{n_{\text{query}}}$)
- $c$: Sequence context length (in tokens)
- $b$: Concurrent batch size / active streams
- $\text{PrecisionBytes}$: 2 for FP16/BF16, 1 for INT8/FP8 KV-cache

#### Example: Llama-3.1-8B at 8,192 Context ($b=1$, FP16)
- $L = 32$
- $n_{\text{kv}} = 8$
- $d_{\text{head}} = 128$
- $c = 8,192$
- $\text{PrecisionBytes} = 2$

$$\text{KV Bytes} = 2 \times 32 \times 8 \times 128 \times 8,192 \times 1 \times 2 = 1,073,741,824\text{ Bytes} \equiv 1.00\text{ GiB}$$

#### Multi-Head Latent Attention (MLA)
In architectures like **DeepSeek-V3 / DeepSeek-R1**, attention keys and values are projected into a low-rank compressed latent space ($d_{c}$) plus decoupled positional embeddings ($d_{r}$):

$$\text{KV Bytes}_{\text{MLA}} = L \times (d_{c} + d_{r}) \times c \times b \times \text{PrecisionBytes}$$

This achieves up to a **$5\times - 7\times$ reduction** in KV cache memory compared to standard MHA.

---

### 2.3 Runtime Buffer & CUDA Overhead

Executing deep learning kernels requires working memory outside raw parameters:
- **CUDA Runtime / Driver Context**: $300\text{ MB} - 1.2\text{ GiB}$ depending on GPU architecture and CUDA driver version.
- **cuBLAS / cuDNN Workspace**: Scratch space allocated for matrix multiplication algorithms.
- **Paging / PagedAttention Overhead**: Block tables and fragmentation buffer margins (typically $10\%\text{ - }15\%$).

---

### 2.4 Training & Fine-Tuning Memory

When training or fine-tuning models, VRAM requirements scale significantly:

$$\text{Total VRAM}_{\text{Training}} = \text{Weights} + \text{Gradients} + \text{Optimizer States} + \text{Activations} + \text{Overhead}$$

#### Full Fine-Tuning (AdamW):
- **Weights**: 16-bit ($2\text{ bytes/param}$)
- **Gradients**: 16-bit ($2\text{ bytes/param}$)
- **AdamW States**: FP32 master weights ($4\text{ bytes}$) + 1st momentum ($4\text{ bytes}$) + 2nd momentum ($4\text{ bytes}$) = $12\text{ bytes/param}$
- **Total Static Overhead**: $\approx 16\text{ bytes/param}$

#### LoRA (Low-Rank Adaptation):
- Frozen Base Weights ($2\text{ bytes/param}$ in FP16)
- Trainable Adapters $A$ and $B$ (typically $< 1\%$ of total parameters)
- Gradients and Optimizer States allocated *only* for the trainable adapter parameters.

#### QLoRA:
- Base weights quantized to NormalFloat4 (NF4, $0.5\text{ bytes/param}$)
- Pageable optimizer states with Double Quantization.

---

## 3. Directory Layout

- `src/lib/engine/types.ts`: TypeScript contracts for precision, layers, attention types, and sizing results.
- `src/lib/engine/units.ts`: Exact power-of-two (GiB) and decimal (GB) conversion utilities.
- `src/lib/engine/registry.ts`: Verified architectural specifications for open weights models.
- `src/lib/engine/calculator.ts`: Core mathematical sizing algorithms.
- `src/lib/engine/workload.ts`: Concurrency and workload archetype modeling.
- `src/lib/engine/exporter.ts`: Qualification test bundle generator for vLLM and GenAI-Perf.
