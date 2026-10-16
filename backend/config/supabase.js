import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { query, isDatabaseConfigured, getConnectionStatus } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseUrl !== 'your_supabase_url' &&
  supabaseKey !== 'your_supabase_service_role_key' &&
  supabaseUrl.startsWith('http')
);

let supabase = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('✓ Supabase API client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
}

// In-memory fallback history store
let localHistory = [];

/**
 * Record a lookup into history (PostgreSQL direct, Supabase API, or memory fallback)
 */
export async function recordLookup({ lookup_type, query_value, status = 'success', result_summary = null }) {
  const formattedSummary = typeof result_summary === 'object' ? result_summary : { note: result_summary };
  const fallbackRecord = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    lookup_type,
    query_value,
    status,
    result_summary: formattedSummary,
    created_at: new Date().toISOString()
  };

  // 1. Try PostgreSQL direct pool first if configured
  if (isDatabaseConfigured) {
    try {
      // Prevent accidental duplicate history records (e.g. double-click within 2 seconds)
      const duplicateCheck = await query(
        `SELECT * FROM public.lookup_history
         WHERE LOWER(lookup_type) = LOWER($1)
           AND LOWER(query_value) = LOWER($2)
           AND created_at > NOW() - INTERVAL '2 seconds'
         ORDER BY created_at DESC LIMIT 1;`,
        [lookup_type, query_value]
      );
      if (duplicateCheck.rows?.[0]) {
        return duplicateCheck.rows[0];
      }

      const res = await query(
        `INSERT INTO public.lookup_history (lookup_type, query_value, status, result_summary)
         VALUES ($1, $2, $3, $4)
         RETURNING *;`,
        [lookup_type, query_value, status, JSON.stringify(formattedSummary)]
      );
      if (res.rows?.[0]) {
        return res.rows[0];
      }
    } catch (e) {
      // Fall through on connection or auth error
    }
  }

  // 2. Try Supabase REST client if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('lookup_history')
        .insert([{
          lookup_type,
          query_value,
          status,
          result_summary: formattedSummary
        }])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      // Fall through
    }
  }

  // 3. Fallback to local memory store
  localHistory.unshift(fallbackRecord);
  if (localHistory.length > 200) {
    localHistory.pop();
  }
  return fallbackRecord;
}

/**
 * Fetch lookup history
 */
