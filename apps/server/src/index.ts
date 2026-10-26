import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import crypto from 'node:crypto';
import {
  GpuTelemetryFrameSchema,
  RigPairingRequestSchema,
  EmergencyHaltCommandSchema,
  RigRegistrationRequestSchema,
  QualificationJobDispatchSchema,
  JobProgressEventSchema,
} from '@hardware-inference/protocol';
import { FleetManager, WebSocketConnection } from './fleet-manager.js';
import { getDatabaseClient } from './db/client.js';

export const fastify = Fastify({ logger: false });
export const fleetManager = new FleetManager();
export const dbClient = getDatabaseClient();

// In-memory batch & run history
export interface StoredQualificationRun {
  runId: string;
  rigId: string;
  batchId?: string;
  modelId: string;
  overallVerdict: 'PASSED' | 'FAILED';
  peakVramGiB: number;
  ttftP95Ms: number;
  itlP95Ms: number;
  goodputPct: number;
  oomCount: number;
  bundleJson: any;
  createdAt: number;
}

export interface StoredBatchRecord {
  id: string;
  name: string;
  workloadArchetype: string;
  targetSla: { maxTtftMs: number; maxItlMs: number };
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalRigsCount: number;
  completedRigsCount: number;
  passedRigsCount: number;
  dispatchedAt: number;
  completedAt?: number;
  rigIds: string[];
}

const activeBatches = new Map<string, StoredBatchRecord>();
const qualificationRunStore = new Map<string, StoredQualificationRun>();
const activePairingPins = new Map<string, { rigId: string; expiresAt: number }>();
const rigSubscribers = new Map<string, Set<WebSocketConnection>>();

// Register Fastify plugins
await fastify.register(cors, { origin: '*' });
await fastify.register(websocket);

// 1. Healthcheck
fastify.get('/health', async () => {
  return {
    status: 'healthy',
    version: '0.2.0',
    milestone: 'v2.0 - Live Fleet Platform',
    onlineRigsCount: fleetManager.getAllRigs().filter((r) => r.isOnline).length,
    timestamp: new Date().toISOString(),
  };
});

// 2. Cloud Arbitrage Pricing Index
fastify.get('/api/arbitrage/prices', async () => {
  return {
    updatedAt: new Date().toISOString(),
    providers: [
      {
        provider: 'SaladCloud (Consumer Pool)',
        gpu: 'RTX 4090 (24GB)',
        pricePerHourUsd: 0.28,
        availability: 'High',
        bandwidthType: 'Consumer PCIe',
      },
      {
        provider: 'RunPod Community Cloud',
        gpu: 'RTX 4090 (24GB)',
        pricePerHourUsd: 0.44,
        availability: 'Medium',
        bandwidthType: 'Data Center',
      },
      {
        provider: 'RunPod Secure Cloud',
        gpu: 'NVIDIA H100 SXM (80GB)',
        pricePerHourUsd: 2.39,
        availability: 'High',
        bandwidthType: 'HBM3 3.35 TB/s',
      },
      {
        provider: 'AWS EC2 (p5.48xlarge)',
        gpu: '8x NVIDIA H100 SXM',
        pricePerHourUsd: 32.77,
        availability: 'Reserved / On-Demand',
        bandwidthType: 'NVLink 900 GB/s',
      },
      {
        provider: 'Local Connected Desktop Rig',
        gpu: 'Detected Local Hardware',
        pricePerHourUsd: 0.00,
        availability: 'Instant',
        bandwidthType: 'Local Direct Bus',
      },
    ],
  };
});

// 3. Rig Registration Endpoint
fastify.post('/api/rigs/register', async (req, reply) => {
  const parseResult = RigRegistrationRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      error: 'Invalid rig registration request format',
      details: parseResult.error.format(),
    });
  }

  const { rigId, apiKey } = fleetManager.registerRig(parseResult.data);
  return reply.status(201).send({
    success: true,
    rigId,
    apiKey,
    message: 'Machine registered into factory fleet registry.',
  });
});

// 4. Fleet Machine Inventory Endpoints
fastify.get('/api/rigs', async () => {
  return {
    count: fleetManager.getAllRigs().length,
    rigs: fleetManager.getAllRigs(),
  };
});

