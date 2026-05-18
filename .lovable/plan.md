## Goal

Build a Shopify-style marketplace for developer-submitted apps that lives alongside the existing built-in apps (APPS in `src/lib/apps.ts` stays untouched). Clicking any app card — built-in or marketplace — opens the Shopify-style detail page you screenshotted (left meta column, hero/screenshots, install/buy button).

## Phased approach

Splitting into 4 phases so each turn ships something working. After each phase you preview, give feedback, then I continue.

### Phase 1 — Foundation + Shopify-style detail page (this turn)
- DB migration: `apps`, `app_purchases`, `app_reviews`, `developer_profiles` tables + RLS + storage bucket `marketplace-assets`
- `useAppRoles` hook + `is_marketplace_admin` check
- Replace current `dashboard.apps.listing.$appKey.tsx` with the Shopify-style layout: sticky left rail (icon, title, pricing, rating, developer, Install/Buy button), centered hero screenshot, right-side screenshot stack, long description, screenshot lightbox carousel
- Works for both built-in apps (from `APPS`) and marketplace apps (from DB) via a unified loader

### Phase 2 — Submission + browse + developer dashboard
- `/dashboard/apps/submit` — submission form (name, description, category, URL, price, up to 5 screenshots → Supabase Storage)
- `/dashboard/apps/marketplace` — browse approved apps with category filter, price filter (free/paid), search
- `/dashboard/developer` — developer's own apps with status badges, edit, earnings; profile section (bio, website)

### Phase 3 — Admin review + ratings
- `/dashboard/admin/marketplace` — admin panel (gated by `marketplace_admin` role) with pending/approved/rejected tabs and approve/reject actions; sends `notifications` row to developer
- Rating/review system on detail page (1-5 stars + text, only buyers can leave reviews); average rating shown on cards
- "My Apps" tab merging built-in installed + marketplace purchased; "Developer" badge for users with submitted apps

### Phase 4 — Stripe payments
- Enable Lovable Payments (Stripe) — requires Pro plan; I'll run the eligibility check and walk you through
- "Buy for $X" creates a Stripe checkout session via server function; webhook records `app_purchases` row with `stripe_payment_id`
- 10% platform fee via `application_fee_amount` (needs Stripe Connect for developers — added in this phase)

## Technical notes

- **Coexistence**: built-in `APPS` (Discount Generator, Email Marketing, …) keep their current install flow via `installed_apps` + the Make.com webhook. Marketplace apps use `app_purchases`. The detail page route detects which source the app comes from.
- **Routes**: All under `/dashboard/*` (uses the existing auth-gated dashboard layout). No new public routes.
- **Storage**: New public bucket `marketplace-assets` for screenshots and app icons. Folder-scoped RLS (`{user_id}/...`).
- **Server functions**: Submission moderation, purchase creation, and Stripe checkout go through `createServerFn` with `requireSupabaseAuth`.
- **Admin gate**: New `marketplace_admin` value added to the existing `app_role` enum and granted via `user_roles`.

## What I need from you to start

Just approve this plan. I'll start with Phase 1 (DB migration first, you approve it, then I build the detail page).
