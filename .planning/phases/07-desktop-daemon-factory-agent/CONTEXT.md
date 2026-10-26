# Phase 7 Context: Desktop Daemon & Automated Factory Test Agent

## Context & Objectives
Phase 7 implements the physical on-machine agent in `apps/desktop` (Tauri 2.0 Rust + React). It acts as the local worker running on workstations and servers on the OEM factory floor, polling physical sensors, executing qualification benchmarks, and streaming telemetry back to the cloud gateway.

## Requirements Addressed
- **DSK-01**: Lightweight native desktop agent with system tray integration and auto-start capability.
- **DSK-02**: Background hardware sensor loop continuously polling physical GPU metrics (VRAM, clock, temperature, fan speed, power) across single-GPU and multi-GPU rigs.
- **DSK-03**: Remote job executor receiving benchmark job dispatches from the cloud gateway, spawning `hw-qual-cli` locally, and streaming live progress back to the server.
- **DSK-04**: Offline resilience: local telemetry and run buffering when disconnected, automatically synchronizing upon network restoration.
- **DSK-05**: Local test station GUI with quick 1-click qualification run launcher and PIN pairing display.

## Target Files
- `apps/desktop/src/sensor-service.ts`: Continuous hardware sensor loop and telemetry assembler.
- `apps/desktop/src/cloud-streamer.ts`: WebSocket client streaming frames to `/ws/rigs/:rigId/stream`.
- `apps/desktop/src/job-worker.ts`: Remote qualification benchmark execution worker.
- `apps/desktop/src/App.tsx`: Factory test station dashboard with live meters, PIN pairing card, and quick run launcher.
- `apps/desktop/__tests__/`: Unit and integration test suites.
