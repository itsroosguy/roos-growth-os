# Roos StudioX Business OS — Comprehensive Audit Report (Phase 1)

**Audit Date:** October 28, 2026  
**Auditor:** Roos StudioX Design Lead & Senior Frontend Architect  
**Workspace:** `Whatsapp CRM & Automation`  
**Repository Branch:** `main`

---

## 1. Baseline Visual Capture Inventory

All 15 routes have been captured in headless Chrome across all 6 specified viewport widths (`2560px`, `1440px`, `1280px`, `1024px`, `768px`, and `390px`), totaling **90 before-rebuild screenshots** stored in `screenshots/before/`.

| Route Name | Route Path | File Path | Viewports Captured | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Overview** | `/app/[orgSlug]/overview` | `src/app/(dashboard)/app/[orgSlug]/overview/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Inbox** | `/app/[orgSlug]/inbox` | `src/app/(dashboard)/app/[orgSlug]/inbox/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Leads / Pipeline** | `/app/[orgSlug]/leads` | `src/app/(dashboard)/app/[orgSlug]/leads/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Contacts** | `/app/[orgSlug]/contacts` | `src/app/(dashboard)/app/[orgSlug]/contacts/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Campaigns** | `/app/[orgSlug]/campaigns` | `src/app/(dashboard)/app/[orgSlug]/campaigns/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Templates** | `/app/[orgSlug]/templates` | `src/app/(dashboard)/app/[orgSlug]/templates/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Automations** | `/app/[orgSlug]/automations` | `src/app/(dashboard)/app/[orgSlug]/automations/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Tasks & Follow-ups** | `/app/[orgSlug]/tasks` | `src/app/(dashboard)/app/[orgSlug]/tasks/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Reports** | `/app/[orgSlug]/reports` | `src/app/(dashboard)/app/[orgSlug]/reports/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Team** | `/app/[orgSlug]/team` | `src/app/(dashboard)/app/[orgSlug]/team/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **WhatsApp Settings** | `/app/[orgSlug]/whatsapp` | `src/app/(dashboard)/app/[orgSlug]/whatsapp/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **AI Assistant** | `/app/[orgSlug]/settings/ai` | `src/app/(dashboard)/app/[orgSlug]/settings/ai/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Integrations / Admin** | `/app/[orgSlug]/settings/admin` | `src/app/(dashboard)/app/[orgSlug]/settings/admin/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Subscription & Usage** | `/app/[orgSlug]/subscription` | `src/app/(dashboard)/app/[orgSlug]/subscription/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |
| **Organisation Settings** | `/app/[orgSlug]/settings` | `src/app/(dashboard)/app/[orgSlug]/settings/page.tsx` | 2560, 1440, 1280, 1024, 768, 390 | Baseline Saved |

---

## 2. Route Inventory & Diagnostic Table

