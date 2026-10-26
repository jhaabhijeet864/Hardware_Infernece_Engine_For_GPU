# Hardware Partner Pilot & Factory Acceptance Runbook
**Document Version:** 2.0  
**Target Audience:** OEM System Integrators, Hardware Manufacturing Partners, QA Factory Technicians, and AI Procurement Teams  
**Product:** Local AI Hardware Workload Qualification Suite (`hw-qual-cli`)

---

## 1. Executive Summary & Partnership Framework

This runbook defines the operational testing and quality assurance procedures for the joint hardware manufacturing partnership.

### The Division of Responsibilities
* **Hardware Manufacturing Partner:** Builds, integrates, tests, and ships physical AI workstations and servers (dual RTX 4090, RTX 6000 Ada, L40S, A100/H100) from manufacturing facilities (e.g. Shenzhen, China).
* **Software Team (Antigravity Suite):** Provides the reproducible workload qualification engine, automated test station tooling (`hw-qual-cli`), and tamper-evident acceptance certificates included with every shipped unit.

### Commercial Value Proposition
Instead of competing with generic spreadsheet calculators or raw uncalibrated hardware claims, every machine shipped from the factory includes a **Reproducible Workload Acceptance Certificate** signed with a unique cryptographic machine hash (`system_hash`), proving that the machine delivers certified latency percentiles (TTFT, ITL) and zero OOM errors under real enterprise customer workloads.

---

## 2. Factory Test Station Preparation Checklist

Before initiating qualification on any assembled machine or server, factory technicians must complete the following 5-point hardware pre-flight check:

### Pre-Flight Checklist
1. **NVIDIA Driver & CUDA Alignment:**
   - Verify driver version: `nvidia-smi` (Requirement: Driver $\ge 550.54$ on Linux, $\ge 590$ on Windows).
   - Verify CUDA compiler capability: `nvcc --version` (Requirement: CUDA $12.2+$).
2. **PCIe Bus Width & Link Generation:**
   - Run: `nvidia-smi --query-gpu=pcie.link.gen.current,pcie.link.width.current --format=csv`
   - Requirement: Gen 4 or Gen 5 with minimum x8 width (preferably x16).  
     *Warning:* Faulty riser cables or improper motherboard bifurcation can drop GPUs to PCIe Gen 1 x1, which catastrophically throttles TTFT prefill latency.
3. **Thermal Airflow & Power Limit (TDP):**
   - Check GPU power limits: `nvidia-smi --query-gpu=power.limit,power.default_limit --format=csv`
   - Ensure case ventilation fans are at $100\%$ duty cycle during factory stress runs. Ambient room temperature must be maintained $\le 25^\circ\text{C}$.
4. **Host System Memory & Swap:**
   - Minimum 64 GiB system RAM for single-GPU workstations; minimum 128 GiB for dual-GPU systems.
5. **Runtime Environment:**
   - Node.js 20+ installed on the test bench, or test station USB drive plugged into the machine.

---

## 3. Automated Factory Test Execution Protocol

Qualification runs can be executed using the automated test station script or directly via the `hw-qual-cli` binary.

### 3.1 Option A: One-Click Test Station Launcher
On the target machine, run:
```bash
# On Linux / Ubuntu / WSL2 test bench:
./scripts/partner-test-station.sh

# On Windows test bench:
.\scripts\partner-test-station.bat
```

### 3.2 Option B: Direct CLI Invocation
```bash
# Step 1: Query local physical machine environment and cryptographic fingerprint
npx hw-qual env

# Step 2: Execute qualification benchmark for customer target workload
npx hw-qual run --archetype enterprise-rag

# Step 3: Or qualify against a custom customer workload exported from Web UI
npx hw-qual run --spec /path/to/customer-workload.json
```

---

## 4. The 4-Point Acceptance Audit Criteria

Every run evaluates four strict operational criteria. All 4 must pass for the machine to receive `QUALIFIED` status:

