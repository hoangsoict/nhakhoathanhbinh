---
name: nextjs-supabase-web
description: Checklist làm việc với Next.js App Router, API route, Supabase (DB/Storage), biến môi trường và triển khai Vercel của dự án nhakhoathanhbinh. Dùng khi sửa API, env, schema, storage hoặc deploy.
---

## Use When

- Next.js, Vercel, Supabase, API routes.
- Environment variables.
- Database integration.
- Storage.
- Deployment.

## Checklist

- Identify client component vs server route execution.
- Check required env vars:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `SUPABASE_JWKS_URL`
  - `ADMIN_PIN`
- Do not expose `SUPABASE_SECRET_KEY` or real `ADMIN_PIN` to client code.
- Validate input in API routes.
- Keep public-facing errors in Vietnamese when appropriate.
- For Supabase queries, handle error and empty-data paths.
- For schema changes, update `supabase/schema.sql` idempotently.
- For storage, check bucket `clinic-assets` and public URLs.
- Check Vercel deployment impact.
- Run `npm run lint` and `npm run build` when feasible.

## Common Files

- `app/api/**/route.ts`
- `lib/supabase.ts`
- `lib/settings.ts`
- `lib/appointments.ts`
- `supabase/schema.sql`
- `.env.example`