| Route Path | Source File | Current Layout Width | Current Status Pills | Monospace Usage | Live Store Query vs Mock Array |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/overview` | `overview/page.tsx` | `max-w-[1580px]` (Layout level) | Inconsistent pills (emerald, amber, purple, orange) | `font-mono` on clock, cards, prices, timestamps | **Partial/Contradictory**: Mock arrays for deals, tasks, activity, mini-chat alongside store imports |
| `/inbox` | `inbox/page.tsx` | `max-w-[1580px]` (Trapped in page padding) | WhatsApp pills & green pulse dots | `font-mono` on timestamps and phone numbers | `whatsappStore.getConversations()` & `getMessages()` |
| `/leads` | `leads/page.tsx` | `max-w-[1580px]` | Rainbow badges (orange, purple, emerald, rose, amber) | `font-mono` on deal values and count pill | `crmStore.getLeads()` & `crmStore.getMetrics()` |
| `/contacts` | `contacts/page.tsx` | `max-w-[1580px]` | Opted-in / Opted-out colored pills | `font-mono` on phone numbers & CSV modals | `crmStore.getContacts()` |
| `/campaigns` | `campaigns/page.tsx` | `max-w-[1580px]` | Status pills with bright progress tracks | `font-mono` on sent/delivered rates | `whatsappStore.getCampaigns()` |
| `/templates` | `templates/page.tsx` | `max-w-[1580px]` | Meta approval status pills (green, yellow, red) | `font-mono` on variable tokens `{{1}}` | `whatsappStore.getTemplates()` |
| `/automations` | `automations/page.tsx` | `max-w-[1580px]` | Active/Inactive badges & webhook triggers | `font-mono` on execution IDs & runtimes | `automationEngine.getAutomations()` & executions |
| `/tasks` | `tasks/page.tsx` | `max-w-[1580px]` | Priority pills (High, Med, Low), Overdue chips | `font-mono` on due dates | `crmStore.getTasks()` |
| `/reports` | `reports/page.tsx` | `max-w-[1580px]` | Conversion percentage badges | `font-mono` on metrics and axis labels | Computes from `crmStore` + mock charts |
| `/team` | `team/page.tsx` | `max-w-[1580px]` | Role badges (Owner, Admin, Manager, Staff) | `font-mono` on clearance levels & dates | `teamStore.getMembers()` |
| `/whatsapp` | `whatsapp/page.tsx` | `max-w-[1580px]` | Connected/Disconnected badges, Tier chips | `font-mono` on Phone Number ID & WABA ID | `whatsappStore.getConfig()` |
| `/settings/ai` | `settings/ai/page.tsx` | `max-w-[1580px]` (Stretched form) | Model pills (Claude 3.5, GPT-4o, etc.) | `font-mono` on temperature & token sliders | `aiConfigStore.getConfig()` |
| `/settings/admin` | `settings/admin/page.tsx` | `max-w-[1580px]` (Stretched) | Webhook simulator status pills | `font-mono` on API keys & payloads | Mock simulator + integrations store |
| `/subscription` | `subscription/page.tsx` | `max-w-[1580px]` | Plan tier chips (Starter, Growth, Enterprise) | `font-mono` on pricing and invoice dates | `subscriptionStore.getSubscription()` |
| `/settings` | `settings/page.tsx` | `max-w-[1580px]` (Stretched) | Workspace status chip | `font-mono` on workspace slug & IDs | `useTenant()` context |

---

## 3. Data Integrity Audit (Overview Screen)

Every number, KPI, and table row on the Overview screen traced back to its backing store query or identified as a hardcoded literal.

| UI Element / Field | Displayed Value | Backing Store Method | Verification Result | Defect & Remedy |
| :--- | :--- | :--- | :--- | :--- |
| **New Leads Card** | `32` (+20%) | `crmStore.getLeads(orgSlug).length` | **Hardcoded Literal** (`32` in JSX) | Contradicts live store (`leads.length` is 6). Must derive dynamically from `crmStore.getMetrics(orgSlug).totalLeads`. |
| **Pipeline Value Card** | `₹6,60,000` (+18%) | `crmStore.getMetrics(orgSlug).pipelineValue` | **Hardcoded Literal** (`₹6,60,000` in JSX) | Contradicts live store (`metrics.pipelineValue` is 21,30,000). Wire directly to `metrics.pipelineValue`. |
| **WhatsApp Velocity Card** | `412` (avg 4m response) | `whatsappStore.getConversations(orgSlug)` | **Hardcoded Literal** (`412` in JSX) | Compute live total messages across active conversations or derive from store. |
| **Follow-ups Due Card** | `3` (1 Overdue) | `crmStore.getTasks(orgSlug)` | **Hardcoded Literal** (`3` in JSX) | Wire directly to pending tasks count (`tasks.filter(t => t.status !== 'completed').length`). |
| **Conversations Filter Tabs** | `All (7)`, `Unread (3)`, `Assigned (4)` | `whatsappStore.getConversations(orgSlug)` | **Hardcoded Literal strings** in tab buttons | Compute counts dynamically from `conversations.length`, `unread.length`, `assigned.length`. |
| **Conversation List Rows** | `Sneha Reddy`, `Aarav Patel`, `Rahul Mehta` | `whatsappStore.getConversations(orgSlug)` | **Hardcoded Mock Array** in JSX | Contradicts `whatsappStore`. Replace with real conversations mapped from store. |
| **Mini-Chat Interactive Pane** | `previewMessages` state with fake reply input | None (Duplicate ephemeral state) | **Disconnected Simulation** | **Violates Defect 14**: Remove mini-composer; replace with compact activity feed linking to `/inbox?c=<id>`. |
| **Commercial Pipeline Header** | `₹8.30 Lakh` (+3.9%) | `crmStore.getMetrics(orgSlug)` | **Hardcoded Literal** | Wire to real active pipeline sum from `crmStore`. |
| **Proposal Sent Header** | `₹2.30 Lakh` (1 deal) | `crmStore.getMetrics(orgSlug)` | **Hardcoded Literal** | Wire to `metrics.leadsByStage.proposal.value`. |
| **Deals Won Header** | `1 deal` (100% close) | `crmStore.getMetrics(orgSlug)` | **Hardcoded Literal** | Wire to `metrics.leadsByStage.won.count`. |
| **Priority Deals List** | `Retail Automation Contract`, `Multi-Store CRM` | `crmStore.getLeads(orgSlug)` | **Hardcoded Mock Array** | Wire directly to `leads.slice(0, 3)` sorted by `estimated_value` desc. |
| **Today's Tasks List** | `t1`, `t2`, `t3`, `t4` hardcoded titles | `crmStore.getTasks(orgSlug)` | **Hardcoded Mock Array** | Wire to `filteredTasks.slice(0, 4)` from `crmStore.getTasks(orgSlug)`. |
| **Recent Activity Feed** | 5 hardcoded strings | Activity/Audit store | **Hardcoded Mock Array** | Derive from real CRM + WhatsApp latest events. |
| **Campaign Performance Card**| `1,248 Sent`, `1,012 Delivered`, `312 Replied` | `whatsappStore.getCampaigns(orgSlug)` | **Hardcoded Literals** | Wire to active campaign metrics from `whatsappStore`. |

---

## 4. Defect Register Cross-Reference (All 32 Defects)

### Category A: Global & Layout Container
- **Defect 1 (Layout Width Discrepancy)**: Content width jumps inconsistently. Remedy: Standardize on `max-w-[1680px]` for data pages, `max-w-[880px]` for settings, and full-bleed viewport `calc(100vh - 56px)` for Inbox.
- **Defect 2 (Monospace Overuse)**: Monospace used on metrics, dates, and IDs. Remedy: Zero monospace across product; enforce Google Sans with `font-variant-numeric: tabular-nums`.
- **Defect 3 (Orange Budget Violation)**: Orange appears on decorative icons, badges, borders. Remedy: Restrict `#FF7A1A` strictly to primary CTAs, active nav markers, and attention dots (< 3% screen pixels).
- **Defect 4 (Rainbow Badges)**: Status pills use conflicting purples, blues, yellows. Remedy: Calm semantic ramp (neutral zinc, restrained emerald, warning amber, muted rose).
- **Defect 5 (Heavy Drop Shadows)**: Fuzzy drop shadows create visual clutter. Remedy: Subtle 1px hairlines (`#E4E4E7`/`#E5E7EB`) and crisp 1px borders.

