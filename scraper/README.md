# HackFeed Scraper Microservice

A standalone Python microservice that autonomously scrapes and synchronizes:
1. **Hackathons & Internships** from **Unstop**, **Devfolio**, **HackerEarth**, and **H2Skill (Hack2skill)** into the HackFeed `opportunities` table.
2. **Courses & Certifications** from **Coursera**, **freeCodeCamp**, **NPTEL (SWAYAM)**, and **Udemy** into the HackFeed `courses` table.

---

## 📁 Architecture & Directory Structure

```
scraper/
├── config.py                  # Global settings (Supabase, timeouts, Apify token)
├── db.py                      # Database client (opportunities & courses upsert + scrape_logs audit)
├── main.py                    # Orchestrator (CLI + FastAPI + APScheduler)
├── requirements.txt           # Python dependencies
├── .env.example               # Config template (including APIFY_API_TOKEN)
├── README.md                  # Complete documentation & operational guide
└── scrapers/
    ├── __init__.py            # Registry exporting scrapers & factory functions
    ├── base.py                # BaseScraper (.scrape() -> list[dict]), opportunity & course normalizers
    ├── config.py              # Platform routing config ('direct' vs 'apify') & Actor mappings
    ├── course_utils.py        # Shared course utilities (domain keyword mapper, level inferrer)
    ├── unstop.py              # Dedicated Unstop scraper (API + HTML fallback)
    ├── devfolio.py            # Dedicated Devfolio scraper (API + HTML fallback)
    ├── hackerearth.py         # Dedicated HackerEarth scraper (API + HTML fallback)
    ├── h2skill.py             # Dedicated H2Skill scraper (API + HTML fallback)
    ├── apify_fallback.py      # Generic Apify fallback layer (Actor runner + normalizer)
    ├── coursera.py            # Coursera scraper (Public Catalog API courses.v1)
    ├── freecodecamp.py        # freeCodeCamp scraper (Curriculum / verified certifications)
    ├── nptel.py               # NPTEL scraper (IIT / Swayam computer science courses)
    └── udemy.py               # Udemy scraper (Apify route + documented gap)
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

#### Opportunities Scraping:
Run all opportunity platforms (Unstop, Devfolio, HackerEarth, H2Skill):
```bash
python main.py
```

Run a specific opportunity platform only:
```bash
python main.py --platform unstop
python main.py --platform devfolio
python main.py --platform hackerearth
python main.py --platform h2skill
```

#### Courses & Certifications Scraping:
Run all course platforms (Coursera, freeCodeCamp, NPTEL, Udemy):
```bash
python main.py --courses
```

Run a specific course platform only:
```bash
python main.py --courses --platform coursera
python main.py --courses --platform freecodecamp
python main.py --courses --platform nptel
python main.py --courses --platform udemy
```
*(Or simply `python main.py --platform coursera` — the CLI routes automatically)*

### Option B: Run as a FastAPI Service with APScheduler

Starts an HTTP API server on port 8000 and automatically schedules:
- **Opportunities scrape**: every 6 hours (configurable via `SCRAPE_INTERVAL_HOURS`)
- **Hourly deadline reminders**: every hour at minute 0
- **Weekly newsletter digest**: every Monday at 09:00 UTC
- **Weekly course scraper**: every Sunday at 00:00 UTC

```bash
python main.py --serve
```

#### REST Endpoints:
- `GET /health` — Check service health and supported opportunity + course platforms.
- `POST /scrape` — Trigger an immediate background scrape of all opportunity platforms.
- `POST /scrape/{platform}` — Trigger a background scrape for a specific platform (`unstop`, `devfolio`, `hackerearth`, `h2skill`).
- `POST /scrape/courses` — Trigger an immediate background scrape of all course platforms.
- `POST /scrape/courses/{platform}` — Trigger a background scrape for a specific course platform (`coursera`, `freecodecamp`, `nptel`, `udemy`).
- `POST /reminders` — Trigger deadline reminders dispatch.
- `POST /digest` — Trigger weekly digest newsletter dispatch.

---

## 🎓 Course Scrapers & Controlled Schema

Course scrapers conform strictly to the HackFeed `courses` Postgres table:

| Column | Type / Constraint | Description |
|---|---|---|
| `title` | `TEXT NOT NULL` | Name of the course or certification |
| `description` | `TEXT` | Syllabus / course description |
| `provider` | `TEXT NOT NULL` | Platform (e.g. `'Coursera'`, `'freeCodeCamp'`, `'NPTEL'`, `'Udemy'`) |
| `domain` | `TEXT NOT NULL` | Controlled list: `Web Development`, `AI/ML`, `Cloud Computing`, `DSA`, `Cybersecurity`, `Data Science` |
| `level` | `course_level` | `'beginner'`, `'intermediate'`, `'advanced'` |
| `price_type` | `course_price_type` | `'free'`, `'paid'`, `'free_with_paid_certificate'` |
| `price` | `TEXT` | Price string (`'₹1,000'`, `'$49'`, `null` if free) |
| `duration` | `TEXT` | Course length (`'~300 hours'`, `'8-12 weeks'`, `'40 hours'`) |
| `certificate_provided` | `BOOLEAN` | Verified certificate upon completion |
| `course_url` | `TEXT NOT NULL` | Canonical course link |
| `rating` | `NUMERIC(3,1)` | Course rating (e.g. `4.8`) |
| `tags` | `TEXT[]` | Keyword tags array |
| `is_active` | `BOOLEAN` | Visibility flag |
| `is_featured` | `BOOLEAN` | Featured spotlight flag |

### Controlled Domain Categorization:
Courses are mapped deterministically into the 6 controlled domains via `course_utils.py`:
1. **Web Development**: HTML, CSS, JavaScript, React, Next.js, Node.js, Express, Full Stack.
2. **AI/ML**: Machine Learning, Deep Learning, Generative AI, Neural Networks, Computer Vision, NLP.
3. **Cloud Computing**: AWS, Google Cloud, Azure, DevOps, Kubernetes, Docker, Serverless, Terraform.
4. **DSA**: Data Structures, Algorithms, Problem Solving, Competitive Programming, OOP.
5. **Cybersecurity**: Information Security, Ethical Hacking, Network Security, Penetration Testing.
6. **Data Science**: Python for Data, Pandas, NumPy, SQL, Relational Databases, D3.js, Analytics.

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

---

## 🖼️ Original Cover Image Extraction & Validation

Each scraper module (`unstop.py`, `devfolio.py`, `hackerearth.py`, `h2skill.py`) extracts the opportunity's original cover/banner image following a strict priority hierarchy:

1. **Dedicated Banner/Cover Elements**: Inspects platform-specific cover and banner elements (e.g., `header img`, `.banner-section img`, `.cover-image img`, `img.banner-img`, `.event-banner img`) or direct high-resolution banner paths from platform APIs (e.g., Unstop competition detail API, Devfolio `cover_img`).
2. **Open Graph / Twitter Fallback**: If no explicit banner element is present, falls back to `<meta property="og:image" content="...">` or `<meta name="twitter:image" content="...">`. These are reliable across almost all platforms because they are used for social share previews and reflect the authentic, on-brand cover image for that specific listing.
3. **HTTP HEAD Request Validation**: Every candidate URL is validated via an HTTP `HEAD` request (verifying `status_code < 400` and `Content-Type` starting with `image/*`, with graceful stream fallback if servers reject HEAD). If validation fails or the link is broken, `banner_image_url` is left as `None` to prevent broken images from rendering on the client.
4. **Direct Linking (No Hotlink Caching)**: Source image URLs are stored directly in the `banner_image_url` field, allowing the client browser to load them directly from the original platform.

> [!NOTE]
> **Future Improvement — Supabase Storage Re-hosting**:
> If hotlinking ever becomes unreliable because platforms enforce stricter cross-origin image loading policies (CORP/CORS) or anti-hotlinking headers, the next step is to asynchronously download validated cover images and re-host them via **Supabase Storage** (e.g., an `opportunity-banners` public bucket). This is flagged as a future enhancement.

