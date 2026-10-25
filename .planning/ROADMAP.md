# Roadmap: Local AI Hardware Qualification Suite

## Phase 1: Estimation Engine Hardening & Scientific Integrity
**Focus**: Decouple math, fix KV-cache formulas with architectural awareness, enforce GiB vs GB units, establish test suite, and clean up ambiguous labels in the existing UI.

- [ ] **1.1 Engine Extraction & Architecture Math**:
  - Extract calculation logic into pure TypeScript module `src/lib/engine/`.
  - Implement full KV-cache formula with layer count ($L$), KV heads ($H_{\text{KV}}$), head dimension ($D_{\text{head}}$), token length ($T$), and batch ($B$).
  - Add model architecture database with presets for Llama 3/3.1, Mistral, Gemma 2, Qwen 2.5, DeepSeek, Phi-3.
- [ ] **1.2 Unit Clarity & Status Classification**:
  - Distinguish GiB (binary) and GB (decimal) across calculations and display.
  - Implement result classification: `Analytical Estimate`, `Calibrated Estimate`, `Measured Result`, `Unsupported`.
- [ ] **1.3 UI Clean-up & Honesty**:
  - Replace "GPU Utilization" with "Estimated Memory Occupancy".
  - Replace unconditional "BEST MATCH" with criteria-based status (Fits Memory, Meets Target SLA).
  - Add explicit "Experimental" badges to Training and Quantization calculators.
- [ ] **1.4 Verification**:
  - Unit tests covering known model configurations and architectural edge cases against HuggingFace/vLLM baselines.

## Phase 2: Workload Specification & UI Flow
**Focus**: Provide a structured input specification covering serving demands, concurrency, and SLA targets.

- [ ] **2.1 Workload Specification Schema**:
  - Define schema: Model ID, precision/quantization, prompt length (P50/P99), generation length (P50/P99), concurrency (active requests), arrival pattern, SLA thresholds (TTFT max, ITL target).
- [ ] **2.2 Workload Form & Preset Overhaul**:
  - Create interactive Workload Builder component replacing simplistic parameter-only inputs.
  - Distinguish active concurrent requests from registered users.
- [ ] **2.3 Feasibility Pre-Check View**:
  - Display analytical feasibility with clear disclaimers ("Performance not measured for this hardware. Validation suite required before purchase approval").

## Phase 3: Local Benchmark Runner CLI (`hw-qual-cli`)
**Focus**: Provide an executable tool to benchmark the physical machine against the specified workload.

- [ ] **3.1 Environment Capture Module**:
  - Collect GPU topology (model, count, total VRAM, bus), CPU, System RAM, OS, driver version, CUDA version.
- [ ] **3.2 vLLM / Serving Adapter**:
  - Script to configure and invoke `vllm bench serve` with matching workload parameters (prompt/gen lengths, concurrency).
  - Capture real-time GPU memory watermark and request latencies (TTFT, ITL, request latency, goodput).
- [ ] **3.3 Output Bundle Generator**:
  - Package benchmark run into a structured `qualification-run.json` artifact containing full provenance, raw percentiles, and errors.

## Phase 4: Hardware Acceptance & Comparison Reports
**Focus**: Deliver the commercial output—the reproducible qualification certificate and comparison report.

- [ ] **4.1 Bundle Ingestion & Analytical vs. Measured Comparison**:
  - Web UI capability to load or drag-and-drop `qualification-run.json`.
  - Visual delta view: Analytical memory prediction vs. actual measured memory and latency percentiles.
- [ ] **4.2 SLA Pass/Fail Evaluator**:
  - Automated evaluation against defined workload targets (e.g. TTFT < 500ms, ITL < 30ms, 0 OOM errors).
- [ ] **4.3 Exportable Hardware Acceptance Certificate**:
  - Print-ready PDF and clean HTML export featuring hardware details, test parameters, SLA results, and qualification sign-off.

## Phase 5: Hardware Supplier Pilot & Partner Integration
**Focus**: Test with a real hardware partner or target system (OEM workstation/server).

- [ ] **5.1 Target Machine Matrix & Pilot Scenarios**:
  - Validate on target partner configuration (e.g., dual RTX 4090 or single A100/H100/L40S).
- [ ] **5.2 Co-branded Qualification Template**:
  - Support OEM/Integrator branding for pre-sales and factory delivery reports.
- [ ] **5.3 Deployment & Distribution Packaging**:
  - Production build and distribution instructions for local runner and web UI.
