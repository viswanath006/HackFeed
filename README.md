<div align="center">

# 🚀 HackFeed

**The all-in-one discovery platform for hackathons, internships & coding challenges**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://hack-feed-umber.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet)](LICENSE)

[**🌐 Live Demo →**](https://hack-feed-umber.vercel.app) · [**Report a Bug**](https://github.com/viswanath006/HackFeed/issues) · [**Request a Feature**](https://github.com/viswanath006/HackFeed/issues)

</div>

---

## ✨ What is HackFeed?

HackFeed is a beautiful, real-time aggregation platform that pulls active hackathons, internships, and coding challenges from across the internet — **Unstop, Devfolio, HackerEarth, and Hack2Skill** — into one unified, searchable feed. No more jumping between tabs.

Every card shows the **original platform poster**, live deadlines, prizes, and a one-click "Apply" button that takes you directly to the source listing.

---

## 🖼️ Screenshots

> _The platform at a glance — dark, premium, and always up to date._

| Feed | Opportunity Detail |
|:---:|:---:|
| [![Feed](https://placehold.co/600x360/0d0d16/7c3aed?text=Feed+View)](https://hack-feed-umber.vercel.app/opportunities) | [![Detail](https://placehold.co/600x360/0d0d16/7c3aed?text=Detail+View)](https://hack-feed-umber.vercel.app/opportunities) |

---

## 🧩 Features

| Feature | Description |
|---|---|
| 🔍 **Live Aggregation** | Auto-scrapes Unstop, Devfolio, HackerEarth & Hack2Skill every 6 hours |
| 🖼️ **Original Posters** | Displays the exact same banner/cover image as the source platform |
| ⏰ **Deadline Tracking** | Real-time countdown badges with urgency indicators |
| 🔎 **Smart Filtering** | Filter by type (hackathon / internship), platform, mode, and more |
| 🔖 **Bookmarks** | Save opportunities to your personal list (auth required) |
| 🔐 **Google OAuth** | One-click sign-in via Supabase + Google OAuth 2.0 |
| 🌙 **Dark Mode** | Premium dark-first design with glassmorphism effects |
| 📱 **Responsive** | Fully responsive across mobile, tablet, and desktop |
| ⚡ **Fast** | SSR + ISR powered by Next.js 14 App Router |

---

## 🏗️ Tech Stack

### Frontend
| Technology | Role |
|---|---|
| **Next.js 14** (App Router) | Framework — SSR, ISR, API Routes |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS** | Utility-first styling |
| **Plus Jakarta Sans + Inter** | Premium typography |
| **Supabase JS SDK** | Database queries + Auth session management |

### Backend & Database
| Technology | Role |
|---|---|
| **Supabase** (PostgreSQL) | Primary database + Row-Level Security |
| **Supabase Auth** | Google OAuth 2.0, session management, SSR cookies |
| **Next.js Route Handlers** | Serverless API endpoints |
| **Middleware** | Auth protection for private routes |

### Scraper Microservice
| Technology | Role |
|---|---|
| **Python 3.11+** | Scraper runtime |
| **FastAPI** | HTTP service + background scheduler |
| **HTTPX** | Async-friendly HTTP client |
| **BeautifulSoup4** | HTML fallback parser |
| **APScheduler** | Cron-based scraping every 6 hours |
| **Supabase Python SDK** | Upsert scraped data via service role |

---

## 📁 Project Structure

```
HackFeed/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Homepage (hero + featured opportunities)
│   ├── opportunities/          # Feed + detail pages
│   │   ├── page.tsx            # /opportunities — full feed
│   │   ├── FeedClient.tsx      # Client-side filters + infinite scroll
│   │   └── [id]/page.tsx       # /opportunities/[id] — detail view
│   ├── bookmarks/              # Saved opportunities (auth-protected)
│   ├── settings/               # User settings
│   ├── login/ & signup/        # Auth pages
│   ├── admin/                  # Admin dashboard
│   └── auth/callback/          # OAuth redirect handler
│
├── components/                 # Reusable UI components
│   ├── OpportunityCard.tsx     # Feed card with poster, deadline, tags
│   ├── NavbarClient.tsx        # Top navigation with auth state
│   ├── DeadlineBadge.tsx       # Live countdown badge
│   └── admin/                  # Admin-specific components
│
├── lib/                        # Shared utilities
│   ├── supabase/               # Supabase client (browser + server + types)
│   └── mockData.ts             # Fallback seed data
│
├── scraper/                    # Python scraper microservice
│   ├── main.py                 # CLI entrypoint + FastAPI server
│   ├── db.py                   # Supabase upsert layer
│   ├── config.py               # Settings loader
│   ├── scrapers/
│   │   ├── unstop.py           # Unstop API scraper
│   │   ├── devfolio.py         # Devfolio API scraper
│   │   ├── hackerearth.py      # HackerEarth API scraper
│   │   └── h2skill.py          # Hack2Skill API scraper
│   └── requirements.txt        # Python dependencies
│
├── supabase/
│   └── combined_setup.sql      # Full DB schema (run once in Supabase SQL editor)
│
├── middleware.ts               # Auth middleware — protects /bookmarks, /settings, /admin
├── .env.example                # Safe template for environment variables
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.11+
- A free [Supabase](https://supabase.com) account
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 app (for login)

---

### 1. Clone the Repository

```bash
git clone https://github.com/viswanath006/HackFeed.git
cd HackFeed
```

---

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of [`supabase/combined_setup.sql`](supabase/combined_setup.sql)
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

---

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

### 4. Enable Google OAuth (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add Authorized Redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret**
5. In Supabase → **Authentication → Providers → Google**, paste both values and enable the provider

---

### 5. Install & Run the Frontend

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

---

### 6. Run the Scraper (Populate with Live Data)

```bash
cd scraper
pip install -r requirements.txt

# Copy and fill in scraper credentials
cp .env .env.real   # then fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

# Run a one-time scrape of all platforms
python main.py

# Or scrape a specific platform
python main.py --platform unstop
python main.py --platform devfolio
python main.py --platform hackerearth
python main.py --platform h2skill

# Or start the persistent FastAPI service with auto-scheduling
python main.py --serve
```

The scraper will populate your Supabase `opportunities` table with **200+ live listings** — complete with official poster images.

---

## 🗄️ Database Schema

The `opportunities` table is the core of HackFeed:

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Opportunity title |
| `type` | `enum` | `hackathon` or `internship` |
| `source_platform` | `text` | `Unstop`, `Devfolio`, `HackerEarth`, `H2Skill` |
| `source_url` | `text` | Link to the original listing (unique) |
| `banner_image_url` | `text` | Official poster/cover image from source |
| `application_deadline` | `timestamptz` | Registration close date |
| `prize_pool` | `text` | Prize amount (if hackathon) |
| `stipend` | `text` | Stipend range (if internship) |
| `tags` | `text[]` | Tech stack / domain tags |
| `mode` | `text` | `online`, `offline`, or `hybrid` |
| `is_featured` | `bool` | Shown on homepage featured section |
| `is_active` | `bool` | Soft-delete / archive flag |

Full schema: [`supabase/combined_setup.sql`](supabase/combined_setup.sql)

---

## 🔒 Security & Privacy

- All secrets live in `.env.local` and `scraper/.env` — both are **gitignored** and never committed
- The Supabase `anon` key is scoped to read-only public data via Row-Level Security (RLS)
- The `service_role` key is **server-only** — never exposed to the browser
- Google OAuth client credentials are stored only in Supabase's encrypted provider config

---

## 🛠️ Scraper Architecture

```
Unstop API  ──┐
Devfolio API  ─┤─→  Scraper (Python)  ──→  Supabase (PostgreSQL)
HackerEarth  ─┤         ↑
Hack2Skill   ──┘    APScheduler (every 6h)
                         ↑
                    FastAPI HTTP Server (optional)
```

Each scraper:
1. Hits the platform's public JSON API
2. Falls back to HTML scraping if the API fails
3. Normalises the data into the shared schema
4. Upserts into Supabase — **inserting new** listings and **updating changed** ones
5. Skips unchanged records entirely (deduplication by `source_url`)

---

## 📦 Deployment

### Frontend (Vercel — recommended)

> **Already deployed at [hack-feed-umber.vercel.app](https://hack-feed-umber.vercel.app)** 🎉

To deploy your own fork:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add your environment variables in the Vercel project settings dashboard.

### Scraper (any Python host — Railway, Render, Fly.io, etc.)

```bash
# Start the persistent service
python scraper/main.py --serve --port 8000
```

The service exposes `/scrape`, `/scrape/{platform}`, and `/health` endpoints.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows the existing patterns and doesn't commit any secrets.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Built with ❤️ by [viswanath006](https://github.com/viswanath006)

🌐 **Live at [hack-feed-umber.vercel.app](https://hack-feed-umber.vercel.app)**

⭐ **Star this repo if you found it useful!**

</div>
