"""
scraper/scrapers/devfolio.py

Scraper module for Devfolio.
Fetches Hackathons from Devfolio using their search API and public hackathon listings.
Uses JSON search API first, falling back to HTML scraping if necessary.
"""

from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper
from config import settings


class DevfolioScraper(BaseScraper):
    platform_name: str = "Devfolio"

    API_SEARCH_URL = "https://api.devfolio.co/api/search/hackathons"
    EXPLORE_URL = "https://devfolio.co/hackathons"

    def scrape(self) -> List[Dict[str, Any]]:
        """
        Main scraping entrypoint for Devfolio.
        """
        items: List[Dict[str, Any]] = []
        print(f"[{self.platform_name}] Fetching hackathons...")

        # 1. Try public search API
        try:
            self.rate_limit()
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Referer": "https://devfolio.co/hackathons",
                "Origin": "https://devfolio.co"
            }
            payload = {
                "type": "application_open",
                "from": 0,
                "size": min(settings.MAX_ITEMS_PER_PLATFORM, 50)
            }

            response = self.client.post(
                self.API_SEARCH_URL,
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                hits = data.get("hits", {}).get("hits", []) or data.get("result", []) or data.get("hackathons", [])

                for item in hits:
                    source = item.get("_source") or item
                    normalized = self._parse_json_item(source)
                    if normalized:
                        items.append(normalized)

                if items:
                    print(f"[{self.platform_name}] Successfully fetched {len(items)} hackathons via API.")
                    return items
        except Exception as e:
            print(f"[{self.platform_name} API Error] {e}")

        # 2. Fallback: Parse HTML from explore page
        html_items = self._scrape_html()
        items.extend(html_items)

        # Deduplicate by source_url
        seen_urls = set()
        unique_results = []
        for item in items:
            url = item.get("source_url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(item)

        print(f"[{self.platform_name}] Total opportunities extracted: {len(unique_results)}")
        return unique_results

    def _parse_json_item(self, raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        name = raw.get("name") or raw.get("title")
        slug = raw.get("slug")
        if not name or not slug:
            return None

        # Build clean source URL (Devfolio uses subdomain https://<slug>.devfolio.co or path)
        source_url = f"https://{slug}.devfolio.co"

        # Organizer
        organizer = raw.get("organizer_name") or raw.get("university_name") or raw.get("company_name") or "Devfolio"

        # Location & Mode
        is_online = raw.get("is_online", True)
        location = raw.get("location") or ("Online" if is_online else None)
        mode = "online" if is_online else ("offline" if location and location.lower() != "online" else "hybrid")

        # Dates
        start_date = raw.get("starts_at") or raw.get("start_date")
        end_date = raw.get("ends_at") or raw.get("end_date")
        deadline = raw.get("apply_by") or raw.get("applications_close_at") or raw.get("submissions_close_at") or start_date

        # Prizes
        prize_raw = raw.get("prizes_total") or raw.get("prize_total") or raw.get("total_prizes")
        prize_pool = None
        if prize_raw:
            currency = raw.get("prize_currency", "₹")
            prize_pool = f"{currency}{prize_raw:,}" if isinstance(prize_raw, (int, float)) else str(prize_raw)

        # Tags
        tags = raw.get("themes", []) or raw.get("tags", []) or []
        if isinstance(tags, list):
            tags = [t if isinstance(t, str) else t.get("name", "") for t in tags]

        # Banner image / Official Cover
        # 1. Check direct cover_img / hero_image in Devfolio API payload
        hackathon_setting = raw.get("hackathon_setting", {}) if isinstance(raw.get("hackathon_setting"), dict) else {}
        candidate_cover = (
            raw.get("cover_img") or
            raw.get("hero_image") or
            raw.get("banner_image") or
            raw.get("cover_image")
        )

        # 2. If candidate is missing or relative, check detail page HTML (dedicated cover element -> og:image)
        banner_url = None
        if candidate_cover and isinstance(candidate_cover, str) and candidate_cover.startswith("http"):
            banner_url = candidate_cover
        else:
            banner_url = self.fetch_cover_image_from_page(
                source_url,
                selectors=[
                    "header img",
                    "img[src*='cover']",
                    "img[src*='banner']",
                    ".cover-image img",
                    "img[alt*='cover' i]",
                    "img[alt*='banner' i]"
                ],
                fallback_url=candidate_cover or hackathon_setting.get("logo") or raw.get("logo")
            )

        return self.normalize_opportunity(
            title=name,
            source_url=source_url,
            opportunity_type="hackathon",
            source_platform=self.platform_name,
            description=raw.get("desc") or raw.get("description") or raw.get("tagline"),
            organizer=organizer,
            location=location,
            mode=mode,
            start_date=start_date,
            end_date=end_date,
            application_deadline=deadline,
            prize_pool=prize_pool,
            tags=tags,
            banner_image_url=banner_url,
            is_active=True
        )

    def _scrape_html(self) -> List[Dict[str, Any]]:
        """HTML fallback scraper for Devfolio."""
        items: List[Dict[str, Any]] = []
        try:
            self.rate_limit()
            resp = self.client.get(self.EXPLORE_URL)
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.find_all("a", href=True)

            for card in cards[:settings.MAX_ITEMS_PER_PLATFORM]:
                href = card.get("href", "")
                if "devfolio.co" not in href or href == "https://devfolio.co" or "/hackathons" in href:
                    continue

                title_el = card.find(["h2", "h3", "h4", "p", "span"])
                title = title_el.get_text(strip=True) if title_el else None
                if not title or len(title) < 4:
                    continue

                img_el = card.find("img")
                card_thumb = img_el.get("src") if img_el else None
                banner = self.fetch_cover_image_from_page(
                    href,
                    selectors=[
                        "header img",
                        "img[src*='cover']",
                        "img[src*='banner']",
                        ".cover-image img",
                        "img[alt*='cover' i]",
                        "img[alt*='banner' i]"
                    ],
                    fallback_url=card_thumb
                )

                items.append(self.normalize_opportunity(
                    title=title,
                    source_url=href,
                    opportunity_type="hackathon",
                    source_platform=self.platform_name,
                    organizer="Devfolio",
                    banner_image_url=banner,
                    mode="online"
                ))

            print(f"[{self.platform_name} HTML] Parsed {len(items)} hackathons from fallback HTML.")
        except Exception as e:
            print(f"[{self.platform_name} HTML Error] {e}")

        return items
