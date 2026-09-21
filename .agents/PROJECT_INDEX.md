# Project Index

## Project

`nhakhoathanhbinh` is an appointment website for Nha Khoa Thanh Binh.

- Public site: `/`
- Internal site: `/manage`
- Public identity key: phone number
- No public accounts, login, or appointment codes
- Internal roles: `admin`, `maintain`

## Stack

- Next.js App Router, React, TypeScript.
- Supabase Postgres via `@supabase/supabase-js`.
- Public Supabase Storage bucket `clinic-assets` for homepage media.
- Vercel deployment.
- ESLint flat config.

## Main Paths

- `app/`: Next.js App Router, UI, API route.
- `app/page.tsx`: public customer UI.
- `app/manage/page.tsx`: internal `/manage` UI.
- `app/manage/reports-panel.tsx`, `app/api/admin/reports/route.ts`, `lib/reports.ts`: admin/maintain date-range reports and CSV export, limited to one month.
- `app/api/appointments/`: public booking, lookup, edit, cancel, availability.
- `app/api/admin/`: internal appointments, settings, session, users.
- `app/api/settings/homepage/route.ts`: public homepage settings API.
- `lib/appointments.ts`: appointment types, date/time helpers, business validation.
- `lib/settings.ts`: clinic settings load/save.
- `lib/supabase.ts`: Supabase admin client.
- `supabase/schema.sql`: idempotent schema/migration.
- `docs/URD/`: Vietnamese business requirements.
- `.agents/`: AI context, rules, skills, workflows, memory.

## Context By Task

- Next.js/API/Supabase/Vercel: `.agents/skills/nextjs-supabase-web/SKILL.md`
- Clinic booking logic: `.agents/skills/clinic-booking-business/SKILL.md`
- URD writing/review: `.agents/skills/ba-urd-writing/SKILL.md`
- Code changes: `.agents/rules/CODING_RULES.md`, `.agents/rules/SECURITY_RULES.md`, `.agents/workflows/BEFORE_CHANGE.md`
- Git/commit/push: `.agents/rules/GIT_RULES.md`
- Documentation/context: `.agents/rules/DOCUMENTATION_RULES.md`

## Archive

- Old context files are kept in `.agents/archive/`.
