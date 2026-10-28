# Roos StudioX Business OS — Design Specification: Revision 2 ("The 2027 Pass")

**Author:** Creative Director, Principal Product Designer & Senior Frontend Architect  
**Date:** October 28, 2026  
**Status:** Authoritative Product & Design Specification (Supersedes Revision 1)

---

## 1. Design Philosophy: "Confidence, Depth & Meaningful Color"

Roos StudioX Business OS is a CRM and WhatsApp Business Operating System designed to sit comfortably next to Linear, Attio, and Stripe. It moves beyond 2014 admin templates (uniform white boxes, hairline borders, single-hue accents) into a calm, confident, and deeply structured 2027 interface.

### Core Principles
1. **Color carries meaning, never decoration**: Color exists to classify, orient, and alert. Every hue corresponds strictly to an entity type, status, or stage.
2. **Confident scale & physical hierarchy**: Every screen has a distinct hero. Metrics lead with large tabular typography; secondary metadata settles into quiet, readable contrast.
3. **Layered depth & atmospheric light**: Inset floating navigation, warm paper canvas (`#F7F5F0`) with faint radial warmth, 2-layer ambient shadows, and ink heroes (`#0B0D12`).
4. **Hard typography floor**: Zero text rendered below 13px computed. Nothing actionable below 14px.
5. **Real data exclusively**: 100% connected to live CRM, WhatsApp, and billing stores. Zero fabricated metrics, zero static mock numbers.

---

## 2. Color System: "Color is Meaning"

Color is strictly functional. The palette establishes instant semantic recognition across modules:

| Semantic Role | Primary Hue | Active Tint | Border Tint | Text AA | Functional Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Flame** | `#FF5A1F` | `#FFF0EB` | `rgba(255,90,31,0.25)` | `#C73E0C` | Primary CTAs, active focus rings, urgent alerts |
| **Ultramarine** | `#3B5BFD` | `#EAEEFF` | `rgba(59,91,253,0.22)` | `#1E3BB8` | WhatsApp conversations, customer messages, live chat |
| **Emerald** | `#12B886` | `#E6FBF2` | `rgba(18,184,134,0.25)` | `#0A7A53` | Won revenue, delivered messages, verified webhooks, healthy SLA |
| **Amber** | `#F5A524` | `#FFF3D6` | `rgba(245,165,36,0.30)` | `#8F5300` | Follow-ups due today, pending approvals, automation triggers |
| **Sky** | `#1FA2E8` | `#EBF6FD` | `rgba(31,162,232,0.25)` | `#0F6F9D` | People, contacts, customer profiles, team governance |
| **Violet** | `#7C4DFF` | `#F4F0FF` | `rgba(124,77,255,0.25)` | `#6938EF` | AI suggestions, intelligence copilot, broadcast campaigns |
| **Rose** | `#E5484D` | `#FFE9EA` | `rgba(229,72,77,0.25)` | `#B42336` | Overdue follow-ups, failed dispatches, lost deals, errors |

### Categorical Pipeline Progression
Pipeline stages use distinctive semantic hues to provide immediate visual orientation:
1. **Inbound / New**: Slate neutral (`#6C7690`)
2. **Contacted**: Sky (`#1FA2E8`)
3. **Qualified**: Ultramarine (`#3B5BFD`)
4. **Proposal**: Amber (`#F5A524`)
5. **Won**: Emerald (`#12B886`)
6. **Lost**: Rose (`#E5484D`)

---

## 3. Fluid Typography System (Google Sans Exclusively)

The typography scale is fluid, rooted at `clamp(16px, 0.35vw + 11.5px, 18px)` using standard rems.

### Typography Constraints
- **Font:** Google Sans exclusively. `font-synthesis: none !important;` prevents faux-bold and faux-italic rendering.
- **Allowed Weights:** 400 (regular), 500 (medium), and 600 (sparingly). Strictly zero bold (> 600 weight).
- **Zero Italics:** Strictly zero italic or oblique text.
- **Zero Monospace:** Monospace fonts are forbidden. Numbers enforce `font-variant-numeric: tabular-nums` for alignment.
- **Hard Floors:**
  - **Zero text < 13px computed** anywhere in the product.
  - **Zero actionable or primary text < 14px**.

### Fluid Type Scale
| Token | REM Size | Computed (at 16px root) | Weight | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- |
| `hero-metric` | 5.0rem | 80px | 500 | Defining focal metric (Revenue Hero) |
| `metric-xl` | 3.5rem | 56px | 500 | Large KPI displays |
| `display` | 2.25rem | 36px | 500 | Primary page titles |
| `metric` | 2.0rem | 32px | 500 | Secondary quantitative figures |
| `title` | 1.25rem | 20px | 500 | Section and module headings |
| `label-lg` | 1.0625rem | 17px | 500 | Prominent card headings, table titles |
| `label` | 1.0rem | 16px | 500 | Primary item titles, contact names |
| `body` | 0.9375rem | 15px | 400 | Primary body text, chat bubbles, descriptions |
| `small` | 0.875rem | 14px | 400 | Supporting metadata, form inputs, secondary rows |
| `meta` | 0.8125rem | 13px | 400 | Timestamps, secondary helper copy (hard floor) |
| `eyebrow` | 0.75rem | 13px (clamped) | 500 | Uppercase section indicators (+0.06em tracking) |

---

## 4. Radii, Shadows & Surface Architecture

### Radii Scale
- **Controls & Small Components:** `rounded-[12px]` (buttons, inputs, select fields, pill chips)
- **Cards & Working Panels:** `rounded-[20px]` (module cards, bento blocks, tables)
- **Heroes & Drawers:** `rounded-[28px]` (Revenue hero card, detail drawers, preview modals)
- **Status Pills:** `rounded-full` (capsules)

