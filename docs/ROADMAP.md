# Product Roadmap & Milestone Execution Plan

## Milestone Overview & Tracking

| Milestone | Scope / Deliverable | Status |
| :--- | :--- | :---: |
| **Milestone 1** | Inspect repository, prepare architecture, schema, security plan & roadmap | **Completed** |
| **Milestone 2** | Design system, authentication & organization model (Next.js, shadcn/ui, Supabase Auth) | Pending Review |
| **Milestone 3** | Implement & test tenant security (PostgreSQL RLS, automated cross-tenant tests) | Planned |
| **Milestone 4** | Build contacts, leads & sales pipeline (CSV import, board view, stage transitions) | Planned |
| **Milestone 5** | Build tasks, follow-ups & sales dashboard (real-time metrics, empty states) | Planned |
| **Milestone 6** | Add mock WhatsApp provider & shared inbox (simulated messages, 24h window UI) | Planned |
| **Milestone 7** | Add live Meta Cloud API integration (webhook signature validation, official templates) | Planned |
| **Milestone 8** | Add automation templates & background processing (DB queue, idempotency, retries) | Planned |
| **Milestone 9** | Add subscription foundations, usage limits & reporting (tier quotas, audit logs) | Planned |
| **Milestone 10**| Complete end-to-end testing, documentation & production deployment preparation | Planned |

---

## Detailed Milestone Execution Breakdown

### Milestone 1: Inspect Repository & Implementation Plan (Completed)
- [x] Inspect local workspace tools (Node 26.8.2, npm 11.19.1, Git initialized).
- [x] Create project `.gitignore` and `.env.example`.
- [x] Produce comprehensive system architecture blueprint (`docs/ARCHITECTURE.md`).
- [x] Design complete 17-table relational database schema with ER diagram (`docs/DATABASE_SCHEMA.md`).
- [x] Define multi-tenant Row-Level Security and role permissions (`docs/MULTI_TENANCY.md`).
- [x] Specify WhatsApp provider abstraction and Meta compliance rules (`docs/WHATSAPP_INTEGRATION.md`).
- [x] Document cost budget, technical risks, and mitigation strategies.
- [x] Commit Milestone 1 to Git.

---

### Milestone 2: Design System, Authentication & Organization Model
- [ ] Initialize Next.js 14/15 App Router project with TypeScript strict mode and Tailwind CSS.
- [ ] Install and configure shadcn/ui component primitives (Button, Input, Card, Dialog, Table, Badge).
- [ ] Implement Supabase client/server SSR wrappers (`@supabase/ssr`).
- [ ] Create authentication flows: Sign up, Login, Password Reset, Auth Callback.
- [ ] Implement Organization creation and user membership flow (Owner role initialization).
- [ ] Implement Organization switcher and route layout (`/app/[orgSlug]/...`).
- [ ] Build global navigation: Overview, Inbox, Leads, Contacts, Automations, Tasks, Reports, Team, WhatsApp, Subscription, Settings.

---

### Milestone 3: Implement & Test Tenant Security
- [ ] Create initial Supabase SQL migration (`20261012000001_initial_schema.sql`) for core tables.
- [ ] Create RLS migration (`20261012000002_rls_policies.sql`) with helper functions.
- [ ] Implement automated integration test suite for tenant isolation:
  - Create Org A and Org B with distinct users.
  - Verify Org A cannot read, insert, update, or delete Org B records via authenticated client.
  - Verify role constraints: Staff cannot delete or configure settings.
- [ ] Verify no secrets exposed in client bundles.

---

### Milestone 4: Contacts, Leads & Sales Pipeline
- [ ] Build Contacts management: List, search, filter, create, edit, archive.
- [ ] Build CSV import/export with client & server-side validation and duplicate detection.
- [ ] Implement separate marketing consent tracking per contact (Meta compliance).
- [ ] Build Leads management: Table view and Kanban pipeline board (Stages: New, Contacted, Qualified, Proposal, Won, Lost).
- [ ] Build Lead detail page displaying contact details, activity history, deal value, and next follow-up.

---

### Milestone 5: Tasks, Follow-ups & Sales Dashboard
- [ ] Build Tasks & Follow-up views with date filters (Due today, Overdue, Upcoming, Completed, Assigned to me).
- [ ] Implement Task creation, completion, and rescheduling.
- [ ] Build Overview Dashboard computing real metrics from database:
  - Total leads, new leads this month, leads by stage.
  - Open & overdue follow-ups, won/lost deals, pipeline deal value, conversion rate.
- [ ] Ensure accessible empty states and loading skeletons.

---

### Milestone 6: Mock WhatsApp Provider & Shared Inbox
- [ ] Create `IWhatsAppProvider` interface and mock provider implementation.
- [ ] Build Shared Inbox UI: Conversation list, active thread, message composer, customer profile sidebar.
- [ ] Add Mock Message Simulator panel to test incoming customer chats and status transitions (`sent` -> `delivered` -> `read`).
- [ ] Implement 24-hour customer service window timer and UI restrictions (disabling free-form text when expired).
- [ ] Clearly label all simulated records with `[MOCK / DEV MODE]`.

---

### Milestone 7: Live Meta Cloud API Integration
- [ ] Implement `MetaCloudApiProvider` using official Meta Graph API v20.0+.
- [ ] Build WhatsApp Settings page for credentials input (`phone_number_id`, `waba_id`, System User access token).
- [ ] Implement AES-256 token encryption at rest.
- [ ] Implement Webhook Verification (`GET /api/webhooks/whatsapp`) with challenge response.
- [ ] Implement Webhook Event Ingestion (`POST /api/webhooks/whatsapp`) with HMAC-SHA256 signature verification and `wamid` deduplication.
- [ ] Support official WhatsApp Message Templates synchronization and sending.
- [ ] Build test message verification tool requiring confirmed delivery before marking connection "live".

---

### Milestone 8: Automation Engine & Background Processing
- [ ] Build Automation Rules UI with predefined templates:
  - Triggers: Lead created, Stage changed, Follow-up due, Lead assigned, Incoming message, No reply, Won/Lost.
  - Actions: Create task, Assign lead, Add internal note, Queue email, Queue permitted WhatsApp message.
- [ ] Implement persistent database job queue (`automation_executions`) with `FOR UPDATE SKIP LOCKED`.
- [ ] Build idempotent queue processor (`/api/cron/process-jobs`) with exponential backoff (max 3 retries) and infinite loop circuit breaker.
- [ ] Add execution logs and manual retry/pause controls.

---

### Milestone 9: Subscription Foundations, Usage Limits & Reporting
- [ ] Configure plan structures (Starter, Growth, Business) with explicit seat, contact, and WhatsApp quotas.
- [ ] Implement server-side entitlement enforcement checks preventing quota overruns.
- [ ] Build Usage & Subscription view displaying current monthly usage vs. plan limits.
- [ ] Build Reports view with visual pipeline conversion rates, response times, and team performance metrics.
- [ ] Maintain immutable `audit_logs` for sensitive administrative events.

---

### Milestone 10: Complete Testing, Documentation & Deployment
- [ ] Full automated test suite execution (Unit, Integration, E2E).
- [ ] TypeScript strict check & ESLint verification (`npm run build` zero-error test).
- [ ] Complete developer runbook, migration guide, and production deployment checklist.
- [ ] Verify commercial terms and budget caps (₹5,000–₹15,000/mo).
- [ ] Final Git tag and release commit.
