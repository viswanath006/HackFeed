"use client"

/**
 * app/signup/page.tsx
 *
 * Student sign-up page — email/password registration + Google OAuth.
 * Grounded in Paper & Ink editorial aesthetic.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/env"

type Step = "form" | "check-inbox"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>("form")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setStep("check-inbox")
        setLoading(false)
      }, 500)
      return
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
      },
    })

    if (authError) {
      if (authError.message.toLowerCase().includes("already registered")) {
        setError("This email is already registered. Try signing in.")
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    setStep("check-inbox")
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
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

        .alert-error {
          padding: 0.75rem 0.9rem;
          font-size: 0.82rem;
          margin-bottom: 1.2rem;
          line-height: 1.5;
          background: #FFF1F0;
          border: 1px solid #FFCCC7;
          color: #CF1322;
        }

        .field { margin-bottom: 1.2rem; }
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
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.82rem;
          color: #6E6A63;
        }
        .footer-text a {
          color: #161512;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Inbox confirmation */
        .inbox-card { text-align: center; }
        .inbox-card h1 {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .inbox-card p {
          font-size: 0.85rem;
          color: #6E6A63;
          line-height: 1.6;
          margin-bottom: 1.75rem;
        }
        .inbox-card .email-highlight {
          color: #161512; font-weight: 600;
        }
        .btn-back {
          display: inline-block;
          padding: 0.65rem 1.5rem;
          border: 1px solid #161512;
          background: #161512;
          color: #F7F5F0;
          font-size: 0.85rem;
          font-weight: 500;
          text-decoration: none;
        }
        .btn-back:hover { background: #2B2824; }
      `}</style>

      <div className="auth-root">
        <div className="card">
          <Link href="/" className="logo">
            <span className="logo-text">HackFeed</span>
            <span className="logo-badge">Bulletin</span>
          </Link>

          {step === "check-inbox" ? (
            <div className="inbox-card">
              <h1>Check your inbox</h1>
              <p>
                We sent an activation link to{" "}
                <span className="email-highlight">{email}</span>.
                <br />
                Confirm your email to complete registration.
              </p>
              <Link href="/login" className="btn-back">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <h1>Join Bulletin</h1>
              <p className="subtitle">Track verified hackathons, internships &amp; deadlines</p>

              {error && <div className="alert-error" role="alert">{error}</div>}

              <form onSubmit={handleSignup} noValidate>
                <div className="field">
                  <label htmlFor="signup-email">Email address</label>
                  <input
                    id="signup-email"
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
                  <label htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-confirm-password">Confirm password</label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>

                <button
                  type="submit"
                  id="signup-submit-btn"
                  className="btn-primary"
                  disabled={loading || googleLoading}
                >
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </form>

              <div className="divider"><span>or</span></div>

              <button
                type="button"
                id="signup-google-btn"
                className="btn-google"
                onClick={handleGoogleSignup}
                disabled={loading || googleLoading}
              >
                {googleLoading ? "Connecting…" : "Sign up with Google"}
              </button>

              <p className="footer-text">
                Already have an account?{" "}
                <Link href="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
