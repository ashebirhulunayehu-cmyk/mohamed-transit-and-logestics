This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Run the frontend and API

The API source is in `backend/` and targets .NET 9. Install the .NET 9 SDK and Node.js dependencies, then start both development servers from the project root:

```bash
npm install
npm run dev:all
```

The frontend runs at `http://localhost:3000` and the API at `http://localhost:5254`; the frontend uses that API URL by default. Use `npm run dev` or `npm run dev:api` to run either server separately. The API's `http` launch profile uses its local SQLite configuration. Database snapshots and uploaded profile files from the upstream repository are intentionally not included.

## Customer sidebar summary

The customer layout loads its counters from `/api/customer/sidebar-summary`. The route
requires an `accessToken` cookie and forwards it to the backend. Set
`BACKEND_API_URL` to the backend API root (defaults to `http://localhost:5254/api/v1`).
Set `CUSTOMER_SIDEBAR_USER_ID` to the authenticated importer's numeric user ID; local
development defaults to the provided simulation account ID `3`, while other
environments must configure the ID explicitly. The route normalizes SQLite `0`/`1`
flags into booleans and returns an error instead of fabricated counts if a backend
request fails.

## Customer dashboard backend routes

The customer home page redirects to `/[lang]/customer/dashboard`, which provides
shipment, tax-record, document, and support-request views. Authenticated API
proxies forward shipment reads to `/Customer/GetMyServices`, document reads to
`/Document/GetServiceDocuments` (with a `serviceId` query parameter), and
downloads to `/Document/DownloadDocument?documentId=...`. Tax records are loaded
from `/TaxRecords/GetByCustomer/{customerUserId}` by `/api/customer/tax`; the
proxy normalizes numeric status codes `0` and `1` to `Unpaid` and `Paid`. In
development the customer ID defaults to `3`; configure `CUSTOMER_SIDEBAR_USER_ID`
explicitly in other environments.

`/api/customer/support` forwards GET requests to `/SupportRequests/GetMine` and
validated POST requests to `/SupportRequests/Create`. Ticket creation accepts
`subject`, `description`, and priority `Low`, `Medium`, or `High`; the proxy sets
`status` to `Pending`. All proxy reads bypass caches and forward the authenticated
access token. The payment dialog is a preview only; it does not charge or mark a
tax assessment paid.

The workflow verifies the importer profile through `/Customer/GetProfile`
before loading customer records. Shipment data comes from
`/Shipments/GetByImporter/{customerUserId}`; stage executions use
`/stages/executions/customer/{customerUserId}`. The proxy maps SQLite-style
`IsVerified`, `IsBlocked`, and `RequiresCustomerAction` flags to JSON booleans,
and the dashboard renders actual stage executions and their issue descriptions.
For the local simulation account, `CUSTOMER_SIDEBAR_USER_ID` defaults to `3` in
development. Non-development deployments must configure the authenticated
importer's ID.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
