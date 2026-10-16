import { Router } from 'express';
import { isDatabaseConfigured, testConnection, getConnectionStatus } from '../config/db.js';
import { isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

router.get('/health', async (req, res) => {
  // Test connection status (cached or ping)
  let dbStatus = getConnectionStatus();
  if (!dbStatus.testedAt || (Date.now() - new Date(dbStatus.testedAt).getTime() > 15000)) {
    dbStatus = await testConnection();
  }

  res.json({
    success: true,
    status: 'online',
    service: 'Integrated Lookup Toolkit API',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    database: {
      provider: 'Supabase PostgreSQL',
      configured: isDatabaseConfigured || isSupabaseConfigured,
      connected: Boolean(dbStatus.connected),
      mode: dbStatus.connected ? 'postgresql_pooler' : 'local_cache_fallback',
      latencyMs: dbStatus.latencyMs || null,
      serverTime: dbStatus.serverTime || null,
      dbVersion: dbStatus.version || null,
      error: dbStatus.connected ? null : dbStatus.error,
      hint: dbStatus.connected ? null : dbStatus.hint
    }
  });
});

export default router;
