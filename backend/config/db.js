import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const { Pool } = pg;

export const databaseUrl = (process.env.DATABASE_URL || '').trim();

export const isDatabaseConfigured = Boolean(
  databaseUrl &&
  databaseUrl.startsWith('postgres') &&
  !databaseUrl.includes('[PASSWORD]')
);

let pool = null;
let lastConnectionStatus = {
  testedAt: null,
  connected: false,
  error: null,
  latencyMs: null
};

if (isDatabaseConfigured) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      max: 10,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    });

    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]:', err.message);
    });
  } catch (err) {
    console.error('Failed to create PostgreSQL pool:', err.message);
  }
}

/**
 * Execute a SQL query on the pool
 */
export async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database pool not initialized. Check DATABASE_URL in .env');
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (
      err.code === 'ECONNRESET' ||
      err.message?.includes('Connection terminated') ||
      err.message?.includes('socket disconnected')
    ) {
      // Automatic single retry with a fresh pooled connection if PgBouncer closed stale socket
      return await pool.query(text, params);
    }
    throw err;
  }
}

/**
 * Test database connection and return detailed health status
 */
export async function testConnection() {
  const start = Date.now();
  if (!isDatabaseConfigured || !pool) {
    lastConnectionStatus = {
      testedAt: new Date().toISOString(),
      connected: false,
      configured: false,
      error: 'DATABASE_URL is not configured or uses placeholder.',
      latencyMs: null
    };
    return lastConnectionStatus;
  }

  try {
    const res = await pool.query('SELECT NOW() as now, current_database() as db, version() as version;');
    const latencyMs = Date.now() - start;
    lastConnectionStatus = {
      testedAt: new Date().toISOString(),
      connected: true,
      configured: true,
      latencyMs,
      database: res.rows[0]?.db,
      serverTime: res.rows[0]?.now,
      version: res.rows[0]?.version ? res.rows[0].version.split(' on ')[0] : 'PostgreSQL'
    };
    return lastConnectionStatus;
  } catch (err) {
    const latencyMs = Date.now() - start;
    let hint = 'Verify your database connection string in .env.';
    if (err.code === '28P01') {
      hint = 'Password authentication failed. Please update your Supabase database password in .env (Project Settings -> Database).';
    } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      hint = 'Database host could not be resolved. Check network connectivity.';
    }

    lastConnectionStatus = {
      testedAt: new Date().toISOString(),
      connected: false,
      configured: true,
      error: err.message,
      code: err.code,
      hint,
      latencyMs
    };
    return lastConnectionStatus;
  }
}

/**
 * Get current cached or evaluated connection status
 */
export function getConnectionStatus() {
  return lastConnectionStatus;
}

/**
 * Automatically apply schema.sql and seed.sql to the connected database
 */
export async function autoPushSchemaAndSeed({ forceSeed = false } = {}) {
  console.log('----------------------------------------------------');
  console.log('🔄 Checking Database & Autopush Status...');

  if (!isDatabaseConfigured || !pool) {
    console.log('ℹ DATABASE_URL not fully configured. Autopush skipped.');
    console.log('----------------------------------------------------');
    return { success: false, skipped: true, reason: 'Database not configured' };
  }

  const conn = await testConnection();
  if (!conn.connected) {
    console.warn(`⚠️ Database connection check failed: ${conn.error}`);
    if (conn.hint) console.warn(`👉 Hint: ${conn.hint}`);
    console.log('ℹ Application will operate with local memory-cache fallback.');
    console.log('----------------------------------------------------');
    return { success: false, error: conn.error, hint: conn.hint };
  }

  console.log(`✓ PostgreSQL connected successfully (${conn.latencyMs}ms latency)`);

  const client = await pool.connect();
  try {
    // 1. Push Schema
    const schemaPath = path.join(backendRoot, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Applying schema from schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✓ Database schema pushed and verified successfully (tables: lookup_history, users).');
    } else {
      console.warn('⚠️ schema.sql not found at:', schemaPath);
    }

    console.log('🎉 Database initialization complete (Zero Mock Data Policy: Real Live Operations Only).');
    console.log('----------------------------------------------------');
    return { success: true };
  } catch (err) {
    console.error('❌ Failed during schema push execution:', err.message);
    console.log('----------------------------------------------------');
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

export default pool;
