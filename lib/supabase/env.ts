/**
 * lib/supabase/env.ts
 *
 * Helper to safely extract and sanitize Supabase environment variables.
 * Checks if live credentials have been configured in .env.local.
 */

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  return (
    url.startsWith("https://") &&
    !url.includes("placeholder") &&
    !url.includes("<project-ref>") &&
    !url.includes("<") &&
    key.length > 20 &&
    !key.includes("placeholder") &&
    !key.includes("<")
  )
}

export function getSupabaseEnv() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co"
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key"

  if (url.includes("<") || url.includes(">") || !url.startsWith("http")) {
    url = "https://placeholder-project.supabase.co"
  }
  if (anonKey.includes("<") || anonKey.includes(">")) {
    anonKey = "placeholder-anon-key"
  }
  if (serviceKey.includes("<") || serviceKey.includes(">")) {
    serviceKey = "placeholder-service-key"
  }

  return { url, anonKey, serviceKey }
}
