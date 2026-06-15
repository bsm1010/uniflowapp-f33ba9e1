# Multi-Store Support for Fennecly

This is a large change. Today the whole app assumes **one store per user** — `store_settings.user_id` is the store, and every other table (orders, products, delivery_tariffs, ai_agent_settings, chatbot_settings, currency_settings, custom_domains, analytics_integrations, discount_codes, popups, abandoned_carts, contact_messages, instagram_connections, …) scopes data by `user_id` (the owner) via RLS.

Moving to multi-store means introducing a `stores` table and re-scoping every owner-keyed table to `store_id`. I want to confirm the plan before executing because it touches ~20 tables, all RLS policies, and most dashboard pages.

---

## 1. Database

### New `stores` table

- `id uuid pk`, `owner_id uuid` (→ profiles), `name`, `slug` (unique), `logo_url`, `description`, `category`, `currency`, `is_default bool`, `created_at`, `updated_at`.
- RLS: owner can CRUD their own stores. Public can `SELECT` minimal columns by slug (for storefront).
- Migration backfills one store per existing user from `store_settings` and stamps it as `is_default`.

### Add `store_id` to existing tables

Tables to migrate (nullable column → backfill from owner's default store → set NOT NULL → swap RLS):
`store_settings`, `products`, `categories`, `orders`, `order_items` (via order), `abandoned_carts`, `chatbot_conversations`, `chatbot_settings`, `ai_agent_settings`, `ai_agent_analytics`, `currency_settings`, `analytics_integrations`, `delivery_tariffs`, `discount_codes`, `popups`, `contact_messages`, `custom_domains`, `instagram_connections`, `ig_conversations`, `ig_messages`, `installed_apps`, `shipments` (if owner-scoped), `notifications` stays per-user.

> Note: `store_settings` becomes 1:1 with `stores` (keyed by `store_id`) instead of 1:1 with `user_id`.

### RLS rewrite

All existing "owner = auth.uid()" policies become "store belongs to auth.uid()" via a `SECURITY DEFINER` helper `public.user_owns_store(_store_id uuid)`.

### Per-user "current store"

Add `profiles.current_store_id uuid` so the active store survives reloads. The client sets it on switch.

## 2. Backend code changes

- All `createServerFn` handlers that today filter by `user_id` must filter by `store_id` (and verify ownership via the helper).
- `import-zr-orders.functions.ts`, `push-order.functions.ts`, `track-shipment.functions.ts`, `sync-tariffs.functions.ts`, `create-order.functions.ts`, builder/sections, ai-agent, etc. all need the active `storeId` passed in or read from `profiles.current_store_id`.
- Public storefront (`/s/$slug`) resolves `slug` against `stores` (not `store_settings.user_id`).

## 3. UI — new pieces

- **`useCurrentStore()` hook**: loads stores for the user, exposes `currentStore`, `stores`, `setCurrent(id)`. Persists to `profiles.current_store_id`.
- **`StorePickerDialog`**: full-screen frosted-glass modal (backdrop-blur). Fennecly logo, title "Which store would you like to manage?", grid of store cards (logo, name, category, orders badge), hover lift, dashed "+ Create New Store" card. Auto-opens on login if `stores.length > 1` and no current store. Skipped if only one.
- **`CreateStoreWizard`**: 3 steps (name/category/currency → logo/description → confirm preview). On confirm, inserts store + sets it current + navigates to dashboard.
- **Sidebar/topbar store switcher**: current logo + name button → opens `StorePickerDialog`.
- **`/dashboard/store-settings`** route: edit name / logo / category / currency, delete store (blocked when it's the only store).

## 4. Data isolation

Enforced server-side by RLS (helper function). Client always passes `store_id` from the active store; if missing, queries return empty.

## 5. Style

Reuse existing PageHeader, Card, Button, Dialog primitives, design tokens, font-display headings — matches the rest of Fennecly.

---

## Technical details (for review)

```text
stores
  id, owner_id, name, slug UNIQUE, logo_url, description,
  category, currency DEFAULT 'DZD', is_default, created_at, updated_at

profiles
  + current_store_id uuid NULL → stores(id) ON DELETE SET NULL

helper
  public.user_owns_store(_store_id uuid) RETURNS bool
    SECURITY DEFINER, checks stores.owner_id = auth.uid()

every owner-scoped table
  + store_id uuid NULL  -- backfill from default store
  ALTER ... SET NOT NULL after backfill
  DROP old "auth.uid() = user_id" policies
  CREATE policies USING public.user_owns_store(store_id)
```

Backfill strategy: for each user with rows in table T but no store yet, insert a default store from `store_settings` (or a generic "My Store" if absent), then `UPDATE T SET store_id = <that store>`. Atomic per-table, in a single migration.

---

## Scope check before I start

Two confirmations would help:

1. **Storefront URLs** (`/s/$slug`) — today the slug lives on `store_settings`. After migration, each store has its own slug and its own public storefront. Confirmed?
2. **Subscription / credits** stay per-user (not per-store), since billing is on the account. Confirmed?

If both are yes, I'll execute as one migration + a follow-up code pass (server fns + UI). If you want, I can deliver in two phases: (A) DB + switcher + create flow + isolation, then (B) per-page polish & store-settings page.

Reply "go" to proceed with the full plan, or tell me which pieces to drop / change.
