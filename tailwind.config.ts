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
        sm: "4px",
        md: "8px",
        lg: "12px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)",
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
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 250ms ease-out",
        "slide-out-right": "slide-out-right 250ms ease-in",
        "fade-in": "fade-in 150ms ease",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
