"""
scraper/scrapers/base.py

Abstract base scraper defining common utilities, HTTP client setup,
rate limiting, date parsing, text normalization, and error handling.
All platform scrapers inherit from BaseScraper.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import time
import dateparser
import httpx
from config import settings


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 HackFeedBot/1.0"
    ),
    "Accept": "application/json, text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}


class BaseScraper(ABC):
    platform_name: str = "Unknown"

    def __init__(self, request_delay: float = 1.5):
        self.request_delay = request_delay
        self._last_request_time: float = 0.0
        self.client = httpx.Client(
            headers=DEFAULT_HEADERS,
            timeout=settings.REQUEST_TIMEOUT_SECONDS,
            follow_redirects=True
        )

    def rate_limit(self, delay: Optional[float] = None) -> None:
        """
        Enforces a delay between consecutive network requests to be a respectful scraper.
        """
        wait_time = delay if delay is not None else self.request_delay
        elapsed = time.time() - self._last_request_time
        if elapsed < wait_time:
            time.sleep(wait_time - elapsed)
        self._last_request_time = time.time()

    def parse_datetime(self, date_val: Any) -> Optional[str]:
        """
        Parses arbitrary date/time strings (ISO, relative, timestamps)
        and converts to an ISO-8601 UTC string (e.g. '2025-09-15T18:30:00+00:00').
        """
        if not date_val:
            return None

        # Check if already integer/float timestamp (millis or secs)
        try:
            if isinstance(date_val, (int, float)) or (isinstance(date_val, str) and date_val.strip().isdigit()):
                ts = float(date_val)
                if ts > 10000000000:  # milliseconds
                    ts = ts / 1000.0
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
                return dt.isoformat()
        except Exception:
            pass

        try:
            dt = dateparser.parse(str(date_val))
            if dt:
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).isoformat()
        except Exception:
            pass

        return None

    def clean_text(self, text: Optional[str]) -> Optional[str]:
        """Strips excessive whitespace and HTML remnants."""
        if not text:
            return None
        cleaned = " ".join(str(text).split()).strip()
        return cleaned if cleaned else None

    def infer_mode(self, location: Optional[str], text_content: Optional[str] = "") -> Optional[str]:
        """
        Infers 'online', 'offline', or 'hybrid' from location and context strings.
        Must match enum: 'online', 'offline', 'hybrid' or None.
        """
        loc_lower = (location or "").lower()
        context_lower = (text_content or "").lower()
        combined = f"{loc_lower} {context_lower}"

        if "hybrid" in combined:
            return "hybrid"
        if any(w in combined for w in ["online", "virtual", "remote", "web", "discord", "zoom"]):
            return "online"
        if location and len(location.strip()) > 2 and "tbd" not in loc_lower:
            return "offline"
        return "online"

    def normalize_opportunity(
        self,
        title: str,
        source_url: str,
        opportunity_type: str,  # 'hackathon' | 'internship'
        source_platform: str,
        description: Optional[str] = None,
        organizer: Optional[str] = None,
        location: Optional[str] = None,
        mode: Optional[str] = None,  # 'online' | 'offline' | 'hybrid'
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None,
        application_deadline: Optional[Any] = None,
        prize_pool: Optional[str] = None,
        stipend: Optional[str] = None,
        tags: Optional[List[str]] = None,
        eligibility: Optional[str] = None,
        team_size: Optional[str] = None,
        banner_image_url: Optional[str] = None,
        is_active: bool = True,
        is_featured: bool = False
    ) -> Dict[str, Any]:
        """
        Builds a normalized dictionary conforming to the HackFeed opportunities schema.
        """
        # Validate enum constraints
        valid_types = {"hackathon", "internship"}
        normalized_type = opportunity_type.lower() if opportunity_type else "hackathon"
        if normalized_type not in valid_types:
            normalized_type = "hackathon"

        valid_modes = {"online", "offline", "hybrid"}
        normalized_mode = mode.lower() if mode else self.infer_mode(location, description)
        if normalized_mode not in valid_modes:
            normalized_mode = None

        # Clean tags list
        clean_tags = []
        if tags:
            for t in tags:
                if t and isinstance(t, str):
                    c = self.clean_text(t)
                    if c and len(c) < 50:
                        clean_tags.append(c)
        clean_tags = list(dict.fromkeys(clean_tags))  # deduplicate preserving order

        return {
            "title": self.clean_text(title) or "Untitled Opportunity",
            "description": self.clean_text(description),
            "type": normalized_type,
            "source_platform": source_platform,
            "source_url": source_url.strip(),
            "organizer": self.clean_text(organizer),
            "location": self.clean_text(location) or ("Online" if normalized_mode == "online" else None),
            "mode": normalized_mode,
            "start_date": self.parse_datetime(start_date),
            "end_date": self.parse_datetime(end_date),
            "application_deadline": self.parse_datetime(application_deadline),
            "prize_pool": self.clean_text(prize_pool),
            "stipend": self.clean_text(stipend),
            "tags": clean_tags if clean_tags else None,
            "eligibility": self.clean_text(eligibility),
            "team_size": self.clean_text(team_size),
            "banner_image_url": banner_image_url.strip() if banner_image_url else None,
            "is_active": is_active,
            "is_featured": is_featured,
        }

    @abstractmethod
    def scrape(self) -> List[Dict[str, Any]]:
        """
        Main scraping entrypoint. Scrapes and parses opportunities from the platform.
        Returns a list of normalized opportunity dictionaries conforming to the schema.
        """
        pass

    def fetch_opportunities(self) -> List[Dict[str, Any]]:
        """Alias for scrape() for backwards compatibility."""
        return self.scrape()

    def close(self):
        try:
            self.client.close()
        except Exception:
            pass
