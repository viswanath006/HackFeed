"""
scraper/scrapers/config.py

Platform routing configuration for HackFeed Scraper Microservice.
Controls whether each platform runs via direct scraping or the Apify fallback layer.
"""

from typing import Dict

# ── Platform Execution Mode ──────────────────────────────────────────────────
# Set any platform to "apify" to route via Apify fallback, or "direct" for native scraper.
# Changing a platform from "direct" to "apify" is a one-line toggle.
# NOTE: Direct scraping is tried first for cost reasons. Apify runs cost per result
# and are intended as a fallback for brittle or heavily protected platforms.
PLATFORM_CONFIG: Dict[str, str] = {
    "unstop": "direct",        # "direct" | "apify"
    "devfolio": "direct",      # "direct" | "apify"
    "hackerearth": "direct",   # "direct" | "apify"
    "h2skill": "direct",       # "direct" | "apify"
}

# ── Apify Actor Registry ─────────────────────────────────────────────────────
# Map platform names to their respective Apify Actor IDs or store names.
APIFY_ACTORS: Dict[str, str] = {
    "unstop": "apify/web-scraper",          # e.g. apify/unstop-scraper or custom actor ID
    "devfolio": "apify/web-scraper",        # e.g. apify/devfolio-scraper
    "hackerearth": "apify/web-scraper",    # e.g. apify/hackerearth-scraper
    "h2skill": "apify/web-scraper",        # e.g. apify/hack2skill-scraper
}

# Default start URLs for generic Apify web scraper actors
APIFY_START_URLS: Dict[str, list] = {
    "unstop": [
        {"url": "https://unstop.com/hackathons"},
        {"url": "https://unstop.com/internships"}
    ],
    "devfolio": [
        {"url": "https://devfolio.co/hackathons"}
    ],
    "hackerearth": [
        {"url": "https://www.hackerearth.com/challenges/"}
    ],
    "h2skill": [
        {"url": "https://hack2skill.com/hackathons"}
    ]
}


def get_platform_mode(platform_name: str) -> str:
    """Returns 'direct' or 'apify' for a given platform name (case-insensitive)."""
    return PLATFORM_CONFIG.get(platform_name.lower(), "direct")


def get_apify_actor(platform_name: str) -> str:
    """Returns the Apify Actor ID for a platform."""
    return APIFY_ACTORS.get(platform_name.lower(), "apify/web-scraper")
