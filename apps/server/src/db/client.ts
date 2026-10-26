import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export interface DatabaseClient {
  isMock: boolean;
  db: ReturnType<typeof drizzle> | null;
}

let clientInstance: DatabaseClient | null = null;

export function getDatabaseClient(): DatabaseClient {
  if (clientInstance) return clientInstance;

  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      const queryClient = postgres(connectionString);
      const db = drizzle(queryClient, { schema });
      clientInstance = { isMock: false, db };
      console.log('✓ Connected to PostgreSQL via Drizzle ORM');
      return clientInstance;
    } catch (err) {
      console.warn('⚠ Failed to connect to PostgreSQL, falling back to in-memory mode:', err);
    }
  }

  // Fallback mode for testing and standalone dev
  clientInstance = { isMock: true, db: null };
  return clientInstance;
}
