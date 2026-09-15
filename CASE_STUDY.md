# FleetDesk — Case Study

**Studio:** Strelizia Creative Studio
**Type:** SaaS Product Design & Development
**Timeline:** 1 month
**Market:** France / Francophone Europe

---

## Overview

FleetDesk is a fleet management SaaS built for small and medium-sized businesses that operate vehicle fleets — logistics companies, field service teams, and transportation businesses. The platform centralizes vehicle tracking, driver management, maintenance scheduling, and compliance — replacing scattered spreadsheets and disconnected tools with a single, real-time operational hub.

---

## Problem

Fleet managers in the SMB segment operate in operational chaos. Vehicles, drivers, and maintenance records live in different spreadsheets, shared WhatsApp groups, or legacy desktop tools. The consequences are concrete:

- Double-booked vehicles due to no shared assignment view
- Missed technical inspections (MOT) and expired driver documents → compliance risk
- No visibility into maintenance cost trends across the fleet
- No audit trail for operations involving multiple team members

Off-the-shelf fleet software either targets enterprise (complex, expensive, over-featured) or is too generic to cover the French regulatory specifics (carte grise, technical inspection cycles).

**The gap:** no modern, well-designed SaaS at the SMB price point tailored to French fleet operators.

---

## Role & Scope

We designed and built FleetDesk from zero — strategy, UX, UI, and full-stack development.

- Product strategy & scoping
- UX research & information architecture
- UI design (design system, all screens)
- Frontend development (React + Vite)
- Backend & infrastructure (Supabase, Firebase, Vercel)
- Stripe billing integration
- Multi-tenant org model

---

## Users

**Primary — Fleet Manager (Admin)**
Responsible for the entire fleet. Assigns vehicles, monitors compliance, tracks costs. Usually non-technical. Needs speed, clarity, and zero cognitive overhead.

**Secondary — Collaborator**
A team member (dispatcher, assistant) with limited write access. Invited via email into the admin's organization. Needs to view and log day-to-day operations without touching billing or org settings.

---

## Design Approach

### Information Architecture

Fleet operations have a clear entity hierarchy: **Organization → Vehicles → Drivers → Assignments**. We anchored the IA around this hierarchy, giving each entity its own dedicated section with full list and detail views.

Cross-cutting concerns (maintenance, mileage, inspections, washing) are surfaced both on entity detail pages and in the dashboard — so a manager can either drill into a vehicle's history or get the fleet-wide view first.

### Dashboard as Command Center

The dashboard was designed to answer three questions in under 10 seconds:
1. Which vehicles need attention now?
2. Which drivers have expiring documents?
3. What's my fleet's usage trend?

We used a card-based layout with color-coded alerts (green/amber/red), a recharts line chart for monthly mileage per vehicle, and a maintenance forecast panel. Data is real-time — any update by a collaborator reflects immediately via Supabase subscriptions.

### Progressive Disclosure

Most operations in fleet management are add-on details to a core entity. We used modal dialogs and sheet-based drawers to handle secondary actions (add maintenance record, log mileage, upload document) without navigating away from the main list. This kept the primary navigation shallow and reduced orientation cost.

### Empty States as Activation Moments

Every empty state pairs an icon, a human explanation, and a direct CTA. Rather than a generic "no data" message, empty states tell the user exactly what to do next ("Add your first vehicle to start tracking your fleet"). This reduced friction during onboarding.

### Compliance-Forward Design

French fleet operators have specific regulatory requirements: carte grise validity, technical inspection cycles, driver medical certificates. We made document expiration a first-class UI concept — badges, color-coded countdowns, and predictive alerts based on known inspection intervals. The system surfaces upcoming expirations proactively, not reactively.

---

## UI Design System

| Token | Value |
|---|---|
| Primary | `#2563EB` (blue) |
| Destructive | `#DC2626` (red) |
| Success | `#10B981` (green) |
| Warning | `#F59E0B` (amber) |
| Font | Geist / system-ui |
| Border Radius | `0.5rem` |
| Base Unit | `4px` |

**Component foundation:** Radix UI primitives (accessible, unstyled) wrapped with custom Tailwind styling — giving us full design control without rebuilding accessibility from scratch.

