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
        // App canvas & surface system (Warm Paper Canvas & Pure Whites)
        canvas: "#F7F5F0",       // 2027 Warm paper canvas
        surface: {
          DEFAULT: "#FFFFFF",    // Working surface
          subtle: "#F7F5F0",
          muted: "#EFEDE7",      // Sunken well / input bg
          hover: "#F5F3ED",
          card: "#FFFFFF",
        },
        sunken: "#EFEDE7",       // Inputs, table headers, stat wells
        line: {
          DEFAULT: "#E6E2D8",    // Hairline border
          strong: "#D2CEC2",     // Emphasized line
          subtle: "#EDEAE1",
        },
        border: {
          DEFAULT: "#E6E2D8",
          strong: "#D2CEC2",
          subtle: "#EDEAE1",
          focus: "#FF5A1F",
        },

        // Dark App Shell (Floating Inset Sidebar & Hero Surfaces)
        ink: {
          950: "#0B0D12",        // Floating Sidebar surface & Hero Dark
          850: "#12151C",        // Sidebar raised / dropdowns
          700: "#1B1F29",        // Sidebar hover / active base
          600: "#242A38",
          500: "#373E50",
        },
        "on-ink": {
          1: "#F4F5F7",          // High-contrast shell text
          2: "#A3A9B6",          // Muted shell text / idle icons
          3: "#6B7280",          // Eyebrow / low-contrast labels
        },

        // Content Typography Tokens
        "text-1": "#12141A",     // Primary text (AAA on canvas/surface)
        "text-2": "#454B57",     // Secondary text (AA)
        "text-3": "#666C78",     // Muted tertiary / metadata

        // =========================================================================
        // 2027 MEANINGFUL COLOR SYSTEM: "COLOR IS MEANING"
        // =========================================================================
        flame: {
          500: "#FF5A1F",        // Brand, primary action, NEEDS ATTENTION NOW
          600: "#E8470F",
          text: "#B93A0A",       // WCAG AA on tint
          tint: "#FFF1EA",
          100: "#FFE2D4",
          hover: "#FF6D38",
        },
        ultramarine: {
          500: "#3D5AFE",        // Conversations, messaging, communication
          600: "#2F46D6",
          text: "#2A3DB5",       // WCAG AA on tint
          tint: "#EAEEFF",
        },
        emerald: {
          500: "#12B886",        // Revenue, won, growth, healthy
          600: "#0E9F6E",
          text: "#0A7A53",       // WCAG AA on tint
          tint: "#E4F7EF",
        },
        amber: {
          500: "#F5A524",        // Time: follow-ups, SLAs, due soon, waiting
          600: "#D98A0B",
          text: "#8F5300",       // WCAG AA on tint
          tint: "#FFF3D6",
        },
        sky: {
          500: "#1FA2E8",        // People: contacts, team
          600: "#0B84C6",
          text: "#0A6AA3",       // WCAG AA on tint
          tint: "#E3F3FD",
        },
        violet: {
          500: "#7C4DFF",        // Campaigns, templates, AI
          600: "#6538E8",
          text: "#5B34C9",       // WCAG AA on tint
          tint: "#F0EAFF",
        },
        rose: {
          500: "#E5484D",        // Danger, overdue, failed, lost
          600: "#CF2F36",
          text: "#B42336",       // WCAG AA on tint
          tint: "#FFE9EA",
        },

        // Stage categorical scale
        stage: {
          inbound: "#94A3B8",    // Inbound (slate)
          contacted: "#1FA2E8",  // Contacted (sky)
          qualified: "#3D5AFE",  // Qualified (ultramarine)
          proposal: "#F5A524",   // Proposal (amber)
          won: "#12B886",        // Won (emerald)
          lost: "#E5484D",       // Lost (rose)
        },

        // Backward compatibility aliases
        roos: {
          orange: "#FF5A1F",
          hover: "#FF6D38",
          light: "#FFE2D4",
          subtle: "#FFF1EA",
        },
        positive: {
          DEFAULT: "#12B886",
          bg: "#E4F7EF",
        },
        warning: {
          DEFAULT: "#F5A524",
          bg: "#FFF3D6",
        },
        danger: {
          DEFAULT: "#E5484D",
          bg: "#FFE9EA",
        },
        info: {
          DEFAULT: "#3D5AFE",
          bg: "#EAEEFF",
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
        // ZERO MONOSPACE: Map monospace classes to Google Sans with tabular figures
        mono: [
          '"Google Sans"',
          '"Google Sans Text"',
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        "hero-metric": ["5rem", { lineHeight: "1", fontWeight: "500", letterSpacing: "-0.02em" }],
        "metric-xl": ["3.5rem", { lineHeight: "3.75rem", fontWeight: "500", letterSpacing: "-0.025em" }],
        display: ["2.25rem", { lineHeight: "1.15", fontWeight: "500", letterSpacing: "-0.02em" }],
        metric: ["2rem", { lineHeight: "1.1", fontWeight: "500", letterSpacing: "-0.02em" }],
        title: ["1.25rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "-0.015em" }],
        "label-lg": ["1.0625rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "-0.01em" }],
        label: ["1.0625rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "-0.01em" }],
        body: ["1rem", { lineHeight: "1.5", fontWeight: "400", letterSpacing: "-0.005em" }],
        small: ["0.875rem", { lineHeight: "1.45", fontWeight: "400", letterSpacing: "0em" }],
        meta: ["0.8125rem", { lineHeight: "1.35", fontWeight: "400", letterSpacing: "0em" }],
        eyebrow: ["0.8125rem", { lineHeight: "1.2", fontWeight: "500", letterSpacing: "0.06em" }],
        xs: ["13px", { lineHeight: "1.25rem" }],
        sm: ["14px", { lineHeight: "1.375rem" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "600",      // Strictly capped at 600 - bold (>600) never permitted
        extrabold: "600",
        black: "600",
      },
      borderRadius: {
        control: "12px",
        card: "20px",
        panel: "20px",
        hero: "28px",
        drawer: "28px",
        container: "20px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
        full: "9999px",
      },
      maxWidth: {
        data: "1680px",
        settings: "760px",
      },
      boxShadow: {
        none: "none",
        hairline: "0 1px 2px 0 rgba(11, 13, 18, 0.03)",
        // 2027 Two-layer soft card shadow
        card: "0 1px 2px rgba(11,13,18,.04), 0 8px 24px -12px rgba(11,13,18,.12)",
        // Hero card elevation
        hero: "0 2px 4px rgba(11,13,18,.04), 0 16px 32px -16px rgba(11,13,18,.16)",
        overlay: "0 20px 48px -12px rgba(11, 13, 18, 0.22)",
        dropdown: "0 12px 32px -4px rgba(11, 13, 18, 0.16)",
        sidebar: "0 12px 36px -8px rgba(11, 13, 18, 0.35)",
        "flame-glow": "0 0 24px -4px rgba(255, 90, 31, 0.25)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)",
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)", // Emil Kowalski deceleration
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Emil Kowalski spring micro-interaction
        enter: "cubic-bezier(0.2, 0, 0, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
      },
      transitionDuration: {
        120: "120ms",
        140: "140ms",
        160: "160ms",
        180: "180ms",
        200: "200ms",
        220: "220ms",
        320: "320ms",
      },
    },
  },
  plugins: [],
};

export default config;
