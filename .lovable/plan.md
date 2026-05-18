# ZRExpress integration — full fix

## What's already in place (verified)

- `ZRExpressAdapter` already calls Procolis with the correct headers (`token: secretKey`, `key: tenantId`) for `add_colis`, `lire`, and `token` (validate).
- `ZRExpressTariffsService` already fetches `/tarification` and normalizes to `{wilaya, city, delivery_type, price}`.
- `syncDeliveryCompanyTariffs` already upserts those into `delivery_tariffs` for the store.
- `delivery_tariffs` is already read by the checkout (`AlgerianCheckoutForm`) and the order server fn to compute shipping price by wilaya + delivery type.
- `ShippingCompaniesSection` already parses the pasted JSON `{secretKey, tenantId}` correctly and maps them to `apiKey`/`apiSecret`.

So credential storage, tariff fetch, and checkout pricing are wired. The gaps are: validation is mocked, orders never reach Procolis, no status sync, no manual resend, errors are swallowed.

## Changes

### 1. Re-enable real credential validation
`src/lib/delivery/validate.functions.ts` currently sets `result = { success: true }` without pinging the provider. Replace with a real call to `ZRExpressService.validateApiKey(secretKey, tenantId)` (already implemented — hits `/token` on Procolis). Return the actual error message on failure so the UI shows it.

### 2. Push order to ZRExpress on creation
In `src/lib/orders/create-order.functions.ts`, after the `shipments` row is inserted, look up the store's default delivery company (or the `companyId` passed in), load its credentials, and call `ZRExpressAdapter.createShipment(...)`. On success:
- update the `shipments` row with `tracking_number`, `status: "created"`, `provider_response`
- update the `orders` row with `tracking_number` and `status: "confirmed"`

On failure: keep the shipment in `pending` with `last_error` set so the dashboard can show it and the user can retry. Order creation itself must NOT fail just because the provider push failed (graceful degradation).

Schema additions to `shipments` (migration): `tracking_number text`, `last_error text`, `provider_response jsonb`, `last_sync_at timestamptz`. Add `tracking_number text` to `orders` as well.

### 3. Manual "Send to ZRExpress" button
New server fn `pushOrderToProvider({ accessToken, orderId, companyId? })` in `src/lib/delivery/push-order.functions.ts`:
- auth the caller, verify the order belongs to them
- resolve company (passed-in or store default)
- call the adapter, persist tracking number + status to `shipments` + `orders`
- return `{ ok, message, trackingNumber? }`

UI: in `src/routes/dashboard.orders.tsx`, add a "Send to ZRExpress" action per row when the shipment is `pending` or has `last_error`. Show the tracking number and last error inline once available.

### 4. Periodic status sync
New public cron route `src/routes/api/public/hooks/sync-shipment-statuses.ts`:
- guarded by the project anon key in the `apikey` header (standard pattern)
- selects active shipments (`status IN ('pending','created','in_transit')`) with a tracking number, joined to their store's credentials
- calls `adapter.trackShipment(tracking_number)` for each
- updates `shipments.status` + `last_sync_at`, and mirrors a coarse status onto `orders.status` (in_transit → shipped, delivered → delivered, failed/cancelled → cancelled)

Schedule via `pg_cron` + `pg_net` every 30 minutes against the stable `project--{id}.lovable.app` URL.

### 5. Clear error UX
- `pushOrderToProvider` returns a typed error message (no raw provider stack traces) — the UI toasts it and stores `last_error` so it's visible later.
- `validateAndActivateDeliveryCompany` already surfaces a message; with #1 done it'll reflect real Procolis errors (invalid token, expired tenant, network).
- Shipments table in `dashboard.shipments.tsx` shows `last_error` when present.

## Technical notes

- Tariff sync remains a manual "Sync tariffs" button (already wired in `TariffsSection`). Optionally trigger it once at connect time after #1 succeeds — small follow-on.
- The `orders.tracking_number` column needs adding via migration. `shipments` likely already has `tracking_number` (check before migrating).
- Status mapping uses the existing `mapZRStatus` in the adapter — no duplication.
- Cron job uses `apikey: <anon>` header per project guidelines; no new secret needed.

## Files touched

- migration: add columns to `shipments` and `orders`
- `src/lib/delivery/validate.functions.ts` — real validation
- `src/lib/delivery/push-order.functions.ts` — NEW
- `src/lib/orders/create-order.functions.ts` — auto-push after insert
- `src/routes/api/public/hooks/sync-shipment-statuses.ts` — NEW (cron target)
- `src/routes/dashboard.orders.tsx` — manual send button + tracking/error display
- `src/routes/dashboard.shipments.tsx` — show last_error + tracking
- pg_cron schedule via insert tool