export async function getHistory({ search = '', type = '', limit = 50 } = {}) {
  const maxLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  // 1. Try PostgreSQL direct pool
  if (isDatabaseConfigured) {
    try {
      let sql = 'SELECT * FROM public.lookup_history';
      const params = [];
      const where = [];

      if (type && type !== 'all') {
        params.push(type.toLowerCase());
        where.push(`LOWER(lookup_type) = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        where.push(`query_value ILIKE $${params.length}`);
      }

      if (where.length > 0) {
        sql += ` WHERE ${where.join(' AND ')}`;
      }

      params.push(maxLimit);
      sql += ` ORDER BY created_at DESC LIMIT $${params.length};`;

      const res = await query(sql, params);
      return { data: res.rows, source: 'postgresql' };
    } catch (e) {
      // Fall through to other sources
    }
  }

  // 2. Try Supabase REST client
  if (isSupabaseConfigured && supabase) {
    try {
      let req = supabase
        .from('lookup_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(maxLimit);

      if (type && type !== 'all') {
        req = req.eq('lookup_type', type);
      }
      if (search) {
        req = req.ilike('query_value', `%${search}%`);
      }

      const { data, error } = await req;
      if (!error && Array.isArray(data)) {
        return { data, source: 'supabase_api' };
      }
    } catch (e) {
      // Fall through
    }
  }

  // 3. Filter local memory store
  let filtered = [...localHistory];
  if (type && type !== 'all') {
    filtered = filtered.filter(item => item.lookup_type.toLowerCase() === type.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(item => item.query_value.toLowerCase().includes(s));
  }
  return {
    data: filtered.slice(0, maxLimit),
    source: 'local_cache'
  };
}

/**
 * Delete a single history record
 */
export async function deleteHistoryRecord(id) {
  if (isDatabaseConfigured) {
    try {
      await query('DELETE FROM public.lookup_history WHERE id = $1;', [id]);
      return { success: true };
    } catch (e) {
      // Fall through
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('lookup_history')
        .delete()
        .eq('id', id);

      if (!error) return { success: true };
    } catch (e) {
      // Fall through
    }
  }

  localHistory = localHistory.filter(item => item.id !== id);
  return { success: true };
}

/**
 * Clear all history records
 */
export async function clearAllHistory() {
  if (isDatabaseConfigured) {
    try {
      await query('DELETE FROM public.lookup_history;');
      localHistory = [];
      return { success: true };
    } catch (e) {
      // Fall through
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('lookup_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (!error) {
        localHistory = [];
        return { success: true };
      }
    } catch (e) {
      // Fall through
    }
  }

  localHistory = [];
  return { success: true };
}

/**
 * Get aggregated statistics for Dashboard
 */
export async function getDashboardStats() {
  const result = {
    totalLookups: 0,
    dnsLookups: 0,
    ipLookups: 0,
    emailChecks: 0,
    whoisChecks: 0,
    reverseDnsLookups: 0,
    nameLookups: 0,
    threatScans: 0,
    source: 'local_cache'
  };

  // 1. PostgreSQL direct count
  if (isDatabaseConfigured) {
    try {
      const statsRes = await query(`
        SELECT LOWER(lookup_type) as type, COUNT(*)::int as count 
        FROM public.lookup_history 
        GROUP BY LOWER(lookup_type);
      `);

      if (statsRes.rows) {
        result.source = 'postgresql';
        statsRes.rows.forEach(row => {
          result.totalLookups += row.count;
          if (row.type === 'dns') result.dnsLookups = row.count;
          else if (row.type === 'ip') result.ipLookups = row.count;
          else if (row.type === 'email') result.emailChecks = row.count;
          else if (row.type === 'whois') result.whoisChecks = row.count;
          else if (row.type === 'reverse-dns') result.reverseDnsLookups = row.count;
          else if (row.type === 'name') result.nameLookups = row.count;
          else if (row.type === 'threat-scan' || row.type === 'scan') result.threatScans += row.count;
        });
        return result;
      }
    } catch (e) {
      // Fall through
    }
  }

  // 2. Supabase API query
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('lookup_history')
        .select('lookup_type');

      if (!error && Array.isArray(data)) {
        result.source = 'supabase_api';
        result.totalLookups = data.length;
        data.forEach(row => {
          const t = row.lookup_type?.toLowerCase();
          if (t === 'dns') result.dnsLookups++;
          else if (t === 'ip') result.ipLookups++;
          else if (t === 'email') result.emailChecks++;
          else if (t === 'whois') result.whoisChecks++;
          else if (t === 'reverse-dns') result.reverseDnsLookups++;
          else if (t === 'name') result.nameLookups++;
          else if (t === 'threat-scan' || t === 'scan') result.threatScans++;
        });
        return result;
      }
    } catch (e) {
      // Fall through
    }
  }

  // 3. Local calculation
  result.totalLookups = localHistory.length;
  localHistory.forEach(item => {
    const t = item.lookup_type?.toLowerCase();
    if (t === 'dns') result.dnsLookups++;
    else if (t === 'ip') result.ipLookups++;
    else if (t === 'email') result.emailChecks++;
    else if (t === 'whois') result.whoisChecks++;
    else if (t === 'reverse-dns') result.reverseDnsLookups++;
    else if (t === 'name') result.nameLookups++;
    else if (t === 'threat-scan' || t === 'scan') result.threatScans++;
  });

  return result;
}

export default supabase;
