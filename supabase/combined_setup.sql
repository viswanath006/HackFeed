-- =============================================================================
-- HackFeed Complete Database Schema Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nibygyqfbhjeeqfydbsh/sql/new
-- =============================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Custom ENUM types
DO $$ BEGIN
    CREATE TYPE opportunity_type AS ENUM ('hackathon', 'internship');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_mode AS ENUM ('online', 'offline', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE scrape_status AS ENUM ('success', 'failed', 'partial');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE preference_opportunity_type AS ENUM ('hackathon', 'internship', 'both');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Table: opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
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

-- 3. Table: bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    opportunity_id UUID        NOT NULL REFERENCES public.opportunities (id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bookmarks_user_opportunity_unique UNIQUE (user_id, opportunity_id)
);

-- 4. Table: admins
CREATE TABLE IF NOT EXISTS public.admins (
    id         UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email      TEXT        NOT NULL,
    role       admin_role  NOT NULL DEFAULT 'moderator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table: scrape_logs
CREATE TABLE IF NOT EXISTS public.scrape_logs (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    source_platform TEXT          NOT NULL,
    status          scrape_status NOT NULL,
    items_scraped   INTEGER       NOT NULL DEFAULT 0,
    items_added     INTEGER       NOT NULL DEFAULT 0,
    items_updated   INTEGER       NOT NULL DEFAULT 0,
    error_message   TEXT,
    run_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 6. Table: user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_tags TEXT[] DEFAULT '{}',
    preferred_type preference_opportunity_type DEFAULT 'both' NOT NULL,
    reminder_enabled BOOLEAN DEFAULT true NOT NULL,
    digest_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Table: reminder_queue
CREATE TABLE IF NOT EXISTS public.reminder_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    remind_at TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT reminder_queue_user_opp_remind_key UNIQUE (user_id, opportunity_id, remind_at)
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities (type);
CREATE INDEX IF NOT EXISTS idx_opportunities_source_platform ON public.opportunities (source_platform);
CREATE INDEX IF NOT EXISTS idx_opportunities_application_deadline ON public.opportunities (application_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_active ON public.opportunities (is_active);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_active_deadline ON public.opportunities (is_active, application_deadline DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_opportunities_tags ON public.opportunities USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_reminder_queue_pending ON public.reminder_queue(remind_at, sent) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_reminder_queue_user_opp ON public.reminder_queue(user_id, opportunity_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_digest ON public.user_preferences(digest_enabled) WHERE digest_enabled = true;

-- 9. Auto updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER trg_opportunities_updated_at
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_queue ENABLE ROW LEVEL SECURITY;

-- 11. Policies
-- opportunities
DROP POLICY IF EXISTS "opportunities_public_read" ON public.opportunities;
CREATE POLICY "opportunities_public_read" ON public.opportunities FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "opportunities_admin_insert" ON public.opportunities;
CREATE POLICY "opportunities_admin_insert" ON public.opportunities FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "opportunities_admin_update" ON public.opportunities;
CREATE POLICY "opportunities_admin_update" ON public.opportunities FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "opportunities_admin_delete" ON public.opportunities;
CREATE POLICY "opportunities_admin_delete" ON public.opportunities FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- bookmarks
DROP POLICY IF EXISTS "bookmarks_owner_select" ON public.bookmarks;
CREATE POLICY "bookmarks_owner_select" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_owner_insert" ON public.bookmarks;
CREATE POLICY "bookmarks_owner_insert" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_owner_delete" ON public.bookmarks;
CREATE POLICY "bookmarks_owner_delete" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reminder_queue
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminder_queue;
CREATE POLICY "Users can view their own reminders" ON public.reminder_queue FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminder_queue;
CREATE POLICY "Users can delete their own reminders" ON public.reminder_queue FOR DELETE USING (auth.uid() = user_id);

-- admins
DROP POLICY IF EXISTS "admins_self_or_superadmin_select" ON public.admins;
CREATE POLICY "admins_self_or_superadmin_select" ON public.admins FOR SELECT TO authenticated
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid() AND a.role = 'super_admin'));

DROP POLICY IF EXISTS "admins_superadmin_write" ON public.admins;
CREATE POLICY "admins_superadmin_write" ON public.admins FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid() AND a.role = 'super_admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE a.id = auth.uid() AND a.role = 'super_admin'));

-- scrape_logs
DROP POLICY IF EXISTS "scrape_logs_admin_select" ON public.scrape_logs;
CREATE POLICY "scrape_logs_admin_select" ON public.scrape_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "scrape_logs_admin_insert" ON public.scrape_logs;
CREATE POLICY "scrape_logs_admin_insert" ON public.scrape_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- =============================================================================
-- 7. Courses & Certifications
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE course_price_type AS ENUM ('free', 'paid', 'free_with_paid_certificate');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.courses (
    id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    title                TEXT             NOT NULL,
    description          TEXT,
    provider             TEXT             NOT NULL,
    domain               TEXT             NOT NULL,
    level                course_level,
    price_type           course_price_type NOT NULL DEFAULT 'free',
    price                TEXT,
    duration             TEXT,
    certificate_provided BOOLEAN          NOT NULL DEFAULT FALSE,
    course_url           TEXT             NOT NULL,
    rating               NUMERIC(3,1),
    tags                 TEXT[],
    is_active            BOOLEAN          NOT NULL DEFAULT TRUE,
    is_featured          BOOLEAN          NOT NULL DEFAULT FALSE,
    added_by             UUID             REFERENCES public.admins (id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

    CONSTRAINT courses_domain_check CHECK (
        domain IN (
            'Web Development',
            'AI/ML',
            'Cloud Computing',
            'DSA',
            'Cybersecurity',
            'Data Science'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_courses_domain ON public.courses (domain);
CREATE INDEX IF NOT EXISTS idx_courses_price_type ON public.courses (price_type);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses (is_active);
CREATE INDEX IF NOT EXISTS idx_courses_active_featured ON public.courses (is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_tags ON public.courses USING GIN (tags);

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_public_read" ON public.courses;
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "courses_admin_insert" ON public.courses;
CREATE POLICY "courses_admin_insert" ON public.courses FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "courses_admin_update" ON public.courses;
CREATE POLICY "courses_admin_update" ON public.courses FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "courses_admin_delete" ON public.courses;
CREATE POLICY "courses_admin_delete" ON public.courses FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Extend bookmarks for courses
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_opportunity_unique;
ALTER TABLE public.bookmarks ALTER COLUMN opportunity_id DROP NOT NULL;
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses (id) ON DELETE CASCADE;

ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_one_target_check;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_one_target_check
    CHECK (
        (opportunity_id IS NOT NULL AND course_id IS NULL)
        OR
        (opportunity_id IS NULL AND course_id IS NOT NULL)
    );

ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_opportunity_unique;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_user_opportunity_unique
    UNIQUE (user_id, opportunity_id);

ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_course_unique;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_user_course_unique
    UNIQUE (user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_course_id ON public.bookmarks (course_id) WHERE course_id IS NOT NULL;