| Audit Gate | Criterion | Target Threshold | Disqualification Action |
| :--- | :--- | :--- | :--- |
| **1. Memory Fit** | Peak VRAM Watermark $\le$ Installed Capacity | $VRAM_{\text{peak}} \le VRAM_{\text{physical}}$ | Upgrade GPU VRAM tier (e.g. 24GB to 48GB) or apply INT8/INT4 quantization. |
| **2. TTFT SLA** | Time-To-First-Token P95 Latency | $\le \text{Customer Target SLA}$ (e.g. 600ms) | Check PCIe link width; verify FlashAttention 2 kernel is active. |
| **3. ITL SLA** | Inter-Token Latency (TPOT) P95 | $\le \text{Customer Target SLA}$ (e.g. 35ms) | Verify memory bandwidth; reduce stream concurrency if saturated. |
| **4. Reliability** | CUDA Out-of-Memory & Request Failures | Exactly 0 OOMs, 0 failed requests | Investigate driver stability, GPU PCIe bus power, or thermal crash. |

---

## 5. Failure Remediation Procedures

If a factory qualification run fails, technicians must consult the following decision matrix before disassembling hardware:

### Symptom 1: Memory Fit Failure or CUDA OOM
* **Cause:** The active workload concurrency ($\times$ prompt length) generated a KV-cache footprint that exceeded physical GPU VRAM.
* **Remediation:**
  1. Check if KV-cache quantization is enabled in the workload spec (`FP16` vs `INT8`).
  2. For 70B parameter models, verify that 4-bit weight quantization (AWQ/GPTQ) is selected.
  3. If unquantized serving is required, route the order to a dual-GPU or server configuration (e.g. Dual RTX 4090 or L40S 48GB).

### Symptom 2: TTFT Latency SLA Breach
* **Cause:** Prompt pre-fill processing is lagging behind customer requirements.
* **Remediation:**
  1. Inspect `pcie.link.gen.current` in `nvidia-smi`. If running below Gen 4, inspect the PCIe slot connection or motherboard BIOS bifurcation setting.
  2. Check CPU utilization. A single-threaded CPU bottleneck during tokenization will manifest as inflated TTFT.

### Symptom 3: Thermal Throttling ($\ge 83^\circ\text{C}$)
* **Cause:** GPU core temperature reached the thermal throttle threshold, causing the GPU clock frequency to drop by $30\text{--}50\%$.
* **Remediation:**
  1. Inspect GPU heatsink mounting pressure and thermal paste application.
  2. In dual-GPU configurations, verify that there is at least a 2-slot gap between cards or install blower-style cooler shrouds.

---

## 6. Commercial Profit-Sharing & Negotiation Checklist

Before finalizing customer delivery contracts under a profit-sharing model with the Chinese manufacturing partner, the following commercial terms must be documented and signed:

### Commercial Agreement Checklist
1. **Revenue vs. Margin Definition:**
   - Is compensation calculated as a percentage of gross machine sale price, net margin over bill-of-materials (BOM), or a fixed software license fee per qualified machine (e.g., \$150--\$350 per workstation, \$800--\$1,500 per server)?
   - *Recommendation:* Fixed per-unit qualification license fee + percentage of maintenance/upgrade contracts.
2. **Customer Contract & Billing Ownership:**
   - Who invoices the end customer?
   - In international sales (US/EU/APAC), who handles import tariffs, VAT, and customs clearance?
3. **Warranty & Liability Allocation:**
   - Hardware component defects (GPU failure, power supply, fan failure) are the exclusive liability of the manufacturing partner.
   - The software qualification certificate attests to benchmark performance at the factory test date; performance under customer-modified software environments is excluded.
4. **Data Ownership & Privacy:**
   - All machine telemetry and qualification runs remain confidential between partner and customer. No proprietary model weights or customer prompt data are collected.
5. **Branding & Placement:**
   - Shipped systems bear the co-branded "Certified by Antigravity Hardware Qualification Engine" seal on the shipping box and physical chassis badge.
