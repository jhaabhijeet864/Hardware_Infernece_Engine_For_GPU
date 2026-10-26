# Phase 5: Hardware Supplier Pilot & Partner Integration - Context

**Gathered:** 2026-10-26  
**Status:** Ready for execution  
**Target Audience:** Hardware suppliers, OEM system integrators (workstations, servers, edge appliances), and AI procurement teams  
**Core Milestone:** Milestone 1 - Foundation & Scientific Integrity  

<domain>
## Phase Boundary
Phase 5 establishes the practical partner integration and commercial readiness layer for hardware manufacturers and system integrators. It provides pre-configured partner machine matrices, co-branded qualification certificate templates, and a factory pilot runbook for automated pre-sales and shipping acceptance.

Key deliverables:
1. **Target Machine Matrix & Partner Profiles**: Structured hardware profile registry (`src/lib/engine/partner-matrix.ts`) modeling workstation and datacenter AI rigs (dual RTX 4090, RTX 6000 Ada, L40S, A100/H100) with known thermal limits and PCIe configurations.
2. **Co-branded Qualification Templates**: Configurable OEM customization in the web certificate (Partner Company Name, Facility Location, Custom Certification Badge, and Warranty terms).
3. **Factory Pilot Runbook & Packaging**: Comprehensive operations guide (`docs/PARTNER_PILOT_RUNBOOK.md`) providing step-by-step factory testing instructions for supplier technicians, Docker/container recipes, and commercial qualification criteria.
</domain>

<decisions>
## Implementation Decisions

### 1. Partner Machine Matrix (`src/lib/engine/partner-matrix.ts`)
- Registry of OEM reference hardware configurations:
  - `RTX-4090-DUAL`: 2x RTX 4090 (48GB total) Workstation for high-concurrency 8B/14B serving.
  - `RTX-6000-ADA`: 1x RTX 6000 Ada (48GB ECC) Professional workstation.
  - `L40S-SERVER`: 1x or 2x L40S (48GB/96GB) Enterprise rackmount server.
  - `A100-80GB-SXMS`: 1x A100 80GB Datacenter accelerator.
- Stores baseline hardware attributes (PCIe bandwidth, TDP power limits, thermal thresholds, and supported tensor parallelism factors).

### 2. OEM Co-Branding Customization (`src/components/OEMBrandingModal.tsx` & `AcceptanceCertificate.tsx`)
- Allow hardware suppliers to customize:
  - Partner Brand / Company Name (e.g. "Apex AI Systems", "Shenzhen Compute Lab")
  - Quality Assurance Facility ID / Laboratory
  - Delivery Terms & Verification Seal text
  - Custom Machine Serial Number and Inspector Title
- Persist settings via `useKV` so factory test stations retain partner branding across runs.

### 3. Factory Pilot Runbook (`docs/PARTNER_PILOT_RUNBOOK.md`)
- Detailed operational handbook for hardware partner engineers:
  - Physical machine preparation (NVIDIA drivers, CUDA, container toolkit).
  - Executing `npx hw-qual run` via automated test script or USB test suite.
  - Interpreting the 4-point verification checklist.
  - Handling fail conditions (OOM, thermal throttling, latency breaches).
  - Commercial contract terms checklist: profit-sharing, warranty boundaries, data ownership.
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md` — Strategic partnership alignment with hardware suppliers
- `.planning/REQUIREMENTS.md` — REP-04, UI-01
- `.planning/research/BENCHMARK_ADAPTER_ARCHITECTURE.md` — Provenance and telemetry architecture
</canonical_refs>
