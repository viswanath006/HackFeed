"""
scraper/db.py

Supabase database integration layer for the HackFeed Scraper.
Uses the service-role client to write directly to opportunities and scrape_logs tables,
bypassing RLS for trusted automation.
"""

from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone
from supabase import create_client, Client
from config import settings


class DatabaseClient:
    def __init__(self):
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError(
                "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment configuration."
            )
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )

    def get_existing_opportunities(self, source_platform: str) -> Dict[str, Dict[str, Any]]:
        """
        Fetches all existing opportunities for a given source platform.
        Returns a dictionary mapping `source_url` -> existing record dict.
        """
        try:
            response = self.client.table("opportunities") \
                .select("id, source_url, title, banner_image_url, application_deadline, prize_pool, stipend, start_date, end_date, description, tags, updated_at") \
                .eq("source_platform", source_platform) \
                .execute()
            
            records = response.data or []
            return {item["source_url"]: item for item in records if item.get("source_url")}
        except Exception as e:
            print(f"[DB ERROR] Failed to fetch existing opportunities for {source_platform}: {e}")
            return {}

    def upsert_opportunities(
        self,
        opportunities: List[Dict[str, Any]],
        source_platform: str
    ) -> Tuple[int, int]:
        """
        Deduplicates and upserts normalized opportunities:
        - If source_url is not in DB: INSERTS new record (increments added_count).
        - If source_url is in DB and relevant details changed: UPDATES record (increments updated_count).
        - If identical: skips.

        Returns (added_count, updated_count).
        """
        if not opportunities:
            return 0, 0

        existing_map = self.get_existing_opportunities(source_platform)
        added_count = 0
        updated_count = 0
        now_iso = datetime.now(timezone.utc).isoformat()

        for opp in opportunities:
            source_url = opp.get("source_url")
            if not source_url:
                continue

            existing = existing_map.get(source_url)

            if not existing:
                # INSERT new record
                try:
                    payload = {**opp}
                    if "is_active" not in payload:
                        payload["is_active"] = True
                    if "is_featured" not in payload:
                        payload["is_featured"] = False

                    self.client.table("opportunities").insert(payload).execute()
                    added_count += 1
                except Exception as e:
                    print(f"[DB INSERT ERROR] Failed to insert '{opp.get('title')}': {e}")
            else:
                # Check for changes in key attributes
                has_changes = (
                    (opp.get("banner_image_url") and opp.get("banner_image_url") != existing.get("banner_image_url")) or
                    (opp.get("title") and opp.get("title") != existing.get("title")) or
                    (opp.get("application_deadline") and opp.get("application_deadline") != existing.get("application_deadline")) or
                    (opp.get("prize_pool") and opp.get("prize_pool") != existing.get("prize_pool")) or
                    (opp.get("stipend") and opp.get("stipend") != existing.get("stipend")) or
                    (opp.get("start_date") and opp.get("start_date") != existing.get("start_date")) or
                    (opp.get("end_date") and opp.get("end_date") != existing.get("end_date")) or
                    (opp.get("description") and opp.get("description") != existing.get("description"))
                )

                if has_changes:
                    try:
                        update_payload = {
                            **opp,
                            "updated_at": now_iso
                        }
                        update_payload.pop("id", None)

                        self.client.table("opportunities") \
                            .update(update_payload) \
                            .eq("id", existing["id"]) \
                            .execute()
                        updated_count += 1
                    except Exception as e:
                        print(f"[DB UPDATE ERROR] Failed to update '{opp.get('title')}': {e}")

        return added_count, updated_count

    def log_scrape_run(
        self,
        source_platform: str,
        status: str,
        items_scraped: int = 0,
        items_added: int = 0,
        items_updated: int = 0,
        error_message: Optional[str] = None
    ) -> None:
        """
        Writes an audit record to the `scrape_logs` table.
        Status must be one of: 'success', 'failed', 'partial'.
        """
        try:
            payload = {
                "source_platform": source_platform,
                "status": status,
                "items_scraped": items_scraped,
                "items_added": items_added,
                "items_updated": items_updated,
                "error_message": error_message,
                "run_at": datetime.now(timezone.utc).isoformat()
            }
            self.client.table("scrape_logs").insert(payload).execute()
            print(f"[AUDIT LOG] {source_platform}: status={status}, scraped={items_scraped}, added={items_added}, updated={items_updated}")
        except Exception as e:
            print(f"[DB LOG ERROR] Failed to log scrape run for {source_platform}: {e}")