fastify.get('/api/rigs/:rigId', async (req, reply) => {
  const { rigId } = req.params as { rigId: string };
  const rig = fleetManager.getRig(rigId);
  if (!rig) {
    return reply.status(404).send({ error: `Rig ${rigId} not found in fleet registry` });
  }
  return rig;
});

fastify.post('/api/rigs/:rigId/heartbeat', async (req, reply) => {
  const { rigId } = req.params as { rigId: string };
  const body = req.body as { status?: any; currentJobId?: string } | undefined;
  const ok = fleetManager.recordHeartbeat(rigId, body?.status, body?.currentJobId);

  if (!ok) {
    return reply.status(404).send({ error: `Rig ${rigId} not registered` });
  }
  return { success: true, timestamp: Date.now() };
});

// 5. Generate 6-digit PIN for Rig Pairing
fastify.post('/api/rigs/:rigId/pin', async (req, reply) => {
  const { rigId } = req.params as { rigId: string };
  const rig = fleetManager.getRig(rigId);
  if (!rig) {
    return reply.status(404).send({ error: `Rig ${rigId} not found` });
  }

  // 6-digit numeric PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  activePairingPins.set(pin, { rigId, expiresAt: Date.now() + 15 * 60 * 1000 }); // 15 min

  return {
    pairingCode: pin,
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
});

// 6. Verify 6-digit PIN Pairing Handshake
fastify.post('/api/pairing/verify', async (req, reply) => {
  const parseResult = RigPairingRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return reply.status(400).send({ error: 'Invalid pairing request payload' });
  }

  const { pairingCode, clientDeviceName } = parseResult.data;
  const pinData = activePairingPins.get(pairingCode);

  if (!pinData || pinData.expiresAt < Date.now()) {
    return reply.status(404).send({ error: 'Pairing PIN expired or invalid' });
  }

  const rig = fleetManager.getRig(pinData.rigId);
  const sessionToken = `session_${Buffer.from(pairingCode + Date.now()).toString('base64url')}`;
  activePairingPins.delete(pairingCode);

  return {
    success: true,
    rigId: pinData.rigId,
    rigName: rig?.name || `Paired Rig (${clientDeviceName})`,
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
});

// 7. Single Qualification Job Dispatch
fastify.post('/api/jobs/dispatch', async (req, reply) => {
  const parseResult = QualificationJobDispatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      error: 'Invalid qualification job dispatch format',
      details: parseResult.error.format(),
    });
  }

  const job = parseResult.data;
  const rigRecord = fleetManager.getRigRecord(job.targetRigId);

  if (!rigRecord) {
    return reply.status(404).send({ error: `Target rig ${job.targetRigId} not registered` });
  }

  fleetManager.updateRigStatus(job.targetRigId, 'BENCHMARKING', job.jobId);

  // Transmit dispatch command over WebSocket if connected
  if (rigRecord.socket && rigRecord.socket.readyState === 1) {
    rigRecord.socket.send(JSON.stringify({
      type: 'EXECUTE_JOB',
      job,
    }));
  }

  // Broadcast progress initial event
  broadcastToRigSubscribers(job.targetRigId, {
    type: 'JOB_PROGRESS',
    event: {
      jobId: job.jobId,
      rigId: job.targetRigId,
      status: 'INITIALIZING',
      progressPct: 0,
      timestamp: Date.now(),
    },
  });

  return reply.status(202).send({
    status: 'DISPATCHED',
    jobId: job.jobId,
    rigId: job.targetRigId,
    isSocketConnected: Boolean(rigRecord.socket && rigRecord.socket.readyState === 1),
  });
});

