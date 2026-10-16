-- ==========================================================
-- Integrated Lookup Toolkit: Supabase PostgreSQL Schema
-- Database Tables: lookup_history, users
-- ==========================================================

-- Enable pgcrypto extension if needed for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- Table: lookup_history
-- Stores audit log and results of all executed lookups
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.lookup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lookup_type VARCHAR(50) NOT NULL, -- 'dns', 'ip', 'reverse-dns', 'email', 'whois', 'name', 'integrated'
    query_value TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success', 'failed'
    result_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying and dashboard statistics
CREATE INDEX IF NOT EXISTS idx_lookup_history_created_at ON public.lookup_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lookup_history_type ON public.lookup_history (lookup_type);
CREATE INDEX IF NOT EXISTS idx_lookup_history_status ON public.lookup_history (status);

-- ==========================================================
-- Table: users
-- Stores security analyst and researcher credentials
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) DEFAULT 'Security Researcher',
    organization VARCHAR(255) DEFAULT 'Independent',
    password_hash VARCHAR(255) NOT NULL,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lookups_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON public.users (api_key);

-- ==========================================================
-- Row Level Security (RLS)
-- ==========================================================
ALTER TABLE public.lookup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for lookup_history
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lookup_history' AND policyname = 'Allow public read access to lookup_history'
    ) THEN
        CREATE POLICY "Allow public read access to lookup_history" ON public.lookup_history FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lookup_history' AND policyname = 'Allow public insert access to lookup_history'
    ) THEN
        CREATE POLICY "Allow public insert access to lookup_history" ON public.lookup_history FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lookup_history' AND policyname = 'Allow public delete access to lookup_history'
    ) THEN
        CREATE POLICY "Allow public delete access to lookup_history" ON public.lookup_history FOR DELETE USING (true);
    END IF;
END $$;

-- Policies for users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public access to users'
    ) THEN
        CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

COMMENT ON TABLE public.lookup_history IS 'Stores user-initiated lookup records and results in Integrated Lookup Toolkit';
COMMENT ON TABLE public.users IS 'Stores registered security researchers and SOC analysts';


