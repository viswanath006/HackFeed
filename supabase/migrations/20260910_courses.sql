-- =============================================================================
-- HackFeed — Courses & Certifications Migration
-- Migration: 20260910_courses.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Custom ENUM types for courses
-- ---------------------------------------------------------------------------

CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');

CREATE TYPE course_price_type AS ENUM ('free', 'paid', 'free_with_paid_certificate');

-- ---------------------------------------------------------------------------
-- 2. Table: courses
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS courses (
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
    added_by             UUID             REFERENCES admins (id) ON DELETE SET NULL,
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

COMMENT ON TABLE  courses              IS 'Curated course and certification listings for students.';
COMMENT ON COLUMN courses.provider    IS 'Course platform e.g. Coursera, Udemy, freeCodeCamp, NPTEL, Google, AWS Skill Builder.';
COMMENT ON COLUMN courses.domain      IS 'Controlled domain category for clean filtering.';
COMMENT ON COLUMN courses.price_type  IS 'free = entirely free; paid = costs money; free_with_paid_certificate = audit free, certificate paid.';
COMMENT ON COLUMN courses.tags        IS 'Optional freeform tags, e.g. ARRAY[''Python'', ''Hands-on Projects''].';

-- ---------------------------------------------------------------------------
-- 3. Indexes on courses
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_courses_domain
    ON courses (domain);

CREATE INDEX IF NOT EXISTS idx_courses_price_type
    ON courses (price_type);

CREATE INDEX IF NOT EXISTS idx_courses_is_active
    ON courses (is_active);

CREATE INDEX IF NOT EXISTS idx_courses_active_featured
    ON courses (is_active, is_featured);

-- GIN index for tag-array queries
CREATE INDEX IF NOT EXISTS idx_courses_tags
    ON courses USING GIN (tags);

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger for courses
-- ---------------------------------------------------------------------------

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security (RLS) for courses
-- ---------------------------------------------------------------------------

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (incl. anon) can read active rows
CREATE POLICY "courses_public_read"
    ON courses FOR SELECT
    USING (is_active = TRUE);

-- Admin insert
CREATE POLICY "courses_admin_insert"
    ON courses FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admin update
CREATE POLICY "courses_admin_update"
    ON courses FOR UPDATE
    TO authenticated
    USING   (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admin delete
CREATE POLICY "courses_admin_delete"
    ON courses FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 6. Extend bookmarks table to support courses
-- ---------------------------------------------------------------------------

-- Drop the existing NOT NULL constraint on opportunity_id
-- and make it nullable so a bookmark can reference either an
-- opportunity OR a course (exactly one of the two must be set).

-- Step 1: Drop the existing unique constraint (we'll recreate it scoped to non-null)
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_opportunity_unique;

-- Step 2: Make opportunity_id nullable
ALTER TABLE bookmarks ALTER COLUMN opportunity_id DROP NOT NULL;

-- Step 3: Add course_id column
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses (id) ON DELETE CASCADE;

-- Step 4: CHECK constraint — exactly one of opportunity_id or course_id must be set
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_one_target_check
    CHECK (
        (opportunity_id IS NOT NULL AND course_id IS NULL)
        OR
        (opportunity_id IS NULL AND course_id IS NOT NULL)
    );

-- Step 5: Unique constraint for opportunity bookmarks
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_opportunity_unique
    UNIQUE (user_id, opportunity_id);

-- Step 6: Unique constraint for course bookmarks
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_course_unique
    UNIQUE (user_id, course_id);

-- Step 7: Index for course_id lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_course_id
    ON bookmarks (course_id)
    WHERE course_id IS NOT NULL;