// 8. Multi-Machine Batch Dispatch
fastify.post('/api/batches/dispatch', async (req, reply) => {
  const body = req.body as {
    name?: string;
    workloadArchetype: string;
    modelId?: string;
    targetRigIds: string[];
    sla?: { maxTtftMs: number; maxItlMs: number };
  };

  if (!body.targetRigIds || body.targetRigIds.length === 0) {
    return reply.status(400).send({ error: 'targetRigIds array is required' });
  }

  const batchId = crypto.randomUUID();
  const batchRecord: StoredBatchRecord = {
    id: batchId,
    name: body.name || `Batch-${new Date().toISOString().slice(0, 10)}`,
    workloadArchetype: body.workloadArchetype || 'enterprise-rag',
    targetSla: body.sla || { maxTtftMs: 500, maxItlMs: 35 },
    status: 'RUNNING',
    totalRigsCount: body.targetRigIds.length,
    completedRigsCount: 0,
    passedRigsCount: 0,
    dispatchedAt: Date.now(),
    rigIds: body.targetRigIds,
  };

  activeBatches.set(batchId, batchRecord);

  // Dispatch individual jobs to each rig
  for (const rigId of body.targetRigIds) {
    const jobId = crypto.randomUUID();
    const jobPayload = {
      jobId,
      batchId,
      targetRigId: rigId,
      workloadArchetype: batchRecord.workloadArchetype,
      modelId: body.modelId || 'meta-llama/Llama-3.1-8B-Instruct',
      precision: 'FP16',
      promptTokens: 4096,
      genTokens: 512,
      concurrency: 8,
      sla: batchRecord.targetSla,
      timeoutSeconds: 600,
    };

    const rigRecord = fleetManager.getRigRecord(rigId);
    if (rigRecord) {
      fleetManager.updateRigStatus(rigId, 'BENCHMARKING', jobId);
      if (rigRecord.socket && rigRecord.socket.readyState === 1) {
        rigRecord.socket.send(JSON.stringify({ type: 'EXECUTE_JOB', job: jobPayload }));
      }
    }
  }

  return reply.status(202).send({
    status: 'DISPATCHED',
    batchId,
    totalDispatched: body.targetRigIds.length,
  });
});

fastify.get('/api/batches', async () => {
  return Array.from(activeBatches.values());
});

fastify.get('/api/batches/:batchId', async (req, reply) => {
  const { batchId } = req.params as { batchId: string };
  const batch = activeBatches.get(batchId);
  if (!batch) {
    return reply.status(404).send({ error: `Batch ${batchId} not found` });
  }
  const runs = Array.from(qualificationRunStore.values()).filter((r) => r.batchId === batchId);
  return { ...batch, runs };
});

// 9. Completed Qualification Bundle Upload
fastify.post('/api/rigs/:rigId/runs', async (req, reply) => {
  const { rigId } = req.params as { rigId: string };
  const bundle = req.body as any;

  if (!bundle || !bundle.qualification_verdict) {
    return reply.status(400).send({ error: 'Invalid qualification run bundle payload' });
  }

  const runId = bundle.metadata?.run_id || `run_${Date.now()}`;
  const verdict = bundle.qualification_verdict.overall as 'PASSED' | 'FAILED';
  const peakVramGiB = bundle.telemetry?.peak_vram_gib || 0;
  const ttftP95Ms = bundle.measured_metrics?.ttft_ms?.p95 || 0;
  const itlP95Ms = bundle.measured_metrics?.itl_ms?.p95 || 0;
  const goodputPct = bundle.measured_metrics?.goodput_pct || 100;
  const oomCount = bundle.measured_metrics?.oom_count || 0;

  const storedRun: StoredQualificationRun = {
    runId,
    rigId,
    batchId: bundle.metadata?.batch_id,
    modelId: bundle.workload_spec?.model_id || 'Unknown',
    overallVerdict: verdict,
    peakVramGiB,
    ttftP95Ms,
    itlP95Ms,
    goodputPct,
    oomCount,
    bundleJson: bundle,
    createdAt: Date.now(),
  };

  qualificationRunStore.set(runId, storedRun);
  fleetManager.updateRigStatus(rigId, 'IDLE', null);

  // If part of a batch, update batch progress
  if (storedRun.batchId) {
    const batch = activeBatches.get(storedRun.batchId);
    if (batch) {
      batch.completedRigsCount++;
      if (verdict === 'PASSED') batch.passedRigsCount++;
      if (batch.completedRigsCount >= batch.totalRigsCount) {
        batch.status = batch.passedRigsCount === batch.totalRigsCount ? 'COMPLETED' : 'FAILED';
        batch.completedAt = Date.now();
      }
    }
  }

  return reply.status(201).send({
    success: true,
    runId,
    verdict,
    certificateUrl: `/api/runs/${runId}/certificate`,
  });
});

