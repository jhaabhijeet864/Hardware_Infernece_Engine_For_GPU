# User Acceptance Testing (UAT) & Verification Audit Report

**Date**: 2026-10-26  
**Project**: Hardware Inference & Qualification Monorepo Ecosystem  
**Milestone**: Milestone 1 & Monorepo Expansion  
**Commit Baseline**: `fc15bc5` / `63e10ce`  

---

## 1. Executive Summary

A comprehensive cross-phase audit was conducted across all 5 qualification phases and the 3 client applications (`apps/desktop`, `apps/server`, `apps/mobile`) and 6 shared packages (`packages/*`).

- **Total Assessed Capabilities**: 28
- **Automated Verification Pass Rate**: 100% (8 test suites, 26 unit & integration tests)
- **Testable Now (Interactive / Human UAT)**: 14 items
- **Needs Prerequisites (Hardware / Mobile / Server)**: 8 items
- **Stale / Obsolete**: 0 items (100% active codebase alignment)

---

## 2. Capabilities & UAT Status Matrix

### Testable Now (Interactive Web & Local CLI)
| # | Phase / Module | Feature / Capability | Expected Acceptance Behavior | Status |
|---|---|---|---|---|
| 1 | Phase 1 (Engine) | Architectural KV Cache Math | DeepSeek MLA shows 0.27 GiB at 4k; Llama 3.1 8B GQA shows 1.00 GiB; GiB vs GB displayed correctly | Active |
| 2 | Phase 1 (Engine) | Unit Disambiguation | Memory labels specify GiB (binary $1024^3$) with decimal GB comparisons | Active |
| 3 | Phase 2 (Workload) | Dual-Boundary Sizing | P50 prompt/gen displays typical operating memory; P99 displays peak stress boundary | Active |
| 4 | Phase 2 (Workload) | Concurrency vs Registered Users | Concurrency slider adjusts active client streams, warning on single-GPU overflow | Active |
| 5 | Phase 2 (Workload) | Tensor Parallelism Selector | User can select TP=1, 2, 4, 8, splitting weights and KV cache across GPUs | Active |
| 6 | Phase 3 (CLI) | Local Hardware Probe | `npx hw-qual env` outputs exact physical GPU model, driver, CUDA, CPU, RAM, and SHA-256 hash | Active |
| 7 | Phase 3 (CLI) | Simulated Qualification Run | `npx hw-qual run --archetype enterprise-rag --simulate` executes benchmark and emits bundle | Active |
| 8 | Phase 4 (Acceptance)| Drag-and-Drop Ingestion | Dragging or selecting `qualification-run.json` loads verified empirical metrics immediately | Active |
| 9 | Phase 4 (Acceptance)| Pre-loaded Reference Fixtures | Switching between RTX 4090 (Pass), RTX 2050 (Fail), and L40S (Pass) updates delta cards | Active |
| 10| Phase 4 (Acceptance)| Print-Ready Acceptance Cert | Clicking Print invokes browser print dialog with clean, chromeless certificate styling | Active |
| 11| Phase 5 (Partner) | OEM Decision Matrix Tab | Workload matches pre-qualified partner machines with optimal/plausible status and headroom | Active |
| 12| Phase 5 (Partner) | OEM Co-Branding Modal | Gear icon opens modal; Shenzhen preset updates company name, facility, and warranty clause | Active |
| 13| Phase 5 (Partner) | Scientific Documentation Dialog | Question mark icon in header opens formula guide and benchmark specifications | Active |
| 14| Packages (Shared) | Zero-error Monorepo Build | `turbo run build` / `npm run build` compiles all workspaces without TypeScript errors | Active |

---

### Needs Prerequisites (Physical Hardware, Daemons, Mobile)
| # | Module | Feature | Prerequisite Needed | Expected Behavior When Met |
|---|---|---|---|---|
| 15| Phase 3 (CLI) | Live vLLM Serving Benchmark | NVIDIA GPU with Docker / Python vLLM runtime | `npx hw-qual run` streams actual vLLM throughput & percentiles |
| 16| Phase 5 (Pilot) | Automated Factory Station | Physical Windows/Linux test bench | `scripts/partner-test-station.bat` generates qualification artifacts |
| 17| Desktop Agent | Tauri 2.0 System Tray Daemon | Rust toolchain (`cargo`), WebView2 runtime | System tray icon appears with context menu & live NVML sensor feed |
| 18| Desktop Agent | Native VRAM Purge IPC | Running PyTorch / CUDA processes | Invoking purge commands flushes PyTorch CUDA caching allocator |
| 19| Cloud Server | Fastify WebSocket Relay | Node.js process / Docker container | WebSocket connection at `/ws/rigs/:id/telemetry` relays live frames |
| 20| Cloud Server | PostgreSQL DB Schema | PostgreSQL 16 instance | Drizzle ORM migrations persist rig telemetry and qualification runs |
| 21| Cloud Server | Signed Killswitch | Active client with HMAC SHA-256 secret | Dispatches emergency halt command with $\le 5$s timestamp validation |
| 22| Mobile App | Expo React Native HUD | Mobile device with Expo Go / EAS build | Animated cyber dials render live VRAM/temp with haptic kill switch |