**Dark mode:** Full dark theme via CSS HSL variables, stored in localStorage, toggled globally.

**Responsive:** Mobile-first. Sidebar collapses to icon-only at the `lg` breakpoint. Forms and tables reflow for mobile use.

---

## Key Features

### Vehicle & Driver Management
Full CRUD for vehicles (plate, model, status, documents) and drivers (profile, contact, certifications). Each entity has a detail page with tabs for history, documents, and linked records.

### Smart Assignment Engine
Assignment logic prevents double-booking by automatically closing an active assignment when a new one is created for the same vehicle or driver. Swap scenarios (same driver, different vehicle) are handled without data loss.

### Maintenance Forecasting
Custom forecasting algorithm (`maintenanceForecast.js`) predicts upcoming maintenance based on logged intervals and last service dates. Output surfaces on the dashboard with traffic-light status — no manual tracking required.

### Document Compliance Tracking
Drivers and vehicles each have a document management layer. Expiration dates trigger color-coded alerts. Fleet managers see compliance health at a glance.

### Real-Time Collaboration
Supabase Postgres Change subscriptions keep all connected users in sync. Collaborators' operations immediately reflect in the manager's view — no refresh required.

### Activity Log
Enterprise-tier audit trail. Every create, update, and delete is logged with user attribution, entity reference, and timestamp. Silent async writes — never blocks the main operation.

### Multi-Tenant Organizations
Org model with admin + collaborator roles. Collaborators join via email invite (CollaboratorWelcome flow), inherit org data scope on sign-up. Data isolation enforced at the query level via `org_id`.

### Billing & Plans
Stripe integration with plan-gated features (`usePlanLimits`). Billing success handled with a dedicated confirmation flow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite |
| Styling | Tailwind CSS v3, Radix UI, shadcn/ui patterns |
| State | TanStack React Query v5 + React Context |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Animations | Framer Motion |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| File Storage | Firebase Storage |
| Payments | Stripe |
| Hosting | Vercel |
| i18n | i18next + react-i18next |
| Notifications | Sonner (toasts) |
| PDF Export | jsPDF + html2canvas |

---

## Architecture Decisions

**Single data layer.** All queries and mutations live in `useFleetData.js`. Components consume hooks — no business logic leaks into UI components. This made the codebase navigable and components reusable.

**React Query as the data backbone.** Supabase real-time events invalidate the correct query keys, not individual state setters. Cache invalidation is centralized, not scattered across components.

**AppLayout waits for all critical queries.** Before rendering the app, we wait for the 9 core data queries to settle. Minimum 600ms loading state prevents flash. Smooth fade transition into the app. Result: zero skeleton jank, users land on a fully populated UI.

**Firebase for files, Supabase for everything else.** Firebase Storage handles binary uploads (PDFs, images) while Supabase handles all relational data. Clean separation — no mixing of concerns.

**Activity logging is always async.** `logActivity()` wraps every write in a non-blocking call. If the audit log fails, the user's operation succeeds. Reliability of core operations is never sacrificed for logging.

---

## Outcomes

- Shipped production-ready SaaS with full auth, billing, and multi-tenant collaboration
- Covers 9 operational modules under one UI shell with consistent patterns
- Real-time sync across org members — zero polling, zero refresh
- Full mobile-responsive — usable on a phone at the warehouse or on the road
- Dark mode built-in from day one
- French regulatory specifics (inspection cycles, carte grise) encoded into the product logic

---

## Learnings

**Compliance is a product feature, not an afterthought.** Users don't want to be told a document expired — they want to be warned 30 days before. Building predictive alerting directly into the data model (rather than layering it on top) was the right call.

**Org model complexity is hidden UX complexity.** Multi-tenant auth — especially the collaborator invite flow — has many edge cases (user already exists, wrong org, stale invite). We isolated these flows into dedicated pages with explicit error states so users never hit a dead end silently.

**Real-time raises expectations.** Once users see live updates, any staleness feels like a bug. The investment in Supabase subscriptions was non-negotiable once we committed to collaborative multi-user access.

---

*Built by Strelizia Creative Studio — product strategy, design, and full-stack development.*
*Contact: julian.khuy@gmail.com*
