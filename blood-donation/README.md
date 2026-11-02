# HayatLink

A Pakistan-focused blood donation web app. Visitors search active local donors by **blood group** and **city**, then connect on WhatsApp. Seekers can also post hospital requests to a public emergency feed.

Frontend is **JavaScript** on **Next.js App Router** with **Bootstrap**. Data lives in **PostgreSQL on Supabase** (`@supabase/supabase-js` + `@supabase/ssr`). Until Supabase keys are set, the app runs a local demo store so the full UI can be used immediately.

## Features

- Standardized Pakistan city list (searchable autocomplete) on registration and search
- 90-day donation cooldown: donors who gave blood in the last 90 days never appear in public results
- Privacy wall: search cards show name, blood type, city, and area — never a phone number as text
- WhatsApp deep-link with a polite, pre-filled Urdu-English request message
- Public emergency feed for Critical / Urgent / Routine hospital appeals
- Donor dashboard: availability switch and last-donation date

## Quick start (demo mode)

```bash
cd blood-donation
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo search: **O+** in **Lahore**. Demo donor login: `fatima@hayatlink.pk` / `demo12345`.

## Connect Supabase (production)

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL Editor. It creates `profiles`, `blood_requests`, check constraints, lookup indexes, the `available_donors` view, and RLS policies.
3. Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
```

4. In Supabase Auth, add the site URL and `/auth/callback` redirect.
5. Restart `npm run dev`. Demo mode turns off automatically when both env vars are present.

## Scripts

```bash
npm run dev    # development server
npm run lint   # ESLint
npm run build  # production build
npm start      # serve the production build
```

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Landing search (blood group + city) |
| `/donors` | Public donor results + WhatsApp connect |
| `/request` | Post a hospital blood request |
| `/feed` | Chronological emergency feed |
| `/login` `/register` | Donor authentication |
| `/dashboard` | Availability + last donation date |

## Privacy & cooldown

Public queries use the `available_donors` view, which applies `donor_currently_available(is_available, last_donation_date)`. Phone numbers are stored so the server can build `https://wa.me/923XXXXXXXXX` links; they are not rendered as text on donor cards.
