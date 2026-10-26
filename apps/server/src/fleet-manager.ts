import crypto from 'node:crypto';
import {
  RigStatus,
  RigRegistrationRequest,
  RigSummary,
} from '@hardware-inference/protocol';

export type WebSocketConnection = {
  readyState: number;
  send: (data: string) => void;
};

export interface RegisteredRigRecord {
  id: string;
  name: string;
  hardwareUuid: string;
  systemHash: string;
  gpuModel: string;
  gpuCount: number;
  vramTotalBytes: number;
  driverVersion: string;
  cudaVersion: string;
  pcieLink: string;
  hostCpu: string;
  hostRamBytes: number;
  partnerOrg: string;
  status: RigStatus;
  lastHeartbeatAt: number;
  apiKey: string;
  currentJobId?: string | null;
  socket?: WebSocketConnection;
}

export class FleetManager {
  private rigs = new Map<string, RegisteredRigRecord>();
  private hardwareUuidToId = new Map<string, string>();
  private fleetSubscribers = new Set<WebSocketConnection>();
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(autoStartHeartbeatCheck = true) {
    if (autoStartHeartbeatCheck) {
      this.heartbeatInterval = setInterval(() => {
        this.checkHeartbeats();
      }, 5000);
    }
  }

  public stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Register a machine into the fleet registry or update existing registration.
   */
  public registerRig(req: RigRegistrationRequest): { rigId: string; apiKey: string } {
    let rigId = this.hardwareUuidToId.get(req.hardwareUuid);
    const now = Date.now();
    const apiKey = `key_${crypto.randomBytes(16).toString('hex')}`;

    if (!rigId) {
      rigId = crypto.randomUUID();
      this.hardwareUuidToId.set(req.hardwareUuid, rigId);
    }

    const existing = this.rigs.get(rigId);

    const record: RegisteredRigRecord = {
      id: rigId,
      name: req.name || existing?.name || `Rig-${req.hardwareUuid.slice(0, 8)}`,
      hardwareUuid: req.hardwareUuid,
      systemHash: req.systemHash,
      gpuModel: req.gpuModel,
      gpuCount: req.gpuCount || 1,
      vramTotalBytes: req.vramTotalBytes,
      driverVersion: req.driverVersion,
      cudaVersion: req.cudaVersion,
      pcieLink: req.pcieLink,
      hostCpu: req.hostCpu,
      hostRamBytes: req.hostRamBytes,
      partnerOrg: req.partnerOrg || 'Shenzhen Precision AI Hardware Co.',
      status: 'IDLE',
      lastHeartbeatAt: now,
      apiKey,
      currentJobId: existing?.currentJobId || null,
      socket: existing?.socket,
    };

    this.rigs.set(rigId, record);
    this.broadcastFleetUpdate();

    return { rigId, apiKey };
  }

  /**
   * Associate an active WebSocket connection with a registered rig.
   */
  public connectRigSocket(rigId: string, socket: WebSocketConnection): boolean {
    const rig = this.rigs.get(rigId);
    if (!rig) return false;

    rig.socket = socket;
    rig.lastHeartbeatAt = Date.now();
    if (rig.status === 'OFFLINE') {
      rig.status = 'IDLE';
    }

    this.broadcastFleetUpdate();
    return true;
  }

  /**
   * Disconnect rig socket and mark offline.
   */
  public disconnectRigSocket(rigId: string) {
    const rig = this.rigs.get(rigId);
    if (rig) {
      rig.socket = undefined;
      rig.status = 'OFFLINE';
      this.broadcastFleetUpdate();
    }
  }

  /**
   * Record periodic heartbeat from rig.
   */
  public recordHeartbeat(rigId: string, status?: RigStatus, jobId?: string): boolean {
    const rig = this.rigs.get(rigId);
    if (!rig) return false;

    rig.lastHeartbeatAt = Date.now();
    if (status) rig.status = status;
    if (jobId !== undefined) rig.currentJobId = jobId;

    this.broadcastFleetUpdate();
    return true;
  }

  /**
   * Update operational status of a rig.
   */
  public updateRigStatus(rigId: string, status: RigStatus, jobId?: string | null): boolean {
    const rig = this.rigs.get(rigId);
    if (!rig) return false;

    rig.status = status;
    if (jobId !== undefined) rig.currentJobId = jobId;
    rig.lastHeartbeatAt = Date.now();

    this.broadcastFleetUpdate();
    return true;
  }

  /**
   * Retrieve summary of all registered rigs.
   */
  public getAllRigs(): RigSummary[] {
    return Array.from(this.rigs.values()).map((r) => this.toSummary(r));
  }

  /**
   * Retrieve summary for a specific rig by ID.
   */
  public getRig(rigId: string): RigSummary | undefined {
    const rig = this.rigs.get(rigId);
    return rig ? this.toSummary(rig) : undefined;
  }

  /**
   * Retrieve internal record including active socket.
   */
  public getRigRecord(rigId: string): RegisteredRigRecord | undefined {
    return this.rigs.get(rigId);
  }

  /**
   * Subscribe client socket to fleet-wide updates.
   */
  public subscribeToFleet(socket: WebSocketConnection) {
    this.fleetSubscribers.add(socket);
    // Send immediate snapshot
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ type: 'FLEET_SNAPSHOT', rigs: this.getAllRigs() }));
    }
  }

  /**
   * Unsubscribe client from fleet updates.
   */
  public unsubscribeFromFleet(socket: WebSocketConnection) {
    this.fleetSubscribers.delete(socket);
  }

  /**
   * Broadcast fleet state changes to all subscribers.
   */
  public broadcastFleetUpdate() {
    if (this.fleetSubscribers.size === 0) return;

    const payload = JSON.stringify({
      type: 'FLEET_UPDATE',
      timestamp: Date.now(),
      rigs: this.getAllRigs(),
    });

    for (const sub of this.fleetSubscribers) {
      if (sub.readyState === 1) {
        try {
          sub.send(payload);
        } catch {
          // Ignore transient socket write errors
        }
      }
    }
  }

  /**
   * Check for stale heartbeats (timeout > 15 seconds) and mark offline.
   */
  public checkHeartbeats(timeoutMs = 15000) {
    const now = Date.now();
    let hasChanged = false;

    for (const rig of this.rigs.values()) {
      if (rig.status !== 'OFFLINE' && now - rig.lastHeartbeatAt > timeoutMs) {
        rig.status = 'OFFLINE';
        rig.socket = undefined;
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.broadcastFleetUpdate();
    }
  }

  private toSummary(record: RegisteredRigRecord): RigSummary {
    const vramTotalGiB = Number((record.vramTotalBytes / (1024 * 1024 * 1024)).toFixed(2));
    const isOnline = record.status !== 'OFFLINE' && (Date.now() - record.lastHeartbeatAt < 20000);

    return {
      id: record.id,
      name: record.name,
      hardwareUuid: record.hardwareUuid,
      systemHash: record.systemHash,
      gpuModel: record.gpuModel,
      gpuCount: record.gpuCount,
      vramTotalBytes: record.vramTotalBytes,
      vramTotalGiB,
      status: record.status,
      isOnline,
      lastHeartbeatAt: record.lastHeartbeatAt,
      currentJobId: record.currentJobId,
      partnerOrg: record.partnerOrg,
    };
  }
}