### Ambient Shadow & Depth Layers
- **Card Ambient Shadow:** `0 1px 2px rgba(11,13,18,.04), 0 8px 24px -12px rgba(11,13,18,.12)`
- **Hover Elevation:** `0 2px 4px rgba(11,13,18,.06), 0 12px 28px -10px rgba(11,13,18,.16)`
- **Sidebar & Drawers:** `0 12px 36px -8px rgba(11,13,18,0.35)`
- **Hero Glow:** Dark surface with subtle top-right flame ambient radial gradient (`rgba(255,90,31,0.08)`)

---

## 5. Navigation & Workspace Shell Architecture

### Inset Floating Sidebar
The sidebar is an inset floating dark panel (`#0B0D12`):
- Margin: `p-3` outer padding ensures canvas background (`#F7F5F0`) visibly flows around all four edges.
- Radius: `rounded-[24px]` with top inner highlight (`border-t border-white/10`).
- Brand Header: Roos StudioX official logo rendered clean without redundant adjacent HTML text spans.
- Active Item: Module hue tint chip (`bg-[hue]/15`), duotone icon in module hue, and 3px sliding Flame accent bar.
- Height Budget: 42px item rows, 24px category spacing, Configuration sub-section collapsed by default. Zero screen overflow.
- Bottom Pinned Card: User avatar with deterministic color assignment, name, workspace, role chip, and sandbox controls.

### Topbar & Canvas
- Topbar height: 56px with breadcrumb hierarchy, command palette search (`⌘K`), and notification center.
- Canvas: Warm paper `#F7F5F0` with subtle top-left ambient radial warmth.
- Gutter: Generous 40px padding on desktop screens (`p-4 sm:p-6 md:p-10`).

---

## 6. Route-by-Route Module Identity & Composition

| Route | Module Identity | Hero Component | Layout Structure |
| :--- | :--- | :--- | :--- |
| **Overview** | Flame & Multi-Hue | Next Best Action (7-col) + Revenue Hero (5-col) | 5-row Bento: Greeting → Today Strip (4 chips) → Heroes → Up Next / Coming Up → Deals / Activity |
| **Shared Inbox** | Ultramarine (`#3B5BFD`) | Thread Canvas & Pinned AI Composer | 3-pane viewport height: Thread list on canvas → Thread on white panel → Contact drawer |
| **Sales Pipeline** | Categorical Stages | Visual Kanban Board + Stage Columns | Stage headers with colored dots, lead cards with stuck time and owner avatars |
| **Contacts** | Sky (`#1FA2E8`) | Search-First Contact Directory | Search & filter bar, 40px table rows, deterministic avatar colors, consent status pills |
| **Tasks / Agenda** | Amber (`#F5A524`) | Agenda & Overdue Action Grid | Overdue (Rose), Today (Amber), Upcoming groups with one-click checkoff & undo toast |
| **Broadcasts** | Violet (`#7C4DFF`) | Compliant Broadcast Manager | StatStrip, filter tabs, campaign progress bars, real cost in INR |
| **Templates** | Violet (`#7C4DFF`) | Smartphone Preview Drawer | Grid of approved Meta templates, interactive smartphone simulation drawer |
| **Automations** | Amber (`#F5A524`) | Trigger-Action Workflow Rule Chains | Human-readable "When → If → Then" rule blocks with live sandbox triggers |
| **Reports** | Emerald (`#12B886`) | Executive Analytics & Funnel Breakdown | One question per card with clear takeaways, proportional funnel bars, SLA response rates |
| **Team Roster** | Sky (`#1FA2E8`) | Access Credentials & Role Governance | Enterprise liability matrix, invitation dispatch, deterministic colored avatars |
| **WhatsApp API** | Slate & Ultramarine | Connection Settings & Meta Cloud API | 760px settings shell, live/mock mode toggle, webhook verification credentials |
| **AI Engine** | Violet (`#7C4DFF`) | Model Persona & Token Controls | Model selector, temperature sliders, prompt editor, safety bounds |
| **Integrations** | Slate Neutrals | Platform Operator Console | Operator KPI strip, quota override controls, Defect 32 RestrictedState |
| **Subscription** | Emerald (`#12B886`) | Quota Meter & Unit Economics | Plan tier comparison, India UPI AutoPay billing cycle, downgrade safety pre-flight |
| **Organisation** | Slate Neutrals | Business Profile & Grounding | Workspace name, immutable tenant slug, sticky save bar |

---

## 7. Motion Design Engineering (Emil Kowalski Skill Standard)

All UI transitions strictly follow Emil Kowalski's motion design engineering principles:
1. **Snappy Timings:** Standard interaction durations between 140ms and 220ms.
2. **Entrances:** High-performance deceleration curve `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo).
3. **Micro-interactions:** Physics-based spring curve `cubic-bezier(0.34, 1.56, 0.64, 1)` for click responses and button presses.
4. **Zero Layout Thrashing:** No animation on `width`, `height`, `top`, `left`, `margin`, or `padding`. All transforms use GPU-accelerated `translate3d()` and `scale()`.
5. **Reduced Motion:** Universal fallback layer `@media (prefers-reduced-motion: reduce)` disables all transitions for accessibility.

---

## 8. Verification & Auditing Standard

Every release must satisfy:
1. Automated DOM typography audit: zero text nodes < 13px, zero actionable < 14px, max weight 600, zero italics, zero monospace, Google Sans loaded.
2. WCAG AA contrast check on all foreground/background pairs.
3. Currency standard: Indian Rupee grouping (`formatINR(val)` produces `₹4,20,000`).
4. Cross-viewport visual fidelity across 7 breakpoints: 2560px, 1920px, 1440px, 1280px, 1024px, 768px, and 390px.
