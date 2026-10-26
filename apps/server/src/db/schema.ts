import { pgTable, uuid, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rigs = pgTable('rigs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  hardwareUuid: text('hardware_uuid').notNull().unique(),
  gpuModel: text('gpu_model').notNull(),
  vramTotalBytes: text('vram_total_bytes').notNull(),
  isOnline: boolean('is_online').default(false).notNull(),
  lastHeartbeatAt: timestamp('last_heartbeat_at'),
  secretKeyHash: text('secret_key_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const telemetrySnapshots = pgTable('telemetry_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  rigId: uuid('rig_id').references(() => rigs.id).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  vramUsedBytes: text('vram_used_bytes').notNull(),
  temperatureC: integer('temperature_c'),
  powerWatts: integer('power_watts'),
  utilizationPct: integer('utilization_pct'),
});

export const qualificationRuns = pgTable('qualification_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  rigId: uuid('rig_id').references(() => rigs.id).notNull(),
  runId: text('run_id').notNull().unique(),
  modelId: text('model_id').notNull(),
  overallVerdict: text('overall_verdict').notNull(), // 'PASSED' | 'FAILED'
  bundleJson: jsonb('bundle_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
