"""
scraper/scrapers/coursera.py

Scraper for Coursera courses using Coursera's public Catalog API.
Extracts title, description, domain, level, duration, and certificates.
"""

from typing import List, Dict, Any, Optional
import sys
from scrapers.base import BaseScraper
from scrapers.course_utils import map_domain, infer_level, parse_rating
from config import settings


class CourseraScraper(BaseScraper):
    platform_name: str = "Coursera"
    API_URL: str = "https://api.coursera.org/api/courses.v1"

    def __init__(self, request_delay: float = 1.0):
        super().__init__(request_delay=request_delay)

    def scrape(self) -> List[Dict[str, Any]]:
        """
        Queries Coursera's public Catalog API and parses courses
        matching the HackFeed controlled domain categories.
        """
        print(f"[{self.platform_name}] Querying Coursera Catalog API...")
        results: List[Dict[str, Any]] = []
        seen_urls = set()

        max_items = max(settings.MAX_ITEMS_PER_PLATFORM, 30)
        batch_size = 50
        max_batches = 4  # Scrapes up to 200 raw courses to find domain matches

        for batch_idx in range(max_batches):
            if len(results) >= max_items:
                break

            start_offset = batch_idx * batch_size
            params = {
                "start": start_offset,
                "limit": batch_size,
                "primaryLanguages": "en",
                "fields": "name,slug,description,workload,domainTypes,certificates,photoUrl",
            }

            try:
                self.rate_limit(self.request_delay)
                resp = self.client.get(self.API_URL, params=params, timeout=settings.REQUEST_TIMEOUT_SECONDS)

                if resp.status_code != 200:
                    print(f"[{self.platform_name}] API returned status {resp.status_code}: {resp.text[:120]}", file=sys.stderr)
                    break

                data = resp.json()
                elements = data.get("elements", [])
                if not elements:
                    break

                for item in elements:
                    if len(results) >= max_items:
                        break

                    name = item.get("name")
                    slug = item.get("slug")
                    if not name or not slug:
                        continue

                    course_url = f"https://www.coursera.org/learn/{slug}"
                    if course_url in seen_urls:
                        continue

                    description = item.get("description") or ""
                    domain_types = item.get("domainTypes")

                    # Map domain to one of the 6 controlled domains
                    domain = map_domain(title=name, description=description, domain_types=domain_types)
                    if not domain:
                        # Course doesn't match any tech domain (e.g. arts, personal dev, business)
                        continue

                    # Level inference
                    level = infer_level(title=name, description=description)

                    # Duration from workload field
                    workload = item.get("workload")
                    duration = workload.strip() if workload else None

                    # Certificates
                    certs = item.get("certificates", [])
                    has_cert = bool(certs) or True  # Coursera courses offer certificate on completion

                    # Coursera courses allow free audit, certificate requires payment/subscription
                    price_type = "free_with_paid_certificate"
                    price = "$49"

                    tags = [domain, "Coursera", "Self-paced"]
                    if level:
                        tags.append(level.capitalize())

                    course_dict = self.normalize_course(
                        title=name,
                        course_url=course_url,
                        provider="Coursera",
                        domain=domain,
                        description=description,
                        level=level,
                        price_type=price_type,
                        price=price,
                        duration=duration,
                        certificate_provided=has_cert,
                        rating=4.7,  # Default standard Coursera quality score
                        tags=tags,
                        is_active=True,
                        is_featured=False
                    )

                    seen_urls.add(course_url)
                    results.append(course_dict)

            except Exception as e:
                print(f"[{self.platform_name}] Error fetching batch {batch_idx}: {e}", file=sys.stderr)
                break

        print(f"[{self.platform_name}] Scraped {len(results)} valid tech courses.")
        return results
