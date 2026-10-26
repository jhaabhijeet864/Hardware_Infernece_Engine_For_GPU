import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rigs = pgTable('rigs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  name: text('name').notNull(),
  hardwareUuid: text('hardware_uuid').notNull().unique(),
  systemHash: text('system_hash').notNull(),
  gpuModel: text('gpu_model').notNull(),
  gpuCount: integer('gpu_count').default(1).notNull(),
  vramTotalBytes: text('vram_total_bytes').notNull(),
  driverVersion: text('driver_version').default('Unknown').notNull(),
  cudaVersion: text('cuda_version').default('Unknown').notNull(),
  pcieLink: text('pcie_link').default('Gen 4 x16').notNull(),
  hostCpu: text('host_cpu').default('Unknown CPU').notNull(),
  hostRamBytes: text('host_ram_bytes').notNull(),
  partnerOrg: text('partner_org').default('Shenzhen Precision AI Hardware Co.').notNull(),
  isOnline: boolean('is_online').default(false).notNull(),
  lastHeartbeatAt: timestamp('last_heartbeat_at'),
  secretKeyHash: text('secret_key_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const qualificationBatches = pgTable('qualification_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  workloadArchetype: text('workload_archetype').notNull(),
  targetSlaJson: jsonb('target_sla_json').notNull(),
  status: text('status').default('QUEUED').notNull(), // 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  totalRigsCount: integer('total_rigs_count').default(1).notNull(),
  completedRigsCount: integer('completed_rigs_count').default(0).notNull(),
  passedRigsCount: integer('passed_rigs_count').default(0).notNull(),
  dispatchedAt: timestamp('dispatched_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const qualificationRuns = pgTable('qualification_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => qualificationBatches.id),
  rigId: uuid('rig_id').references(() => rigs.id).notNull(),
  runId: text('run_id').notNull().unique(),
  modelId: text('model_id').notNull(),
  overallVerdict: text('overall_verdict').notNull(), // 'PASSED' | 'FAILED'
  peakVramGiB: numeric('peak_vram_gib'),
  ttftP95Ms: numeric('ttft_p95_ms'),
  itlP95Ms: numeric('itl_p95_ms'),
  goodputPct: numeric('goodput_pct'),
  oomCount: integer('oom_count').default(0).notNull(),
  bundleJson: jsonb('bundle_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const telemetrySnapshots = pgTable('telemetry_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  rigId: uuid('rig_id').references(() => rigs.id).notNull(),
  runId: uuid('run_id').references(() => qualificationRuns.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  memoryUsedGib: numeric('memory_used_gib').notNull(),
  temperatureC: integer('temperature_c'),
  powerWatts: integer('power_watts'),
  utilizationPct: integer('utilization_pct'),
});
