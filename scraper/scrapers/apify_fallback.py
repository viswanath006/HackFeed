"""
scraper/scrapers/apify_fallback.py

Generic Apify API fallback scraper for HackFeed.
Used when direct scraping of a platform is too brittle, complex, or maintenance-heavy.
Triggers an Apify Actor run via REST API, polls for completion, downloads the dataset,
and normalizes results into the HackFeed opportunities schema.
"""

import time
from typing import List, Dict, Any, Optional
from scrapers.base import BaseScraper
from scrapers.config import get_apify_actor, APIFY_START_URLS
from config import settings


class ApifyFallbackScraper(BaseScraper):
    """
    Drop-in replacement scraper that executes an Apify actor via REST API
    and normalizes the output dataset into HackFeed's opportunities schema.
    """

    def __init__(self, platform_name: str, actor_id: Optional[str] = None):
        super().__init__(request_delay=1.0)
        self.platform_name = platform_name.capitalize()
        self.platform_key = platform_name.lower()
        self.actor_id = actor_id or get_apify_actor(self.platform_key)
        self.api_token = settings.APIFY_API_TOKEN

    def scrape(self) -> List[Dict[str, Any]]:
        """
        Executes the Apify actor, polls until done, and normalizes output items.
        """
        if not self.api_token:
            raise ValueError(
                f"[Apify Fallback] Cannot run Apify for '{self.platform_name}' because "
                "APIFY_API_TOKEN is not configured in .env."
            )

        print(f"[Apify Fallback] Triggering Apify actor '{self.actor_id}' for {self.platform_name}...")

        # 1. Trigger Actor Run
        run_data = self._trigger_actor_run()
        run_id = run_data.get("id")
        dataset_id = run_data.get("defaultDatasetId")

        if not run_id or not dataset_id:
            raise RuntimeError(f"[Apify Fallback] Invalid response when starting actor: {run_data}")

        print(f"[Apify Fallback] Actor run started. Run ID: {run_id}. Polling for completion...")

        # 2. Poll for Completion
        finished_run = self._poll_run_status(run_id)
        final_status = finished_run.get("status")

        if final_status != "SUCCEEDED":
            raise RuntimeError(f"[Apify Fallback] Actor run failed with status: {final_status}")

        print(f"[Apify Fallback] Run completed successfully. Fetching dataset {dataset_id}...")

        # 3. Fetch Dataset Items
        items = self._fetch_dataset_items(dataset_id)
        print(f"[Apify Fallback] Received {len(items)} raw items from Apify dataset.")

        # 4. Normalize to HackFeed schema
        normalized_items: List[Dict[str, Any]] = []
        for raw in items:
            normalized = self._normalize_apify_item(raw)
            if normalized:
                normalized_items.append(normalized)

        # Deduplicate
        seen_urls = set()
        unique_results = []
        for it in normalized_items:
            url = it.get("source_url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(it)

        print(f"[Apify Fallback] Normalized {len(unique_results)} opportunities for {self.platform_name}.")
        return unique_results

    def _trigger_actor_run(self) -> Dict[str, Any]:
        """Calls Apify POST /v2/acts/{actor_id}/runs to trigger an execution."""
        # Sanitize actor ID (replace / with ~ for Apify URL encoding if needed)
        encoded_actor = self.actor_id.replace("/", "~")
        url = f"https://api.apify.com/v2/acts/{encoded_actor}/runs"

        params = {"token": self.api_token}
        payload = {
            "startUrls": APIFY_START_URLS.get(self.platform_key, [{"url": f"https://{self.platform_key}.com"}]),
            "maxItems": settings.MAX_ITEMS_PER_PLATFORM
        }

        resp = self.client.post(url, params=params, json=payload, timeout=30.0)
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Failed to trigger Apify actor {self.actor_id}: HTTP {resp.status_code} - {resp.text}")

        data = resp.json().get("data", {})
        return data

    def _poll_run_status(self, run_id: str, max_wait_seconds: int = 180, poll_interval: int = 5) -> Dict[str, Any]:
        """Polls GET /v2/acts/{actor_id}/runs/{run_id} until terminal state."""
        encoded_actor = self.actor_id.replace("/", "~")
        url = f"https://api.apify.com/v2/acts/{encoded_actor}/runs/{run_id}"
        params = {"token": self.api_token}

        start_time = time.time()
        while time.time() - start_time < max_wait_seconds:
            time.sleep(poll_interval)
            resp = self.client.get(url, params=params, timeout=20.0)
            if resp.status_code == 200:
                run_info = resp.json().get("data", {})
                status = run_info.get("status")
                if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
                    return run_info
                print(f"[Apify Fallback] Run status: {status}... waiting")
            else:
                print(f"[Apify Fallback] Status check warning: HTTP {resp.status_code}")

        raise TimeoutError(f"Apify actor run {run_id} timed out after {max_wait_seconds} seconds.")

    def _fetch_dataset_items(self, dataset_id: str) -> List[Dict[str, Any]]:
        """Downloads all items from the resulting Apify dataset."""
        url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"
        params = {
            "token": self.api_token,
            "format": "json",
            "clean": 1
        }
        resp = self.client.get(url, params=params, timeout=40.0)
        if resp.status_code != 200:
            raise RuntimeError(f"Failed to fetch dataset items: HTTP {resp.status_code} - {resp.text}")
        return resp.json()

    def _normalize_apify_item(self, raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Maps heterogeneous fields from arbitrary Apify actor datasets
        to the HackFeed opportunities schema.
        """
        title = raw.get("title") or raw.get("name") or raw.get("heading")
        source_url = raw.get("url") or raw.get("link") or raw.get("source_url") or raw.get("href")
        if not title or not source_url:
            return None

        # Type classification
        raw_type = str(raw.get("type", "")).lower()
        title_lower = title.lower()
        if any(w in raw_type or w in title_lower for w in ["internship", "job", "hiring"]):
            opp_type = "internship"
        else:
            opp_type = "hackathon"

        # Organizer
        organizer = raw.get("organizer") or raw.get("company") or raw.get("host") or self.platform_name

        # Dates & deadlines
        deadline = raw.get("deadline") or raw.get("apply_by") or raw.get("end_date") or raw.get("registration_end")
        start_date = raw.get("start_date") or raw.get("starts_at")
        end_date = raw.get("end_date") or raw.get("ends_at")

        # Prize & stipend
        prize_pool = raw.get("prize_pool") or raw.get("prize") or raw.get("prizes")
        stipend = raw.get("stipend") or raw.get("salary")

        # Mode & location
        location = raw.get("location") or raw.get("city")
        mode = raw.get("mode")

        # Tags
        tags = raw.get("tags") or raw.get("skills") or raw.get("categories") or []
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        # Banner image
        banner = raw.get("banner_image_url") or raw.get("image") or raw.get("cover") or raw.get("thumbnail")

        return self.normalize_opportunity(
            title=title,
            source_url=source_url,
            opportunity_type=opp_type,
            source_platform=self.platform_name,
            description=raw.get("description") or raw.get("summary") or raw.get("details"),
            organizer=organizer,
            location=location,
            mode=mode,
            start_date=start_date,
            end_date=end_date,
            application_deadline=deadline,
            prize_pool=str(prize_pool) if prize_pool else None,
            stipend=str(stipend) if stipend else None,
            tags=tags if isinstance(tags, list) else None,
            banner_image_url=banner,
            is_active=True
        )
