import type { Config } from "tailwindcss"

const config: Config = {
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
          DEFAULT: "#F7F5F0",
          muted: "#EFECE4",
          subtle: "#E8E4D9",
        },
        ink: {
          DEFAULT: "#161512",
          muted: "#6E6A63",
          faint: "#9C978D",
        },
        signal: {
          DEFAULT: "#FF4B1F",
          hover: "#E03E15",
          faint: "#FFF2EE",
        },
        forest: {
          DEFAULT: "#1B4332",
          light: "#2D6A4F",
          faint: "#EFF6F2",
        },
        hairline: {
          DEFAULT: "#D4CFC4",
          dark: "#B8B1A2",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}
export default config
