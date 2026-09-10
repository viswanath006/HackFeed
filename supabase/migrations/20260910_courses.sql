-- =============================================================================
-- HackFeed — Courses & Certifications Migration
-- Migration: 20260910_courses.sql
-- Direct Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nibygyqfbhjeeqfydbsh/sql/new
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Custom ENUM types for courses (idempotent)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE course_price_type AS ENUM ('free', 'paid', 'free_with_paid_certificate');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------------
-- 2. Table: courses
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
    id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    title                TEXT             NOT NULL,
    description          TEXT,
    provider             TEXT             NOT NULL,  -- e.g. 'Coursera', 'Udemy', 'freeCodeCamp', 'NPTEL', 'Google', 'AWS Skill Builder'
    domain               TEXT             NOT NULL,  -- Controlled list: 'Web Development', 'AI/ML', 'Cloud Computing', 'DSA', 'Cybersecurity', 'Data Science'
    level                course_level,
    price_type           course_price_type NOT NULL DEFAULT 'free',
    price                TEXT,                       -- e.g. '$49', '₹2,999', null if free
    duration             TEXT,                       -- e.g. '6 weeks', '20 hours'
    certificate_provided BOOLEAN          NOT NULL DEFAULT FALSE,
    course_url           TEXT             NOT NULL,
    rating               NUMERIC(3,1),               -- e.g. 4.7
    tags                 TEXT[],                     -- e.g. ARRAY['Python', 'Beginner Friendly', 'Hands-on Projects']
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

COMMENT ON TABLE  public.courses              IS 'Curated course and certification listings for students.';
COMMENT ON COLUMN public.courses.provider    IS 'Course platform e.g. Coursera, Udemy, freeCodeCamp, NPTEL, Google, AWS Skill Builder.';
COMMENT ON COLUMN public.courses.domain      IS 'Controlled domain category for clean filtering.';
COMMENT ON COLUMN public.courses.price_type  IS 'free = entirely free; paid = costs money; free_with_paid_certificate = audit free, certificate paid.';
COMMENT ON COLUMN public.courses.tags        IS 'Optional freeform tags, e.g. ARRAY[''Python'', ''Hands-on Projects''].';

-- ---------------------------------------------------------------------------
-- 3. Indexes on courses
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_courses_domain
    ON public.courses (domain);

CREATE INDEX IF NOT EXISTS idx_courses_price_type
    ON public.courses (price_type);

CREATE INDEX IF NOT EXISTS idx_courses_is_active
    ON public.courses (is_active);

CREATE INDEX IF NOT EXISTS idx_courses_active_featured
    ON public.courses (is_active, is_featured);

-- GIN index for tag-array queries
CREATE INDEX IF NOT EXISTS idx_courses_tags
    ON public.courses USING GIN (tags);

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger for courses
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security (RLS) for courses
-- ---------------------------------------------------------------------------

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (incl. anon) can read active rows
DROP POLICY IF EXISTS "courses_public_read" ON public.courses;
CREATE POLICY "courses_public_read"
    ON public.courses FOR SELECT
    USING (is_active = TRUE);

-- Admin insert
DROP POLICY IF EXISTS "courses_admin_insert" ON public.courses;
CREATE POLICY "courses_admin_insert"
    ON public.courses FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Admin update
DROP POLICY IF EXISTS "courses_admin_update" ON public.courses;
CREATE POLICY "courses_admin_update"
    ON public.courses FOR UPDATE
    TO authenticated
    USING   (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Admin delete
DROP POLICY IF EXISTS "courses_admin_delete" ON public.courses;
CREATE POLICY "courses_admin_delete"
    ON public.courses FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 6. Extend bookmarks table to support courses
-- ---------------------------------------------------------------------------

-- Step 1: Drop existing unique constraint
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_opportunity_unique;

-- Step 2: Make opportunity_id nullable
ALTER TABLE public.bookmarks ALTER COLUMN opportunity_id DROP NOT NULL;

-- Step 3: Add course_id column
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses (id) ON DELETE CASCADE;

-- Step 4: CHECK constraint — exactly one of opportunity_id or course_id must be set
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_one_target_check;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_one_target_check
    CHECK (
        (opportunity_id IS NOT NULL AND course_id IS NULL)
        OR
        (opportunity_id IS NULL AND course_id IS NOT NULL)
    );

-- Step 5: Unique constraint for opportunity bookmarks
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_opportunity_unique;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_user_opportunity_unique
    UNIQUE (user_id, opportunity_id);

-- Step 6: Unique constraint for course bookmarks
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_course_unique;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_user_course_unique
    UNIQUE (user_id, course_id);

-- Step 7: Index for course_id lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_course_id
    ON public.bookmarks (course_id)
    WHERE course_id IS NOT NULL;
