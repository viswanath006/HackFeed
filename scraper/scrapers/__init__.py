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
from scrapers.coursera import CourseraScraper
from scrapers.freecodecamp import FreeCodeCampScraper
from scrapers.nptel import NptelScraper
from scrapers.udemy import UdemyScraper
from scrapers.config import (
    PLATFORM_CONFIG,
    APIFY_ACTORS,
    get_platform_mode,
    COURSE_PLATFORM_CONFIG,
    COURSE_APIFY_ACTORS,
    get_course_platform_mode,
)

DIRECT_SCRAPER_MAP: Dict[str, Type[BaseScraper]] = {
    "unstop": UnstopScraper,
    "devfolio": DevfolioScraper,
    "hackerearth": HackerEarthScraper,
    "h2skill": H2SkillScraper,
}

ALL_PLATFORMS = list(DIRECT_SCRAPER_MAP.keys())

COURSE_SCRAPER_MAP: Dict[str, Type[BaseScraper]] = {
    "coursera": CourseraScraper,
    "freecodecamp": FreeCodeCampScraper,
    "nptel": NptelScraper,
    "udemy": UdemyScraper,
}

ALL_COURSE_PLATFORMS = list(COURSE_SCRAPER_MAP.keys())


def get_course_scraper_for_platform(platform_name: str) -> BaseScraper:
    """
    Factory function returning the appropriate course scraper instance.
    """
    p_key = platform_name.lower()
    scraper_cls = COURSE_SCRAPER_MAP.get(p_key)
    if scraper_cls:
        return scraper_cls()

    raise ValueError(f"Unknown course platform: {platform_name}. Supported: {ALL_COURSE_PLATFORMS}")


def get_scraper_for_platform(platform_name: str) -> BaseScraper:
    """
    Factory function returning the appropriate scraper instance (Direct, Apify Fallback, or Course)
    based on configuration.
    """
    p_key = platform_name.lower()

    # Route course platforms
    if p_key in COURSE_SCRAPER_MAP:
        return get_course_scraper_for_platform(p_key)

    mode = get_platform_mode(p_key)

    if mode == "apify":
        return ApifyFallbackScraper(platform_name=p_key)
    
    scraper_cls = DIRECT_SCRAPER_MAP.get(p_key)
    if scraper_cls:
        return scraper_cls()

    raise ValueError(f"Unknown platform: {platform_name}. Supported: {ALL_PLATFORMS + ALL_COURSE_PLATFORMS}")


__all__ = [
    "BaseScraper",
    "UnstopScraper",
    "DevfolioScraper",
    "HackerEarthScraper",
    "H2SkillScraper",
    "ApifyFallbackScraper",
    "CourseraScraper",
    "FreeCodeCampScraper",
    "NptelScraper",
    "UdemyScraper",
    "DIRECT_SCRAPER_MAP",
    "ALL_PLATFORMS",
    "COURSE_SCRAPER_MAP",
    "ALL_COURSE_PLATFORMS",
    "PLATFORM_CONFIG",
    "APIFY_ACTORS",
    "COURSE_PLATFORM_CONFIG",
    "COURSE_APIFY_ACTORS",
    "get_scraper_for_platform",
    "get_course_scraper_for_platform",
    "get_platform_mode",
    "get_course_platform_mode",
]