// 10. Remote Emergency Kill Switch
fastify.post('/api/rigs/:rigId/emergency-halt', async (req, reply) => {
  const parseResult = EmergencyHaltCommandSchema.safeParse(req.body);
  if (!parseResult.success) {
    return reply.status(400).send({ error: 'Invalid emergency command format' });
  }

  const { rigId, commandId, reason } = parseResult.data;
  fastify.log.warn(`🚨 EMERGENCY HALT EXECUTED for rig: ${rigId} (Command: ${commandId}) - ${reason}`);

  const rigRecord = fleetManager.getRigRecord(rigId);
  if (rigRecord && rigRecord.socket && rigRecord.socket.readyState === 1) {
    rigRecord.socket.send(JSON.stringify({
      type: 'EMERGENCY_HALT',
      command: parseResult.data,
    }));
  }

  fleetManager.updateRigStatus(rigId, 'IDLE', null);

  broadcastToRigSubscribers(rigId, {
    type: 'EMERGENCY_HALTED',
    rigId,
    commandId,
    reason,
    timestamp: Date.now(),
  });

  return {
    status: 'DISPATCHED',
    rigId,
    commandId,
    dispatchedAt: new Date().toISOString(),
    message: 'Emergency kill command transmitted to rig daemon over WSS.',
  };
});

// Helper: Broadcast payload to subscribers of a specific rig
function broadcastToRigSubscribers(rigId: string, data: any) {
  const subscribers = rigSubscribers.get(rigId);
  if (!subscribers) return;

  const payload = JSON.stringify(data);
  for (const sub of subscribers) {
    if (sub.readyState === 1) {
      try {
        sub.send(payload);
      } catch {
        // Ignore dead socket writes
      }
    }
  }
}

// 11. WebSocket Channels
fastify.register(async function (wsServer) {
  // Desktop Daemons push telemetry and receive jobs: /ws/rigs/:rigId/stream
  wsServer.get('/ws/rigs/:rigId/stream', { websocket: true }, (socket, req) => {
    const { rigId } = req.params as { rigId: string };
    fleetManager.connectRigSocket(rigId, socket as unknown as WebSocketConnection);

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Telemetry Frame
        if (data.type === 'TELEMETRY_FRAME' || data.gpus) {
          const valid = GpuTelemetryFrameSchema.safeParse(data);
          if (valid.success) {
            fleetManager.recordHeartbeat(rigId);
            broadcastToRigSubscribers(rigId, { type: 'TELEMETRY_FRAME', frame: valid.data });
          }
        }

        // Job Progress Event
        if (data.type === 'JOB_PROGRESS' || data.progressPct !== undefined) {
          const valid = JobProgressEventSchema.safeParse(data);
          if (valid.success) {
            broadcastToRigSubscribers(rigId, { type: 'JOB_PROGRESS', event: valid.data });
          }
        }
      } catch (err) {
        // Ignore unparseable raw bytes
      }
    });

    socket.on('close', () => {
      fleetManager.disconnectRigSocket(rigId);
    });
  });

  // Mobile apps & Web Dashboards watch a specific rig: /ws/rigs/:rigId/watch
  wsServer.get('/ws/rigs/:rigId/watch', { websocket: true }, (socket, req) => {
    const { rigId } = req.params as { rigId: string };

    if (!rigSubscribers.has(rigId)) {
      rigSubscribers.set(rigId, new Set());
    }
    rigSubscribers.get(rigId)!.add(socket as unknown as WebSocketConnection);

    socket.on('close', () => {
      rigSubscribers.get(rigId)?.delete(socket as unknown as WebSocketConnection);
    });
  });

  // Fleet Operations Cockpit watches all rigs: /ws/fleet/live
  wsServer.get('/ws/fleet/live', { websocket: true }, (socket) => {
    fleetManager.subscribeToFleet(socket as unknown as WebSocketConnection);

    socket.on('close', () => {
      fleetManager.unsubscribeFromFleet(socket as unknown as WebSocketConnection);
    });
  });
});

export async function startServer(customPort?: number) {
  const port = customPort || Number(process.env.PORT) || 3001;
  try {
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`⚡ Hardware-Inference Cloud Gateway running at http://localhost:${port}`);
    return fastify;
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Start listening only when executed directly, not during test imports
const isTestEnv = process.env.NODE_ENV === 'test';
if (!isTestEnv) {
  startServer();
}
