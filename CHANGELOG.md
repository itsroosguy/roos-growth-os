# Changelog — Roos StudioX Business OS

All notable architectural, visual, and experiential changes to the Roos StudioX CRM & WhatsApp Business Operating System are documented in this file.

---

## [Patch: Hydration Mismatch & SSR Normalization] — 2026-10-29
### Zero Hydration Errors & Full Client/Server Determinism
- **Root Cause Resolution**:
  - Eliminated the `Server: "1" Client: "2"` mismatch caused by server boot timestamps vs client load timestamps in singleton store seed data across midnight boundaries.
  - Normalized `crmStore.getTasks()` and `crmStore.getLeads()` to dynamically calculate task and lead due dates relative to the active request timestamp (`t-301` consistently Due Today, `t-302` consistently Overdue, `t-303` consistently Upcoming).
  - Added strict date boundary bounds (`>= startOfToday && <= endOfToday`) for `todayTasks` to prevent future/upcoming tasks from leaking into the today filter.
- **Hydration Guards (`suppressHydrationWarning`)**:
  - Protected all dynamic queue text nodes across the Next Best Action Hero card (avatar initials, customer name, phone, context quote, AI suggestion, elapsed time).
  - Protected the Today strip metric counters and Up Next in Queue list items.
  - Verified via Chrome CDP headless runner that `nextjs-portal` shadow root contains zero errors, zero toast warnings, and `DETAILED HYDRATION ERRORS: []`.
- **System Integrity**:
  - 144/144 unit and integration tests passing across 27 test files (`vitest run`).
  - 0 TypeScript compiler errors (`tsc --noEmit`).
  - 15/15 routes verified with 0 typography violations (`scripts/dom-audit.js`).

---

## [Revision 2: The "2027 Pass"] — 2026-10-28
### Complete Transformation to 2027 Design Standard across All 15 Routes
- **Tokens & Semantic Meaning**:
  - Implemented the authoritative "Color is Meaning" palette: Flame (`#FF5A1F`), Ultramarine (`#3B5BFD`), Emerald (`#12B886`), Amber (`#F5A524`), Sky (`#1FA2E8`), Violet (`#7C4DFF`), Rose (`#E5484D`).
  - Added categorical pipeline stage progression: Inbound Slate, Contacted Sky, Qualified Ultramarine, Proposal Amber, Won Emerald, Lost Rose.
  - Implemented fluid rem typography rooted at `clamp(15px, 0.4vw + 10.5px, 18px)`: `hero-metric` (5.0rem), `metric-xl` (3.5rem), `display` (2.25rem), `metric` (2.0rem), `title` (1.25rem), `label-lg`/`label` (1.0625rem / 1.0rem), `body` (0.9375rem), `small` (0.875rem), `meta` (0.8125rem), `eyebrow` (0.75rem).
  - Enforced hard floor: Zero text < 13px computed. Nothing actionable < 14px.
  - Introduced 2027 Radii System: 12px controls, 20px cards (`card-2027`), 28px heroes/drawers (`hero-card-dark`), full capsules.
  - Added 2-layer ambient soft shadows (`0 1px 2px rgba(11,13,18,.04), 0 8px 24px -12px rgba(11,13,18,.12)`).
  - Added Indian currency grouping helper `formatINR` (e.g. `₹4,20,000`).
- **Shell & Navigation Rebuilt**:
  - Replaced edge-to-edge sidebar with **inset floating dark panel** (`rounded-[24px]`, `p-3` margin letting warm canvas visibly flow around all four edges, `0 12px 36px -8px rgba(11,13,18,0.35)` shadow, top inner highlight).
  - **Proportionate Logo & Dynamic State Switch**:
    - Reduced expanded `ROOS STUDIOX` logo height from `h-6 sm:h-6.5` (~26px) to `h-[18px] sm:h-[19px]`, providing ~50px of breathing room from the `<` collapse chevron.
    - Added dynamic logo switching on collapse: minimized 76px rail centers the login screen emblem squircle (`/mark.png`, `14px` radius, `#121214` surface, `brightness(0) invert(1)` pure white mark, subtle flame glow) with interactive hover micro-scaling.
    - Floating expand toggle chevron (`>`) unclipped on right border seam (`-right-3`) with circular dark pill and hover flame accent.
  - Fixed ~900px height overflow: 42px rows, 24px category gaps, collapsed configuration group by default, hidden scrollbar with edge fades.
  - Eradicated stray "R / B" glyph artifact next to official logo by removing duplicate adjacent HTML text spans.
  - Active nav item: 36px rounded-square chip in module's hue tint with duotone icon and 3px sliding Flame bar.
  - Renamed "Shared Inbox" navigation module to **"WhatsApp"** across the sidebar, topbar breadcrumbs, command palette (`⌘K`), loading screens, and cross-module link buttons.
  - Elevated topbar to 56px with breadcrumbs, command palette search, and Indian currency results.
