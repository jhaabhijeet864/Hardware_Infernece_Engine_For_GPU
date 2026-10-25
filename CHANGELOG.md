# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Multi-token prediction (MTP) and speculative decoding KV cache estimation models.
- Expanded hardware database for NVIDIA Blackwell (B200, GB200) and AMD Instinct (MI325X).
- Benchmark adapter architecture research and vLLM / GenAI-Perf integration specifications.

---

## [0.1.0] - 2026-10-25

### Added
- **Inference Mode**:
  - Model presets for popular open weights models (Llama 3, Mistral, Gemma, DeepSeek, Qwen).
  - Configurable parameters: parameter size (B), precision (FP16, BF16, INT8, INT4, FP8), context window, batch size.
  - Granular VRAM breakdown: Model Weights, KV Cache (MHA, GQA, sliding window), and runtime buffer overhead.
  - GPU Matchmaker: Ranked hardware recommendations fitting calculated VRAM requirements.
- **Training Mode**:
  - Fine-tuning approach selection: Full Fine-Tune, LoRA, and QLoRA.
  - Memory breakdown: Model weights, gradients, Adam/SGD optimizer states, activation memory, and gradient checkpointing toggles.
- **Quantization Comparison Mode**:
  - Side-by-side memory footprint, quality impact, and throughput tradeoffs for FP16, INT8, and INT4 formats.
- **Export & Sharing**:
  - PDF spec sheet export for hardware acquisition proposals and team documentation.
  - Shareable URL links with encoded calculator state.
- **Repository & Community Infrastructure**:
  - Open source MIT License.
  - Contributor Covenant Code of Conduct.
  - Standardized Contribution and Support guides.
  - Interactive GitHub issue forms and PR templates.
  - Automated CI workflow with dependency audits.

[Unreleased]: https://github.com/abhijeetjha/Hardware-Inference/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/abhijeetjha/Hardware-Inference/releases/tag/v0.1.0
