# AceScholar

Elite academic writing, technical drafting, and programming solutions platform.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS 4, Lucide icons
- **Backend:** Express, TypeScript (tsx)
- **Database:** Supabase (PostgreSQL + Auth + Storage)

## Quick Start

```bash
npm install
cp .env.example .env   # fill in your Supabase keys
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build frontend + bundle server |
| `npm start` | Run production server |
| `npm run lint` | TypeScript type check |

## Project Structure

```
server/
  index.ts              # Express entry point
  lib/                  # Shared server utilities
    supabase.ts         # DB clients
    validation.ts       # Input sanitization
    utils.ts            # Role derivation, expert matching
  routes/               # API route handlers
    auth.ts             # Login, signup, email verification
    orders.ts           # Order CRUD
    payments.ts         # Payment processing
    profiles.ts         # Profile + expert management
    messages.ts         # Order chat messages
    contacts.ts         # Contact form
    upload.ts           # File uploads
src/
  components/           # React components
  lib/supabase.ts       # Frontend API client
  types.ts              # TypeScript interfaces
migrations/             # SQL migration scripts
```

## Environment Variables

See `.env.example` for required variables. Key ones:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase project credentials
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin access
- `ADMIN_EMAIL` — Email granted admin role (immutable)