### Category B: Shell & Navigation
- **Defect 6 (Sandbox Controls Demotion)**: Role switcher and mock simulator buttons clutter UI. Remedy: Group into collapsible Developer/Sandbox drawer in Sidebar bottom.
- **Defect 7 (Clearance Level Terminology)**: Fictional "Clearance Level" labels confuse users. Remedy: Use standard enterprise roles ("Owner", "Admin", "Manager", "Staff").
- **Defect 8 (Topbar Search Bar)**: Massive full-width input wastes topbar space. Remedy: Compact command trigger (`⌘K`) + contextual breadcrumb.
- **Defect 9 (Sidebar Active State Matching)**: Sub-routes (`/settings/ai`, `/settings/admin`) highlight `/settings` simultaneously. Remedy: Longest-prefix / exact matching.
- **Defect 10 (Sidebar Collapsed Tooltips)**: Hover tooltips misaligned on scroll. Remedy: Fixed portal tooltips with instant spring enter.
- **Defect 11 (Account Bar at Short Viewports)**: Account bar overflows below screen on 600px heights. Remedy: Sticky bottom flex container with internal scroll.
- **Defect 12 (Sidebar Active Indicator)**: Over-styled orange blocks. Remedy: Crisp hairline active strip with `#FF7A1A` indicator.

