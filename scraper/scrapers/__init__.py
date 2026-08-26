"""
scraper/scrapers/__init__.py

Exports all dedicated scrapers, configuration registry, and factory functions for HackFeed.
"""

from typing import Dict, Type
from scrapers.base import BaseScraper
from scrapers.unstop import UnstopScraper
from scrapers.devfolio import DevfolioScraper
from scrapers.hackerearth import HackerEarthScraper
from scrapers.h2skill import H2SkillScraper
from scrapers.apify_fallback import ApifyFallbackScraper
from scrapers.config import PLATFORM_CONFIG, APIFY_ACTORS, get_platform_mode

DIRECT_SCRAPER_MAP: Dict[str, Type[BaseScraper]] = {
    "unstop": UnstopScraper,
    "devfolio": DevfolioScraper,
    "hackerearth": HackerEarthScraper,
    "h2skill": H2SkillScraper,
}

ALL_PLATFORMS = list(DIRECT_SCRAPER_MAP.keys())


def get_scraper_for_platform(platform_name: str) -> BaseScraper:
    """
    Factory function returning the appropriate scraper instance (Direct or Apify Fallback)
    based on the configuration in scrapers/config.py.
    """
    p_key = platform_name.lower()
    mode = get_platform_mode(p_key)

    if mode == "apify":
        return ApifyFallbackScraper(platform_name=p_key)
    
    scraper_cls = DIRECT_SCRAPER_MAP.get(p_key)
    if scraper_cls:
        return scraper_cls()

    raise ValueError(f"Unknown platform: {platform_name}. Supported: {ALL_PLATFORMS}")


__all__ = [
    "BaseScraper",
    "UnstopScraper",
    "DevfolioScraper",
    "HackerEarthScraper",
    "H2SkillScraper",
    "ApifyFallbackScraper",
    "DIRECT_SCRAPER_MAP",
    "ALL_PLATFORMS",
    "PLATFORM_CONFIG",
    "APIFY_ACTORS",
    "get_scraper_for_platform",
]
