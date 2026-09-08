import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        display: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        "display-hero": ["3.5rem", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "display-md": ["1.875rem", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "display-sm": ["1.375rem", { lineHeight: "1.35", letterSpacing: "-0.015em" }],
        "numeral-xl": ["2.25rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "numeral-lg": ["1.75rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
      },
      colors: {
        paper: {
          DEFAULT: "var(--color-paper)",
          muted: "var(--color-paper-muted)",
          subtle: "var(--color-paper-subtle)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
          faint: "var(--color-ink-faint)",
        },
        signal: {
          DEFAULT: "var(--color-signal)",
          hover: "var(--color-signal-hover)",
          faint: "var(--color-signal-faint)",
        },
        forest: {
          DEFAULT: "var(--color-forest)",
          light: "var(--color-forest-light)",
          faint: "var(--color-forest-faint)",
        },
        hairline: {
          DEFAULT: "var(--color-border)",
          dark: "var(--color-border-dark)",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}
export default config
