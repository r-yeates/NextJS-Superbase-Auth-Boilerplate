# Next.js + Supabase Auth Boilerplate

A clean, production-ready authentication starter using Next.js (App Router) and Supabase. Clone it, point it at your Supabase project, and you're done.

## What's included

- Email/password sign up, sign in, password reset, and email verification
- Server-side sessions via `@supabase/ssr` (secure HttpOnly cookies)
- Middleware-based route protection
- Rate limiting (brute force + user enumeration protection) backed by a Supabase table
- Tailwind CSS UI, fully typed with TypeScript

## Quick start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd auth
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Project Settings** → **API** and copy your **Project URL**, **anon key**, and **service role key**

### 3. Set environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> For production, set `NEXT_PUBLIC_SITE_URL` to your live domain. The service role key is used server-side only for rate limiting and is never exposed to the client.

### 4. Create the rate limiting table

In the Supabase **SQL Editor**, run:

```sql
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits (identifier, created_at);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
```

Optionally add a scheduled cleanup (pg_cron or Supabase scheduled functions):

```sql
DELETE FROM public.rate_limits WHERE created_at < NOW() - INTERVAL '2 hours';
```

### 5. Configure Supabase auth settings

In your Supabase Dashboard:

1. **Authentication** → **URL Configuration** → add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (production)

2. **Authentication** → **Email Templates** → update the **Confirm signup** template's confirmation URL to:
   ```
   {{ .SiteURL }}/auth/callback?code={{ .Token }}
   ```

3. **Authentication** → **Providers** → ensure **Email** is enabled with **email confirmations** toggled on.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
├── auth/
│   ├── actions.ts              # Server actions (sign in, sign up, reset, etc.)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── reset-password/page.tsx
│   ├── update-password/page.tsx
│   ├── verify-email/page.tsx
│   ├── callback/route.ts       # Supabase auth callback handler
│   └── auth-code-error/page.tsx
├── dashboard/page.tsx          # Protected route example
└── page.tsx                    # Public home page
lib/
├── supabase/
│   ├── server.ts               # Server-side Supabase client
│   ├── client.ts               # Client-side Supabase client
│   ├── middleware.ts            # Session refresh helper
│   └── service.ts              # Service role client (rate limiting)
├── rateLimit.ts                # Rate limiting logic
└── validation/password.ts      # Password rules
middleware.ts                   # Route protection
```

## Route protection

- **Public**: `/`, `/auth/*`
- **Protected**: `/dashboard` and everything else
- Authenticated users visiting `/auth/*` are redirected to `/dashboard`
- Unauthenticated users visiting protected routes are redirected to `/auth/login`

## Accessing the user

**Server component:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return <div>Hello, {user.email}</div>
}
```

**Client component:**

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientComponent() {
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return <div>{user?.email}</div>
}
```

## Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Add your four environment variables in the Vercel dashboard (or via `vercel env add`), and update `NEXT_PUBLIC_SITE_URL` and your Supabase redirect URLs to your production domain.

## Customisation

- **Styles** — Tailwind CSS; edit `app/globals.css` or individual page files
- **Email templates** — Supabase Dashboard → **Authentication** → **Email Templates**
- **Rate limits** — adjust `CONFIGS` in `lib/rateLimit.ts` (attempts/window per action)
- **OAuth providers** — enable in Supabase Dashboard, add a sign-in button calling `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`

## Troubleshooting

| Problem | Fix |
|---|---|
| Confirmation email not arriving | Check spam; verify redirect URL includes `/auth/callback` |
| Wrong redirect after login | Check `NEXT_PUBLIC_SITE_URL` matches your current domain |
| Rate limit errors without the table | Run the SQL from step 4 — auth still works without it (fails open) |
| Routes not protected | Confirm `middleware.ts` is in the project root, not inside `app/` |

## License

MIT — use it however you like.
