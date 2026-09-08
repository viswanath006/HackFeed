"""
scraper/config.py

Configuration loader and settings validation for the HackFeed Scraper Microservice.
Loads environment variables from local .env or root .env.local.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load root .env.local first (primary application config), then scraper/.env as override if valid
root_env_path = Path(__file__).resolve().parent.parent / ".env.local"
env_path = Path(__file__).resolve().parent / ".env"

if root_env_path.exists():
    load_dotenv(dotenv_path=root_env_path)
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=False)
else:
    load_dotenv()


def _clean_env_val(key: str, default: str = "") -> str:
    val = os.getenv(key, default)
    if val and ("<your-" in val or "your-project-ref" in val):
        return ""
    return val


class Settings:
    # Supabase credentials (Service role required to bypass RLS)
    SUPABASE_URL: str = (
        _clean_env_val("SUPABASE_URL") or
        _clean_env_val("NEXT_PUBLIC_SUPABASE_URL")
    )
    SUPABASE_SERVICE_ROLE_KEY: str = (
        _clean_env_val("SUPABASE_SERVICE_ROLE_KEY")
    )

    # Apify API token (Used when any platform is set to "apify" mode)
    APIFY_API_TOKEN: str = os.getenv("APIFY_API_TOKEN", "")

    # Scraper tuning & network settings
    REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "25"))
    MAX_ITEMS_PER_PLATFORM: int = int(os.getenv("MAX_ITEMS_PER_PLATFORM", "50"))
    REQUEST_DELAY_SECONDS: float = float(os.getenv("REQUEST_DELAY_SECONDS", "1.5"))

    # Service & scheduler settings
    SCRAPE_INTERVAL_HOURS: int = int(os.getenv("SCRAPE_INTERVAL_HOURS", "6"))
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")

    def validate(self) -> bool:
        """Validates critical settings."""
        if not self.SUPABASE_URL:
            print("[ERROR] SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is not set in environment or .env", file=sys.stderr)
            return False
        if not self.SUPABASE_SERVICE_ROLE_KEY:
            print("[ERROR] SUPABASE_SERVICE_ROLE_KEY is not set in environment or .env", file=sys.stderr)
            return False
        return True


settings = Settings()
