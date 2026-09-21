# Decisions

## Business

- Public customers do not create accounts.
- Public customers do not log in.
- Public customers do not use appointment codes.
- Phone number is the public business key for booking, lookup, edit, and cancel.
- Same-day limit: one phone number may have at most one `booked` appointment.
- If same-day status is `booked` or `no_show`, the phone cannot book again that day.
- Customers may reschedule valid appointments by phone number.
- Do not require customers to cancel before rescheduling.
- Do not apply same-day-only booking.
- Use admin-configured `booking_advance_days`.
- Use `slot_capacity` as the default customers-per-slot value.
- Allow optional per-slot capacity overrides inside each weekly schedule day; missing overrides fall back to `slot_capacity`.
- Do not apply a 2-hour-before-cancel rule.
- Block public edit/cancel once appointment time has arrived or passed.
- Weekly schedule is admin-configured; no fixed Mon-Fri/Sat schedule as source of truth.

## Technical

- Use Next.js App Router for frontend and API routes.
- Use Supabase Postgres as database.
- Use public Supabase Storage bucket `clinic-assets` for homepage images/logo.
- Deploy on Vercel.
- Use `SUPABASE_SECRET_KEY` only server-side in route handlers.
- Canonical env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`, `ADMIN_PIN`.
- Root admin login uses username `admin` and `ADMIN_PIN`.
- Use `.agents/` as the standard AI context system for Codex/Antigravity.
- `AGENTS.md` is the main entrypoint.
- `agents.md` only points to `AGENTS.md` and `.agents/`.
- AI instruction/context markdown uses concise English.
- Vietnamese reader-facing business docs remain in `docs/URD/`, `docs/DESIGN/`, `docs/OPERATIONS/`.

## Data

- Both reports filter by appointment date, including the selected start and end dates (confirmed by user). Creation timestamps are displayed as details, not used for date filtering.

- Reporting customers are identified by phone number. Repeat bookings mean more than one appointment record in the selected range; editing a record does not create a new booking count.
- Reporting UI and API allow `admin` and `maintain`; CSV export includes detailed booking timestamps and current appointment information.
- Report ranges are limited to one calendar month for both roles and report types, inclusive (e.g. September 5–October 4), capped at the following month's last day when needed. Enforce in both UI and API.
- `appointments.created_at` is the actual booking time and same-slot ordering key.
- `appointment_history` stores audit snapshots.
- `clinic_settings` stores schedule, per-slot capacity overrides, holidays, homepage, default slot capacity, and booking advance days.
- `weekly_schedule[*].slotCapacities` stores optional 30-minute slot capacity overrides keyed by `HH:mm`.
- `staff_users` stores `maintain` users with password hash and active flag.
- Schema SQL must be idempotent with `if not exists` / `add column if not exists`.
