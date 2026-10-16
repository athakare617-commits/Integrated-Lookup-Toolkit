#!/usr/bin/env node
/**
 * Standalone Schema & Seed Autopush Script
 * Usage: node scripts/autopush.js [--force-seed]
 */

import { autoPushSchemaAndSeed, isDatabaseConfigured, databaseUrl } from '../config/db.js';

async function main() {
  console.log('\n====================================================');
  console.log('🚀 Integrated Lookup Toolkit: Database Autopush');
  console.log('====================================================');
  
  if (!isDatabaseConfigured) {
    console.error('❌ Error: DATABASE_URL is not configured in backend/.env');
    console.log('Please set DATABASE_URL in backend/.env and re-run.');
    process.exit(1);
  }

  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`Connecting to: ${maskedUrl}`);

  const forceSeed = process.argv.includes('--force-seed') || process.argv.includes('--seed');
  const result = await autoPushSchemaAndSeed({ forceSeed });

  if (result.success) {
    console.log('\n✅ Database schema and seed successfully pushed to PostgreSQL!\n');
    process.exit(0);
  } else {
    console.error('\n❌ Autopush failed:', result.error || result.reason);
    if (result.hint) {
      console.log(`💡 Hint: ${result.hint}\n`);
    }
    process.exit(1);
  }
}

main();
