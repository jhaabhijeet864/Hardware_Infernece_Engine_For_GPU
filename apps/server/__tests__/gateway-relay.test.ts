process.env.NODE_ENV = 'test';
import { fastify, fleetManager } from '../src/index';

async function runGatewayRelayTests() {
  console.log('--- Starting Cloud Gateway & Telemetry Relay Tests ---');

  await fastify.ready();

  // Test 1: Healthcheck
  const healthRes = await fastify.inject({
    method: 'GET',
    url: '/health',
  });
  if (healthRes.statusCode !== 200) {
    throw new Error(`Test 1 Failed: Healthcheck returned ${healthRes.statusCode}`);
  }
  const healthBody = JSON.parse(healthRes.body);
  if (healthBody.status !== 'healthy' || !healthBody.milestone.includes('v2.0')) {
    throw new Error(`Test 1 Failed: Invalid healthcheck payload: ${healthRes.body}`);
  }
  console.log('✓ Test 1 Passed: Server healthcheck and milestone v2.0 verified.');

  // Test 2: Cloud Arbitrage Pricing Index
  const priceRes = await fastify.inject({
    method: 'GET',
    url: '/api/arbitrage/prices',
  });
  if (priceRes.statusCode !== 200) {
    throw new Error(`Test 2 Failed: Arbitrage pricing returned ${priceRes.statusCode}`);
  }
  const priceBody = JSON.parse(priceRes.body);
  if (!Array.isArray(priceBody.providers) || priceBody.providers.length < 3) {
    throw new Error(`Test 2 Failed: Expected at least 3 cloud providers: ${priceRes.body}`);
  }
  console.log(`✓ Test 2 Passed: Cloud Arbitrage Pricing Index verified (${priceBody.providers.length} providers listed).`);

  // Test 3: Rig Registration Endpoint
  const regPayload = {
    hardwareUuid: 'hw-rig-shenzhen-101',
    systemHash: 'sha256_mock_rig_101',
    name: 'Shenzhen Rig #101',
    gpuModel: 'NVIDIA RTX 6000 Ada Generation',
    gpuCount: 1,
    vramTotalBytes: 51539607552, // 48 GiB
    driverVersion: '550.54.14',
    cudaVersion: '12.4',
    pcieLink: 'Gen 4 x16',
    hostCpu: 'Intel Xeon w7-2495X',
    hostRamBytes: 137438953472,
    partnerOrg: 'Shenzhen Precision AI Hardware Co.',
  };

  const regRes = await fastify.inject({
    method: 'POST',
    url: '/api/rigs/register',
    payload: regPayload,
  });

  if (regRes.statusCode !== 201) {
    throw new Error(`Test 3 Failed: Rig registration returned ${regRes.statusCode}: ${regRes.body}`);
  }
  const regBody = JSON.parse(regRes.body);
  const rigId = regBody.rigId;
  if (!rigId || !regBody.apiKey) {
    throw new Error('Test 3 Failed: Missing rigId or apiKey in response');
  }
  console.log(`✓ Test 3 Passed: Machine registration successful (Rig ID: ${rigId.slice(0, 8)}).`);

  // Test 4: Fleet Listing Endpoint
  const listRes = await fastify.inject({
    method: 'GET',
    url: '/api/rigs',
  });
  const listBody = JSON.parse(listRes.body);
  if (listRes.statusCode !== 200 || !listBody.rigs.some((r: any) => r.id === rigId)) {
    throw new Error(`Test 4 Failed: Rig ${rigId} not present in fleet list: ${listRes.body}`);
  }
  console.log(`✓ Test 4 Passed: Fleet listing verified with ${listBody.count} registered machines.`);

  // Test 5: 6-Digit PIN Pairing Handshake
  const pinRes = await fastify.inject({
    method: 'POST',
    url: `/api/rigs/${rigId}/pin`,
  });
  if (pinRes.statusCode !== 200) {
    throw new Error(`Test 5 Failed: PIN generation returned ${pinRes.statusCode}`);
  }
  const { pairingCode } = JSON.parse(pinRes.body);
  if (!pairingCode || pairingCode.length !== 6) {
    throw new Error(`Test 5 Failed: Invalid 6-digit PIN: ${pairingCode}`);
  }

  // Verify PIN Handshake
  const verifyRes = await fastify.inject({
    method: 'POST',
    url: '/api/pairing/verify',
    payload: {
      pairingCode,
      clientPublicKey: 'pk_mock_mobile_device_key_32chars_long',
      clientDeviceName: 'QA Technician iPad Pro',
    },
  });

  if (verifyRes.statusCode !== 200) {
    throw new Error(`Test 5 Failed: Pairing verification returned ${verifyRes.statusCode}: ${verifyRes.body}`);
  }
  const verifyBody = JSON.parse(verifyRes.body);
  if (!verifyBody.sessionToken || verifyBody.rigId !== rigId) {
    throw new Error('Test 5 Failed: Invalid session token or rigId');
  }
  console.log(`✓ Test 5 Passed: 6-digit PIN pairing handshake completed (Token: ${verifyBody.sessionToken.slice(0, 16)}...).`);

  // Test 6: Qualification Job Dispatch
  const jobPayload = {
    jobId: 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6',
    targetRigId: rigId,
    workloadArchetype: 'enterprise-rag',
    modelId: 'meta-llama/Llama-3.1-8B-Instruct',
    precision: 'FP16',
    promptTokens: 4096,
    genTokens: 512,
    concurrency: 8,
    sla: { maxTtftMs: 500, maxItlMs: 35 },
    timeoutSeconds: 300,
  };

  const dispatchRes = await fastify.inject({
    method: 'POST',
    url: '/api/jobs/dispatch',
    payload: jobPayload,
  });

  if (dispatchRes.statusCode !== 202) {
    throw new Error(`Test 6 Failed: Job dispatch returned ${dispatchRes.statusCode}: ${dispatchRes.body}`);
  }
  const rigStatus = fleetManager.getRig(rigId);
  if (rigStatus?.status !== 'BENCHMARKING') {
    throw new Error(`Test 6 Failed: Rig status should be BENCHMARKING, got ${rigStatus?.status}`);
  }
  console.log('✓ Test 6 Passed: Qualification benchmark job dispatched to physical rig.');

  // Test 7: Completed Qualification Run Bundle Upload
  const mockBundle = {
    metadata: {
      run_id: 'qual-test-run-2026-pass',
      timestamp: new Date().toISOString(),
    },
    workload_spec: {
      model_id: 'meta-llama/Llama-3.1-8B-Instruct',
    },
    qualification_verdict: {
      overall: 'PASSED',
      memory_fit: 'PASSED',
      ttft_sla: 'PASSED',
      itl_sla: 'PASSED',
      zero_oom: 'PASSED',
    },
    telemetry: {
      peak_vram_gib: 17.8,
    },
    measured_metrics: {
      ttft_ms: { p95: 281 },
      itl_ms: { p95: 24 },
      goodput_pct: 98.4,
      oom_count: 0,
    },
  };

  const bundleRes = await fastify.inject({
    method: 'POST',
    url: `/api/rigs/${rigId}/runs`,
    payload: mockBundle,
  });

  if (bundleRes.statusCode !== 201) {
    throw new Error(`Test 7 Failed: Bundle upload returned ${bundleRes.statusCode}: ${bundleRes.body}`);
  }
  const bundleBody = JSON.parse(bundleRes.body);
  if (bundleBody.verdict !== 'PASSED') {
    throw new Error(`Test 7 Failed: Expected PASSED verdict: ${bundleRes.body}`);
  }
  const idleStatus = fleetManager.getRig(rigId);
  if (idleStatus?.status !== 'IDLE') {
    throw new Error(`Test 7 Failed: Rig status should return to IDLE, got ${idleStatus?.status}`);
  }
  console.log('✓ Test 7 Passed: Completed qualification run bundle ingested and stored.');

  // Test 8: Emergency Kill Switch Halt
  const haltPayload = {
    rigId,
    commandId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    timestamp: Date.now(),
    issuedByUserId: 'user_qa_lead_01',
    reason: 'Thermal throttle alert > 88C',
    purgeVram: true,
    signature: 'mock_hmac_signature',
  };

  const haltRes = await fastify.inject({
    method: 'POST',
    url: `/api/rigs/${rigId}/emergency-halt`,
    payload: haltPayload,
  });

  if (haltRes.statusCode !== 200) {
    throw new Error(`Test 8 Failed: Emergency halt returned ${haltRes.statusCode}: ${haltRes.body}`);
  }
  console.log('✓ Test 8 Passed: Remote emergency kill switch dispatched abort signal.');

  console.log('--- All Cloud Gateway & Telemetry Relay Tests Passed! ---');
  fleetManager.stop();
  await fastify.close();
  process.exit(0);
}

runGatewayRelayTests().catch((err) => {
  console.error('Gateway relay tests failed:', err);
  process.exit(1);
});
