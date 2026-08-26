-- =============================================================================
-- Migration: 20260824_engagement_features.sql
-- Description: User preferences, reminder queue, and RLS policies for HackFeed
-- =============================================================================

-- 1. Enum for preferred opportunity types
DO $$ BEGIN
    CREATE TYPE preference_opportunity_type AS ENUM ('hackathon', 'internship', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Table: user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_tags TEXT[] DEFAULT '{}',
    preferred_type preference_opportunity_type DEFAULT 'both' NOT NULL,
    reminder_enabled BOOLEAN DEFAULT true NOT NULL,
    digest_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Table: reminder_queue
CREATE TABLE IF NOT EXISTS public.reminder_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    remind_at TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT reminder_queue_user_opp_remind_key UNIQUE (user_id, opportunity_id, remind_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminder_queue_pending 
    ON public.reminder_queue(remind_at, sent) 
    WHERE sent = false;

CREATE INDEX IF NOT EXISTS idx_reminder_queue_user_opp 
    ON public.reminder_queue(user_id, opportunity_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_digest 
    ON public.user_preferences(digest_enabled) 
    WHERE digest_enabled = true;

-- 4. Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_queue ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. RLS Policies for reminder_queue
CREATE POLICY "Users can view their own reminders"
    ON public.reminder_queue
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
    ON public.reminder_queue
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for auto-updating updated_at on user_preferences
CREATE OR REPLACE FUNCTION set_updated_at_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_user_preferences();
