import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// 🔧 Fix: Ensure DATABASE_URL is correctly formatted for Neon
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('www.theceylonx.com')) {
  const correctUrl = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
  process.env.DATABASE_URL = correctUrl;
  console.log('🔧 Database URL fixed in db.ts:', correctUrl.replace(/:([^:@]*?)@/, ':***@'));
}

// Configure Neon WebSocket properly
neonConfig.webSocketConstructor = ws;

// Disable WebSocket as fallback if still causing issues
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode: Configuring Neon client for stability');
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection pool configuration for stability
  ssl: true,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

export const db = drizzle({ client: pool, schema });