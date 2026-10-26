# Phase 6 Context: Central Fleet Gateway & Rig Telemetry Relay

## Context & Objectives
Phase 6 establishes the cloud gateway and communication backbone for Milestone 2. It connects physical hardware workstations and servers running on the factory floor with remote monitors and the central operations dashboard.

## Requirements Addressed
- **GW-01**: Central Fastify WebSocket gateway handling concurrent persistent connections from physical test rigs and live monitor clients.
- **GW-02**: Rig registration and cryptographic pairing handshake (6-digit PIN and session token validation).
- **GW-03**: Streaming telemetry ingestion pipeline validating `GpuTelemetryFrame` schemas with under 50ms broadcast latency.
- **GW-04**: PostgreSQL persistence with Drizzle ORM storing machine inventory, qualification runs, time-series telemetry snapshots, and factory acceptance certificates.
- **GW-05**: REST & WebSocket API endpoints for rig heartbeat, status querying, remote benchmark job dispatching, and emergency abort signals.

## Architecture Decisions
1. **Fastify + `@fastify/websocket`**: Selected for low memory footprint and high throughput; capable of streaming 100ms telemetry frames across dozens of factory rigs simultaneously.
2. **Dual-Channel WebSocket Design**:
   - Ingestion Channel: `/ws/rigs/:rigId/stream` (Desktop daemon pushes live NVML telemetry and job progress).
   - Broadcast Channel: `/ws/rigs/:rigId/watch` (Web dashboard & mobile app subscribe to real-time telemetry).
   - Fleet Channel: `/ws/fleet/live` (Fleet-wide presence and status summary).
3. **Database Flexibility**: Drizzle ORM client supports standard PostgreSQL while providing an in-memory fallback for local development or CI environments where a live database container is not running.
4. **Resilient Pairing Protocol**: 6-digit PIN pairing with 15-minute expiration and 30-day session tokens allows factory floor technicians to walk up to any physical rig, read the PIN, and pair instantly.

## Target Files
- `apps/server/src/index.ts`: Fastify server, WebSocket handlers, and route registrations.
- `apps/server/src/fleet-manager.ts`: Presence tracking, active socket maps, and heartbeat monitors.
- `apps/server/src/db/schema.ts`: Drizzle ORM tables (`rigs`, `qualificationBatches`, `qualificationRuns`, `telemetrySnapshots`).
- `apps/server/src/db/client.ts`: Connection pool and storage abstraction.
- `packages/protocol/src/`: Updated message schemas for job dispatching and progress events.
- `apps/server/__tests__/`: Integration tests for relay, pairing, and dispatching.
