import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F7F8",
        canvas: "#F7F7F8",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F4F4F6",
          muted: "#F7F7F8",
          hover: "#F1F1F4",
          card: "#FFFFFF",
        },
        roos: {
          orange: "#FF7900",
          hover: "#E66D00",
          light: "#FF9433",
          dark: "#CC6000",
          subtle: "rgba(255, 121, 0, 0.12)",
          border: "rgba(255, 121, 0, 0.25)",
          glow: "rgba(255, 121, 0, 0.35)",
        },
        dark: {
          bg: "#0D0D0E",
          card: "#121214",
          elevated: "#161619",
          hover: "#18181C",
          border: "#1F1F23",
          muted: "#27272A",
          text: "#F4F4F5",
        },
        foreground: {
          DEFAULT: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
        google: {
          blue: {
            DEFAULT: "#2563EB", // Confident Interaction Blue
            hover: "#1D4ED8",
            subtle: "rgba(37, 99, 235, 0.08)",
          },
          green: {
            DEFAULT: "#10B981", // Teal / Emerald Positive
            hover: "#059669",
            subtle: "rgba(16, 185, 129, 0.10)",
          },
          yellow: {
            DEFAULT: "#F59E0B", // Amber Attention
            hover: "#D97706",
            subtle: "rgba(245, 158, 11, 0.10)",
          },
          red: {
            DEFAULT: "#EF4444", // Coral / Red Destructive
            hover: "#DC2626",
            subtle: "rgba(239, 68, 68, 0.10)",
          },
          purple: {
            DEFAULT: "#8B5CF6", // Purple Insights / AI
            hover: "#7C3AED",
            subtle: "rgba(139, 92, 246, 0.10)",
          },
        },
        border: {
          DEFAULT: "#E2E8F0",
          subtle: "#F1F5F9",
          strong: "#CBD5E1",
          focus: "#2563EB",
        },
      },
      fontFamily: {
        sans: [
          '"Google Sans"',
          '"Google Sans Text"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        display: [
          '"Google Sans"',
          '"Google Sans Display"',
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "600",      // Strictly capped at 600 - bold (>600) never permitted
        extrabold: "600", // Strictly capped at 600 - bold (>600) never permitted
        black: "600",     // Strictly capped at 600 - bold (>600) never permitted
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
        "3xl": "26px",
        full: "9999px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        dropdown: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        floating: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)",
        blue: "0 4px 14px 0 rgba(37, 99, 235, 0.20)",
        orange: "0 4px 14px 0 rgba(255, 122, 26, 0.20)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)",
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)", // Emil Kowalski deceleration curve for entrances
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Emil Kowalski physics-based spring curve for clicks & micro-interactions
      },
      transitionDuration: {
        140: "140ms",
        160: "160ms",
        180: "180ms",
        200: "200ms",
        220: "220ms",
        fast: "140ms",
        base: "180ms",
        smooth: "220ms",
      },
    },
  },
  plugins: [],
};

export default config;