---

## 3. Prioritized Human UAT Test Plan

### Group 1: Workload Sizing & Multi-GPU Tensor Parallelism (Browser)
**Prerequisites**: Web application running (`npm run dev` or `dist/` preview).

1. **Verify Architectural Workload Sizing**:
   - Navigate to **1. Workload Sizing** tab.
   - Select Archetype: `Autonomous Agentic Reasoner (Llama 3.3 70B)`.
   - Observe the Tensor Parallelism panel: Recommendation should display `TP ≥ 2 for Meta Llama 3.3 70B`.
   - Toggle `TP = 2` and `TP = 4`:
     - Expected: Per-GPU VRAM requirement drops accordingly (e.g. from ~70 GiB at TP=2 to ~37 GiB at TP=4).
     - Expected: Hardware Matchmaker automatically updates to recommend `2x NVIDIA RTX 4090` or `2x NVIDIA L40S`.

2. **Verify Concurrency & Headroom Alerts**:
   - Select `Enterprise RAG & Document QA`.
   - Drag Concurrency slider from 8 to 64 active streams.
   - Expected: KV Cache memory occupancy increases linearly; total VRAM warning displays when exceeding single 24GB GPU bounds.

---

### Group 2: Hardware Acceptance & Certification (Browser)
**Prerequisites**: Web application running.

3. **Verify Reference Fixture Ingestion & Verdict Switching**:
   - Navigate to **2. Acceptance Reports** tab.
   - Click preset button: `RTX 2050 Entry Laptop (FAIL)`.
   - Expected: Active status badge displays `FAIL`; delta card shows `VRAM Exhausted: 100%`, `18 OOM Errors`, Goodput gauge turns red (42%).
   - Click preset button: `RTX 4090 Workstation (PASS)`.
   - Expected: Status badge updates to `PASS`; delta card shows `Headroom: +6.2 GiB`, TTFT margin `+319 ms`, Goodput turns emerald (98.5%).

4. **Verify OEM Co-Branding & Delivery Acceptance Certificate**:
   - Scroll down to the **Hardware Acceptance Certificate**.
   - Click **OEM Co-Branding** button (or header Gear icon).
   - In modal, click **Shenzhen Hardware Partner** preset.
   - Click **Apply Co-Branding**.
   - Expected: Certificate header reflects `SHENZHEN PRECISION AI HARDWARE CO.`, facility location updates to `Bao'an High-Tech Industrial Park`, and official warranty clause updates.
   - Click **Print / Export PDF**:
     - Expected: Browser print preview renders clean, high-contrast, black-and-white certificate with zero navigation chrome or buttons.

---

### Group 3: OEM Hardware Decision Matrix (Browser)
**Prerequisites**: Web application running.

5. **Verify Partner Machine Recommendations**:
   - Navigate to **3. OEM Matrix** tab.
   - Observe recommended physical architectures:
     - Expected: Categorized into `Optimal Configurations` and `Alternative / High-Density Options`.
     - Expected: Each card displays GPU count, form factor, power envelope, expected TTFT, and computed VRAM headroom.

---

### Group 4: Local Hardware CLI Runner (Terminal)
**Prerequisites**: Local terminal with Node.js.

6. **Verify Physical Hardware Inspection**:
   - Run: `npm run hw-qual -- env`
   - Expected: Terminal prints detected physical GPU topology (or Apple Silicon / fallback), driver version, host CPU, RAM, and SHA-256 machine hash.

7. **Verify Headless Benchmark Simulation**:
   - Run: `npm run hw-qual -- run --archetype enterprise-rag --simulate`
   - Expected: CLI executes simulated telemetry polling, evaluates the 4-point SLA checklist, and saves JSON bundle into `qualification_artifacts/`.
