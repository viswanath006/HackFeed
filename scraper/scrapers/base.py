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
        self._validated_images: Dict[str, Optional[str]] = {}

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

    def validate_image_url(self, url: Optional[str]) -> Optional[str]:
        """
        Validates that a candidate URL resolves to an actual image via HTTP HEAD/GET request.
        Verifies status < 400 and Content-Type starts with 'image/'.
        Skips and returns None if validation fails so broken links are not stored.
        """
        if not url or not isinstance(url, str):
            return None
        clean_url = url.strip()
        if clean_url.startswith("//"):
            clean_url = f"https:{clean_url}"
        if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
            return None

        # Return cached result if already validated in this scraper run
        if clean_url in self._validated_images:
            return self._validated_images[clean_url]

        # Exclude inline data URI, placeholder images, and generic blank icons
        lower_url = clean_url.lower()
        if any(p in lower_url for p in ["data:image", "placeholder", "default-avatar", "blank.gif", "transparent.png"]):
            self._validated_images[clean_url] = None
            return None

        try:
            # 1. Try lightweight HEAD request
            resp = self.client.head(clean_url, timeout=3.5)
            content_type = resp.headers.get("content-type", "").lower()
            if resp.status_code < 400 and content_type.startswith("image/"):
                self._validated_images[clean_url] = clean_url
                return clean_url

            # 2. Fallback to GET stream if server rejects HEAD (e.g. 405 Method Not Allowed / 403)
            if resp.status_code in [405, 403, 501] or not content_type:
                with self.client.stream("GET", clean_url, timeout=3.5) as stream_resp:
                    ct = stream_resp.headers.get("content-type", "").lower()
                    if stream_resp.status_code < 400 and ct.startswith("image/"):
                        self._validated_images[clean_url] = clean_url
                        return clean_url
        except Exception:
            self._validated_images[clean_url] = None
            return None

        self._validated_images[clean_url] = None
        return None

    def extract_cover_image(
        self,
        html_or_soup: Any,
        selectors: Optional[List[str]] = None,
        fallback_url: Optional[str] = None
    ) -> Optional[str]:
        """
        Extracts a cover/banner image from parsed HTML or raw HTML text:
        1. Checks dedicated platform banner/cover element selectors
        2. Falls back to Open Graph meta tag (<meta property="og:image" content="...">)
           or Twitter image tag (<meta name="twitter:image" content="...">)
        3. Falls back to fallback_url
        4. Validates the candidate URL resolves to an actual image before returning
        """
        from bs4 import BeautifulSoup

        soup = html_or_soup if hasattr(html_or_soup, "find") else BeautifulSoup(str(html_or_soup), "html.parser")
        candidate_url: Optional[str] = None

        # 1. Check dedicated banner / cover image selectors
        default_selectors = [
            "img.banner",
            "img.cover",
            "img.banner-img",
            "img.cover-image",
            ".banner-section img",
            ".cover-image img",
            ".challenge-cover img",
            ".event-banner img",
            "img[alt*='banner' i]",
            "img[alt*='cover' i]",
            "img[src*='banner' i]",
            "img[src*='cover' i]",
            "header img"
        ]
        active_selectors = (selectors or []) + default_selectors

        for sel in active_selectors:
            el = soup.select_one(sel)
            if el:
                src = el.get("src") or el.get("data-src") or el.get("data-lazy-src")
                if src and isinstance(src, str) and not src.startswith("data:"):
                    candidate_url = src.strip()
                    break

        # 2. Fall back to Open Graph or Twitter image meta tag
        if not candidate_url:
            for prop in ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]:
                meta_el = soup.find("meta", attrs={"property": prop}) or soup.find("meta", attrs={"name": prop})
                if meta_el and meta_el.get("content"):
                    c = meta_el.get("content").strip()
                    if c.startswith("http") or c.startswith("//"):
                        candidate_url = c
                        break

        # 3. Fallback candidate
        if not candidate_url and fallback_url:
            candidate_url = fallback_url

        # 4. Validate through HEAD request
        if candidate_url:
            return self.validate_image_url(candidate_url)

        return None

    def fetch_cover_image_from_page(
        self,
        detail_url: str,
        selectors: Optional[List[str]] = None,
        fallback_url: Optional[str] = None
    ) -> Optional[str]:
        """
        Fetches an opportunity's detail page HTML and extracts the validated cover image.
        """
        if not detail_url or not detail_url.startswith("http"):
            return self.validate_image_url(fallback_url) if fallback_url else None

        try:
            self.rate_limit(0.5)
            resp = self.client.get(detail_url, timeout=settings.REQUEST_TIMEOUT_SECONDS)
            if resp.status_code == 200:
                img = self.extract_cover_image(resp.text, selectors=selectors, fallback_url=fallback_url)
                if img:
                    return img
        except Exception:
            pass

        return self.validate_image_url(fallback_url) if fallback_url else None

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

        parsed_deadline = self.parse_datetime(application_deadline)
        effective_is_active = is_active
        if parsed_deadline:
            try:
                dl_dt = datetime.fromisoformat(parsed_deadline.replace("Z", "+00:00"))
                if dl_dt < datetime.now(timezone.utc):
                    effective_is_active = False
            except Exception:
                pass

        # Validate banner image URL resolves to an actual image
        validated_banner = self.validate_image_url(banner_image_url) if banner_image_url else None

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
            "application_deadline": parsed_deadline,
            "prize_pool": self.clean_text(prize_pool),
            "stipend": self.clean_text(stipend),
            "tags": clean_tags if clean_tags else None,
            "eligibility": self.clean_text(eligibility),
            "team_size": self.clean_text(team_size),
            "banner_image_url": validated_banner,
            "is_active": effective_is_active,
            "is_featured": is_featured,
        }

    def normalize_course(
        self,
        title: str,
        course_url: str,
        provider: str,
        domain: str,
        description: Optional[str] = None,
        level: Optional[str] = None,
        price_type: str = "free",
        price: Optional[str] = None,
        duration: Optional[str] = None,
        certificate_provided: bool = False,
        rating: Optional[float] = None,
        tags: Optional[List[str]] = None,
        is_active: bool = True,
        is_featured: bool = False
    ) -> Dict[str, Any]:
        """
        Builds a normalized dictionary conforming to the HackFeed courses schema.
        """
        valid_domains = {
            "Web Development",
            "AI/ML",
            "Cloud Computing",
            "DSA",
            "Cybersecurity",
            "Data Science"
        }
        valid_levels = {"beginner", "intermediate", "advanced"}
        valid_price_types = {"free", "paid", "free_with_paid_certificate"}

        norm_domain = domain.strip() if domain else "Web Development"
        if norm_domain not in valid_domains:
            # Fallback to closest matching domain or default
            for vd in valid_domains:
                if vd.lower() in norm_domain.lower() or norm_domain.lower() in vd.lower():
                    norm_domain = vd
                    break
            else:
                norm_domain = "Web Development"

        norm_level = level.lower().strip() if level else None
        if norm_level not in valid_levels:
            norm_level = None

        norm_price_type = price_type.lower().strip() if price_type else "free"
        if norm_price_type not in valid_price_types:
            norm_price_type = "free"

        # Parse and bound rating
        clean_rating = None
        if rating is not None:
            try:
                r_val = float(rating)
                if 0.0 <= r_val <= 5.0:
                    clean_rating = round(r_val, 1)
            except (ValueError, TypeError):
                clean_rating = None

        # Clean tags list
        clean_tags = []
        if tags:
            for t in tags:
                if t and isinstance(t, str):
                    c = self.clean_text(t)
                    if c and len(c) < 50:
                        clean_tags.append(c)
        clean_tags = list(dict.fromkeys(clean_tags))

        # Price formatting
        clean_price = self.clean_text(price) if norm_price_type != "free" else None

        return {
            "title": self.clean_text(title) or "Untitled Course",
            "description": self.clean_text(description),
            "provider": self.clean_text(provider) or "Unknown",
            "domain": norm_domain,
            "level": norm_level,
            "price_type": norm_price_type,
            "price": clean_price,
            "duration": self.clean_text(duration),
            "certificate_provided": bool(certificate_provided),
            "course_url": course_url.strip(),
            "rating": clean_rating,
            "tags": clean_tags if clean_tags else None,
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
