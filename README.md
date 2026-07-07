# Home Maintenance

**"Dedicated to Changing Lives"** — hire vetted local home-service workers in Zimbabwe.

React 18 + Vite SPA backed by Appwrite (project `homemaintenance`, database `main`).

## Features

- Splash screen + first-open 3-step onboarding (localStorage flag)
- Browse approved workers with search, category chip filters, and area filter
- Public stats (Workers / Available Now)
- Email+password auth (Appwrite Accounts)
- "Register as Worker" flow (profiles go live after admin review)
- Instant hire flow: booking form (address, optional GPS, description, schedule) → PayNow Zimbabwe payment screen (EcoCash / OneMoney / Telecash / ZIPIT / Visa-Mastercard) → escrow booking with `HM-XXXXXX` reference
- My Bookings: confirm job done (releases worker, prompts star rating) and request refund after 24h in escrow
- Ratings & reviews with client-side worker rating recompute
- Worker dashboard: profile status, availability toggle, jobs, notifications
- Complaints form
- Notification bell with unread badge, mark-as-read, ~30s polling + refresh on navigation
- Admin panel (`/admin`, members of Appwrite team `admins`): stats incl. customers & platform earnings, worker approvals/suspension, bookings & payment history with status actions, complaints inbox, category price editor

## Run

```bash
npm install
npm run dev     # local dev
npm run build   # production build (dist/)
```

Deployed as a static SPA — the host must serve `index.html` as fallback for all routes.

## Configuration

Public client values (Appwrite endpoint, project id, database id, collection ids, admin team id, fee rate) live in `src/lib/config.js`. No secrets are used by the client.

### Env vars (only needed for real payments later)

- `VITE_PAYNOW_INTEGRATION_ID`
- `VITE_PAYNOW_INTEGRATION_KEY`

## PayNow integration point

Payment is currently **simulated** in `src/lib/paynow.js` (`simulatePayment`). The file documents the production path: move transaction creation server-side (e.g. an Appwrite Function) since the PayNow integration key must remain secret, then poll the returned URL until `Paid`. Keep the same `{ success, reference, method }` return shape and nothing else in the app needs to change.

## Data / permissions notes

- Collections: `categories`, `workers`, `bookings`, `reviews`, `complaints`, `notifications` (schema already provisioned in Appwrite).
- `bookings`, `complaints`, `notifications` use document security: documents are created with explicit `Permission.read/update` for the owning user, the worker's user (bookings), and `Role.team('admins')`.
