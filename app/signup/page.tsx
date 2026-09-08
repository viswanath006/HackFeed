"use client"

/**
 * app/signup/page.tsx
 *
 * Student sign-up page — email/password registration + Google OAuth.
 * Zero-emoji developer aesthetic with clean SVGs and modern typography.
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
      setError("Google OAuth requires live Supabase credentials in .env.local. You can test registration using email & password.")
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
          background: #090a0f;
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
          top: -20%;
          right: 50%;
          transform: translateX(50%);
          width: 60%;
          height: 50%;
          background: radial-gradient(ellipse, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .card {
          background: #12141c;
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border-radius: 1rem;
          padding: 2.25rem;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.8rem;
          text-decoration: none;
        }
        .logo-icon {
          width: 28px; height: 28px;
          background: #4f46e5;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text {
          font-family: var(--font-display), sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        h1 {
          font-family: var(--font-display), sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 0.35rem;
        }
        .subtitle {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 1.5rem;
        }

        .alert-error {
          padding: 0.75rem 0.9rem;
          border-radius: 0.65rem;
          font-size: 0.82rem;
          margin-bottom: 1.2rem;
          line-height: 1.5;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5;
        }

        .field { margin-bottom: 1rem; }
        .field label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(255,255,255,0.7);
          margin-bottom: 0.4rem;
        }
        .field input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          color: #fff;
          font-size: 0.88rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        .field input::placeholder { color: rgba(255,255,255,0.3); }
        .field input:focus {
          border-color: rgba(99, 102, 241, 0.6);
        }

        .btn-primary {
          width: 100%;
          padding: 0.65rem;
          background: #4f46e5;
          border: none;
          border-radius: 0.5rem;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 0.25rem;
        }
        .btn-primary:hover:not(:disabled) { background: #4338ca; }
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
          font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 500;
        }

        .btn-google {
          width: 100%;
          padding: 0.65rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          color: rgba(255,255,255,0.85);
          font-size: 0.85rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-google:hover:not(:disabled) {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
        }
        .btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

        .google-icon { width: 16px; height: 16px; flex-shrink: 0; }

        .footer-text {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.45);
        }
        .footer-text a {
          color: #818cf8; text-decoration: none; font-weight: 500;
        }
        .footer-text a:hover { text-decoration: underline; }

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

        /* Inbox confirmation */
        .inbox-card { text-align: center; }
        .inbox-icon {
          width: 48px; height: 48px;
          background: rgba(124, 58, 237, 0.15);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.2rem;
          color: #a78bfa;
        }
        .inbox-card h1 { font-size: 1.35rem; margin-bottom: 0.5rem; }
        .inbox-card p {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.45);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .inbox-card .email-highlight {
          color: #a5b4fc; font-weight: 600;
        }
        .btn-back {
          display: inline-block;
          padding: 0.6rem 1.25rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.6rem;
          color: rgba(255,255,255,0.8);
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
        }
        .btn-back:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      <div className="auth-root">
        <div className="card">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="logo-text">HackFeed</span>
          </Link>

          {step === "check-inbox" ? (
            <div className="inbox-card">
              <div className="inbox-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
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
              <h1>Create account</h1>
              <p className="subtitle">Join HackFeed — developer opportunity aggregator</p>

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
                  {loading && <span className="spinner" aria-hidden="true" />}
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
