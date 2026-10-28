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
        // App canvas & surface system
        canvas: "#F6F5F1",       // Warm paper canvas
        surface: {
          DEFAULT: "#FFFFFF",    // Working surface
          subtle: "#F6F5F1",
          muted: "#EFEDE7",      // Sunken well / input bg
          hover: "#F4F3EE",
          card: "#FFFFFF",
        },
        sunken: "#EFEDE7",       // Inputs, table headers, stat wells
        line: {
          DEFAULT: "#E4E1D8",    // Hairline border
          strong: "#D2CEC2",     // Emphasized line
          subtle: "#EDEAE1",
        },
        border: {
          DEFAULT: "#E4E1D8",
          strong: "#D2CEC2",
          subtle: "#EDEAE1",
          focus: "#FF5A1F",
        },

        // Dark App Shell (Sidebar & Shell Chrome)
        ink: {
          950: "#0B0D12",        // Sidebar surface
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
        "text-2": "#4B515D",     // Secondary text (AA)
        "text-3": "#6A707C",     // Muted tertiary / metadata

        // Flame Accent ("The One Signal")
        flame: {
          500: "#FF5A1F",        // Primary action, active nav, critical attention
          700: "#C73E0C",        // Flame text on light surfaces (AA)
          50: "#FFF1EA",         // Soft attention highlight
          100: "#FFE0D2",        // Subtle selection / focus tint
          hover: "#FF6D38",
        },
        // Alias for roos brand compatibility
        roos: {
          orange: "#FF5A1F",
          hover: "#FF6D38",
          light: "#FFE0D2",
          subtle: "#FFF1EA",
        },

        // Semantic Feedback Tokens
        positive: {
          DEFAULT: "#0F7B5A",
          bg: "#E6F4EE",
        },
        warning: {
          DEFAULT: "#A8650A",
          bg: "#FBF0DC",
        },
        danger: {
          DEFAULT: "#B42318",
          bg: "#FDECEA",
        },
        info: {
          DEFAULT: "#2F55D4",
          bg: "#E8EEFD",
        },

        // Monochromatic Pipeline Stage Ramp
        stage: {
          1: "#CFC8B8",          // Lead / Inbound (warm sand)
          2: "#A9B0BF",          // Contacted (light slate)
          3: "#6C7690",          // Qualified (steel gray)
          4: "#3B4258",          // Proposal Sent (deep charcoal)
          5: "#12141A",          // Negotiation (ink dark)
          won: "#0F7B5A",
          lost: "#B42318",
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
        "metric-xl": ["56px", { lineHeight: "60px", fontWeight: "500", letterSpacing: "-0.03em" }],
        display: ["30px", { lineHeight: "36px", fontWeight: "500", letterSpacing: "-0.02em" }],
        metric: ["28px", { lineHeight: "32px", fontWeight: "500", letterSpacing: "-0.02em" }],
        title: ["18px", { lineHeight: "26px", fontWeight: "500", letterSpacing: "-0.015em" }],
        label: ["15px", { lineHeight: "22px", fontWeight: "500", letterSpacing: "-0.01em" }],
        body: ["14px", { lineHeight: "22px", fontWeight: "400", letterSpacing: "-0.005em" }],
        small: ["13px", { lineHeight: "20px", fontWeight: "400", letterSpacing: "0em" }],
        meta: ["12px", { lineHeight: "16px", fontWeight: "400", letterSpacing: "0em" }],
        eyebrow: ["11px", { lineHeight: "14px", fontWeight: "500", letterSpacing: "0.06em" }],
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
        control: "8px",
        container: "14px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
        full: "9999px",
      },
      maxWidth: {
        data: "1680px",
        settings: "760px",
      },
      boxShadow: {
        none: "none",
        hairline: "0 1px 2px 0 rgba(11, 13, 18, 0.03)",
        card: "0 1px 3px 0 rgba(11, 13, 18, 0.04)",
        overlay: "0 12px 32px -8px rgba(11, 13, 18, 0.18)",
        dropdown: "0 8px 24px -4px rgba(11, 13, 18, 0.14)",
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
