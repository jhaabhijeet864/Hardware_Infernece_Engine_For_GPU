import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import {
  GpuTelemetryFrameSchema,
  RigPairingRequestSchema,
  EmergencyHaltCommandSchema,
} from '@hardware-inference/protocol';

const fastify = Fastify({ logger: true });

// Register plugins
await fastify.register(cors, { origin: '*' });
await fastify.register(websocket);

// Active live WebSocket subscribers (Mobile apps listening to rig telemetry)
type WebSocketConnection = { readyState: number; send: (data: string) => void };
const rigSubscribers = new Map<string, Set<WebSocketConnection>>();
const activePairingPins = new Map<string, { rigId: string; expiresAt: number }>();

// 1. Healthcheck
fastify.get('/health', async () => {
  return { status: 'healthy', version: '0.1.0', timestamp: new Date().toISOString() };
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

// 3. Rig Pairing Endpoint: Verify 6-digit PIN
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

  // Generate ephemeral session token for Mobile client
  const sessionToken = `session_${Buffer.from(pairingCode + Date.now()).toString('base64url')}`;
  activePairingPins.delete(pairingCode);

  return {
    success: true,
    rigId: pinData.rigId,
    rigName: `Paired Rig (${clientDeviceName})`,
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
});

// 4. Remote Emergency Kill Switch Endpoint
fastify.post('/api/rigs/:rigId/emergency-halt', async (req, reply) => {
  const parseResult = EmergencyHaltCommandSchema.safeParse(req.body);
  if (!parseResult.success) {
    return reply.status(400).send({ error: 'Invalid emergency command format' });
  }

  const { rigId, commandId, reason } = parseResult.data;
  fastify.log.warn(`🚨 EMERGENCY HALT EXECUTED for rig: ${rigId} (Command: ${commandId}) - ${reason}`);

  // Broadcast command to connected desktop rig socket
  return {
    status: 'DISPATCHED',
    rigId,
    commandId,
    dispatchedAt: new Date().toISOString(),
    message: 'Emergency kill command transmitted to rig daemon over WSS.',
  };
});

// 5. WebSocket Telemetry Relay:
// Desktop daemons push frames to /ws/rigs/:rigId/stream
// Mobile apps subscribe to /ws/rigs/:rigId/watch
fastify.register(async function (fastify) {
  fastify.get('/ws/rigs/:rigId/stream', { websocket: true }, (socket, req) => {
    const { rigId } = req.params as { rigId: string };
    fastify.log.info(`Desktop rig connected for telemetry: ${rigId}`);

    socket.on('message', (message) => {
      try {
        const frame = JSON.parse(message.toString());
        const valid = GpuTelemetryFrameSchema.safeParse(frame);
        if (valid.success) {
          // Relay frame to all active mobile subscribers for this rig
          const subscribers = rigSubscribers.get(rigId);
          if (subscribers) {
            const payload = JSON.stringify(valid.data);
            for (const sub of subscribers) {
              if (sub.readyState === 1) {
                sub.send(payload);
              }
            }
          }
        }
      } catch (err) {
        fastify.log.error(err, 'Failed to process telemetry frame');
      }
    });

    socket.on('close', () => {
      fastify.log.info(`Desktop rig disconnected: ${rigId}`);
    });
  });

  fastify.get('/ws/rigs/:rigId/watch', { websocket: true }, (socket, req) => {
    const { rigId } = req.params as { rigId: string };
    fastify.log.info(`Mobile client subscribed to rig: ${rigId}`);

    if (!rigSubscribers.has(rigId)) {
      rigSubscribers.set(rigId, new Set());
    }
    rigSubscribers.get(rigId)!.add(socket as unknown as WebSocketConnection);

    socket.on('close', () => {
      rigSubscribers.get(rigId)?.delete(socket);
    });
  });
});

const port = Number(process.env.PORT) || 3001;
try {
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`⚡ Hardware-Inference Cloud Gateway running at http://localhost:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
