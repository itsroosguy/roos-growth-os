# WhatsApp Automation & CRM SaaS

A modern, multi-tenant Business OS module engineered for small businesses to manage leads, contacts, WhatsApp conversations, sales follow-ups, and automations from a single dashboard.

Built strictly with the official **Meta WhatsApp Business Platform Cloud API**, **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase PostgreSQL with Row Level Security (RLS)**.

---

## Architecture & Engineering Documentation

- [System Architecture Specification](docs/ARCHITECTURE.md)
- [Database Schema & Data Relationships](docs/DATABASE_SCHEMA.md)
- [Multi-Tenancy & Security Architecture](docs/MULTI_TENANCY.md)
- [WhatsApp Integration & Provider Architecture](docs/WHATSAPP_INTEGRATION.md)
- [Project Roadmap & Milestones](docs/ROADMAP.md)

---

## Key Technical Features

1. **Enterprise Multi-Tenancy**: Isolated workspaces with strict PostgreSQL Row-Level Security (RLS) policies and role-based permissions (`Owner`, `Admin`, `Staff`).
2. **Provider Abstraction**: Dual-mode messaging architecture featuring a development **Mock WhatsApp Provider** for zero-cost testing and an official **Meta Cloud API Provider** for production.
3. **Meta Policy Compliance**: Automated enforcement of Meta's 24-hour customer service window, message template restrictions, and explicit marketing consent/opt-out records.
4. **Reliable Background Automation**: Persistent database-backed job queue (`automation_executions`) with `FOR UPDATE SKIP LOCKED` batching, idempotency keys, and bounded retries.
5. **Cost-Optimized SaaS**: Built to run comfortably within a ₹5,000–₹15,000/month production budget without costly third-party broker dependencies.

---

## Development Setup

### Prerequisites
- Node.js 18+ (tested on Node 26)
- Git

### Initial Configuration
```bash
# 1. Copy the environment template
cp .env.example .env.local

# 2. Configure your Supabase project credentials in .env.local
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

See [Roadmap](docs/ROADMAP.md) for milestone implementation progress and instructions.
