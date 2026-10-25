# Support Policy

Thank you for using **Hardware-Inference (LLM Hardware Calculator)**! 💡

We want your experience with this tool to be seamless. If you need help, have questions, or run into roadblocks, here are the best channels to find support.

---

## 🧭 Channels for Support

### 1. GitHub Discussions
For general questions, design ideas, hardware recommendations, or discussions about memory estimation formulas:
- Visit **GitHub Discussions** in our repository.
- Search existing topics to see if your question has already been answered.
- Ask questions in the appropriate category (e.g., *Q&A*, *Ideas*, *Show and Tell*).

### 2. GitHub Issues (Bug Reports & Hardware Requests)
If you encounter a verified bug in calculation math, UI glitch, or missing hardware:
- Use our [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) template for bugs.
- Use our [Hardware Request](.github/ISSUE_TEMPLATE/hardware_model_request.yml) template to request new accelerators or GPUs.
- Avoid opening issues for general support or personal hardware troubleshooting.

### 3. Security Vulnerabilities
If you suspect you have identified a security vulnerability, please do **not** open a public issue. Review our [Security Policy](SECURITY.md) and report privately to [jhaabhijeet864@gmail.com](mailto:jhaabhijeet864@gmail.com).

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><strong>Why does my calculated VRAM differ from actual runtime usage in vLLM / Ollama?</strong></summary>

Different inference runtimes allocate memory differently:
- **vLLM** pre-allocates a fixed percentage of GPU memory (default `gpu_memory_utilization = 0.90`) for its PagedAttention KV-cache pool regardless of context length.
- **llama.cpp / Ollama** allocates KV cache dynamically or statically based on the specific `-c` context window flag.
- **CUDA Runtime Overhead** (typically 300MB - 1.2GB) is consumed by driver context and cuBLAS workspace buffers.

Our calculator provides options to toggle and fine-tune runtime context and overhead margins!
</details>

<details>
<summary><strong>Can I export my calculation results?</strong></summary>

Yes! You can export your full configuration as a PDF specification sheet or generate a shareable URL containing the exact parameters for your team.
</details>

---

## 🤝 Community Etiquette

When asking for support, please be kind, respectful, and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Providing full context, model name, quantization type, and hardware targets will help us assist you much faster!
