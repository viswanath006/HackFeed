"""
scraper/scrapers/unstop.py

Scraper module for Unstop (formerly Dare2Compete).
Fetches both Hackathons and Internships using Unstop's public API / listing endpoints.
Uses JSON search API first, falling back to HTML scraping if necessary.
"""

from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper
from config import settings


class UnstopScraper(BaseScraper):
    platform_name: str = "Unstop"

    SEARCH_API_URL = "https://unstop.com/api/public/opportunity/search-result"

    def scrape(self) -> List[Dict[str, Any]]:
        """
        Main scraping entrypoint for Unstop.
        Scrapes both Hackathons and Internships.
        """
        results: List[Dict[str, Any]] = []

        # 1. Fetch Hackathons
        print(f"[{self.platform_name}] Fetching hackathons...")
        hackathons = self._fetch_category(
            category="hackathons",
            opportunity_type="hackathon",
            per_page=min(settings.MAX_ITEMS_PER_PLATFORM, 50)
        )
        results.extend(hackathons)

        self.rate_limit()

        # 2. Fetch Internships
        print(f"[{self.platform_name}] Fetching internships...")
        internships = self._fetch_category(
            category="internships",
            opportunity_type="internship",
            per_page=min(settings.MAX_ITEMS_PER_PLATFORM, 50)
        )
        results.extend(internships)

        # Deduplicate within batch by source_url
        seen_urls = set()
        unique_results = []
        for item in results:
            url = item.get("source_url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(item)

        print(f"[{self.platform_name}] Total opportunities extracted: {len(unique_results)}")
        return unique_results

    def _fetch_category(
        self,
        category: str,
        opportunity_type: str,
        per_page: int = 40
    ) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []

        params = {
            "opportunity": category,
            "page": 1,
            "per_page": per_page,
            "oppstatus": "open"
        }

        try:
            headers = {
                "Accept": "application/json, text/plain, */*",
                "Referer": f"https://unstop.com/{category}",
                "Origin": "https://unstop.com"
            }
            response = self.client.get(
                self.SEARCH_API_URL,
                params=params,
                headers=headers
            )

            if response.status_code == 200:
                try:
                    data = response.json()
                    raw_list = (
                        data.get("data", {}).get("data", []) or
                        data.get("data", []) or
                        data.get("opportunities", [])
                    )

                    for raw in raw_list:
                        normalized = self._parse_json_item(raw, opportunity_type)
                        if normalized:
                            items.append(normalized)
                    
                    if items:
                        print(f"[{self.platform_name}] Fetched {len(items)} {category} via JSON API.")
                        return items
                except Exception as json_err:
                    print(f"[{self.platform_name}] JSON parse failed for {category}, trying HTML: {json_err}")
            
            # Fallback to HTML scraping if API returned non-200 or unexpected payload
            html_items = self._scrape_html(category, opportunity_type)
            items.extend(html_items)

        except Exception as e:
            print(f"[{self.platform_name} Error] Failed to fetch {category}: {e}")
            html_items = self._scrape_html(category, opportunity_type)
            items.extend(html_items)

        return items

    def _parse_json_item(self, raw: Dict[str, Any], opportunity_type: str) -> Optional[Dict[str, Any]]:
        title = raw.get("title") or raw.get("name")
        if not title:
            return None

        # Build Source URL
        slug = raw.get("seo_url") or raw.get("slug") or raw.get("public_url")
        if slug:
            if slug.startswith("http"):
                source_url = slug
            else:
                source_url = f"https://unstop.com/{slug.lstrip('/')}"
        else:
            opp_id = raw.get("id")
            source_url = f"https://unstop.com/opportunity/{opp_id}"

        # Organizer
        org_data = raw.get("organisation", {}) or raw.get("organisation_name")
        if isinstance(org_data, dict):
            organizer = org_data.get("name")
        else:
            organizer = org_data or raw.get("author", {}).get("name") or "Unstop"

        # Banner image / Official Cover
        # 1. First check competition detail API for full-size banner (hosted on CloudFront)
        opp_id = raw.get("id")
        banner_url = None

        if opp_id:
            try:
                detail_resp = self.client.get(
                    f"https://unstop.com/api/public/competition/{opp_id}",
                    headers={"Accept": "application/json", "Referer": "https://unstop.com/hackathons"},
                    timeout=2.5
                )
                if detail_resp.status_code == 200:
                    competition = detail_resp.json().get("data", {}).get("competition", {})
                    banner_obj = competition.get("banner") or {}
                    banner_mobile_obj = competition.get("banner_mobile") or {}
                    if isinstance(banner_obj, dict):
                        banner_url = banner_obj.get("image_url") or (f"https://d8it4huxumps7.cloudfront.net/{banner_obj['path'].lstrip('/')}" if banner_obj.get("path") else None)
                    if not banner_url and isinstance(banner_mobile_obj, dict):
                        banner_url = banner_mobile_obj.get("image_url") or (f"https://d8it4huxumps7.cloudfront.net/{banner_mobile_obj['path'].lstrip('/')}" if banner_mobile_obj.get("path") else None)
            except Exception:
                pass

        # 2. If still no banner, fall back to detail page HTML extraction (dedicated banner selector -> og:image)
        if not banner_url and source_url and source_url.startswith("http"):
            banner_url = self.fetch_cover_image_from_page(
                source_url,
                selectors=[".banner-section img", "img.banner-img", ".banner-image img", "img.banner", ".cover-image img"]
            )

        # 3. Fallback to payload fields if still missing
        if not banner_url:
            _banner_mobile = raw.get("banner_mobile")
            _banner_dict = raw.get("banner")
            candidate = (
                (_banner_dict.get("image_url") or _banner_dict.get("url") if isinstance(_banner_dict, dict) else None) or
                (_banner_mobile.get("image_url") or _banner_mobile.get("url") if isinstance(_banner_mobile, dict) else None) or
                raw.get("banner_url") or
                raw.get("banner_image") or
                raw.get("logoUrl2") or
                raw.get("logo_url")
            )
            if candidate and isinstance(candidate, str):
                if candidate.startswith("//"):
                    banner_url = f"https:{candidate}"
                elif not candidate.startswith("http"):
                    banner_url = f"https://d8it4huxumps7.cloudfront.net/{candidate.lstrip('/')}"
                else:
                    banner_url = candidate

        # Dates & Deadlines
        regn_req = raw.get("regnRequirements", {}) if isinstance(raw.get("regnRequirements"), dict) else {}
        start_date = regn_req.get("start_regn_dt") or raw.get("start_date") or raw.get("start_at") or raw.get("start_time")
        end_date = regn_req.get("end_regn_dt") or raw.get("end_date") or raw.get("end_at") or raw.get("end_time")
        deadline = regn_req.get("end_regn_dt") or raw.get("end_date") or raw.get("end_regn_date") or raw.get("deadline")

        # Determine active status from Unstop payload
        is_active = True
        status_val = str(raw.get("status", "")).upper()
        if raw.get("regn_open") == 0 or status_val in ["CLOSED", "EXPIRED", "CANCELLED"]:
            is_active = False

        # Prize & Stipend
        prizes = raw.get("prizes") or raw.get("prize_amount")
        prize_pool = None
        if prizes:
            if isinstance(prizes, list) and len(prizes) > 0:
                first_prize = prizes[0]
                if isinstance(first_prize, dict):
                    cash_val = first_prize.get("cash") or first_prize.get("amount")
                    if cash_val:
                        prize_pool = f"₹{int(cash_val):,}" if str(cash_val).isdigit() else f"₹{cash_val}"
                    else:
                        prize_pool = first_prize.get("title") or first_prize.get("rank")
                elif isinstance(first_prize, (int, float, str)):
                    prize_pool = f"₹{first_prize}" if str(first_prize).isdigit() else str(first_prize)
            elif isinstance(prizes, (int, float)):
                prize_pool = f"₹{int(prizes):,}"
            elif isinstance(prizes, str):
                prize_pool = f"₹{prizes}" if prizes.isdigit() else prizes

        stipend = raw.get("stipend") or raw.get("salary")
        if stipend and isinstance(stipend, dict):
            stipend = f"{stipend.get('currency', '₹')} {stipend.get('amount', '')} {stipend.get('frequency', '')}".strip()

        # Tags & filters
        filters = raw.get("filters", []) or []
        tags = [f.get("name") for f in filters if isinstance(f, dict) and f.get("name")]
        if raw.get("category"):
            tags.append(str(raw.get("category")))

        # Location & Mode
        location = raw.get("region") or raw.get("city") or raw.get("location")
        mode = "online" if raw.get("is_online") else ("hybrid" if "hybrid" in str(location).lower() else None)

        # Eligibility & Team Size
        eligibility = raw.get("eligibility") or raw.get("eligible_categories")
        team_size = None
        min_team = raw.get("min_team_size")
        max_team = raw.get("max_team_size")
        if min_team and max_team:
            team_size = f"{min_team} - {max_team} Members" if min_team != max_team else f"{min_team} Member{'s' if min_team > 1 else ''}"

        # Clean description (strip HTML tags)
        desc_raw = raw.get("meta_description") or raw.get("details") or raw.get("short_description") or ""
        if "<" in str(desc_raw) and ">" in str(desc_raw):
            try:
                soup = BeautifulSoup(str(desc_raw), "html.parser")
                desc_clean = soup.get_text(separator="\n").strip()
            except Exception:
                desc_clean = str(desc_raw)
        else:
            desc_clean = str(desc_raw) if desc_raw else None

        return self.normalize_opportunity(
            title=title,
            source_url=source_url,
            opportunity_type=opportunity_type,
            source_platform=self.platform_name,
            description=desc_clean,
            organizer=organizer,
            location=location,
            mode=mode,
            start_date=start_date,
            end_date=end_date,
            application_deadline=deadline,
            prize_pool=prize_pool,
            stipend=str(stipend) if stipend else None,
            tags=tags,
            eligibility=str(eligibility) if eligibility else None,
            team_size=team_size,
            banner_image_url=banner_url,
            is_active=is_active
        )

    def _scrape_html(self, category: str, opportunity_type: str) -> List[Dict[str, Any]]:
        """HTML fallback scraper for Unstop listing pages."""
        items: List[Dict[str, Any]] = []
        url = f"https://unstop.com/{category}"

        try:
            self.rate_limit()
            resp = self.client.get(url)
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.select(".opportunity-card, .c-item, [data-opportunity-id]") or soup.find_all("a", href=True)

            for card in cards[:settings.MAX_ITEMS_PER_PLATFORM]:
                href = card.get("href", "")
                if not href or "/" not in href:
                    continue

                if not href.startswith("http"):
                    full_url = f"https://unstop.com{href if href.startswith('/') else '/' + href}"
                else:
                    full_url = href

                if category not in full_url and "opportunity" not in full_url:
                    continue

                title_el = card.select_one("h3, h4, .title, strong")
                title = title_el.get_text(strip=True) if title_el else None
                if not title or len(title) < 4:
                    continue

                org_el = card.select_one(".org, .company, p, span")
                organizer = org_el.get_text(strip=True) if org_el else "Unstop"

                img_el = card.select_one("img")
                card_thumb = img_el.get("src") if img_el else None
                banner = self.fetch_cover_image_from_page(
                    full_url,
                    selectors=[".banner-section img", "img.banner-img", ".banner-image img", "img.banner", ".cover-image img"],
                    fallback_url=card_thumb
                )

                items.append(self.normalize_opportunity(
                    title=title,
                    source_url=full_url,
                    opportunity_type=opportunity_type,
                    source_platform=self.platform_name,
                    organizer=organizer,
                    banner_image_url=banner,
                    mode="online"
                ))

            print(f"[{self.platform_name} HTML] Parsed {len(items)} items from HTML fallback.")
        except Exception as e:
            print(f"[{self.platform_name} HTML Error] {e}")

        return items
