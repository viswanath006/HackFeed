"""
scraper/scrapers/nptel.py

Scraper for NPTEL (National Programme on Technology Enhanced Learning) courses.
Scrapes direct from NPTEL catalog (https://nptel.ac.in/courses) focusing on
Computer Science & Engineering and related engineering disciplines.
"""

from typing import List, Dict, Any
import sys
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper
from scrapers.course_utils import map_domain, infer_level
from config import settings


class NptelScraper(BaseScraper):
    platform_name: str = "NPTEL"
    CATALOG_URL: str = "https://nptel.ac.in/courses"

    def __init__(self, request_delay: float = 1.0):
        super().__init__(request_delay=request_delay)

    def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrapes NPTEL catalog for Computer Science courses and normalizes them
        into the HackFeed courses schema.
        """
        print(f"[{self.platform_name}] Fetching NPTEL courses catalog from {self.CATALOG_URL}...")
        results: List[Dict[str, Any]] = []
        seen_urls = set()
        max_items = max(settings.MAX_ITEMS_PER_PLATFORM, 40)

        try:
            self.rate_limit(self.request_delay)
            resp = self.client.get(self.CATALOG_URL, timeout=settings.REQUEST_TIMEOUT_SECONDS)

            if resp.status_code != 200:
                print(f"[{self.platform_name}] Catalog page returned status {resp.status_code}", file=sys.stderr)
                return results

            soup = BeautifulSoup(resp.text, "html.parser")

            # NPTEL course cards are links starting with /courses/106 (Computer Science & Engineering)
            course_links = soup.find_all("a", href=True)

            for a in course_links:
                if len(results) >= max_items:
                    break

                href = a.get("href", "").strip()
                # 106 is Computer Science & Engineering
                if not href.startswith("/courses/106"):
                    continue

                course_url = f"https://nptel.ac.in{href}"
                if course_url in seen_urls:
                    continue

                name_el = a.find("div", class_="name")
                if not name_el:
                    continue

                raw_title = name_el.get_text(strip=True)
                # Strip leading "NOC:" or "NPTEL:" prefixes
                clean_title = raw_title
                if clean_title.upper().startswith("NOC:"):
                    clean_title = clean_title[4:].strip()
                elif clean_title.upper().startswith("NPTEL:"):
                    clean_title = clean_title[6:].strip()

                if not clean_title:
                    continue

                # Extract meta details (instructors, IIT institute)
                meta_el = a.find("div", class_="meta-data")
                meta_text = meta_el.get_text(separator=" ", strip=True) if meta_el else ""
                discipline_el = a.find("div", class_="discipline")
                discipline_text = discipline_el.get_text(strip=True) if discipline_el else "Computer Science and Engineering"

                description = f"Comprehensive college-level course offered by NPTEL and top IIT/IISc faculty in {discipline_text}."
                if meta_text:
                    description += f" Faculty: {meta_text}."

                domain = map_domain(title=clean_title, description=description)
                if not domain:
                    continue

                level = infer_level(title=clean_title, description=description)

                tags = [domain, "NPTEL", "IIT / IISc", "Government of India"]
                if level:
                    tags.append(level.capitalize())

                course_dict = self.normalize_course(
                    title=clean_title,
                    course_url=course_url,
                    provider="NPTEL",
                    domain=domain,
                    description=description,
                    level=level,
                    price_type="free_with_paid_certificate",
                    price="₹1,000",
                    duration="8-12 weeks",
                    certificate_provided=True,
                    rating=4.6,
                    tags=tags,
                    is_active=True,
                    is_featured=False
                )

                seen_urls.add(course_url)
                results.append(course_dict)

        except Exception as e:
            print(f"[{self.platform_name}] Error scraping NPTEL catalog: {e}", file=sys.stderr)

        print(f"[{self.platform_name}] Scraped {len(results)} NPTEL tech courses.")
        return results
