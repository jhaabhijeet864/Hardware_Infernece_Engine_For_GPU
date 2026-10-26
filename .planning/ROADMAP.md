# Roadmap: Local AI Hardware Qualification Suite

## Completed Milestones
- **[Milestone v1.0: Foundation & Scientific Integrity](milestones/v1.0-ROADMAP.md)** — Decoupled mathematical calculation engine, dual-boundary workload sizing, local benchmark runner CLI (`hw-qual-cli`), side-by-side delta analysis, official acceptance certificate, and OEM partner machine matrix with factory pilot runbook. (Shipped: 2026-10-26, 100% verified, 8/8 test suites passing).

---

## Active Milestone: v2.0 — Real-Time Rig Telemetry & Live Fleet Qualification Platform

### Phase 6: Central Fleet Gateway & Rig Telemetry Relay
**Focus**: Server-side WebSocket streaming relay, machine pairing, and PostgreSQL persistence.
- [ ] **6.1 WebSocket Gateway & Connection Manager**:
  - Implement Fastify WebSocket gateway with live subscription routing in `apps/server/src/index.ts`.
  - Handle rig registration, heartbeat ping/pong, and multi-client broadcast.
- [ ] **6.2 Database Schema & Drizzle ORM Setup**:
  - Define PostgreSQL schema for physical machines, active qualification jobs, telemetry time-series, and acceptance certificates.
- [ ] **6.3 REST & Command Dispatch Endpoints**:
  - Implement endpoints for remote benchmark job dispatching, pairing verification (6-digit PIN), cloud arbitrage pricing, and emergency abort.
- [ ] **6.4 Verification**:
  - Integration tests for WebSocket message propagation, pairing handshakes, and database persistence.

### Phase 7: Desktop Daemon & Automated Factory Test Agent
**Focus**: Native background agent, continuous hardware sensor loop, and remote benchmark job runner.
- [ ] **7.1 Native Desktop Sensor Core**:
  - Implement continuous NVML and system metric polling in `apps/desktop` (single and multi-GPU telemetry).
  - System tray icon and auto-start configuration.
- [ ] **7.2 Remote Job Execution Worker**:
  - Listen for cloud dispatch commands, invoke `hw-qual-cli` locally with specified workload arguments, and pipe stdout/telemetry live back to the server.
- [ ] **7.3 Local GUI & Pairing Display**:
  - Desktop control panel showing local rig status, live telemetry meters, and 6-digit PIN pairing code for mobile connection.
- [ ] **7.4 Verification**:
  - End-to-end execution of remote benchmark dispatch and live telemetry streaming from desktop to server.

### Phase 8: Live Fleet Management Cockpit & Batch Acceptance UI
**Focus**: Web and desktop operations center for factory test stations.
- [ ] **8.1 Multi-Rig Fleet Grid**:
  - Real-time fleet dashboard in `src/components/` and `@hardware-inference/ui` showing all connected workstations and servers with live status indicators.
- [ ] **8.2 Real-Time Telemetry Dials & Time-Series Charts**:
  - Live charts for VRAM, GPU utilization, temperature, power, and token throughput streaming over WebSockets via `@hardware-inference/api-client`.
- [ ] **8.3 Batch Qualification Dispatcher**:
  - UI modal to select multiple connected rigs, configure workload, and launch concurrent qualification runs across the factory floor.
- [ ] **8.4 Unified Factory Delivery Acceptance View**:
  - Aggregated pass/fail status view with instant certificate generation and cloud link sharing.
- [ ] **8.5 Verification**:
  - End-to-end testing of batch dispatch and real-time chart updating in the web browser.

### Phase 9: Mobile Rig Monitor & Remote Factory Alerts
**Focus**: Mobile companion app for factory floor technicians and remote monitoring.
- [ ] **9.1 Mobile Telemetry Gauge Cluster**:
  - Expo React Native application in `apps/mobile` rendering hardware dials (VRAM, thermal load, fan speed, power).
- [ ] **9.2 Instant Pairing & Machine Scanning**:
  - 6-digit PIN entry and QR code scanner to bind mobile device to a physical workstation.
- [ ] **9.3 Critical Alerting & Emergency Kill Switch**:
  - Push notifications on thermal throttling or OOM crashes, with a one-tap emergency halt button aborting running benchmarks.
- [ ] **9.4 Verification**:
  - Test pairing flow, live telemetry streaming, and emergency halt signal over WebSockets.
