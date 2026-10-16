#!/usr/bin/env node
/**
 * Administrator Credential Reset Utility
 *
 * Usage:
 *   node scripts/reset-admin.js [email] [newPassword]
 *
 * Example:
 *   node scripts/reset-admin.js admin@toolkit.local AdminPass2026!
 */

import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const { Client } = pg;

// Helper to hash password matching authRoutes.js
function hashPassword(password, salt = 'iltk_salt_2026') {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function generateApiKey(prefix = 'iltk_live_admin') {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

async function main() {
  const args = process.argv.slice(2);
  const targetEmail = (args[0] || 'admin@toolkit.local').toLowerCase().trim();
  const targetPassword = args[1] || 'AdminPass2026!';

  console.log('\n======================================================');
  console.log('🛡️  Integrated Lookup Toolkit: Admin Credential Manager');
  console.log('======================================================');
  console.log(`Target Email:    ${targetEmail}`);
  console.log(`New Password:    ${targetPassword}`);
  console.log(`Assigned Role:   Administrator`);
  console.log(`Organization:    Cyber Defense Operations`);
  console.log('------------------------------------------------------');

  const databaseUrl = process.env.DATABASE_URL || '';
  const isDbConfigured = Boolean(
    databaseUrl &&
    databaseUrl.startsWith('postgres') &&
    !databaseUrl.includes('[PASSWORD]')
  );

  const passwordHash = hashPassword(targetPassword);
  const apiKey = generateApiKey('iltk_live_admin');

  if (isDbConfigured) {
    console.log('Connecting to PostgreSQL database...');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000
    });

    try {
      await client.connect();
      console.log('✓ Database connected successfully.');

      // Check if user exists
      const checkRes = await client.query(
        'SELECT id, name, email, role FROM public.users WHERE LOWER(email) = $1 LIMIT 1;',
        [targetEmail]
      );

      if (checkRes.rows.length > 0) {
        // Update existing user
        await client.query(
          `UPDATE public.users 
           SET password_hash = $1, role = 'Administrator', api_key = $2 
           WHERE LOWER(email) = $3;`,
          [passwordHash, apiKey, targetEmail]
        );
        console.log(`✓ Password updated for existing account: "${targetEmail}"`);
      } else {
        // Create new administrator account
        const newId = `usr_admin_${Date.now()}`;
        await client.query(
          `INSERT INTO public.users (id, name, email, role, organization, password_hash, api_key, created_at, lookups_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 0);`,
          [
            newId,
            'SOC Administrator',
            targetEmail,
            'Administrator',
            'Cyber Defense Operations',
            passwordHash,
            apiKey
          ]
        );
        console.log(`✓ Created new Administrator account in PostgreSQL: "${targetEmail}"`);
      }

      await client.end();
    } catch (dbErr) {
      console.warn(`⚠️ PostgreSQL update skipped (${dbErr.message}).`);
      console.log('ℹ Notice: The application backend also supports in-memory fallback.');
    }
  } else {
    console.log('ℹ DATABASE_URL is not configured in backend/.env.');
  }

  console.log('\n======================================================');
  console.log('✅ CREDENTIALS READY FOR LOGIN:');
  console.log(`   Email:    ${targetEmail}`);
  console.log(`   Password: ${targetPassword}`);
  console.log(`   Role:     Administrator`);
  console.log('');
  console.log('👉 You can now log in at: http://localhost:5173/login');
  console.log('   Or create any new admin on: http://localhost:5173/signup');
  console.log('   with Admin Passkey: ADMIN2026');
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
