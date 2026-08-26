-- =============================================================================
-- HackFeed — Initial Database Schema Migration
-- Migration: 001_initial_schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Enable required extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Custom ENUM types
-- ---------------------------------------------------------------------------

CREATE TYPE opportunity_type AS ENUM ('hackathon', 'internship');

CREATE TYPE opportunity_mode AS ENUM ('online', 'offline', 'hybrid');

CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator');

CREATE TYPE scrape_status AS ENUM ('success', 'failed', 'partial');

-- ---------------------------------------------------------------------------
-- 2. Table: opportunities
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS opportunities (
    id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    title                TEXT             NOT NULL,
    description          TEXT,
    type                 opportunity_type NOT NULL,
    source_platform      TEXT,
    source_url           TEXT             NOT NULL UNIQUE,
    organizer            TEXT,
    location             TEXT,
    mode                 opportunity_mode,
    start_date           TIMESTAMPTZ,
    end_date             TIMESTAMPTZ,
    application_deadline TIMESTAMPTZ,
    prize_pool           TEXT,
    stipend              TEXT,
    tags                 TEXT[],
    eligibility          TEXT,
    team_size            TEXT,
    banner_image_url     TEXT,
    is_active            BOOLEAN          NOT NULL DEFAULT TRUE,
    is_featured          BOOLEAN          NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  opportunities              IS 'Aggregated hackathon and internship listings from various platforms.';
COMMENT ON COLUMN opportunities.source_url  IS 'Original URL of the listing; enforced unique to prevent duplicates across scrape runs.';
COMMENT ON COLUMN opportunities.tags        IS 'Freeform tag array, e.g. ARRAY[''AI/ML'', ''Web Dev'', ''Open to all''].';

-- ---------------------------------------------------------------------------
-- 3. Table: bookmarks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bookmarks (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    opportunity_id UUID        NOT NULL REFERENCES opportunities (id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT bookmarks_user_opportunity_unique UNIQUE (user_id, opportunity_id)
);

COMMENT ON TABLE bookmarks IS 'Per-user bookmarks on opportunity listings.';

-- ---------------------------------------------------------------------------
-- 4. Table: admins
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
    id         UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email      TEXT        NOT NULL,
    role       admin_role  NOT NULL DEFAULT 'moderator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admins IS 'Admin users who can manage opportunities and view scrape logs.';

-- ---------------------------------------------------------------------------
-- 5. Table: scrape_logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS scrape_logs (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    source_platform TEXT          NOT NULL,
    status          scrape_status NOT NULL,
    items_scraped   INTEGER       NOT NULL DEFAULT 0,
    items_added     INTEGER       NOT NULL DEFAULT 0,
    items_updated   INTEGER       NOT NULL DEFAULT 0,
    error_message   TEXT,
    run_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE scrape_logs IS 'Audit log for each scraper run per platform.';

-- ---------------------------------------------------------------------------
-- 6. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_opportunities_type
    ON opportunities (type);

CREATE INDEX IF NOT EXISTS idx_opportunities_source_platform
    ON opportunities (source_platform);

CREATE INDEX IF NOT EXISTS idx_opportunities_application_deadline
    ON opportunities (application_deadline);

CREATE INDEX IF NOT EXISTS idx_opportunities_is_active
    ON opportunities (is_active);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id
    ON bookmarks (user_id);

-- Composite index for fast "active feed sorted by deadline" queries
CREATE INDEX IF NOT EXISTS idx_opportunities_active_deadline
    ON opportunities (is_active, application_deadline DESC NULLS LAST);

-- GIN index for efficient tag-array containment queries  (@>, ANY, etc.)
CREATE INDEX IF NOT EXISTS idx_opportunities_tags
    ON opportunities USING GIN (tags);

-- ---------------------------------------------------------------------------
-- 7. updated_at auto-update trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Row Level Security (RLS)
-- ---------------------------------------------------------------------------

-- ── opportunities ────────────────────────────────────────────────────────────

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (incl. anon) can read active rows
CREATE POLICY "opportunities_public_read"
    ON opportunities FOR SELECT
    USING (is_active = TRUE);

-- Admin insert
CREATE POLICY "opportunities_admin_insert"
    ON opportunities FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admin update
CREATE POLICY "opportunities_admin_update"
    ON opportunities FOR UPDATE
    TO authenticated
    USING   (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admin delete
CREATE POLICY "opportunities_admin_delete"
    ON opportunities FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ── bookmarks ────────────────────────────────────────────────────────────────

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_owner_select"
    ON bookmarks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_owner_insert"
    ON bookmarks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_owner_delete"
    ON bookmarks FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ── admins ───────────────────────────────────────────────────────────────────

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Each admin sees their own row; super_admins see all
CREATE POLICY "admins_self_or_superadmin_select"
    ON admins FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM admins a
            WHERE a.id = auth.uid() AND a.role = 'super_admin'
        )
    );

-- Only super_admins can write admin rows
CREATE POLICY "admins_superadmin_write"
    ON admins FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins a
            WHERE a.id = auth.uid() AND a.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins a
            WHERE a.id = auth.uid() AND a.role = 'super_admin'
        )
    );

-- ── scrape_logs ──────────────────────────────────────────────────────────────

ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scrape_logs_admin_select"
    ON scrape_logs FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "scrape_logs_admin_insert"
    ON scrape_logs FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
