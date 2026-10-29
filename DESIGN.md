# Roos StudioX Business OS — Design & Architecture System

## Concept: "Your Day, in Order"
A high-craft CRM designed as an executive morning briefing rather than a dashboard of widgets. Every element directs attention to what is next, what is moving, and what can wait.

---

## 1. Signature Innovations
1. **Interactive Briefing Line**:
   - Synthesizes live workspace state into a single human sentence.
   - Names, wait durations, scheduled calls, and pipeline values are rendered as interactive, module-tinted chips (`[Sneha Reddy]`, `[2h]`, `[3 calls]`, `[₹1.5L]`, `[Proposal]`).
   - Clicking any chip opens its direct drawer or scrolls to its focus panel. Never repeats counts shown on the Today Strip.
2. **The Day Rail**:
   - Chronological vertical timeline unifying scheduled Google Meet / Zoom calls, WhatsApp 24-hour SLA expirations, follow-ups, and scheduled Meta broadcasts.
   - Live `NOW` marker with pulsing emerald indicator and real-time clock.
   - Overdue items sit strictly above the marker in Rose; the immediate upcoming item is emphasized with a primary one-click action.
3. **Pure Two-Hero Split on Overview**:
   - Left (7 cols): **Next Best Action** (white card, subtle Flame glow on left edge, authentic inbound customer message, Gemini-grounded reply draft with real recipient context, inline Send/Edit/Snooze/Done actions).
   - Right (5 cols): **Revenue Hero** (deep `#0B0D12` ink surface, 28px radius, tabular `₹4,20,000` figure with single-session count-up, proportional stage bar for open stages, Won this period, and win rate).

---

## 2. Color System: "Color is Meaning"
Every hue performs exactly one job across all views:
- **Flame (`#FF5A1F`)**: Primary user actions, active navigation indicator bar, high-priority attention.
- **Ultramarine (`#3D5AFE`)**: WhatsApp conversations, messaging threads, communication events.
- **Emerald (`#12B886`)**: Revenue, Won stage, business health, live sync states.
- **Amber (`#F5A524`)**: Time commitments, follow-ups, SLAs, Proposal stage.
- **Sky (`#1FA2E8`)**: Contacts, team members, Contacted stage.
- **Violet (`#7C4DFF`)**: Meta broadcasts, pre-approved templates, AI Engine.
- **Rose (`#E5484D`)**: Overdue deadlines, failed messages, Lost stage.
- **Neutrals**: `#0B0D12` & `#12151C` (Ink App Shell & Revenue Hero), `#F7F5F0` (Warm paper canvas), `#FFFFFF` (Surface), `#E6E2D8` (Hairline boundary), `#12141A` / `#454B57` / `#666C78` (Text 1 / 2 / 3).

---

## 3. Typographic Constraints & Ratios
- **Typeface**: Google Sans exclusively. Zero monospace, zero italics, zero weights > 600.
- **Tabular Figures**: Numeric values and monetary quantities formatted with `font-variant-numeric: tabular-nums`.
- **Fluid Root**: `html { font-size: clamp(16px, 0.35vw + 11.5px, 18px); }`.
- **Hierarchy Scale**:
  - Hero Metric: `5rem` / `80px`
  - Page Title: `2.25rem` / `36px`
  - Secondary Metric: `2rem` / `32px`
  - Section Heading: `1.25rem` / `20px`
  - Record Name: `1.0625rem` / `17px`
  - Body Content: `1rem` / `16px`
  - Secondary Copy: `0.875rem` / `14px`
  - Minimum Floor: `13px` for metadata; `>= 14px` for all interactive elements.

---

## 4. Unwired Data & Backend Dependencies
1. **Live Meta WhatsApp Cloud API**:
   - Currently operating in high-fidelity mock mode using `MockWhatsAppProvider`. Real inbound messages and delivery receipts will stream from Meta Webhook `/api/webhooks/whatsapp` once live access tokens are configured.
2. **Google Calendar & Zoom OAuth**:
   - Meetings and scheduled video calls are isolated per tenant in `calendarStore`. Live OAuth handshake routes (`/api/auth/google/callback`, `/api/auth/zoom/callback`) are designed and ready for cloud client secrets.
3. **Supabase PostgreSQL Migrations**:
   - Local preview runs with resilient in-memory stores that fall back cleanly when environment keys are absent. Running migrations against production PostgreSQL wires all 15 routes directly to multi-tenant RLS tables.
