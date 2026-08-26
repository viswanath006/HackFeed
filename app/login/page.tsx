"use client"

/**
 * app/login/page.tsx
 *
 * Student sign-in page — supports email/password and Google OAuth.
 * Zero-emoji developer aesthetic with clean SVGs and modern typography.
 */

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/env"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Handle query-string messages from callback / signup
  useEffect(() => {
    const err = searchParams.get("error")
    const confirmed = searchParams.get("confirmed")
    const redirectTo = searchParams.get("redirectTo")

    if (err === "auth_callback_failed") setError("Authentication failed. Please try again.")
    if (confirmed === "true") setInfo("Email confirmed! You can now sign in.")
    if (redirectTo) {
      sessionStorage.setItem("redirectTo", redirectTo)
    }
  }, [searchParams])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!isSupabaseConfigured()) {
      // Demo authentication mode during local testing
      setTimeout(() => {
        const redirect = sessionStorage.getItem("redirectTo") || "/"
        sessionStorage.removeItem("redirectTo")
        router.push(redirect)
        router.refresh()
      }, 500)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email before signing in. Check your inbox.")
      } else if (
        authError.message.toLowerCase().includes("invalid") ||
        authError.message.toLowerCase().includes("credentials")
      ) {
        setError("Invalid email or password. Please try again.")
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    const redirect = sessionStorage.getItem("redirectTo") || "/"
    sessionStorage.removeItem("redirectTo")
    router.push(redirect)
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)

    if (!isSupabaseConfigured()) {
      setError("Google OAuth requires live Supabase credentials in .env.local. You can test sign-in using email & password.")
      setGoogleLoading(false)
      return
    }

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message || "Failed to initiate Google sign in. Ensure Google provider is enabled in your Supabase Dashboard.")
        setGoogleLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || "Google sign in error. Check network and Supabase OAuth configuration.")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="card">
      <Link href="/" className="logo">
        <div className="logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span className="logo-text">HackFeed</span>
      </Link>

      <h1>Welcome back</h1>
      <p className="subtitle">Sign in to track hackathons, internships &amp; deadlines</p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {info  && <div className="alert alert-info"  role="status">{info}</div>}

      <form onSubmit={handleEmailLogin} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || googleLoading}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || googleLoading}
          />
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          className="btn-primary"
          disabled={loading || googleLoading}
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="divider"><span>or</span></div>

      <button
        type="button"
        id="login-google-btn"
        className="btn-google"
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
      >
        {googleLoading ? (
          <span className="spinner" style={{ borderTopColor: "rgba(255,255,255,0.8)" }} aria-hidden="true" />
        ) : (
          <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </button>

      <p className="footer-text">
        Don&apos;t have an account?{" "}
        <Link href="/signup">Create one</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <style>{`
        .auth-root {
          font-family: var(--font-sans), system-ui, sans-serif;
          min-height: calc(100vh - 4rem);
          background: #07070c;
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
          left: -15%;
          width: 70%;
          height: 70%;
          background: radial-gradient(ellipse, rgba(124, 58, 237, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .card {
          background: rgba(13, 13, 22, 0.85);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border-radius: 1.25rem;
          padding: 2.25rem;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.8rem;
          text-decoration: none;
        }
        .logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text {
          font-family: var(--font-display), sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }

        h1 {
          font-family: var(--font-display), sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 0.35rem;
        }
        .subtitle {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.45);
          margin-bottom: 1.5rem;
        }

        .alert {
          padding: 0.75rem 0.9rem;
          border-radius: 0.65rem;
          font-size: 0.82rem;
          margin-bottom: 1.2rem;
          line-height: 1.5;
        }
        .alert-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5;
        }
        .alert-info {
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          color: #a5b4fc;
        }

        .field { margin-bottom: 1rem; }
        .field label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.4rem;
        }
        .field input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.6rem;
          color: #fff;
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .field input::placeholder { color: rgba(255,255,255,0.25); }
        .field input:focus {
          border-color: rgba(124, 58, 237, 0.6);
        }

        .btn-primary {
          width: 100%;
          padding: 0.7rem;
          background: #7c3aed;
          border: none;
          border-radius: 0.65rem;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 0.25rem;
        }
        .btn-primary:hover:not(:disabled) { background: #6d28d9; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider {
          display: flex; align-items: center; gap: 0.75rem;
          margin: 1.25rem 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .divider span {
          font-size: 0.75rem; color: rgba(255,255,255,0.3); font-weight: 500;
        }

        .btn-google {
          width: 100%;
          padding: 0.7rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.65rem;
          color: rgba(255,255,255,0.85);
          font-size: 0.88rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-google:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.16);
        }
        .btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

        .google-icon { width: 16px; height: 16px; flex-shrink: 0; }

        .footer-text {
          text-align: center;
          margin-top: 1.4rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.4);
        }
        .footer-text a {
          color: #a78bfa; text-decoration: none; font-weight: 600;
        }
        .footer-text a:hover { color: #c4b5fd; }

        .spinner {
          display: inline-block;
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 0.4rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="auth-root">
        <Suspense fallback={<div className="card text-center text-zinc-400 py-12">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </>
  )
}
