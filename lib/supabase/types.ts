// =============================================================================
// HackFeed — Supabase Database Types
// Conforms to @supabase/supabase-js v2 type definitions with Relationships.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Enum Types
// ---------------------------------------------------------------------------

export type OpportunityType = 'hackathon' | 'internship'
export type OpportunityMode = 'online' | 'offline' | 'hybrid'
export type AdminRole = 'super_admin' | 'moderator'
export type ScrapeStatus = 'success' | 'failed' | 'partial'
export type PreferenceOpportunityType = 'hackathon' | 'internship' | 'both'

// ---------------------------------------------------------------------------
// Row types  (what you get back from SELECT)
// ---------------------------------------------------------------------------

export interface OpportunityRow {
  id: string
  title: string
  description: string | null
  type: OpportunityType
  source_platform: string | null
  source_url: string
  organizer: string | null
  location: string | null
  mode: OpportunityMode | null
  start_date: string | null           // ISO-8601 timestamptz
  end_date: string | null
  application_deadline: string | null
  prize_pool: string | null
  stipend: string | null
  tags: string[] | null
  eligibility: string | null
  team_size: string | null
  banner_image_url: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface BookmarkRow {
  id: string
  user_id: string
  opportunity_id: string
  created_at: string
}

export interface UserPreferencesRow {
  user_id: string
  preferred_tags: string[] | null
  preferred_type: PreferenceOpportunityType
  reminder_enabled: boolean
  digest_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ReminderQueueRow {
  id: string
  user_id: string
  opportunity_id: string
  remind_at: string
  sent: boolean
  created_at: string
}

export interface AdminRow {
  id: string
  email: string
  role: AdminRole
  created_at: string
}

export interface ScrapeLogRow {
  id: string
  source_platform: string
  status: ScrapeStatus
  items_scraped: number
  items_added: number
  items_updated: number
  error_message: string | null
  run_at: string
}

// ---------------------------------------------------------------------------
// Insert types
// ---------------------------------------------------------------------------

export interface OpportunityInsert {
  id?: string
  title: string
  description?: string | null
  type: OpportunityType
  source_platform?: string | null
  source_url: string
  organizer?: string | null
  location?: string | null
  mode?: OpportunityMode | null
  start_date?: string | null
  end_date?: string | null
  application_deadline?: string | null
  prize_pool?: string | null
  stipend?: string | null
  tags?: string[] | null
  eligibility?: string | null
  team_size?: string | null
  banner_image_url?: string | null
  is_active?: boolean
  is_featured?: boolean
  created_at?: string
  updated_at?: string
}

export interface BookmarkInsert {
  id?: string
  user_id: string
  opportunity_id: string
  created_at?: string
}

export interface UserPreferencesInsert {
  user_id: string
  preferred_tags?: string[] | null
  preferred_type?: PreferenceOpportunityType
  reminder_enabled?: boolean
  digest_enabled?: boolean
  created_at?: string
  updated_at?: string
}

export interface ReminderQueueInsert {
  id?: string
  user_id: string
  opportunity_id: string
  remind_at: string
  sent?: boolean
  created_at?: string
}

export interface AdminInsert {
  id: string
  email: string
  role?: AdminRole
  created_at?: string
}

export interface ScrapeLogInsert {
  id?: string
  source_platform: string
  status: ScrapeStatus
  items_scraped?: number
  items_added?: number
  items_updated?: number
  error_message?: string | null
  run_at?: string
}

// ---------------------------------------------------------------------------
// Update types
// ---------------------------------------------------------------------------

export type OpportunityUpdate = Partial<OpportunityInsert>
export type BookmarkUpdate   = Partial<BookmarkInsert>
export type UserPreferencesUpdate = Partial<Omit<UserPreferencesInsert, 'user_id' | 'created_at'>>
export type ReminderQueueUpdate   = Partial<Omit<ReminderQueueInsert, 'id' | 'created_at'>>
export type AdminUpdate      = Partial<AdminInsert>
export type ScrapeLogUpdate  = Partial<ScrapeLogInsert>

// ---------------------------------------------------------------------------
// Database shape (used to type the Supabase client)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row:    OpportunityRow
        Insert: OpportunityInsert
        Update: OpportunityUpdate
        Relationships: []
      }
      bookmarks: {
        Row:    BookmarkRow
        Insert: BookmarkInsert
        Update: BookmarkUpdate
        Relationships: [
          {
            foreignKeyName: "bookmarks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row:    UserPreferencesRow
        Insert: UserPreferencesInsert
        Update: UserPreferencesUpdate
        Relationships: []
      }
      reminder_queue: {
        Row:    ReminderQueueRow
        Insert: ReminderQueueInsert
        Update: ReminderQueueUpdate
        Relationships: [
          {
            foreignKeyName: "reminder_queue_opportunity_id_fkey"
            columns: ["opportunity_id"]
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      admins: {
        Row:    AdminRow
        Insert: AdminInsert
        Update: AdminUpdate
        Relationships: []
      }
      scrape_logs: {
        Row:    ScrapeLogRow
        Insert: ScrapeLogInsert
        Update: ScrapeLogUpdate
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      opportunity_type: OpportunityType
      opportunity_mode: OpportunityMode
      preference_opportunity_type: PreferenceOpportunityType
      admin_role: AdminRole
      scrape_status: ScrapeStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
