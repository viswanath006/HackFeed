"""
scraper/digest_sender.py

Weekly newsletter digest service that queries new opportunities from the past 7 days
and dispatches personalized briefings to users with `digest_enabled = true` via Resend.
"""

import os
import sys
import hmac
import hashlib
import argparse
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import httpx
from db import DatabaseClient
from config import settings

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
APP_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000").rstrip("/")
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "HackFeed Digest <onboarding@resend.dev>")
HMAC_SECRET = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "hackfeed-secret-key-digest")


def generate_unsubscribe_token(user_id: str) -> str:
    """Generates an HMAC SHA-256 token for secure one-click unsubscribe links."""
    return hmac.new(
        HMAC_SECRET.encode("utf-8"),
        user_id.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def render_digest_email(
    picked_for_you: List[Dict[str, Any]],
    also_new: List[Dict[str, Any]],
    user_id: str
) -> str:
    """Generates a responsive, modern dark-mode weekly digest newsletter."""
    unsub_token = generate_unsubscribe_token(user_id)
    unsub_url = f"{APP_URL}/api/digest/unsubscribe?uid={user_id}&token={unsub_token}"

    def render_item(op: Dict[str, Any]) -> str:
        title = op.get("title", "Opportunity")
        organizer = op.get("organizer", "")
        op_type = op.get("type", "hackathon")
        op_id = op.get("id", "")
        detail_url = f"{APP_URL}/opportunities/{op_id}"
        deadline = op.get("application_deadline")
        deadline_text = f"Apply by {deadline[:10]}" if deadline else "Open"
        reward = op.get("prize_pool") or op.get("stipend")

        badge_bg = "rgba(124, 58, 237, 0.15)" if op_type == "hackathon" else "rgba(14, 165, 233, 0.15)"
        badge_color = "#c4b5fd" if op_type == "hackathon" else "#7dd3fc"

        return f"""
        <tr>
          <td style="padding-bottom: 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px 16px;">
              <tr>
                <td>
                  <div style="margin-bottom: 6px;">
                    <span style="display: inline-block; padding: 2px 8px; background-color: {badge_bg}; border-radius: 99px; font-size: 10px; font-weight: 700; color: {badge_color}; text-transform: uppercase; letter-spacing: 0.5px;">
                      {op_type}
                    </span>
                    {f'<span style="margin-left: 6px; font-size: 11px; font-weight: 600; color: #a1a1aa;">{reward}</span>' if reward else ''}
                  </div>
                  <a href="{detail_url}" target="_blank" style="font-size: 15px; font-weight: 700; color: #f4f4f5; text-decoration: none; display: block; line-height: 1.3;">
                    {title}
                  </a>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #71717a;">
                    {f'by {organizer} • ' if organizer else ''}<span style="color: #a1a1aa;">{deadline_text}</span>
                  </p>
                </td>
                <td align="right" valign="middle" style="padding-left: 12px;">
                  <a href="{detail_url}" target="_blank" style="display: inline-block; background-color: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #e4e4e7; text-decoration: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                    View →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        """

    picked_html = "".join([render_item(op) for op in picked_for_you])
    also_new_html = "".join([render_item(op) for op in also_new])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>This Week on HackFeed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07070d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f0ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #07070d; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #0f0f1a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; padding: 32px;" cellspacing="0" cellpadding="0" border="0">
          <!-- Logo & Header -->
          <tr>
            <td align="left" style="padding-bottom: 20px;">
              <span style="font-size: 20px; font-weight: 800; color: #c4b5fd; text-decoration: none; letter-spacing: -0.5px;">⚡ HackFeed Weekly</span>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 24px;">
              <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                This week's top tech opportunities
              </h1>
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
                Here are the latest hackathons, innovation challenges, and tech internships aggregated from Unstop, Devfolio, HackerEarth &amp; H2Skill.
              </p>
            </td>
          </tr>

          <!-- Picked for you section (if available) -->
          {f'''
          <tr>
            <td style="padding-bottom: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c4b5fd;">
              ⭐ Picked for you (matching your interests)
            </td>
          </tr>
          {picked_html}
          ''' if picked_for_you else ''}

          <!-- Also new this week section -->
          {f'''
          <tr>
            <td style="padding-top: 12px; padding-bottom: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa;">
              🔥 Also new this week
            </td>
          </tr>
          {also_new_html}
          ''' if also_new else ''}

          <!-- View all CTA -->
          <tr>
            <td align="center" style="padding-top: 24px; padding-bottom: 28px;">
              <a href="{APP_URL}/opportunities" target="_blank" style="display: block; width: 100%; text-align: center; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; box-sizing: border-box; box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4);">
                Explore Full HackFeed →
              </a>
            </td>
          </tr>

          <!-- Footer & Unsubscribe -->
          <tr>
            <td style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; font-size: 11px; color: #52525b; text-align: center; line-height: 1.6;">
              You received this digest because weekly briefings are enabled on your HackFeed account.<br>
              <a href="{APP_URL}/settings" style="color: #a78bfa; text-decoration: none;">Manage Preferences</a> • 
              <a href="{unsub_url}" style="color: #71717a; text-decoration: underline;">Unsubscribe with 1-click</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_resend_email(to_email: str, subject: str, html_body: str) -> bool:
    """Sends an email via the Resend REST API."""
    if not RESEND_API_KEY:
        print(f"[Resend Notice] RESEND_API_KEY not set. Simulated digest to {to_email}: '{subject}'")
        return True

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            },
            timeout=10.0,
        )
        return response.status_code in (200, 201)
    except Exception as e:
        print(f"[Resend Exception] {e}")
        return False


