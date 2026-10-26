# Requirements: Milestone 2 — Real-Time Rig Telemetry & Live Fleet Qualification Platform

## 1. Fleet Gateway & Telemetry Relay (GW)
- **GW-01**: Central Fastify WebSocket gateway in `apps/server` capable of handling simultaneous persistent connections from physical test rigs and live monitor clients.
- **GW-02**: Rig registration and cryptographic pairing handshake (6-digit PIN and session token validation).
- **GW-03**: Streaming telemetry ingestion pipeline validating `GpuTelemetryFrame` schemas with under 50ms broadcast latency.
- **GW-04**: PostgreSQL persistence with Drizzle ORM storing machine inventory, qualification runs, time-series telemetry snapshots, and factory acceptance certificates.
- **GW-05**: REST & WebSocket API endpoints for rig heartbeat, status querying, remote benchmark job dispatching, and emergency abort signals.

## 2. Desktop Daemon & Factory Sensor Agent (DSK)
- **DSK-01**: Lightweight native desktop agent in `apps/desktop` (Tauri 2.0 Rust + React) with system tray integration and auto-start capability.
- **DSK-02**: Background hardware sensor loop continuously polling physical GPU metrics (VRAM, clock, temperature, fan speed, power) across single-GPU and multi-GPU rigs.
- **DSK-03**: Remote job executor receiving benchmark job dispatches from the cloud gateway, spawning `hw-qual-cli` locally, and streaming live progress back to the server.
- **DSK-04**: Offline resilience: local telemetry and run buffering when disconnected, automatically synchronizing upon network restoration.
- **DSK-05**: Local test station GUI with quick 1-click qualification run launcher and PIN pairing display.

## 3. Fleet Operations Cockpit & Batch Acceptance (FLT)
- **FLT-01**: Live Fleet Operations dashboard in the web and desktop UI (`src/` / `@hardware-inference/ui`) displaying an interactive multi-rig status grid (Active, Idle, Benchmarking, Throttling, Offline).
- **FLT-02**: Real-time telemetry dials and time-series charts updating live via WebSockets (VRAM usage, temperature, power draw, token throughput).
- **FLT-03**: Batch qualification job dispatcher: select multiple connected factory workstations and trigger concurrent test runs against specified customer workloads.
- **FLT-04**: Unified factory delivery acceptance view: real-time pass/fail indicators across all rigs with instant certificate download and cloud link generation.
- **FLT-05**: Cloud arbitrage and hardware comparison index: compare on-prem rig cost and latency against cloud GPU instances (RunPod, Salad, Lambda, AWS).

## 4. Mobile Rig Companion & Remote Control (MOB)
- **MOB-01**: Cross-platform mobile application in `apps/mobile` (Expo React Native) for factory floor technicians and lab managers.
- **MOB-02**: Live hardware gauge cluster displaying real-time metrics for paired machines.
- **MOB-03**: Instant push alerts on critical hardware events: thermal throttle limit exceeded, fan failure, memory exhaustion, or benchmark completion.
- **MOB-04**: Emergency remote kill switch enabling one-tap hardware abort of runaway or overheating benchmark runs.
- **MOB-05**: QR code scanner for scanning physical machine bar codes or PINs to pair instantly with test stations.
