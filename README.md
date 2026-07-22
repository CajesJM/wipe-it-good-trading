# Wipe It Good Trading

Equipment-focused e-commerce scaffold for generators, power tools, carwash equipment, hand tools, and accessories.

## Run the storefront

```bash
npm install
npm run dev
```

The React app now uses the API under `server/` for catalog, authentication, cart, addresses, checkout, order history, and admin operations. There are no client-side users or product records. Every customer must register with a real email, legal name, phone number, and complete delivery address.

## Production implementation

- Architecture and flows: [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md)
- PostgreSQL/Prisma schema: [`server/prisma/schema.prisma`](server/prisma/schema.prisma)
- API bootstrap and payment adapter: [`server/src`](server/src)

Set `VITE_API_URL` to the deployed API origin (the development default is `http://localhost:5000/api`). Start PostgreSQL, run the Prisma migration and seed, then start the API before the Vite app.

```bash
cd server
npm install
npx prisma migrate dev --name initial
npm run db:seed
npm run dev
```

## Important payment rule

Never fulfill a GCash order from a browser redirect, uploaded screenshot, or client-supplied status. Mark it paid only after the server validates a signed payment-provider webhook and stores the event idempotently.
