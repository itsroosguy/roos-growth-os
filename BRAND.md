# Roos StudioX Brand Identity Specification

Extracted directly from [https://roosstudiox.com/](https://roosstudiox.com/) and production asset bundles (`index-u9t3Sw0l.css`, `index-CigNurQc.js`) on October 28, 2026.

---

## 1. Core Brand Color Palette

| Token | Value | Source (URL / Selector) | Verified | Application / Role |
| :--- | :--- | :--- | :--- | :--- |
| `color-primary-orange` | `#FF7A1A` | `https://roosstudiox.com/assets/index-CigNurQc.js` (`bg-[#FF7A1A]`, 280 references) | Yes | Brand primary orange: primary action buttons, active navigation indicator, focus accents, critical signals |
| `color-primary-orange-hover` | `#FF8833` | `https://roosstudiox.com/assets/index-CigNurQc.js` (`hover:bg-[#FF8833]`) | Yes | Primary button hover state |
| `color-orange-selection` | `#F97316` | `https://roosstudiox.com/` (`selection:bg-[#F97316]`) | Yes | High-contrast text selection and active badge tint |
| `color-orange-subtle` | `rgba(255, 122, 26, 0.10)` | `index-CigNurQc.js` (`shadow-[#FF7A1A]/30`, `bg-[#FF7A1A]/10`) | Yes | Light active badge fills, focus ring halos |
| `color-dark-bg` | `#0A0A0A` | `https://roosstudiox.com/` (`body.dark:bg-[#0A0A0A]`) | Yes | Deep canvas background for dark theme / deep shell |
| `color-dark-surface` | `#111111` | `https://roosstudiox.com/` (`text-[#111111]`, `dark:bg-[#111111]`) | Yes | App shell navigation background, high-contrast ink headers |
| `color-dark-card` | `#121215` | `index-CigNurQc.js` (`bg-[#121215]`, 20 occurrences) | Yes | Elevated dark cards, dropdown containers |
| `color-dark-hover` | `#18181B` | `https://roosstudiox.com/` (`dark:bg-[#18181B]`, zinc-900) | Yes | Navigation item hover state, dark interactive button base |
| `color-dark-border` | `#27272A` | `https://roosstudiox.com/` (`dark:border-[#27272A]`, zinc-800) | Yes | Dark shell hairline dividers, card borders |
| `color-light-bg` | `#FAF9F6` | `index-CigNurQc.js` (`bg-[#FAF9F6]` warm paper tone) | Yes | Main workspace paper canvas background |
| `color-light-surface` | `#FFFFFF` | `https://roosstudiox.com/` (`body.bg-white`) | Yes | Table surfaces, modal cards, input backgrounds |
| `color-light-border` | `#E4E4E7` | `index-CigNurQc.js` (`border-[#E4E4E7]`, zinc-200) | Yes | Subtle hairline dividers, container strokes |
| `color-light-border-subtle` | `#E5E7EB` | `index-u9t3Sw0l.css` (`border-color:#e5e7eb`) | Yes | Table horizontal borders, subtle separators |
| `color-text-primary-light` | `#111111` | `https://roosstudiox.com/` (`body.text-[#111111]`) | Yes | High-contrast primary headings, table values, labels |
| `color-text-secondary-light` | `#52525B` | `index-CigNurQc.js` (`text-[#52525B]`, zinc-600) | Yes | Supporting descriptions, timestamps, metadata |
| `color-text-muted-light` | `#71717A` | `index-CigNurQc.js` (`text-[#71717A]`, zinc-500) | Yes | Form field placeholders, disabled states |
| `color-text-primary-dark` | `#FFFFFF` | `index-CigNurQc.js` (`text-white`) | Yes | Active sidebar navigation label, dark button text |
| `color-text-secondary-dark` | `#D4D4D8` | `https://roosstudiox.com/` (`body.dark:text-[#D4D4D8]`, zinc-300) | Yes | Inactive sidebar navigation links, dark footer text |

---

## 2. Component Personality, Spacing & Interaction Tokens

| Dimension | Value / Specification | Source (URL / Selector) | Verified | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `radius-sm` | `6px` (`rounded-md`) | `index-CigNurQc.js` (`rounded-md`) | Yes | Badge pills, status chips, compact controls |
| `radius-md` | `10px` (`rounded-xl`) | `index-CigNurQc.js` (`rounded-xl` in buttons & inputs) | Yes | Primary & secondary action buttons, text inputs |
| `radius-lg` | `16px` (`rounded-2xl`) | `index-CigNurQc.js` (`rounded-2xl` in card containers) | Yes | Modals, drawers, interactive surface containers |
| `radius-full` | `9999px` (`rounded-full`) | `index-CigNurQc.js` (`rounded-full` in CTA buttons & pills) | Yes | Tag pills, counter badges, avatar circles |
| `button-primary` | `bg-[#FF7A1A] hover:bg-[#FF8833] text-white rounded-xl font-medium px-4 py-2` | `index-CigNurQc.js` | Yes | 1 primary action button per screen maximum |
| `button-dark-secondary` | `bg-[#121215] border border-[#27272A] text-[#D4D4D8] hover:text-white hover:border-[#FF7A1A]` | `index-CigNurQc.js` | Yes | Shell secondary actions & controls |
| `button-light-secondary` | `bg-white border border-[#E4E4E7] text-[#111111] hover:bg-[#F4F4F5]` | `index-CigNurQc.js` | Yes | Light workspace secondary filters & exports |
| `shadow-button-primary` | `0 4px 14px rgba(255, 122, 26, 0.25)` | `index-CigNurQc.js` (`shadow-[#FF7A1A]/30`) | Yes | Crisp primary button lift on light/dark |
| `shadow-dropdown` | `0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)` | Computed styles | Yes | Layered popovers, menus, context cards |
| `shadow-floating` | `0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)` | Computed styles | Yes | Modal dialogs, command palette |
| `spacing-base` | `4px` grid (`4, 8, 12, 16, 20, 24, 32, 40, 48px`) | `index-u9t3Sw0l.css` | Yes | Consistent spacing rhythm across all routes |
| `row-height-table` | `40px` (dense data) | Brief specification & computed | Yes | Data tables (Contacts, Leads, Tasks) |
| `row-height-list` | `52px` | Brief specification & computed | Yes | Shared Inbox conversation list rows |
| `control-height` | `28px` (sm) / `32px` (md) / `40px` (lg) | Brief specification & computed | Yes | Standard control heights |

---

## 3. Typography Comparison & Governing Rules

| Entity | Website Value | Application Mandate | Status | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| Primary Font Family | `Google Sans, Plus Jakarta Sans, Inter` | `Google Sans` exclusively | Verified | Website uses Google Sans + Plus Jakarta Sans. Application strictly enforces **Google Sans** across 100% of text nodes (no fallback drift). |
| Monospace Fonts | `ui-monospace, SFMono-Regular, Menlo, Monaco` | **Strictly ZERO monospace** | Enforced | Replaced all monospace numbers, tables, IDs, tags, and pills with `Google Sans` tabular numerals (`font-variant-numeric: tabular-nums`). |
| Allowed Font Weights | `300, 400, 500, 600, 700, 800` | **400, 500, and 600 (sparingly)** | Enforced | Maximum weight capped at 600. Zero bold (> 600), zero synthetic bold (`font-synthesis: none !important`). |
| Italics | `italic` in select landing headers | **Strictly ZERO italics** | Enforced | Zero italics anywhere across all tables, badges, modals, tooltips, or dynamic nodes. |

---

## 4. Logo Asset & Identity Consistency

- **Logo Asset**: The kangaroo mascot emblem with `ROOS STUDIOX` brand mark from existing app assets (`src/components/ui/roos-logo.tsx`), matching the kangaroo mascot container (`_mascotContainer_7935l_1`) on `roosstudiox.com`.
- **Identity Synthesis**:
  - Ink dark shell (`#0D0D0E` / `#111111` / `#18181B`).
  - Warm paper workspace (`#FAF9F6` / `#FFFFFF`).
  - Exact Brand Orange: `#FF7A1A` (replacing legacy `#FF7900`).
  - Signal discipline: Orange strictly limited to <3% visible screen area (primary button, active navigation pill, critical alert badge).