- **Overview Re-architected (5-Row Bento)**:
  - Row 0: Time-aware real greeting ("Good evening, Praveen. Rahul Mehta has been waiting 2 hours.") + period selector + single Flame CTA ("New opportunity").
  - Row 1: Today strip with 4 interactive 72px chips in obsidian black (`#0B0D12`) with semantic signal hierarchy: Red for negative (Overdue), Green for positive (In proposal), and Orange for operational states (Waiting on you, Due today). Filters queue below on click.
  - Row 2: Left 7-col Next Best Action Hero elevated with Live Radar Beacon animation, rainbow flame/violet accent line, authentic WhatsApp speech bubble with customer inbound context (never empty), luminous AI Copilot box with animated shimmer line (`copilot-shimmer-line`), 44px primary Send button with paper plane takeoff animation, Quick Edit with smooth expansion, and tactile Snooze/Done actions + Right 5-col Revenue Hero (ink surface, 28px radius, flame glow, 5rem metric with AnimatedNumber, proportional stage bar from real open stage values, Won shown separately below in emerald).
  - Row 3: Up next queue + Coming up follow-ups with one-click completion & undo toast.
  - Row 4: Deals worth a look (open deals only, never Won) + Collapsed recent activity feed.
- **Flagship Routes Elevated**:
  - **Shared Inbox**: Left thread list on canvas, center thread on white raised panel, chat bubbles (Inbound white, Outbound ultramarine `#EAEEFF`, Internal note amber `#FFF3D6`), larger 15px body text, pinned bottom composer with violet AI reply bar and primary flame Send button.
  - **Sales Pipeline**: Reworked Kanban board to match modern executive product standard:
    - **Header Pill Banners**: Soft pastel pill banners for stages (Inbound, Contacted, Qualified, On Review, Completed, Closed Lost) with status icons, count pills, subtotal stage value readouts, and stage-specific `+` add buttons.
    - **Card Anatomy**: Clean 18px rounded white cards with top due date & `···` context menu, bold titles, context notes, milestone fraction (`1/6`–`6/6`) with visual segmented dashes, overlapping assignee avatar discs, priority badges (`Low`/`Medium`/`High`), link attachment counts, and WhatsApp message badges.
    - **Toolbar**: Integrated search with `⌘K` badge, filter dropdown by priority, `+ Create Deal` primary CTA, team member avatar stack, and `+ Invite` button.
  - **Contacts**: Sky identity, search-first 40px table rows, deterministic colored avatars with initials, consent filter pills, text floor ≥ 13px.
  - **Tasks / Agenda**: Amber identity, Overdue / Today / Upcoming / Completed groups, 20px cards, one-click completion with undo toast.
  - **Broadcasts**: Violet identity, campaign cards with status tints, recipient counts, delivery rates, real costs in `formatINR`.
  - **Templates**: Violet identity, simulated smartphone preview drawer, variable tags.
  - **Automations**: Amber identity, human-readable "When → If → Then" rule chains, 20px card radius, real switches.
  - **Reports**: Emerald & stage colors, one-sentence takeaways above each chart, proportional funnel bars, SLA response brackets.
  - **Team Roster**: Sky identity, deterministic colored avatars, plain-language enterprise roles, text floor ≥ 13px.
  - **WhatsApp API**: Ultramarine / slate identity, 760px settings shell, real toggle switches, sticky save bar.
  - **AI Engine**: Violet identity, model selector, temperature slider, prompt editor.
  - **Integrations**: Slate neutrals, canonical `RestrictedState` explaining routing mismatch.
  - **Subscription**: Emerald identity, clear progress bars ("4 of 5 used (At limit)"), clean tier upgrade CTAs.
  - **Organisation Details**: Slate neutrals, 760px settings shell, real inputs, sticky save bar.
- **Verification**:
  - 144 of 144 unit and integration tests passing. 0 TypeScript errors.
  - Full DOM typography audit passing across all 15 routes: 0 non-Google Sans fonts, max weight ≤ 600, 0 italics, 0 monospace, 0 text < 13px, 0 interactive < 14px.

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
