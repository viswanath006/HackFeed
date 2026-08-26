"""
scraper/main.py

Main orchestrator for the HackFeed Scraper Microservice & Engagement Dispatcher.
- Runs scrapers according to platform configuration (direct vs Apify fallback)
- Deduplicates & upserts data into Supabase
- Dispatches hourly deadline reminders (`reminder_sender.py`)
- Dispatches weekly newsletter digests (`digest_sender.py`)
- Provides CLI execution and FastAPI endpoints with background scheduling.
"""

import sys
import argparse
import traceback
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uvicorn
from fastapi import FastAPI, BackgroundTasks, HTTPException
from apscheduler.schedulers.background import BackgroundScheduler

from config import settings
from db import DatabaseClient
from scrapers import (
    ALL_PLATFORMS,
    get_scraper_for_platform,
    get_platform_mode
)
from reminder_sender import process_reminders
from digest_sender import process_weekly_digest


# ── Core Orchestrator ────────────────────────────────────────────────────────

def run_single_scraper(platform_name: str, db: Optional[DatabaseClient]) -> Dict[str, Any]:
    """
    Executes a single platform scraper with isolated error handling and logging.
    Does NOT auto-fallback to Apify mid-run if direct scraper fails (predictable and cost-controlled).
    """
    mode = get_platform_mode(platform_name)
    print(f"\n[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] >>> Starting scraper: {platform_name.upper()} (Mode: {mode.upper()})...")

    items_scraped = 0
    items_added = 0
    items_updated = 0
    status = "failed"
    error_message: Optional[str] = None
    scraper = None

    try:
        # 1. Instantiate scraper based on configuration (Direct or Apify Fallback)
        scraper = get_scraper_for_platform(platform_name)
        display_name = scraper.platform_name

        # 2. Fetch normalized opportunities from source
        opportunities = scraper.scrape()
        items_scraped = len(opportunities)

        if items_scraped > 0:
            if db:
                # 3. Upsert to Supabase
                added, updated = db.upsert_opportunities(opportunities, display_name)
                items_added = added
                items_updated = updated
            else:
                items_added = items_scraped
                print(f"[{display_name}] Parsing successful: {items_scraped} items parsed (DB offline).")
            status = "success"
        else:
            status = "partial"
            error_message = "Scraper ran successfully but returned 0 items."

    except Exception as e:
        status = "failed"
        error_message = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[SCRAPER FAILED] {platform_name}: {e}", file=sys.stderr)
    finally:
        if scraper:
            scraper.close()
        # 4. Log audit entry to scrape_logs table in Supabase
        if db:
            db.log_scrape_run(
                source_platform=platform_name.capitalize(),
                status=status,
                items_scraped=items_scraped,
                items_added=items_added,
                items_updated=items_updated,
                error_message=error_message
            )

    return {
        "platform": platform_name,
        "mode": mode,
        "status": status,
        "items_scraped": items_scraped,
        "items_added": items_added,
        "items_updated": items_updated,
        "error": error_message
    }


