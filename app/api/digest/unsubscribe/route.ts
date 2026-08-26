/**
 * app/api/digest/unsubscribe/route.ts
 *
 * One-click tokenized unsubscribe handler for weekly email digest.
 * Verifies HMAC signature so users can unsubscribe directly from their email client without logging in.
 */

import { NextResponse, type NextRequest } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env"
import type { Database } from "@/lib/supabase/types"

const HMAC_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "hackfeed-secret-key-digest"

function generateDigestUnsubscribeToken(userId: string): string {
  return crypto.createHmac("sha256", HMAC_SECRET).update(userId).digest("hex")
}

function verifyDigestUnsubscribeToken(userId: string, token: string): boolean {
  if (!userId || !token) return false
  const expected = crypto.createHmac("sha256", HMAC_SECRET).update(userId).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("uid")
  const token = searchParams.get("token")

  if (!userId || !token) {
    return new Response(renderUnsubscribeHtml("Invalid Request", "The unsubscribe link is incomplete.", false), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    })
  }

  const isValid = verifyDigestUnsubscribeToken(userId, token)
  if (!isValid) {
    return new Response(renderUnsubscribeHtml("Security Verification Failed", "This unsubscribe link is invalid or has expired.", false), {
      status: 403,
      headers: { "Content-Type": "text/html" },
    })
  }

  if (isSupabaseConfigured()) {
    try {
      const { url, serviceKey } = getSupabaseEnv()
      const supabaseAdmin = createClient<Database>(url, serviceKey, {
        auth: { persistSession: false },
      })

      await (supabaseAdmin as any)
        .from("user_preferences")
        .update({ digest_enabled: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
    } catch (err) {
      console.error("[Unsubscribe Error]", err)
    }
  }

  return new Response(
    renderUnsubscribeHtml(
      "You've been unsubscribed",
      "You will no longer receive weekly newsletter digests from HackFeed. You can re-enable this anytime in your account settings.",
      true
    ),
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  )
}

function renderUnsubscribeHtml(title: string, message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — HackFeed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #07070d;
      color: #f1f0ff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #0f0f1a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 40px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .icon {
      width: 56px;
      height: 56px;
      background: ${success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"};
      border: 1px solid ${success ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"};
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin: 0 auto 20px;
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #fff; }
    p { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 28px; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      color: #fff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      ${
        success
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
          : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      }
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/settings" class="btn">Manage Preferences on HackFeed →</a>
  </div>
</body>
</html>`
}
