"use client"

/**
 * app/admin/login/page.tsx
 *
 * Admin-only login page.
 *
 * Flow:
 *  1. Authenticate via Supabase email/password.
 *  2. Check the `admins` table for the user's ID.
 *  3. If found → redirect to /admin dashboard.
 *  4. If NOT found → sign the user out and show "Not authorized".
 */

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill error from middleware redirect (?error=unauthorized)
  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      setError("Your account does not have admin access.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Step 1: Sign in with Supabase Auth
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !signInData.user) {
      const msg = signInError?.message ?? ""
      if (msg.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email before signing in.")
      } else if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
        setError("Invalid email or password.")
      } else {
        setError(msg || "Sign in failed. Please try again.")
      }
      setLoading(false)
      return
    }

    // Step 2: Check admins table
    const { data: adminRow } = await supabase
      .from("admins")
      .select("id, role")
      .eq("id", signInData.user.id)
      .maybeSingle()

    if (!adminRow) {
      // Sign them out immediately — they're not an admin
      await supabase.auth.signOut()
      setError("Not authorized. This area is restricted to HackFeed admins.")
      setLoading(false)
      return
    }

    // Step 3: Admin confirmed — redirect to dashboard
    router.push("/admin")
    router.refresh()
  }

  return (
    <div className="card">
      <div className="admin-badge">
        <span className="admin-badge-dot" aria-hidden="true" />
        Admin Portal
      </div>

      <h1>Admin Sign In</h1>
      <p className="subtitle">
        Access is restricted to authorized HackFeed administrators.
      </p>

      {error && (
        <div className="alert-error" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="alert-icon text-rose-400 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} noValidate>
        <div className="field">
          <label htmlFor="admin-email">Admin email</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            placeholder="admin@hackfeed.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          id="admin-login-submit-btn"
          className="btn-primary"
          disabled={loading}
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? "Verifying…" : "Sign In to Dashboard"}
        </button>
      </form>

      <div className="divider-line" />

      <p className="footer-text">
        Not an admin?{" "}
        <Link href="/login">Go to student sign in</Link>
      </p>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: #07070d;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .auth-root::before {
          content: '';
          position: fixed;
          top: -30%;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 60%;
          background: radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .card {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(24px);
          border-radius: 1.25rem;
          padding: 2.5rem 2.25rem;
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
          box-shadow: 0 32px 64px rgba(0,0,0,0.6);
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.75rem;
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #fbbf24;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 1.75rem;
        }
        .admin-badge-dot {
          width: 6px; height: 6px;
          background: #f59e0b;
          border-radius: 50%;
        }

        h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #f1f0ff;
          letter-spacing: -0.03em;
          margin-bottom: 0.4rem;
        }
        .subtitle {
          font-size: 0.88rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1.75rem;
          line-height: 1.5;
        }

        .alert-error {
          padding: 0.75rem 1rem;
          border-radius: 0.65rem;
          font-size: 0.85rem;
          margin-bottom: 1.2rem;
          line-height: 1.5;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.22);
          color: #fca5a5;
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .alert-icon { flex-shrink: 0; margin-top: 0.05rem; }

        .field { margin-bottom: 1.1rem; }
        .field label {
          display: block;
          font-size: 0.82rem;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          margin-bottom: 0.45rem;
          letter-spacing: 0.01em;
        }
        .field input {
          width: 100%;
          padding: 0.7rem 0.9rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 0.65rem;
          color: #f1f0ff;
          font-size: 0.92rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .field input::placeholder { color: rgba(255,255,255,0.22); }
        .field input:focus {
          border-color: rgba(245,158,11,0.5);
          background: rgba(245,158,11,0.05);
        }

        .btn-primary {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #d97706, #b45309);
          border: none;
          border-radius: 0.7rem;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 0.25rem;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 0.4rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer-text {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.25);
        }
        .footer-text a {
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-text a:hover { color: rgba(255,255,255,0.7); }

        .divider-line {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 1.5rem 0;
        }
      `}</style>

      <div className="auth-root">
        <Suspense fallback={<div className="card text-center text-zinc-400 py-12">Loading...</div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </>
  )
}
