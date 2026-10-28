# Roos StudioX Business OS — Design Specification: "Quiet Instrument, One Flame"

**Author:** Creative Director, Product Designer & Principal Frontend Engineer  
**Date:** October 28, 2026  
**Status:** Approved & Binding Specification  

---

## 1. Design Philosophy: "Quiet Instrument, One Flame"

Roos StudioX Business OS is a high-density, calm, and unmistakably authentic operational environment. It removes visual noise, decorative chrome, repetitive metrics, and rainbow status pills in favor of structured typography, warm paper surfaces, and hairline precision.

### The Test for Every Element
*If removing an element loses no information and no action, remove it.*  
*If an element duplicates something already visible on the same screen, remove it.*

---

## 2. Authoritative Token System

### Surface & Elevation Tokens
- `ink-950`: `#0B0D12` — Primary sidebar background surface
- `ink-850`: `#12151C` — Raised areas in dark shell (active items, dropdowns)
- `ink-700`: `#1B1F29` — Sidebar hover base and quick-create surface
- `on-ink-1`: `#F4F5F7` — High-emphasis dark shell text
- `on-ink-2`: `#A3A9B6` — Medium-emphasis dark shell text & inactive icons
- `on-ink-3`: `#6B7280` — Low-emphasis dark shell text & section eyebrow labels
- `canvas`: `#F6F5F1` — Global application background (warm paper)
- `surface`: `#FFFFFF` — Primary working surfaces, cards, tables, drawers
- `sunken`: `#EFEDE7` — Input backgrounds, table headers, stat wells
- `line`: `#E4E1D8` — Canonical hairline borders (1px solid)
- `line-strong`: `#D2CEC2` — Emphasized separators and active borders

### Content Typography Tokens
- `text-1`: `#12141A` — High-contrast primary text (passes WCAG AAA on canvas/surface)
- `text-2`: `#4B515D` — Supporting secondary body text (passes WCAG AA)
- `text-3`: `#6A707C` — Muted tertiary descriptions, metadata, placeholders

### Flame Accent Tokens ("The One Signal")
- `flame-500`: `#FF5A1F` — The single signal: primary action CTA, active nav bar, critical attention
- `flame-700`: `#C73E0C` — Flame text on light surfaces (WCAG AA accessible)
- `flame-50`: `#FFF1EA` — Subtle attention background highlight for new/updated rows
- `flame-100`: `#FFE0D2` — Focus ring accent and active pill container

### Semantic Feedback Tokens
- `positive`: `#0F7B5A` on `#E6F4EE` — Deals won, verified webhooks, delivered messages
- `warning`: `#A8650A` on `#FBF0DC` — Due soon, pending verification, tier at limit
- `danger`: `#B42318` on `#FDECEA` — Overdue tasks, failed automations, lost deals
- `info`: `#2F55D4` on `#E8EEFD` — Informational callouts and system notes

### Pipeline Stage Ramp (Monochromatic Progression)
1. Lead / Inbound: `#CFC8B8` (Warm sand)
2. Contacted: `#A9B0BF` (Light slate)
3. Qualified: `#6C7690` (Steel gray)
4. Proposal Sent: `#3B4258` (Deep charcoal)
5. Negotiation: `#12141A` (Ink dark)
- **Won**: `#0F7B5A` on `#E6F4EE` (Positive emerald)
- **Lost**: `#B42318` on `#FDECEA` (Subdued danger)

---

## 3. Flame Discipline Rules

Flame is a precision signal, never a theme:
1. **Allowed ONLY for:**
   - The single primary action button on any given screen
   - The active sidebar navigation indicator (3px sliding bar)
   - Focus rings on active keyboard inputs
   - Items genuinely demanding immediate human intervention (unanswered messages, overdue SLAs, failed webhooks)
2. **Strictly Prohibited for:**
   - Hyperlinks (links must be `text-1` or `text-2` with underline on hover)
   - Decorative icon backgrounds, headings, badges, or illustrations
   - Rainbow charts, decorative gradients, glassmorphism, or colored shadows

---

## 4. Typographic Scale (Google Sans Exclusively)

