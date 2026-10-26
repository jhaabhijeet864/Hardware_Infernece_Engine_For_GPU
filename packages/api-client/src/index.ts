import {
  GpuTelemetryFrame,
  GpuTelemetryFrameSchema,
  RigPairingResponse,
} from '@hardware-inference/protocol';

export interface ApiClientConfig {
  baseUrl: string;
  wsUrl?: string;
  sessionToken?: string;
}

export interface ArbitrageProviderRate {
  provider: string;
  gpu: string;
  pricePerHourUsd: number;
  availability: string;
  bandwidthType: string;
}

export class HardwareInferenceApiClient {
  private baseUrl: string;
  private wsUrl: string;
  private sessionToken?: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.wsUrl = config.wsUrl || this.baseUrl.replace(/^http/, 'ws');
    this.sessionToken = config.sessionToken;
  }

  public setSessionToken(token: string) {
    this.sessionToken = token;
  }

  /**
   * Fetch live GPU spot pricing across cloud providers & local hardware
   */
  async getArbitragePrices(): Promise<{ updatedAt: string; providers: ArbitrageProviderRate[] }> {
    const res = await fetch(`${this.baseUrl}/api/arbitrage/prices`);
    if (!res.ok) {
      throw new Error(`Failed to fetch arbitrage prices: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Pair a client (e.g. mobile app) with a desktop rig via 6-digit PIN
   */
  async verifyPairingPin(pairingCode: string, clientDeviceName: string): Promise<RigPairingResponse> {
    const res = await fetch(`${this.baseUrl}/api/pairing/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pairingCode,
        clientPublicKey: `pk_${Date.now()}_mock`,
        clientDeviceName,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Pairing verification failed');
    }
    const data: RigPairingResponse = await res.json();
    this.sessionToken = data.sessionToken;
    return data;
  }

  /**
   * Trigger an authenticated emergency halt on a physical rig
   */
  async triggerEmergencyHalt(rigId: string, reason: string = 'User manual emergency halt'): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/api/rigs/${rigId}/emergency-halt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionToken ? { Authorization: `Bearer ${this.sessionToken}` } : {}),
      },
      body: JSON.stringify({
        rigId,
        commandId: `cmd_${Date.now()}`,
        timestamp: Date.now(),
        issuedByUserId: 'operator',
        reason,
        purgeVram: true,
        signature: 'mock_signature_dev',
      }),
    });
    if (!res.ok) {
      throw new Error(`Emergency halt dispatch failed: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Create an auto-reconnecting WebSocket listener for live rig telemetry
   */
  connectRigTelemetry(rigId: string, onFrame: (frame: GpuTelemetryFrame) => void, onError?: (err: any) => void): () => void {
    const url = `${this.wsUrl}/ws/rigs/${rigId}/watch`;
    let ws: WebSocket | null = null;
    let shouldReconnect = true;
    let retryDelay = 1000;

    const connect = () => {
      try {
        ws = new WebSocket(url);

        ws.onopen = () => {
          retryDelay = 1000;
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            const validated = GpuTelemetryFrameSchema.safeParse(parsed);
            if (validated.success) {
              onFrame(validated.data);
            }
          } catch (e) {
            if (onError) onError(e);
          }
        };

        ws.onerror = (e) => {
          if (onError) onError(e);
        };

        ws.onclose = () => {
          if (shouldReconnect) {
            setTimeout(connect, retryDelay);
            retryDelay = Math.min(retryDelay * 1.5, 15000);
          }
        };
      } catch (err) {
        if (onError) onError(err);
      }
    };

    connect();

    // Disconnect cleanup function
    return () => {
      shouldReconnect = false;
      if (ws) {
        ws.close();
      }
    };
  }
}
