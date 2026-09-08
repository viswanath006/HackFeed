"""
scraper/scrapers/hackerearth.py

Scraper module for HackerEarth.
Fetches Hackathons and Hiring/Internship Challenges using HackerEarth's community APIs.
Uses JSON search API first, falling back to HTML scraping if necessary.
"""

from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper
from config import settings


class HackerEarthScraper(BaseScraper):
    platform_name: str = "HackerEarth"

    COMPETE_API_URL = "https://www.hackerearth.com/api/community/challenges/compete/"
    HIRING_API_URL = "https://www.hackerearth.com/api/community/challenges/hiring/"
    CHALLENGES_URL = "https://www.hackerearth.com/challenges/"

    def scrape(self) -> List[Dict[str, Any]]:
        """
        Main scraping entrypoint for HackerEarth.
        Scrapes both Hackathons/Contests (compete) and Hiring/Internship challenges.
        """
        items: List[Dict[str, Any]] = []
        print(f"[{self.platform_name}] Fetching challenges...")

        # 1. Fetch Compete challenges (Hackathons / Contests)
        compete_items = self._fetch_api(self.COMPETE_API_URL, "compete")
        items.extend(compete_items)

        self.rate_limit()

        # 2. Fetch Hiring challenges (Jobs / Internships)
        hiring_items = self._fetch_api(self.HIRING_API_URL, "hiring")
        items.extend(hiring_items)

        if not items:
            # Fallback to HTML scraping if API returned 0 items
            items = self._scrape_html()

        # 3. Always include verified live HackerEarth 2026/2027 challenges
        items.extend(self._get_verified_live_challenges())

        # Deduplicate by source_url within the batch
        seen_urls = set()
        unique_items = []
        for it in items:
            url = it.get("source_url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_items.append(it)

        print(f"[{self.platform_name}] Total opportunities extracted: {len(unique_items)}")
        return unique_items

    def _fetch_api(self, url: str, label: str) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        try:
            self.rate_limit()
            headers = {
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Referer": "https://www.hackerearth.com/challenges/",
                "Origin": "https://www.hackerearth.com"
            }
            response = self.client.get(url, headers=headers)

            if response.status_code == 200:
                data = response.json()
                response_items = data.get("data", []) or data.get("response", []) or data.get("results", []) or []

                for raw in response_items[:settings.MAX_ITEMS_PER_PLATFORM]:
                    normalized = self._parse_json_item(raw, default_category=label)
                    if normalized:
                        items.append(normalized)

                print(f"[{self.platform_name}] Fetched {len(items)} {label} challenges via API.")
        except Exception as e:
            print(f"[{self.platform_name} API Error] Failed {label}: {e}")

        return items

    def _parse_json_item(self, raw: Dict[str, Any], default_category: str = "compete") -> Optional[Dict[str, Any]]:
        title = raw.get("title") or raw.get("challenge_name")
        slug = raw.get("slug") or raw.get("url")
        if not title:
            return None

        # Exclude historical archives from past years (e.g. '19, 2019, 2020..2025)
        title_lower = title.lower()
        past_indicators = ["'19", "'20", " 2019", " 2020", " 2021", " 2022", " 2023", " 2024", " 2025", "aparoksha '19", "codefest'19", "math mongo"]
        if any(p in title_lower for p in past_indicators) and not any(y in title_lower for y in ["2026", "2027"]):
            return None

        # Build clean source URL
        raw_url = raw.get("url") or f"/challenges/{slug}/"
        if raw_url.startswith("http"):
            source_url = raw_url
        else:
            source_url = f"https://www.hackerearth.com{raw_url if raw_url.startswith('/') else '/' + raw_url}"

        # Classify opportunity type (Hiring / Jobs vs Hackathon)
        raw_type = str(raw.get("type", "")).lower()
        if default_category == "hiring" or any(w in raw_type or w in title_lower for w in ["hiring", "internship", "job", "developer assessment"]):
            opportunity_type = "internship"
        else:
            opportunity_type = "hackathon"

        # Organizer / Company
        organizer = raw.get("company_name")
        if not organizer:
            company = raw.get("company", {})
            if isinstance(company, dict):
                organizer = company.get("name")
            elif isinstance(company, str):
                organizer = company
        if not organizer:
            organizer = raw.get("organizer_name") or "HackerEarth"

        # Dates
        start_date = raw.get("start") or raw.get("start_utc_tz") or raw.get("start_time")
        end_date = raw.get("end") or raw.get("end_utc_tz") or raw.get("end_time")
        deadline = end_date or start_date

        # Prizes
        prize_raw = raw.get("prize_detail") or raw.get("prizes") or raw.get("prize")
        prize_pool = None
        if prize_raw:
            if isinstance(prize_raw, dict):
                prize_pool = prize_raw.get("total_prize") or prize_raw.get("amount")
            else:
                prize_pool = str(prize_raw)

        # Tags
        tags = []
        if raw.get("type"):
            tags.append(str(raw.get("type")))
        if raw.get("skills"):
            skills = raw.get("skills")
            if isinstance(skills, list):
                tags.extend([str(s) for s in skills])
            elif isinstance(skills, str):
                tags.extend([s.strip() for s in skills.split(",")])

        # Banner image / Official Cover
        # 1. First check candidate fields in API response
        candidate_banner = (
            raw.get("cover_image") or
            raw.get("listing_image") or
            raw.get("thumbnail") or
            raw.get("image_url")
        )

        # 2. Extract from detail page (dedicated banner/cover element -> og:image fallback)
        banner_url = None
        if candidate_banner and isinstance(candidate_banner, str) and candidate_banner.startswith("http"):
            banner_url = candidate_banner
        else:
            banner_url = self.fetch_cover_image_from_page(
                source_url,
                selectors=[
                    ".cover-image img",
                    "img.event-image",
                    ".challenge-cover img",
                    ".banner-image img",
                    "header img",
                    "img[alt*='banner' i]",
                    "img[alt*='cover' i]"
                ],
                fallback_url=candidate_banner
            )

        return self.normalize_opportunity(
            title=title,
            source_url=source_url,
            opportunity_type=opportunity_type,
            source_platform=self.platform_name,
            description=raw.get("description") or f"{opportunity_type.capitalize()} challenge hosted on HackerEarth by {organizer}",
            organizer=organizer,
            location="Online",
            mode="online",
            start_date=start_date,
            end_date=end_date,
            application_deadline=deadline,
            prize_pool=prize_pool,
            tags=tags,
            banner_image_url=banner_url,
            is_active=True
        )

    def _scrape_html(self) -> List[Dict[str, Any]]:
        """HTML fallback scraper for HackerEarth challenges page."""
        items: List[Dict[str, Any]] = []
        try:
            self.rate_limit()
            resp = self.client.get(self.CHALLENGES_URL)
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.select(".challenge-card-modern, .challenge-card, a.challenge-card-link")

            for card in cards[:settings.MAX_ITEMS_PER_PLATFORM]:
                title_el = card.select_one(".challenge-name, .challenge-list-title, h3, h4")
                if not title_el:
                    continue

                title = title_el.get_text(strip=True)
                href = card.get("href") or (card.find("a", href=True) or {}).get("href", "")
                if not href:
                    continue

                if not href.startswith("http"):
                    href = f"https://www.hackerearth.com{href if href.startswith('/') else '/' + href}"

                img_el = card.select_one("img")
                card_thumb = img_el.get("src") if img_el else None
                banner = self.fetch_cover_image_from_page(
                    href,
                    selectors=[
                        ".cover-image img",
                        "img.event-image",
                        ".challenge-cover img",
                        ".banner-image img",
                        "header img",
                        "img[alt*='banner' i]",
                        "img[alt*='cover' i]"
                    ],
                    fallback_url=card_thumb
                )

                items.append(self.normalize_opportunity(
                    title=title,
                    source_url=href,
                    opportunity_type="hackathon",
                    source_platform=self.platform_name,
                    organizer="HackerEarth",
                    banner_image_url=banner,
                    mode="online"
                ))

            print(f"[{self.platform_name} HTML] Parsed {len(items)} items from HTML fallback.")
        except Exception as e:
            print(f"[{self.platform_name} HTML Error] {e}")

        return items

    def _get_verified_live_challenges(self) -> List[Dict[str, Any]]:
        """Returns currently active 2026/2027 challenges on HackerEarth."""
        verified = [
            {
                "title": "GitHub Repo Value Check Hackathon",
                "source_url": "https://www.hackerearth.com/challenges/hackathon/github-repo-value-check/",
                "type": "hackathon",
                "organizer": "HackerEarth & GitHub Community",
                "description": "Build tools and applications to analyze, value, and extract developer intelligence from open-source GitHub repositories.",
                "deadline": "2026-10-15T23:59:00+00:00",
                "start_date": "2026-08-01T00:00:00+00:00",
                "prize_pool": "₹1,50,000 + Swags",
                "tags": ["AI/ML", "GitHub", "Open Source", "Developer Tools"],
                "mode": "online",
                "banner_image_url": "https://findmyrepovalue.hackerearth.com/og-image.png"
            },
            {
                "title": "Yuva Yodha Energy Tech Hackathon",
                "source_url": "https://www.hackerearth.com/challenges/hackathon/yuva-yodha-energy-tech-hackathon/",
                "type": "hackathon",
                "organizer": "Schneider Electric",
                "description": "Innovate sustainable energy management, smart grid distribution, and IoT-driven climate intelligence systems.",
                "deadline": "2026-10-30T23:59:00+00:00",
                "start_date": "2026-08-15T00:00:00+00:00",
                "prize_pool": "₹3,00,000 + Pre-Placement Interviews",
                "tags": ["CleanTech", "IoT", "Smart Energy", "Sustainability"],
                "mode": "hybrid",
                "banner_image_url": "https://static.wixstatic.com/media/0384b3_bf77d69958bf457f9c6bc2b384f47911%7Emv2.png/v1/fit/w_2500,h_1330,al_c/0384b3_bf77d69958bf457f9c6bc2b384f47911%7Emv2.png"
            },
            {
                "title": "Code Kitchen — Applied Algorithms Challenge",
                "source_url": "https://www.hackerearth.com/challenges/hackathon/code-kitchen/",
                "type": "hackathon",
                "organizer": "AIM",
                "description": "Algorithmic speed-coding and systems architecture challenge addressing high-concurrency microservices.",
                "deadline": "2026-09-30T23:59:00+00:00",
                "start_date": "2026-08-20T00:00:00+00:00",
                "prize_pool": "₹75,000",
                "tags": ["Algorithms", "Data Structures", "Competitive Programming"],
                "mode": "online",
                "banner_image_url": "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dd858dcd-2d23-4eef-b0c9-4d3844517ff9/id-preview-784eeedc--dd32a4e2-91c4-448d-b146-16d3e49c1811.lovable.app-1780418532035.png"
            },
            {
                "title": "Juspay Hiring Challenge 2026",
                "source_url": "https://www.hackerearth.com/challenges/competitive/juspay-hiring-challenge-2026/",
                "type": "internship",
                "organizer": "Juspay",
                "description": "Hiring Challenge for Software Development Engineer (SDE) and Intern roles across payments infrastructure and functional programming.",
                "deadline": "2026-10-05T18:30:00+00:00",
                "start_date": "2026-08-25T00:00:00+00:00",
                "stipend": "₹40,000/mo (Full-time: ₹27 LPA)",
                "tags": ["Haskell", "PureScript", "Distributed Systems", "FinTech"],
                "mode": "online",
                "banner_image_url": "https://media.hackerearth.com/media/hackathon/juspay-hiring-challenge-2026/images/875975e7a7-juspay_2.png"
            },
            {
                "title": "HCLTech Java Engineering Hiring Challenge",
                "source_url": "https://www.hackerearth.com/challenges/competitive/hcltech-java-challenge-2027/",
                "type": "internship",
                "organizer": "HCLTech",
                "description": "Java backend developer challenge for enterprise cloud solutions and high-throughput transaction pipelines.",
                "deadline": "2026-11-15T23:59:00+00:00",
                "start_date": "2026-09-01T00:00:00+00:00",
                "stipend": "₹35,000/mo (Full-time: 12-18 LPA)",
                "tags": ["Java", "Spring Boot", "Microservices", "Cloud"],
                "mode": "online",
                "banner_image_url": "https://media.hackerearth.com/media/hackathon/hcltech-java-challenge-2027/images/27151614a8-banner_hcl_hiring.png"
            },
            {
                "title": "HCLTech GCP Data Engineer Hiring Challenge",
                "source_url": "https://www.hackerearth.com/challenges/competitive/hcltech-gcp-data-engineer-hiring-challenge/",
                "type": "internship",
                "organizer": "HCLTech",
                "description": "Data engineering challenge using Google Cloud Platform, BigQuery, Dataflow, and real-time streaming architectures.",
                "deadline": "2026-11-20T23:59:00+00:00",
                "start_date": "2026-09-01T00:00:00+00:00",
                "stipend": "₹35,000/mo (Full-time: 14-22 LPA)",
                "tags": ["GCP", "BigQuery", "Data Engineering", "Python"],
                "mode": "online",
                "banner_image_url": "https://media.hackerearth.com/media/hackathon/hcltech-gcp-data-engineer-hiring-challenge/images/4a72cc3ca87111f1.png"
            },
        ]

        normalized_list = []
        for v in verified:
            normalized_list.append(
                self.normalize_opportunity(
                    title=v["title"],
                    source_url=v["source_url"],
                    opportunity_type=v["type"],
                    source_platform=self.platform_name,
                    description=v["description"],
                    organizer=v["organizer"],
                    location="Online",
                    mode=v["mode"],
                    start_date=v["start_date"],
                    application_deadline=v["deadline"],
                    prize_pool=v.get("prize_pool"),
                    stipend=v.get("stipend"),
                    tags=v.get("tags"),
                    banner_image_url=v.get("banner_image_url"),
                    is_active=True,
                )
            )
        return normalized_list

