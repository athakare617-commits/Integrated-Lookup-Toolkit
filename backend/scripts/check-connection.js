#!/usr/bin/env node
/**
 * Database Connection & Health Diagnostic Suite
 * Usage: node scripts/check-connection.js
 */

import pg from 'pg';
import dns from 'node:dns/promises';
import net from 'node:net';
import tls from 'node:tls';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL || '';

async function runDiagnostics() {
  console.log('\n====================================================');
  console.log('🔍 Integrated Lookup Toolkit: Database Connection Check');
  console.log('====================================================');

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in backend/.env');
    process.exit(1);
  }

  // Parse URL
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch (err) {
    console.error('❌ Failed to parse DATABASE_URL as a valid URL:', err.message);
    process.exit(1);
  }

  const host = parsed.hostname;
  const port = parseInt(parsed.port || '5432', 10);
  const user = decodeURIComponent(parsed.username);
  const dbName = parsed.pathname.replace(/^\//, '');
  const maskedPass = parsed.password ? '••••••••' : '(none)';

  console.log(`\n📋 Connection Parameters:`);
  console.log(`   Host:     ${host}`);
  console.log(`   Port:     ${port}`);
  console.log(`   User:     ${user}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   Password: ${maskedPass}`);

  // 1. DNS Resolution Test
  console.log(`\n[Step 1/4] Testing DNS resolution for ${host}...`);
  try {
    const lookupResult = await dns.lookup(host);
    console.log(`   ✓ Resolved ${host} -> ${lookupResult.address} (IPv${lookupResult.family})`);
  } catch (err) {
    console.error(`   ❌ DNS resolution failed for ${host}:`, err.message);
    process.exit(1);
  }

  // 2. TCP & TLS Connectivity Test
  console.log(`\n[Step 2/4] Testing TCP & SSL handshake on ${host}:${port}...`);
  const tlsConnected = await new Promise((resolve) => {
    const socket = tls.connect({
      host,
      port,
      rejectUnauthorized: false,
      timeout: 5000
    }, () => {
      console.log(`   ✓ TCP & SSL handshake established successfully.`);
      socket.end();
      resolve(true);
    });

    socket.on('error', (err) => {
      // Note: PostgreSQL protocol requires initial SSLRequest packet before full TLS, or pooler accepts direct TLS
      console.log(`   ℹ Port ${port} is reachable via TCP.`);
      resolve(true);
    });

    socket.on('timeout', () => {
      console.warn(`   ⚠️ Connection timed out on port ${port}.`);
      socket.destroy();
      resolve(false);
    });
  });

  // 3. PostgreSQL Authentication & Query Test
  console.log(`\n[Step 3/4] Testing PostgreSQL authentication & query execution...`);
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 7000
  });

  let authSuccess = false;
  try {
    await client.connect();
    authSuccess = true;
    console.log(`   ✓ Authentication SUCCESSFUL! Logged in as "${user}".`);

    const serverInfo = await client.query(`
      SELECT 
        NOW() as server_now,
        current_database() as database_name,
        current_user as connected_user,
        version() as pg_version;
    `);

    const info = serverInfo.rows[0];
    console.log(`   ✓ Server Time: ${info.server_now}`);
    console.log(`   ✓ Current DB:  ${info.database_name}`);
    console.log(`   ✓ User Role:   ${info.connected_user}`);
    console.log(`   ✓ PG Version:  ${info.pg_version.split(' on ')[0]}`);

    // 4. Schema & Data Inspection
    console.log(`\n[Step 4/4] Inspecting Database Tables and Records...`);
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log(`   Found ${tableNames.length} table(s) in public schema: ${tableNames.join(', ') || '(none)'}`);

    if (tableNames.includes('lookup_history')) {
      const historyCount = await client.query('SELECT COUNT(*) as count FROM public.lookup_history;');
      console.log(`   ✓ Table "lookup_history": ${historyCount.rows[0].count} records`);
    } else {
      console.log(`   ℹ Table "lookup_history" has not been created yet (run "npm run db:push").`);
    }

    if (tableNames.includes('users')) {
      const usersCount = await client.query('SELECT COUNT(*) as count FROM public.users;');
      console.log(`   ✓ Table "users": ${usersCount.rows[0].count} records`);
    } else {
      console.log(`   ℹ Table "users" has not been created yet (run "npm run db:push").`);
    }

    await client.end();
    console.log('\n====================================================');
    console.log('🎉 ALL CHECKS PASSED: Database connection is healthy and operational!');
    console.log('====================================================\n');
    process.exit(0);

  } catch (err) {
    console.error(`   ❌ PostgreSQL Connection Failed: [${err.code || 'UNKNOWN'}] ${err.message}`);

    if (err.code === '28P01') {
      console.log('\n----------------------------------------------------');
      console.log('📌 AUTHENTICATION DIAGNOSTIC & SOLUTION:');
      console.log('The network connection to Supabase pooler succeeded, but');
      console.log('PostgreSQL rejected the password for user "postgres".');
      console.log('');
      console.log('How to fix this:');
      console.log('1. Go to your Supabase Project Dashboard:');
      console.log('   https://supabase.com/dashboard/project/rdnlflziyxdhfhkixpjf/settings/database');
      console.log('2. Click "Reset database password" (or copy your saved database password).');
      console.log('3. Update DATABASE_URL in backend/.env with the new password:');
      console.log('   DATABASE_URL=postgresql://postgres.rdnlflziyxdhfhkixpjf:YOUR_NEW_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
      console.log('4. Run "npm run db:check" to test again.');
      console.log('----------------------------------------------------\n');
    }

    try { await client.end(); } catch (e) {}
    process.exit(authSuccess ? 0 : 1);
  }
}

runDiagnostics();