`font-synthesis: none;` is enforced across all stylesheets. Zero bold (> 600 weight), zero italics, zero monospace. Figures enforce `font-variant-numeric: tabular-nums`.

| Token | Size / Line-height | Font Weight | Usage |
| :--- | :--- | :--- | :--- |
| `metric-xl` | 56px / 60px | 500 | **One per screen**, the defining focal metric |
| `display` | 30px / 36px | 500 | Primary page title |
| `metric` | 28px / 32px | 500 | Secondary quantitative figures |
| `title` | 18px / 26px | 500 | Section and module headings |
| `label` | 15px / 22px | 500 | Record names, customer titles, card labels |
| `body` | 14px / 22px | 400 | Primary table rows, message text, form labels |
| `small` | 13px / 20px | 400 | Supporting descriptions, helper text |
| `meta` | 12px / 16px | 400 | Timestamps, secondary metadata |
| `eyebrow` | 11px / 14px (+0.06em) | 500 | Group headers, table column headers, uppercase |

---

## 5. Focal Point & Composition Map per Route

| Route | Primary Focal Point | Primary Action Button | Natural Composition Structure |
| :--- | :--- | :--- | :--- |
| **Overview** | **Needs you now queue** (left 7-col) + **Revenue `metric-xl`** (right 5-col) | New opportunity | Two-band natural layout; zero duplicate counts |
| **Shared Inbox** | **Active conversation thread & pinned composer** | Send message | Viewport-height 3-pane layout (`calc(100vh - 52px)`); quiet bubbles |
| **Sales Pipeline** | **Kanban Opportunity Board** | Add opportunity | Board/table toggle; bottom scrollbar; all 7 stages visible |
| **Contacts** | **Search field & Customer Directory** | Add contact | Search-first table; 40px rows; real 10/page pagination |
| **Broadcasts** | **Recent campaign performance table** | New broadcast | Open metrics line + campaign status and recipient counts |
| **Templates** | **Template catalog cards & phone preview drawer** | New template | Master cards with one-click preview in phone drawer |
| **Automations** | **Human-readable Trigger → Action rules** | New automation | Sentence syntax: "When [Event] → Then [Action]" |
| **Tasks & SLAs** | **Chronological action queue (Overdue / Today)** | Add task | Grouped lists with one-click complete & undo toast |
| **Analytics** | **Primary question chart with one-sentence takeaway** | Export report | Proportional funnel bars + brand-ramp donut chart |
| **Team Roster** | **Active member roster** | Invite member | Open roster with plain-language enterprise roles |
| **WhatsApp API** | **Phone number connection status card** | Test connection | Sectioned settings form; real toggle switches; 760px column |
| **AI Engine** | **Grounding model & prompt instructions** | Save configuration | Model selector, temperature slider, sticky save bar |
| **Integrations** | **Designed restricted-access state** | Request access | Clear routing mismatch notice and access gate |
| **Subscription** | **Current plan limits utilization bar** | Upgrade tier | Plain-language quota progress: "4 of 5 used (At limit)" |
| **Organisation** | **Organization workspace profile form** | Save profile | Centered 760px single-column settings form |

---

## 6. Motion & Delight Engineering

- **Durations**:
  - Micro-interactions, hover, and press: 120ms to 180ms
  - Popovers, menus, and state changes: 180ms to 200ms
  - Drawers, sidebar expansion, and route transitions: 280ms to 320ms
- **Curves**:
  - Entrance: `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)`
  - Press / Micro-interaction: `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring)
- **Delight Budget**:
  1. Sliding sidebar indicator & icon state shift
  2. Tabular count-up numbers (700-900ms ease-out) and rolling digits on live update
  3. Queue rows that collapse satisfyingly when resolved, ticking counter down
  4. Drag-and-drop opportunity cards with settle animation and Won celebration toast
  5. In-place quick replies without leaving the Overview screen
  6. Keyboard navigation: `G` shortcuts (`G O`, `G I`, `G P`, `G C`, `G T`), `⌘K` palette, `J`/`K` navigation
  7. Optimistic updates with honest rollback and undo toast
