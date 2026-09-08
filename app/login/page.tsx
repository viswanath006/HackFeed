"use client"

/**
 * app/login/page.tsx
 *
 * Student sign-in page — supports email/password and Google OAuth.
 * Grounded in Paper & Ink editorial aesthetic.
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
      setError("Google OAuth requires live Supabase credentials in .env.local.")
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
        setError(authError.message || "Failed to initiate Google sign in.")
        setGoogleLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || "Google sign in error.")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="card">
      <Link href="/" className="logo">
        <span className="logo-text">HackFeed</span>
        <span className="logo-badge">Bulletin</span>
      </Link>

      <h1>Sign In</h1>
      <p className="subtitle">Access your bookmarked opportunities &amp; alerts</p>

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
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </button>

      <p className="footer-text">
        Don&apos;t have an account?{" "}
        <Link href="/signup">Join Bulletin</Link>
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
          background: #F7F5F0;
          color: #161512;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
        }

        .card {
          background: #F7F5F0;
          border: 1px solid #D4CFC4;
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
        }

        .logo {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 2rem;
          text-decoration: none;
        }
        .logo-text {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 1.5rem;
          font-weight: 400;
          color: #161512;
          letter-spacing: -0.02em;
        }
        .logo-badge {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6E6A63;
          padding-left: 0.5rem;
          border-left: 1px solid #D4CFC4;
        }

        h1 {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 1.75rem;
          font-weight: 400;
          color: #161512;
          letter-spacing: -0.02em;
          margin-bottom: 0.35rem;
        }
        .subtitle {
          font-size: 0.85rem;
          color: #6E6A63;
          margin-bottom: 1.75rem;
        }

        .alert {
          padding: 0.75rem 0.9rem;
          font-size: 0.82rem;
          margin-bottom: 1.2rem;
          line-height: 1.5;
        }
        .alert-error {
          background: #FFF1F0;
          border: 1px solid #FFCCC7;
          color: #CF1322;
        }
        .alert-info {
          background: #E6F7FF;
          border: 1px solid #91D5FF;
          color: #0050B3;
        }

        .field {
          margin-bottom: 1.2rem;
        }
        .field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: #161512;
          margin-bottom: 0.4rem;
        }
        .field input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          background: #F7F5F0;
          border: 1px solid #D4CFC4;
          color: #161512;
          font-size: 0.88rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        .field input::placeholder { color: #9C978D; }
        .field input:focus {
          border-color: #161512;
        }

        .btn-primary {
          width: 100%;
          padding: 0.75rem;
          background: #161512;
          border: 1px solid #161512;
          color: #F7F5F0;
          font-size: 0.85rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 0.5rem;
        }
        .btn-primary:hover:not(:disabled) { background: #2B2824; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider {
          display: flex; align-items: center; gap: 0.75rem;
          margin: 1.5rem 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px;
          background: #D4CFC4;
        }
        .divider span {
          font-size: 0.75rem; color: #9C978D; font-weight: 400;
        }

        .btn-google {
          width: 100%;
          padding: 0.75rem;
          background: #F7F5F0;
          border: 1px solid #D4CFC4;
          color: #161512;
          font-size: 0.85rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.15s, background 0.15s;
        }
        .btn-google:hover:not(:disabled) {
          border-color: #161512;
          background: #EFECE4;
        }
        .btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

        .footer-text {
          margin-top: 1.75rem;
          font-size: 0.82rem;
          color: #6E6A63;
          text-align: center;
        }
        .footer-text a {
          color: #161512;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>

      <div className="auth-root">
        <Suspense fallback={<div className="card text-center text-ink-muted py-12">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </>
  )
}
