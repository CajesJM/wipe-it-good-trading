# System design

## Scope

Wipe It Good Trading is a mobile-first Philippine equipment store. The catalog is organized around generators, power tools, carwash equipment, hand tools, and accessories. Customers can browse, save addresses, place COD or GCash orders, and follow delivery updates. Staff can manage inventory, orders, customers, and sales.

## Architecture

```text
React/Vite storefront + admin
          |
          | HTTPS / JSON (JWT or secure cookie)
          v
Node/Express API ---- payment provider (GCash checkout + signed webhook)
       |    |  \
       |    |   +---- courier/tracking adapter
       |    +-------- object storage/CDN for product images
       v
PostgreSQL + transactional outbox
```

Deploy the storefront behind a CDN and the API as a separate service. PostgreSQL is the source of truth. Product media belongs in object storage; only metadata and URLs belong in the database. Redis is optional for rate limiting, short-lived carts, and jobs, but not required for the first release.

## Key workflows

### Checkout

1. Client submits address id, item quantities, and payment method.
2. API reloads product prices and stock from PostgreSQL; it never trusts client totals.
3. In one transaction, API creates the order/items, snapshots the delivery address, reserves stock, and records an initial status event.
4. COD returns an order confirmation immediately with payment status `PENDING`.
5. GCash creates a provider checkout session and returns its redirect URL. The order remains `PAYMENT_PENDING`.
6. A signed provider webhook records the immutable payment event, updates payment/order state idempotently, and enqueues confirmation.
7. Expired or failed payments release reservations. Shipment deducts or finalizes committed inventory according to the selected inventory policy.

### Fulfillment

Admin confirms → packs → adds courier/tracking number → ships → delivers. Every state change appends an `OrderStatusEvent`, creating a customer-visible timeline and an audit trail.

### Cancellation and refunds

Only valid state transitions are accepted. Cancelling an unshipped order releases reserved stock. Paid GCash orders create a refund record and stay in `REFUND_PENDING` until the provider webhook confirms the refund. COD orders never become paid until delivery/collection is recorded.

## API surface

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/products?category=&q=&sort=&cursor=
GET    /api/products/:slug
GET    /api/categories
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
GET    /api/addresses
POST   /api/addresses
POST   /api/checkout/quote
POST   /api/orders
GET    /api/orders
GET    /api/orders/:orderNumber
POST   /api/orders/:id/cancel
POST   /api/payments/gcash/session
POST   /api/webhooks/payments/:provider

GET    /api/admin/metrics
CRUD   /api/admin/products
CRUD   /api/admin/categories
GET    /api/admin/orders
PATCH  /api/admin/orders/:id/status
PATCH  /api/admin/orders/:id/shipment
GET    /api/admin/customers
POST   /api/admin/inventory/adjustments
```

All mutating checkout/payment endpoints accept an `Idempotency-Key`. Admin routes require the `ADMIN` role. Public product routes expose only active products and public inventory availability.

## Data rules

- Store money as integer centavos (`amount = 4850000` means PHP 48,500.00).
- Snapshot product name, SKU, unit price, and delivery address on the order; future catalog/profile edits must not rewrite history.
- Use an inventory ledger plus `stockOnHand` and `stockReserved`; never infer stock solely from order rows.
- Provider event ids and payment references are unique.
- Soft-disable products rather than deleting rows referenced by orders.
- Normalize phone numbers to E.164 and store timestamps in UTC; render them in Asia/Manila.

## GCash integration boundary

`PaymentGateway` isolates the API from a specific provider. Configure a regulated payment provider/merchant account that supports GCash checkout, then set `PAYMENT_CREATE_URL` and `PAYMENT_API_KEY` for the server adapter. Checkout returns the provider-hosted URL, so the browser leaves the store and the customer pays in the GCash/provider flow. Keep provider secrets server-side. Verify webhook signatures against the raw request body, reject replayed event ids, and reconcile pending payments with the provider on a scheduled job. The included sandbox fallback is only for local development and must not be used for live orders.

## Security and operations

- Argon2id password hashing, short-lived access tokens, rotating refresh tokens, and email/phone verification.
- Rate limits on auth, checkout, and webhook routes; Zod validation on every request.
- CSRF protection if cookie auth is used; strict CORS and secure headers.
- Redact address, phone, token, and payment data from logs. Never store GCash credentials or wallet PINs.
- Nightly backups plus tested point-in-time restore; audit logs for admin inventory/order changes.
- Alerts for webhook failures, negative stock, payment/order mismatches, and stuck shipments.

## Delivery phases

1. Catalog, accounts, addresses, cart, COD, admin inventory/orders.
2. GCash sandbox checkout, signed webhooks, reconciliation, transactional email/SMS.
3. Courier tracking, refunds, reports, low-stock alerts, wholesale price lists.
4. Reviews, promotions, wishlists, product variants, and multi-warehouse inventory if demand requires them.
