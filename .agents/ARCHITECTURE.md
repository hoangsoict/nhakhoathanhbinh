# Architecture

## Overview

- Next.js App Router website for Nha Khoa Thanh Binh appointments.
- Public customer UI at `/`.
- Internal staff UI at `/manage`.
- Data: Supabase Postgres.
- Media: Supabase Storage bucket `clinic-assets`.
- Server route handlers use `SUPABASE_SECRET_KEY`.

## Frontend Next.js

- `app/page.tsx`: homepage, image slider, clinic info, booking form, phone lookup/edit/cancel.
- `app/manage/page.tsx`: staff login, appointments, schedule settings, homepage settings, `maintain` users.
- `app/globals.css`: shared public and manage styles.

## API Route

- `app/api/appointments/route.ts`: public create, lookup, edit, cancel.
- `app/api/appointments/availability/route.ts`: public daily slots and counts.
- `app/api/admin/appointments/route.ts`: internal list, create/edit, status updates.
- `app/api/admin/settings/route.ts`: internal settings read/save.
- `app/api/admin/session/route.ts`: internal login/session.
- `app/api/admin/users/route.ts`: admin `maintain` user management.
- `app/api/settings/homepage/route.ts`: public homepage content.

## Supabase Database

| Table | Purpose |
| --- | --- |
| `appointments` | Customer info, appointment date/time, status, `created_at` |
| `appointment_history` | Audit history for create/edit/cancel/status changes |
| `clinic_settings` | `weekly_schedule`, `internal_holidays`, `internal_time_offs`, `homepage_content`, `slot_capacity`, `booking_advance_days` |
| `staff_users` | Internal `maintain` users, password hash, active flag |

- RLS is enabled with deny-public policies.
- Next.js server routes use `SUPABASE_SECRET_KEY`.

## Supabase Storage

- Public bucket: `clinic-assets`.
- Used for homepage slider images and logo.
- Current slide list: `homepage_content.heroSlides`.
- Legacy compatibility: `homepage_content.heroImageUrls`, `homepage_content.heroImageUrl`.

## Vercel Deployment

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_JWKS_URL`
- `ADMIN_PIN`

- Do not expose `SUPABASE_SECRET_KEY` or real `ADMIN_PIN` to client code or markdown.

## Public Booking Flow

1. Customer selects a date within `booking_advance_days`.
2. UI loads availability by schedule, holidays, time-offs, and capacity.
3. Customer enters name, phone, appointment date/time, reason.
4. API validates phone, time, schedule, holidays/time-offs, and capacity.
5. API blocks duplicate same-day phone bookings when status is `booked` or `no_show`.
6. API creates appointment and writes `appointment_history`.

## Public Lookup/Edit/Cancel Flow

1. Customer looks up appointments by phone number.
2. API returns only appointments for that phone number.
3. UI allows edit/cancel only for future `booked` appointments.
4. Appointments at or past their time cannot be changed by customers.
5. Cancel sets status to `cancelled`; cancelled appointments do not occupy slots.
6. Edit validates the new slot like a new booking.

## Admin Flow

1. Staff enters `/manage` and logs in with user/password.
2. `maintain`: view appointments and update status.
3. `admin`: manage appointments, schedule, homepage, capacity, advance days, `maintain` users.
4. Admin appointment create/edit is not limited by public date/time rules.
