# HackFeed Scraper Microservice

A standalone Python microservice that autonomously scrapes and synchronizes hackathon and internship opportunities from **Unstop**, **Devfolio**, **HackerEarth**, and **H2Skill (Hack2skill)** into the HackFeed Supabase database.

---

## 📁 Architecture & Directory Structure

```
scraper/
├── config.py                  # Global settings (Supabase, timeouts, Apify token)
├── db.py                      # Database client with deduplication & scrape_logs audit
├── main.py                    # Orchestrator (CLI + FastAPI + APScheduler)
├── requirements.txt           # Python dependencies
├── .env.example               # Config template (including APIFY_API_TOKEN)
├── README.md                  # Complete documentation & operational guide
└── scrapers/
    ├── __init__.py            # Registry exporting scrapers & factory function
    ├── base.py                # BaseScraper class (.scrape() -> list[dict]), normalization, rate limiting
    ├── config.py              # Platform routing config ('direct' vs 'apify') & Actor mappings
    ├── unstop.py              # Dedicated Unstop scraper (API + HTML fallback)
    ├── devfolio.py            # Dedicated Devfolio scraper (API + HTML fallback)
    ├── hackerearth.py         # Dedicated HackerEarth scraper (API + HTML fallback)
    ├── h2skill.py             # Dedicated H2Skill scraper (API + HTML fallback)
    └── apify_fallback.py      # Generic Apify fallback layer (Actor runner + normalizer)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- A Supabase project with the HackFeed schema deployed (`supabase/migrations/001_initial_schema.sql`)

### 2. Installation
```bash
cd scraper
python -m venv venv

# Linux / macOS:
source venv/bin/activate

# Windows (cmd/powershell):
venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env` in the `scraper/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Optional: Needed only if any platform uses Apify fallback
APIFY_API_TOKEN=your-apify-api-token-here
```

> **Security Note**: The service-role key is used solely by this backend scraper to bypass Row Level Security (RLS). Never commit `.env` or expose this key to web frontends.

---

## 💻 How to Run

### Option A: Run Manually via CLI

Run all platforms (Unstop, Devfolio, HackerEarth, H2Skill):
```bash
python main.py
```

Run a specific platform only:
```bash
python main.py --platform unstop
python main.py --platform devfolio
python main.py --platform hackerearth
python main.py --platform h2skill
```

### Option B: Run as a FastAPI Service with APScheduler

Starts an HTTP API server on port 8000 and automatically schedules a scrape every 6 hours (configurable via `SCRAPE_INTERVAL_HOURS`):

```bash
python main.py --serve
```

#### REST Endpoints:
- `GET /health` — Check service health and supported platforms.
- `POST /scrape` — Trigger an immediate background scrape of all platforms.
- `POST /scrape/{platform}` — Trigger a background scrape for a specific platform (`unstop`, `devfolio`, `hackerearth`, `h2skill`).

---

## ⏰ Automated Scheduling

### 1. Linux Crontab (e.g. Every 6 Hours)
Edit your crontab:
```bash
crontab -e
```
Add the cron rule:
```cron
0 */6 * * * cd /path/to/HackFeed/scraper && /path/to/HackFeed/scraper/venv/bin/python main.py >> /var/log/hackfeed_scraper.log 2>&1
```

---

### 2. GitHub Actions (Free Serverless Scheduler)
You can schedule automated runs directly via GitHub Actions.

Create `.github/workflows/scraper.yml` in your repository:

```yaml
name: Scheduled HackFeed Scraper

on:
  schedule:
    # Runs every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch: # Allows manual trigger from GitHub Actions tab

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: scraper/requirements.txt

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r scraper/requirements.txt

      - name: Run Scrapers
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          APIFY_API_TOKEN: ${{ secrets.APIFY_API_TOKEN }}
        run: |
          cd scraper
          python main.py
```

Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optional `APIFY_API_TOKEN` under **Settings -> Secrets and variables -> Actions**.

---

## 🔍 How to Inspect a Platform for JSON Endpoints

Before writing an HTML scraper with BeautifulSoup or Playwright, **always check for internal JSON APIs first**. JSON endpoints are faster, cleaner, less prone to breaking when HTML CSS classes change, and use fewer compute resources.

### Step-by-Step Inspection Guide:

1. **Open Browser Developer Tools**:
   - Navigate to the platform's listing page (e.g., `https://devfolio.co/hackathons` or `https://hack2skill.com`).
   - Press `F12` (or `Ctrl+Shift+I` on Windows / `Cmd+Option+I` on macOS) and click on the **Network** tab.

2. **Filter by Fetch/XHR**:
   - In the Network filter bar, select **Fetch/XHR** (or **JSON**).
   - Reload the page or scroll down to trigger infinite scroll / pagination.

3. **Look for Listing Responses**:
   - Inspect requests with names like `search`, `list`, `opportunities`, `challenges`, `graphql`, or `events`.
   - Click on a request and check the **Response** / **Preview** tab.
   - Look for structured JSON arrays containing `title`, `slug`, `dates`, `banner`, `tags`, etc.

4. **Copy Headers & Query Params**:
   - Right-click the request -> **Copy as cURL** (or **Copy URL**).
   - Note required headers like `Accept: application/json`, `Referer`, or `Origin`.
   - Incorporate the URL and headers into the scraper module (as seen in `scrapers/unstop.py` and `scrapers/h2skill.py`).

5. **When to use Playwright vs Requests/BeautifulSoup**:
   - If an internal API exists: Use lightweight `httpx`/`requests` (fastest & lightest).
   - If static HTML contains cards: Use `httpx` + `BeautifulSoup`.
   - Only if the page requires heavy client-side JavaScript rendering and exposes no reachable API: Use Playwright as a targeted fallback.

---

## 🔄 Apify Fallback Layer & Cost Controls

### Why Apify Fallback?
Some platforms frequently overhaul their UI, rotate CSS class names, or implement heavy Cloudflare challenges. The Apify fallback module (`scrapers/apify_fallback.py`) provides an autonomous alternative.

> [!IMPORTANT]
> **Cost Notice**: Direct scraping is free and is always the default. Apify runs consume actor compute units / proxy bandwidth ($/run). Apify is designed as a **maintenance fallback**, not the default.

### Switching a Platform to Apify Mode:
To switch any platform to Apify, modify `scraper/scrapers/config.py`:

```python
PLATFORM_CONFIG = {
    "unstop": "direct",
    "devfolio": "direct",
    "hackerearth": "direct",
    "h2skill": "apify",       # <-- Flipped to 'apify' in one line
}
```

Ensure `APIFY_API_TOKEN` is set in your `.env`. The orchestrator will automatically route that platform through Apify, poll the actor run, and normalize the dataset into the exact same `opportunities` schema without requiring any changes to database logic or the Next.js app.

### Predictable Failure Handling:
If a direct scraper encounters an error mid-run, it logs the failure to `scrape_logs` and continues with remaining platforms. It does **not** auto-fallback to Apify mid-run to prevent unintended billing surprises.

---

## 🛡️ Database Deduplication & Audit Logs

- **Deduplication**: Keyed on unique `source_url`. If a listing already exists, it is checked for changes in deadline, prize pool, stipend, or description. If changed, `updated_at` is updated; otherwise, redundant writes are skipped.
- **Audit Logging**: Every execution logs a row in the `scrape_logs` table (`source_platform`, `status`, `items_scraped`, `items_added`, `items_updated`, `error_message`, `run_at`).
