"""
scraper/reminder_sender.py

Hourly scheduled service that queries `reminder_queue` for pending deadline reminders
and dispatches branded notification emails via Resend.
"""

import os
import sys
import argparse
from datetime import datetime, timezone
import httpx
from db import DatabaseClient
from config import settings

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
APP_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000").rstrip("/")
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "HackFeed <onboarding@resend.dev>")


def render_reminder_email(
    opportunity_title: str,
    organizer: str,
    deadline_str: str,
    days_left: int,
    opportunity_url: str,
    opportunity_type: str,
    prize_or_stipend: str = None
) -> str:
    """Generates a clean, mobile-friendly dark-mode HTML email template."""
    days_text = "1 day" if days_left == 1 else f"{days_left} days"
    urgency_color = "#ef4444" if days_left <= 1 else "#f59e0b"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Deadline Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07070d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f0ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #07070d; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #0f0f1a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; padding: 32px;" cellspacing="0" cellpadding="0" border="0">
          <!-- Logo -->
          <tr>
            <td align="left" style="padding-bottom: 24px;">
              <span style="font-size: 20px; font-weight: 800; color: #c4b5fd; text-decoration: none; letter-spacing: -0.5px;">⚡ HackFeed</span>
            </td>
          </tr>

          <!-- Urgency Banner -->
          <tr>
            <td style="padding-bottom: 16px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: rgba(245, 158, 11, 0.15); border: 1px solid {urgency_color}; border-radius: 99px; font-size: 12px; font-weight: 700; color: {urgency_color};">
                ⏰ Closes in {days_text}
              </span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding-bottom: 8px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                {opportunity_title}
              </h1>
            </td>
          </tr>

          <!-- Organizer / Type -->
          <tr>
            <td style="padding-bottom: 24px; font-size: 14px; color: #a1a1aa;">
              Organized by <strong style="color: #e4e4e7;">{organizer or 'Organizer'}</strong> • <span style="text-transform: capitalize;">{opportunity_type}</span>
              {f' • <strong>{prize_or_stipend}</strong>' if prize_or_stipend else ''}
            </td>
          </tr>

          <!-- Deadline Box -->
          <tr>
            <td style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; font-weight: 700;">Final Application Deadline</p>
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #f4f4f5;">{deadline_str}</p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-top: 28px; padding-bottom: 24px;">
              <a href="{opportunity_url}" target="_blank" style="display: block; width: 100%; text-align: center; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; box-sizing: border-box; box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4);">
                View Details &amp; Apply on HackFeed →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; font-size: 12px; color: #52525b; text-align: center; line-height: 1.5;">
              You received this reminder because you bookmarked this opportunity on HackFeed.<br>
              To manage notifications, update your preferences in your <a href="{APP_URL}/settings" style="color: #a78bfa; text-decoration: none;">Account Settings</a>.
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
        print(f"[Resend Notice] RESEND_API_KEY not set. Simulated send to {to_email}: '{subject}'")
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
        if response.status_code in (200, 201):
            return True
        else:
            print(f"[Resend Error] Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"[Resend Exception] {e}")
        return False


def process_reminders(dry_run: bool = False) -> int:
    """
    Main job: queries reminder_queue where remind_at <= now() and sent = false.
    Sends emails and updates sent = true.
    """
    if not settings.validate():
        print("[Reminders] Skipping: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured in environment.", file=sys.stderr)
        return 0

    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        db = DatabaseClient()
        # Fetch pending reminders
        res = db.client.table("reminder_queue") \
            .select("id, user_id, opportunity_id, remind_at, sent, opportunities(id, title, organizer, type, application_deadline, prize_pool, stipend)") \
            .lte("remind_at", now_iso) \
            .eq("sent", False) \
            .limit(100) \
            .execute()

        reminders = res.data or []
        if not reminders:
            print(f"[Reminders] No pending reminders to process at {now_iso}.")
            return 0

        print(f"[Reminders] Found {len(reminders)} pending reminders.")
        sent_count = 0

        for item in reminders:
            queue_id = item["id"]
            user_id = item["user_id"]
            opp = item.get("opportunities") or {}

            if not opp or not opp.get("id"):
                continue

            # Fetch user email using Supabase auth admin
            user_email = None
            try:
                user_res = db.client.auth.admin.get_user_by_id(user_id)
                if user_res and user_res.user:
                    user_email = user_res.user.email
            except Exception as err:
                print(f"[Reminders] Could not fetch email for user {user_id}: {err}")

            if not user_email:
                user_email = f"user_{user_id[:8]}@example.com"

            opp_title = opp.get("title", "Saved Opportunity")
            deadline = opp.get("application_deadline")
            days_left = 1
            if deadline:
                try:
                    dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                    diff = dt - datetime.now(timezone.utc)
                    days_left = max(1, round(diff.total_seconds() / 86400))
                except Exception:
                    pass

            days_text = "1 day" if days_left == 1 else f"{days_left} days"
            subject = f"⏰ Reminder: {opp_title} deadline in {days_text}"
            opp_url = f"{APP_URL}/opportunities/{opp.get('id')}"

            html_body = render_reminder_email(
                opportunity_title=opp_title,
                organizer=opp.get("organizer", ""),
                deadline_str=deadline or "Closing soon",
                days_left=days_left,
                opportunity_url=opp_url,
                opportunity_type=opp.get("type", "opportunity"),
                prize_or_stipend=opp.get("prize_pool") or opp.get("stipend")
            )

            if dry_run:
                print(f"[Dry Run] Would send reminder to {user_email} for '{opp_title}' (Queue ID: {queue_id})")
                sent_count += 1
            else:
                success = send_resend_email(user_email, subject, html_body)
                if success:
                    # Mark as sent
                    db.client.table("reminder_queue").update({"sent": True}).eq("id", queue_id).execute()
                    sent_count += 1
                    print(f"[Reminders] Sent reminder to {user_email} for '{opp_title}'")

        return sent_count

    except Exception as e:
        print(f"[Reminders Exception] Failed processing reminders: {e}")
        return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HackFeed Deadline Reminder Dispatcher")
    parser.add_argument("--dry-run", action="store_true", help="Simulate sending without marking as sent")
    args = parser.parse_args()

    count = process_reminders(dry_run=args.dry_run)
    print(f"[Reminders Complete] Processed {count} reminders.")