def process_weekly_digest(dry_run: bool = False) -> int:
    """
    Main job: queries users with digest_enabled = true,
    fetches opportunities from the past 7 days, and sends personalized briefings.
    """
    if not settings.validate():
        print("[Digest] Skipping: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured in environment.", file=sys.stderr)
        return 0

    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    try:
        db = DatabaseClient()
        # 1. Fetch recent opportunities
        opps_res = db.client.table("opportunities") \
            .select("id, title, organizer, type, application_deadline, prize_pool, stipend, tags, is_featured") \
            .eq("is_active", True) \
            .gte("created_at", seven_days_ago) \
            .order("created_at", desc=True) \
            .limit(30) \
            .execute()

        recent_opps = opps_res.data or []
        if not recent_opps:
            # Fallback to general active opportunities
            fallback_res = db.client.table("opportunities") \
                .select("id, title, organizer, type, application_deadline, prize_pool, stipend, tags, is_featured") \
                .eq("is_active", True) \
                .order("application_deadline", desc=False) \
                .limit(10) \
                .execute()
            recent_opps = fallback_res.data or []

        if not recent_opps:
            print("[Digest] No active opportunities found to send.")
            return 0

        # 2. Fetch users with digest_enabled = true
        pref_res = db.client.table("user_preferences") \
            .select("user_id, preferred_tags, preferred_type, digest_enabled") \
            .eq("digest_enabled", True) \
            .execute()

        users_to_notify = pref_res.data or []
        if not users_to_notify:
            print("[Digest] No users with digest_enabled = true.")
            return 0

        print(f"[Digest] Found {len(users_to_notify)} subscribers and {len(recent_opps)} opportunities.")
        sent_count = 0

        for user_pref in users_to_notify:
            user_id = user_pref["user_id"]
            preferred_tags = [t.lower() for t in (user_pref.get("preferred_tags") or [])]
            preferred_type = user_pref.get("preferred_type", "both")

            # Fetch email
            user_email = None
            try:
                user_res = db.client.auth.admin.get_user_by_id(user_id)
                if user_res and user_res.user:
                    user_email = user_res.user.email
            except Exception as err:
                print(f"[Digest] Could not fetch email for user {user_id}: {err}")

            if not user_email:
                user_email = f"user_{user_id[:8]}@example.com"

            # Filter & group
            picked = []
            also_new = []

            for op in recent_opps:
                op_type = op.get("type", "hackathon")
                op_tags = [t.lower() for t in (op.get("tags") or [])]

                type_match = preferred_type == "both" or op_type == preferred_type
                tag_match = any(pt in " ".join(op_tags) for pt in preferred_tags) if preferred_tags else False

                if tag_match and type_match:
                    picked.append(op)
                else:
                    also_new.append(op)

            # Cap sizes
            picked = picked[:5]
            also_new = also_new[:(10 - len(picked))]

            subject = f"📬 This week on HackFeed: {len(picked) + len(also_new)} new opportunities"
            html_body = render_digest_email(picked, also_new, user_id)

            if dry_run:
                print(f"[Dry Run] Would send digest to {user_email} (Picked: {len(picked)}, Other: {len(also_new)})")
                sent_count += 1
            else:
                success = send_resend_email(user_email, subject, html_body)
                if success:
                    sent_count += 1
                    print(f"[Digest] Sent weekly digest to {user_email}")

        return sent_count

    except Exception as e:
        print(f"[Digest Exception] Failed processing weekly digest: {e}")
        return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HackFeed Weekly Newsletter Digest Dispatcher")
    parser.add_argument("--dry-run", action="store_true", help="Simulate sending without emailing users")
    args = parser.parse_args()

    count = process_weekly_digest(dry_run=args.dry_run)
    print(f"[Digest Complete] Dispatched {count} weekly digests.")