def run_all_scrapers(target_platform: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Runs all configured scrapers or a single specified scraper.
    """
    has_valid_settings = settings.validate()
    db: Optional[DatabaseClient] = None

    if has_valid_settings:
        try:
            db = DatabaseClient()
        except Exception as e:
            print(f"[WARNING] Database initialization failed ({e}). Proceeding in parsing-only mode.", file=sys.stderr)
    else:
        print("[WARNING] Supabase credentials not set. Running in offline/dry-run mode.", file=sys.stderr)

    platforms_to_run = ALL_PLATFORMS
    if target_platform:
        target_clean = target_platform.lower()
        if target_clean not in ALL_PLATFORMS:
            print(f"[ERROR] Unknown platform '{target_platform}'. Available: {ALL_PLATFORMS}", file=sys.stderr)
            return []
        platforms_to_run = [target_clean]

    results = []
    print(f"============================================================")
    print(f"  HackFeed Scraper Run — {datetime.now(timezone.utc).isoformat()}")
    print(f"  Running {len(platforms_to_run)} platform(s): {platforms_to_run}")
    print(f"============================================================")

    for platform_name in platforms_to_run:
        res = run_single_scraper(platform_name, db)
        results.append(res)

    print("\n============================================================")
    print("  Scrape Run Summary")
    print("============================================================")
    for r in results:
        print(f"  • {r['platform'].capitalize():<12} [{r['mode'].upper():<6}]: {r['status'].upper():<8} | Scraped: {r['items_scraped']:<4} | Added: {r['items_added']:<4} | Updated: {r['items_updated']:<4}")
    print("============================================================\n")

    return results


# ── FastAPI Application & Lifespan ───────────────────────────────────────────

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Recurring Scraping (every 6 hours)
    if settings.SCRAPE_INTERVAL_HOURS > 0:
        scheduler.add_job(
            run_all_scrapers,
            "interval",
            hours=settings.SCRAPE_INTERVAL_HOURS,
            id="recurring_scrape_job",
            replace_existing=True
        )
        print(f"[SCHEDULER] Started recurring scrape every {settings.SCRAPE_INTERVAL_HOURS} hour(s).")

    # 2. Hourly Deadline Reminders
    scheduler.add_job(
        process_reminders,
        "cron",
        minute=0,
        id="hourly_reminders_job",
        replace_existing=True
    )
    print("[SCHEDULER] Scheduled hourly deadline reminders dispatcher.")

    # 3. Weekly Newsletter Digest (every Monday at 09:00 UTC)
    scheduler.add_job(
        process_weekly_digest,
        "cron",
        day_of_week="mon",
        hour=9,
        minute=0,
        id="weekly_digest_job",
        replace_existing=True
    )
    print("[SCHEDULER] Scheduled weekly newsletter digest for Mondays at 09:00 UTC.")

    scheduler.start()
    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown()


app = FastAPI(
    title="HackFeed Scraper & Engagement Microservice",
    description="Automated aggregator for hackathons/internships with deadline reminder and newsletter digest dispatchers.",
    version="1.1.0",
    lifespan=lifespan
)


@app.get("/health")
def health_check():
    """Health check endpoint for container orchestrators and status monitoring."""
    return {
        "status": "healthy",
        "service": "hackfeed-scraper",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "platforms_supported": ALL_PLATFORMS,
        "engagement_features": ["deadline_reminders", "weekly_digest", "calendar_export"]
    }


@app.post("/scrape")
def trigger_scrape_all(background_tasks: BackgroundTasks):
    """Triggers an immediate background scrape of all supported platforms."""
    background_tasks.add_task(run_all_scrapers)
    return {
        "message": "Full scrape job queued in background.",
        "status": "queued",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/scrape/{platform}")
def trigger_scrape_platform(platform: str, background_tasks: BackgroundTasks):
    """Triggers a background scrape for a specific platform."""
    target_clean = platform.lower()
    if target_clean not in ALL_PLATFORMS:
        raise HTTPException(
            status_code=404,
            detail=f"Platform '{platform}' not found. Available: {ALL_PLATFORMS}"
        )

    background_tasks.add_task(run_all_scrapers, target_platform=target_clean)
    return {
        "message": f"Scrape job for '{platform}' queued in background.",
        "status": "queued",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/reminders")
def trigger_reminders(background_tasks: BackgroundTasks):
    """Triggers an immediate dispatch of pending deadline reminders."""
    background_tasks.add_task(process_reminders)
    return {
        "message": "Deadline reminder job queued in background.",
        "status": "queued",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/digest")
def trigger_digest(background_tasks: BackgroundTasks):
    """Triggers an immediate dispatch of weekly newsletter digest."""
    background_tasks.add_task(process_weekly_digest)
    return {
        "message": "Weekly digest job queued in background.",
        "status": "queued",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ── CLI Entrypoint ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="HackFeed Scraper & Engagement Microservice")
    parser.add_argument(
        "--platform",
        type=str,
        help="Run a specific scraper only (e.g. unstop, devfolio, hackerearth, h2skill)"
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Start the FastAPI HTTP service and background scheduler"
    )
    parser.add_argument(
        "--reminders",
        action="store_true",
        help="Run pending deadline reminders dispatcher"
    )
    parser.add_argument(
        "--digest",
        action="store_true",
        help="Run weekly newsletter digest dispatcher"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate execution without modifying database or sending real emails"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=settings.API_PORT,
        help=f"Port to bind HTTP service (default: {settings.API_PORT})"
    )

    args = parser.parse_args()

    if args.serve:
        print(f"[SERVER] Starting FastAPI server on {settings.API_HOST}:{args.port}...")
        uvicorn.run(
            "main:app",
            host=settings.API_HOST,
            port=args.port,
            reload=False
        )
    elif args.reminders:
        print(f"[CLI] Running deadline reminder dispatcher (Dry Run: {args.dry_run})...")
        count = process_reminders(dry_run=args.dry_run)
        print(f"[CLI] Processed {count} reminders.")
    elif args.digest:
        print(f"[CLI] Running weekly digest dispatcher (Dry Run: {args.dry_run})...")
        count = process_weekly_digest(dry_run=args.dry_run)
        print(f"[CLI] Dispatched {count} digests.")
    else:
        run_all_scrapers(target_platform=args.platform)


if __name__ == "__main__":
    main()
