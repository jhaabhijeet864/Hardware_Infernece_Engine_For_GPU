import { FleetManager, WebSocketConnection } from '../src/fleet-manager';
import { RigRegistrationRequest } from '@hardware-inference/protocol';

async function runFleetManagerTests() {
  console.log('--- Starting FleetManager Verification Tests ---');

  const fleet = new FleetManager(false); // Disable auto-interval for deterministic testing

  // Test 1: Rig Registration
  const req: RigRegistrationRequest = {
    hardwareUuid: 'uuid-shenzhen-lab-4090-01',
    systemHash: 'hash_abc123456789',
    name: 'Shenzhen Station #1',
    gpuModel: 'NVIDIA GeForce RTX 4090',
    gpuCount: 2,
    vramTotalBytes: 51539607552, // 48 GiB
    driverVersion: '550.54.14',
    cudaVersion: '12.4',
    pcieLink: 'Gen 4 x16',
    hostCpu: 'AMD Threadripper 7960X',
    hostRamBytes: 137438953472, // 128 GiB
    partnerOrg: 'Shenzhen Precision AI Hardware Co.',
  };

  const { rigId, apiKey } = fleet.registerRig(req);
  if (!rigId || !apiKey) {
    throw new Error('Test 1 Failed: Rig registration did not return rigId or apiKey');
  }

  const registered = fleet.getRig(rigId);
  if (!registered || registered.gpuCount !== 2 || registered.vramTotalGiB !== 48.0) {
    throw new Error(`Test 1 Failed: Stored rig specs mismatch: ${JSON.stringify(registered)}`);
  }
  console.log(`✓ Test 1 Passed: Rig registered successfully (ID: ${rigId.slice(0, 8)}, 48 GiB Dual-GPU).`);

  // Test 2: Idempotent Registration for same Hardware UUID
  const reg2 = fleet.registerRig({ ...req, name: 'Shenzhen Station #1 Renamed' });
  if (reg2.rigId !== rigId) {
    throw new Error(`Test 2 Failed: Re-registration did not preserve stable rigId: ${reg2.rigId} vs ${rigId}`);
  }
  const updated = fleet.getRig(rigId);
  if (updated?.name !== 'Shenzhen Station #1 Renamed') {
    throw new Error('Test 2 Failed: Name update was not persisted');
  }
  console.log('✓ Test 2 Passed: Idempotent hardware registration preserved stable rigId.');

  // Test 3: Status transitions and Job Tracking
  fleet.updateRigStatus(rigId, 'BENCHMARKING', 'job_test_001');
  const running = fleet.getRig(rigId);
  if (running?.status !== 'BENCHMARKING' || running?.currentJobId !== 'job_test_001') {
    throw new Error('Test 3 Failed: Status did not update to BENCHMARKING');
  }

  fleet.updateRigStatus(rigId, 'IDLE', null);
  const idle = fleet.getRig(rigId);
  if (idle?.status !== 'IDLE' || idle?.currentJobId !== null) {
    throw new Error('Test 3 Failed: Status did not update to IDLE');
  }
  console.log('✓ Test 3 Passed: Operational status transitions (IDLE <-> BENCHMARKING) verified.');

  // Test 4: Heartbeat & Stale Expiration
  const rigRecord = fleet.getRigRecord(rigId)!;
  // Artificially age the heartbeat by 20 seconds
  rigRecord.lastHeartbeatAt = Date.now() - 20000;
  fleet.checkHeartbeats(15000);

  const staleRig = fleet.getRig(rigId);
  if (staleRig?.status !== 'OFFLINE') {
    throw new Error(`Test 4 Failed: Expected OFFLINE status for stale heartbeat, got ${staleRig?.status}`);
  }
  console.log('✓ Test 4 Passed: Stale heartbeats (>15s) correctly trigger OFFLINE status.');

  // Test 5: Fleet Subscription
  let receivedSnapshot = false;
  const mockSub: WebSocketConnection = {
    readyState: 1,
    send: (data: string) => {
      const msg = JSON.parse(data);
      if (msg.type === 'FLEET_SNAPSHOT' && Array.isArray(msg.rigs)) {
        receivedSnapshot = true;
      }
    },
  };

  fleet.subscribeToFleet(mockSub);
  if (!receivedSnapshot) {
    throw new Error('Test 5 Failed: Fleet subscriber did not receive initial FLEET_SNAPSHOT');
  }
  fleet.unsubscribeFromFleet(mockSub);
  console.log('✓ Test 5 Passed: Fleet WebSocket subscription and snapshot delivery verified.');

  console.log('--- All FleetManager Verification Tests Passed! ---');
}

runFleetManagerTests().catch((err) => {
  console.error('FleetManager verification failed:', err);
  process.exit(1);
});
