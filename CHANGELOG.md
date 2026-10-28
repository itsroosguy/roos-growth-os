# Changelog — Roos StudioX Business OS "Quiet Instrument, One Flame" Full UI Reset

All notable architectural, visual, and experiential changes to the Roos StudioX CRM & WhatsApp Business Operating System are documented in this file.

---

## [Phase 10] — 2026-10-28
### Verified DOM Typography Audit & Visual After-Captures (`67d173b`)
- Captured all 90 after-screenshots across 15 routes and 6 viewports (`2560`, `1440`, `1280`, `1024`, `768`, `390`) in `screenshots/after/`.
- Executed headless Chrome CDP DOM inspection across all 15 routes: 0 typographic violations, 0 non-Google Sans fonts, max weight ≤ 600 verified, zero italics verified, zero monospace verified, orange pixel area strictly below 3% (0.00% across 13 routes, max 1.51%).
- 144 of 144 unit and integration tests passing. 0 TypeScript compiler errors.

## [Phase 9] — 2026-10-28
### Emil Kowalski Motion Physics & Interaction Delight (`f9f3192`)
- Applied GPU-accelerated horizontal slide-over translation (`translate3d(100%, 0, 0)` → `translate3d(0, 0, 0)`) for slide-over drawers with `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo).
- Standardized hover/press micro-interactions to 120ms–140ms with `cubic-bezier(0.34, 1.56, 0.64, 1)` spring curves.
- Enforced universal `@media (prefers-reduced-motion: reduce)` accessibility fallback across all elements.
- Scanned all 100 source files: verified 0 layout-thrashing properties (`width`, `height`, `top`, `left`, `margin`, `padding`).

## [Phase 8] — 2026-10-28
### Complete Rebuild of All Remaining Routes & Auth Screens (`b7bd691`)
- **Contacts**: Rebuilt to dense search-first table with opt-in status filters, 40px rows, real 10/page pagination, and slide-over preview Drawer.
- **Templates**: Rebuilt catalog with simulated smartphone preview Drawer, variable chips, and submission states.
- **Automations**: Replaced raw IDs with natural human-readable "When [Event] → If [Conditions] → Then [Action]" rule chains.
- **Tasks & SLAs**: Grouped action queue into Overdue / Today / Upcoming with one-click completion checkbox and 5-second undo toast.
- **Reports & Analytics**: Rebuilt to single-question charts with one-sentence takeaways, proportional funnel bars, and brand-ramp donut.
- **Subscription**: Cleaned tier capacity progress bar, replaced "Exceeded" text with clear "At limit" badge language.
- **Settings / Admin**: Displayed designed `RestrictedState` explaining `/settings/admin` system operator console and clarifying the Integrations routing mismatch.
- **Auth & Onboarding (Login, Signup, Select Org, Invites)**: Purged all monospace fonts and non-standard colors.

## [Phase 7] — 2026-10-28
### Sales Pipeline Kanban & Table Modernization (`b806b0a`)
- Built Board / Table view toggle with sticky viewport-bottom horizontal scrollbar.
- Implemented 6 visible stages with monochromatic progression ramp (Lead, Contacted, Qualified, Proposal Sent, Negotiation, Closed Lost).
- Added HTML5 drag-and-drop between pipeline stages with Won celebration toast confirmation and optimistic state update.
- Integrated slide-over opportunity record drawer.

## [Phase 6] — 2026-10-28
### Shared Inbox Flagship Overhaul (`c843ae5`)
- Built 3-pane viewport-height layout (`calc(100vh - 52px)`) with 340px conversation list.
- Grouped thread messages by accurate calendar date separators ("Today", "Yesterday", "MMM D, YYYY").
- Enforced quiet chat bubbles (canvas-tone inbound, warm white outbound) with hairline borders.
- Pinned bottom message composer with WhatsApp outbound vs Internal Staff Note mode tabs.
- Added live 24-hour Meta customer-care window countdown timer.
- Integrated AI reply suggestion pill and collapsible 340px customer context drawer.

## [Phase 5] — 2026-10-28
### Overview Focal Point Rebuild (`db403ec`)
- Replaced fragmented multi-card grid with two clear visual zones:
  - Left 7-column **"Needs you now"** priority action queue with in-place reply popover, snooze, and resolve actions.
  - Right 5-column **Revenue focal point** with single `metric-xl` figure, count-up `AnimatedNumber`, and 5-step monochromatic pipeline ramp.
- Added "Deals to watch" high-value opportunity list and "Coming up" SLA agenda.
- Integrated slide-over drawer previews for contacts and opportunities without route navigation.

## [Phase 4] — 2026-10-28
### Shell Rebuild: Signature Sidebar & Calm Topbar (`7aa2274`)
- Rebuilt left sidebar: 272px expanded / 76px collapsed, 44px navigation rows, 3px sliding Flame-500 indicator bar.
- Added quick-create button with `C` hotkey, floating hover tooltips when collapsed, and bottom-pinned user profile & sandbox controls.
- Implemented `G` shortcuts (`G O`, `G I`, `G P`, `G C`, `G T`) and global command palette (`⌘K`).
- Rebuilt topbar: 52px height, breadcrumb hierarchy, search trigger, status indicators, zero redundant titles.

## [Phase 3] — 2026-10-28
### Canonical Primitives & "Quiet Instrument" Token System (`6e056e5`)
- Established authoritative CSS variables: `--canvas`, `--surface`, `--sunken`, `--line`, `--text-1`, `--text-2`, `--text-3`, `--flame-500`.
- Built reusable primitives: `Button` (primary flame, secondary paper, ghost, danger), `StatusPill` (neutral, positive, warning, danger), `StatStrip`, `Table`, `EmptyState`, `RestrictedState`, `AnimatedNumber`, `Drawer`, `SearchField`, `Switch`, `PageHeader`, `SettingsShell`.
- Banned all bold fonts (> 600 weight), italics, and monospace fonts via universal resets.

## [Phase 2] — 2026-10-28
### Authoritative Design Specification Authored (`a560dfb`)
- Created `DESIGN.md` in repository root defining the "Quiet Instrument, One Flame" design philosophy, token system, flame discipline rules, typographic scale, per-route focal points, and Emil Kowalski motion tokens.

## [Phase 1] — 2026-10-28
### Baseline Visual Inventory & Data Integrity Audit (`c5108a3`)
- Captured 90 baseline "before" screenshots across 15 routes and 6 viewports.
- Audited all live stores (`crmStore`, `whatsappStore`, `templateStore`, `campaignStore`, `automationStore`, `reportingEngine`, `aiStore`).
- Documented data contracts, zero fabricated metrics policy, and backend integration requirements in `AUDIT.md`.
