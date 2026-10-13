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
        background: "#F8FAFC",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F1F5F9",
          muted: "#F8FAFC",
          hover: "#F1F5F9",
          blue: "rgba(37, 99, 235, 0.08)",
          emerald: "rgba(16, 185, 129, 0.10)",
          amber: "rgba(245, 158, 11, 0.10)",
          rose: "rgba(239, 68, 68, 0.10)",
          purple: "rgba(139, 92, 246, 0.10)",
        },
        roos: {
          orange: "#FF7A1A",
          hover: "#FF8833",
          light: "#FB923C",
          dark: "#EA580C",
          subtle: "rgba(255, 122, 26, 0.12)",
          glow: "rgba(255, 122, 26, 0.30)",
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
          '"Plus Jakarta Sans"',
          '"Google Sans"',
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
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
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        dropdown: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        floating: "0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        blue: "0 4px 14px 0 rgba(37, 99, 235, 0.25)",
        orange: "0 4px 14px 0 rgba(255, 122, 26, 0.25)",
        glass: "0 10px 35px -5px rgba(15, 23, 42, 0.05), 0 2px 6px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
        "glass-panel": "0 12px 40px -10px rgba(15, 23, 42, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.02), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)",
        "glass-dock": "0 14px 44px -8px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
      },
    },
  },
  plugins: [],
};

export default config;
