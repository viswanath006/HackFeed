"""
scraper/scrapers/h2skill.py

Scraper module for H2Skill (Hack2skill).
Fetches Hackathons, Tech Challenges, and Innovation Events from Hack2skill.
Uses the public JSON event listing API first, falling back to HTML scraping if necessary.
"""

from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper
from config import settings


class H2SkillScraper(BaseScraper):
    platform_name: str = "H2Skill"

    API_EVENTS_URL = "https://hack2skill.com/api/v1/innovator/public/event/list"
    HOME_URL = "https://hack2skill.com"
    LISTING_URL = "https://hack2skill.com/hackathons-listing"

    def scrape(self) -> List[Dict[str, Any]]:
        """
        Main scraping entrypoint for H2Skill.
        """
        items: List[Dict[str, Any]] = []
        print(f"[{self.platform_name}] Fetching hackathons and events...")

        # 1. Try public JSON event list API
        try:
            self.rate_limit()
            headers = {
                "Accept": "application/json, text/plain, */*",
                "Referer": "https://hack2skill.com/",
                "Origin": "https://hack2skill.com"
            }
            response = self.client.get(self.API_EVENTS_URL, headers=headers)

            if response.status_code == 200:
                data = response.json()
                event_data = data.get("data", {})

                raw_events = []
                if isinstance(event_data, dict):
                    raw_events.extend(event_data.get("flagshipEvents", []))
                    raw_events.extend(event_data.get("communityEvents", []))
                elif isinstance(event_data, list):
                    raw_events.extend(event_data)

                for raw in raw_events[:settings.MAX_ITEMS_PER_PLATFORM]:
                    normalized = self._parse_json_item(raw)
                    if normalized:
                        items.append(normalized)

                if items:
                    print(f"[{self.platform_name}] Successfully fetched {len(items)} events via JSON API.")
                    return items
        except Exception as e:
            print(f"[{self.platform_name} API Error] {e}")

        # 2. Fallback: Parse HTML from listing & home pages
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
        title = raw.get("title") or raw.get("name")
        if not title:
            return None

        # Build Source URL
        custom_url = raw.get("customEventUrl")
        event_url = raw.get("eventUrl") or raw.get("slug")

        if custom_url and str(custom_url).strip():
            source_url = custom_url.strip()
            if not source_url.startswith("http"):
                source_url = f"https://hack2skill.com/{source_url.lstrip('/')}"
        elif event_url and str(event_url).strip():
            slug_str = str(event_url).strip()
            if slug_str.startswith("http"):
                source_url = slug_str
            elif slug_str.startswith("/"):
                source_url = f"https://hack2skill.com{slug_str}"
            else:
                source_url = f"https://hack2skill.com/event/{slug_str}"
        else:
            opp_id = raw.get("_id") or raw.get("id")
            source_url = f"https://hack2skill.com/event/{opp_id}"

        # Tags structure in H2Skill API
        tags_obj = raw.get("tags", {}) if isinstance(raw.get("tags"), dict) else {}

        # Mode
        mode_val = tags_obj.get("mode", {}).get("value") if isinstance(tags_obj.get("mode"), dict) else None
        mode = str(mode_val).lower() if mode_val else "online"
        if mode not in ["online", "offline", "hybrid"]:
            mode = "online"

        # Team size
        team_size_obj = tags_obj.get("teamSize", {}) if isinstance(tags_obj.get("teamSize"), dict) else {}
        min_team = team_size_obj.get("min")
        max_team = team_size_obj.get("max")
        team_size = None
        if min_team and max_team:
            team_size = f"{min_team} - {max_team} Members" if min_team != max_team else f"{min_team} Member{'s' if min_team > 1 else ''}"

        # Tech tags
        tech_list = tags_obj.get("technology", {}).get("value", []) if isinstance(tags_obj.get("technology"), dict) else []
        tags = []
        if isinstance(tech_list, list):
            tags.extend([str(t) for t in tech_list if t])
        
        flag_val = raw.get("flag")
        if flag_val:
            tags.append(str(flag_val).title())

        # Dates
        start_date = raw.get("registrationStart") or raw.get("startDate") or raw.get("start_date")
        end_date = raw.get("registrationEnd") or raw.get("endDate") or raw.get("end_date")
        deadline = end_date

        # Banner image / Official Poster
        thumbnail = (
            raw.get("thumbnail") or
            raw.get("eventBanner") or
            raw.get("banner") or
            raw.get("eventLogo") or
            raw.get("image") or
            raw.get("logo")
        )
        if thumbnail and isinstance(thumbnail, str):
            if thumbnail.startswith("//"):
                thumbnail = f"https:{thumbnail}"
            elif not thumbnail.startswith("http"):
                thumbnail = f"https://cdn.hack2skill.com/{thumbnail.lstrip('/')}"

        return self.normalize_opportunity(
            title=title,
            source_url=source_url,
            opportunity_type="hackathon",
            source_platform=self.platform_name,
            description=raw.get("description") or f"Hackathon hosted on Hack2skill: {title}",
            organizer="Hack2skill",
            location="Online" if mode == "online" else "India",
            mode=mode,
            start_date=start_date,
            end_date=end_date,
            application_deadline=deadline,
            tags=tags,
            team_size=team_size,
            banner_image_url=thumbnail,
            is_active=True
        )

    def _scrape_html(self) -> List[Dict[str, Any]]:
        """HTML fallback scraper for Hack2skill."""
        items: List[Dict[str, Any]] = []
        try:
            self.rate_limit()
            resp = self.client.get(self.HOME_URL)
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.find_all("a", href=True)

            for card in cards[:settings.MAX_ITEMS_PER_PLATFORM]:
                href = card.get("href", "")
                if not any(k in href for k in ["/event/", "/hack/", "hackathon"]) or "blog." in href:
                    continue

                if not href.startswith("http"):
                    full_url = f"https://hack2skill.com{href if href.startswith('/') else '/' + href}"
                else:
                    full_url = href

                title_el = card.find(["h2", "h3", "h4", "p", "span", "strong"])
                title = title_el.get_text(strip=True) if title_el else None
                if not title or len(title) < 5 or "guide" in title.lower() or "tips" in title.lower():
                    continue

                img_el = card.find("img")
                banner = img_el.get("src") if img_el else None

                items.append(self.normalize_opportunity(
                    title=title,
                    source_url=full_url,
                    opportunity_type="hackathon",
                    source_platform=self.platform_name,
                    organizer="Hack2skill",
                    banner_image_url=banner,
                    mode="online"
                ))

            print(f"[{self.platform_name} HTML] Parsed {len(items)} hackathons from fallback HTML.")
        except Exception as e:
            print(f"[{self.platform_name} HTML Error] {e}")

        return items
