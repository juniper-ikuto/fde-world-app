import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#FAFAFA",
          secondary: "#F4F4F5",
          elevated: "#FFFFFF",
        },
        text: {
          primary: "#09090B",
          secondary: "#71717A",
          tertiary: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          light: "#EEF2FF",
        },
        border: {
          DEFAULT: "#E4E4E7",
          hover: "#D4D4D8",
        },
        success: "#10B981",
        warning: "#F59E0B",
        destructive: "#EF4444",
        seed: {
          bg: "#FEF3C7",
          text: "#B45309",
        },
        "series-a": {
          bg: "#DBEAFE",
          text: "#1D4ED8",
        },
        "series-b": {
          bg: "#EDE9FE",
          text: "#6D28D9",
        },
        "series-c": {
          bg: "#D1FAE5",
          text: "#047857",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
        "5xl": ["48px", { lineHeight: "52px" }],
      },
      letterSpacing: {
        heading: "-0.025em",
        caps: "0.05em",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)",
        glow: "0 0 0 1px rgba(79,70,229,0.2), 0 16px 40px rgba(79,70,229,0.12)",
        lift: "0 8px 25px rgba(79,70,229,0.35)",
      },
      maxWidth: {
        container: "1200px",
        content: "720px",
      },
      spacing: {
        4.5: "18px",
        13: "52px",
        15: "60px",
        18: "72px",
        22: "88px",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float-a": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%":     { transform: "translate(60px,-40px) scale(1.08)" },
          "66%":     { transform: "translate(-30px,30px) scale(0.95)" },
        },
        "float-b": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "40%":     { transform: "translate(-80px,50px) scale(1.1)" },
          "70%":     { transform: "translate(40px,-20px) scale(0.92)" },
        },
        "float-c": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%":     { transform: "translate(50px,70px) scale(1.05)" },
        },
      },
      animation: {
        "pulse-dot":      "pulse-dot 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 250ms ease-out",
        "slide-out-right":"slide-out-right 250ms ease-in",
        "fade-in":        "fade-in 150ms ease",
        shimmer:          "shimmer 2s linear infinite",
        "float-a":        "float-a 16s ease-in-out infinite",
        "float-b":        "float-b 20s ease-in-out infinite",
        "float-c":        "float-c 24s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