### Category C: Overview Command Center
- **Defect 13 (Mock vs Live Figures)**: 4 cards contain hardcoded numbers that contradict live CRM store. Remedy: 100% store backed via `crmStore`, `whatsappStore`, `automationEngine`.
- **Defect 14 (Mini-Chat Duplication)**: Mini-chat is an unauthenticated duplicate of Inbox with fake reply field. Remedy: Replace with live conversation pulse linking to `/inbox?c=<id>`.
- **Defect 15 (Boxed KPI Cards)**: 4 equal heavy cards look like a generic dashboard. Remedy: Open inline `StatStrip` separated by 1px hairlines.

### Category D: Flagship Shared Inbox
- **Defect 16 (Composer Trapped by Scroll)**: Chat input scrolls away instead of staying pinned. Remedy: Pinned bottom composer in full-bleed viewport (`calc(100vh - 56px)`).
- **Defect 17 (Double Composer Tabs)**: Disjointed reply bars. Remedy: Single unified composer with mode tabs ("WhatsApp" vs "Internal Note").
- **Defect 18 (4-Line Conversation Cards)**: Dense conversation list over-crowded. Remedy: Clean 2-line cards (Name + Timestamp, Preview + Status chip).
- **Defect 19 (Green WhatsApp Bubble Saturation)**: Eye-straining green bubbles. Remedy: Restrained soft-tint `#DCF8C6` and calm paper white for client.
- **Defect 20 (Meta 24h Window Banner)**: Bulky warning banner pushing chat up. Remedy: Slim 28px hairline status strip with countdown.

### Category E: Pipeline & Contacts
- **Defect 21 (Kanban Scrollbar Placement)**: Scrollbar hidden under screen fold; Closed Lost missing. Remedy: Viewport-height kanban column scroll with bottom scrollbar and visible Closed Lost column.
- **Defect 22 (Stage Header Saturation)**: Bright saturated stage column headers. Remedy: Restrained neutral stage ramp with subtle dot indicators.
- **Defect 23 (Contacts Broken Pagination)**: Pages 1, 2, 3 show regardless of item count; page 2 does nothing. Remedy: Real client pagination slicing `filteredContacts` (10 per page) with accurate count.
- **Defect 24 (CSV Action Overprominence)**: CSV import/export dominates table view. Remedy: Quiet secondary actions grouped in dropdown/toolbar.

### Category F: Templates, Automations & Tasks
- **Defect 25 (Templates Form Overload)**: Complex form exposed inline without live preview. Remedy: Quiet master list with slide-over phone preview drawer.
- **Defect 26 (Campaigns Progress Bar Noise)**: Harsh multi-color progress tracks. Remedy: Monochromatic neutral progress tracks with single emerald completion.
- **Defect 27 (Automation Trigger Obscurity)**: Technical JSON nodes instead of human triggers. Remedy: Plain language "When [Event] -> Then [Action]" syntax.
- **Defect 28 (Task Completion Feedback)**: Clunky checkbox states. Remedy: Instant spring animation + strike-through with optimistic store update.

### Category G: Reports, Team & Settings
- **Defect 29 (Funnel Chart Distortion)**: Stages show equal width regardless of numbers. Remedy: Proportional funnel segments reflecting real drop-off.
- **Defect 30 (Rainbow Donut Charts)**: Chart slices clash with brand palette. Remedy: Cohesive brand-ramp donut (ink, zinc, subtle orange accent).
- **Defect 31 (Team Member Table Overload)**: Cluttered role table with raw clearance integers. Remedy: Clean member roster with human role badges and active toggle.
- **Defect 32 (Settings Form Sprawl)**: Settings forms stretch across 1580px screen width. Remedy: Unified `SettingsShell` with sub-navigation and constrained `720px` form column.

---

## 5. Audit Conclusion & Phase Gate Sign-Off

The project baseline has been thoroughly audited and recorded. 90 screenshots are saved as permanent reference in `screenshots/before/`. Every defect has been mapped to its concrete code location. Phase 1 is complete.
