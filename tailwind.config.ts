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
        background: "#FAF9F6",
        canvas: "#FAF9F6",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F4F4F5",
          muted: "#F7F7F8",
          hover: "#F1F1F4",
          card: "#FFFFFF",
        },
        roos: {
          orange: "#FF7A1A",      // True brand orange from roosstudiox.com
          hover: "#FF8833",       // Interactive hover state
          light: "#FFA055",
          dark: "#E66500",
          subtle: "rgba(255, 122, 26, 0.10)",
          border: "rgba(255, 122, 26, 0.25)",
        },
        ink: {
          950: "#0A0A0B",
          900: "#0D0D0E",         // Primary dark sidebar shell
          800: "#121215",
          700: "#18181B",
          600: "#27272A",
          500: "#3F3F46",
        },
        dark: {
          bg: "#0D0D0E",
          card: "#121215",
          elevated: "#18181B",
          hover: "#202024",
          border: "#1F1F24",
          muted: "#27272A",
          text: "#F4F4F5",
        },
        foreground: {
          DEFAULT: "#0D0D0E",
          secondary: "#525866",
          muted: "#717680",
        },
        border: {
          DEFAULT: "#E4E4E7",
          subtle: "#F0F0F3",
          strong: "#D4D4D8",
          hairline: "#E4E4E7",
          focus: "#FF7A1A",
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
        display: ["28px", { lineHeight: "34px", fontWeight: "500", letterSpacing: "-0.02em" }],
        title: ["18px", { lineHeight: "26px", fontWeight: "500", letterSpacing: "-0.015em" }],
        metric: ["32px", { lineHeight: "36px", fontWeight: "500", letterSpacing: "-0.02em" }],
        "label-lg": ["15px", { lineHeight: "22px", fontWeight: "500", letterSpacing: "-0.01em" }],
        body: ["14px", { lineHeight: "22px", fontWeight: "400", letterSpacing: "-0.005em" }],
        "body-sm": ["13px", { lineHeight: "20px", fontWeight: "400", letterSpacing: "0em" }],
        meta: ["12px", { lineHeight: "16px", fontWeight: "400", letterSpacing: "0em" }],
        eyebrow: ["11px", { lineHeight: "14px", fontWeight: "500", letterSpacing: "0.06em" }],
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
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
        full: "9999px",
      },
      maxWidth: {
        data: "1680px",
        settings: "880px",
      },
      boxShadow: {
        none: "none",
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        xs: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        sm: "0 2px 4px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        dropdown: "0 8px 20px -4px rgba(0, 0, 0, 0.08)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)",
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)", // Emil Kowalski deceleration curve for entrances
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Emil Kowalski physics-based spring curve for clicks & micro-interactions
      },
      transitionDuration: {
        120: "120ms",
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
