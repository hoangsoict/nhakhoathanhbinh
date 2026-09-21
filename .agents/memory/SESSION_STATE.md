# Session State

## Current State

- Local test runtime (2026-09-21): production build passed; `npm run start -- --hostname 0.0.0.0 -p 3002` started successfully. `/manage` returned HTTP 200 at `http://localhost:3002/manage`.
- Active development branch: `feature/reports`, created from local `main` on 2026-09-21.
- Git handoff: user requested committing/pushing the reporting changes to `origin/feature/reports` on 2026-09-21; publication result is verified through Git remote tracking.
- Done: `admin` and `maintain` can view/export `/manage` no-show and repeat-booking reports. Both reports filter by appointment date, including both endpoints, with a maximum one-calendar-month range enforced in UI and API (e.g. September 5–October 4; month-end capped to the following month's last day). No-shows require `no_show`; repeat bookings include all statuses and show creation timestamps in Vietnam time.
- Project: appointment website for Nha Khoa Thanh Binh.
- Public site: `/`.
- Internal site: `/manage`.
- Latest session startup: 2026-09-21, AI context bootstrap completed from `AGENTS.md`, project index, architecture, takeover, session state, and decisions; also reviewed open questions, documentation rules, and the startup workflow. Working tree was clean before startup memory updates. Awaiting the next concrete task.
- Current task completed: public booking form now shows the appointment note on separate lines, highlights the 30-minute late cancellation warning in red, and the booking success popup bolds the booked time and date.
- Current task completed: admin can configure per-slot customer capacity in weekly working schedules.
- Env names standardized to `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`, `ADMIN_PIN`.
- Dev server runbook documented in `docs/OPERATIONS/README.md`.
- Vietnamese reader-facing docs in `docs/URD/`, `docs/DESIGN/`, `docs/OPERATIONS/` remain Vietnamese.
- Source code now reads only the standardized env names for Supabase/admin root login.

## Active Business Rules

- Public users do not create accounts.
- Public users do not log in.
- Public users do not use appointment codes.
- Public users book, look up, edit, and cancel by phone number.
- Phone number is stored as a 10-digit local number, for example `0984009777`.
- One phone number may have at most one same-day `booked` appointment.
- If same-day status is `booked` or `no_show`, the phone cannot book again that day.
- Appointment dates must be within admin-configured `booking_advance_days`.
- Slot length: 30 minutes.
- Default slot capacity: `slot_capacity`, default `4`.
- Admin can override capacity for each generated 30-minute slot in `weekly_schedule[*].slotCapacities`; empty slot override falls back to `slot_capacity`.
- `cancelled` does not occupy capacity.
- Current capacity statuses: `booked`, `completed`.
- Pending status model: add `arrived` so `booked`, `arrived`, `completed` occupy capacity.
- Public users can book/edit only future times.
- Appointments at or past their time cannot be updated or cancelled by public users.
- Admin configures weekly schedule and optional per-slot capacity overrides.
- Schedule `close` means the last bookable slot start time.
- Admin configures internal holidays and multiple same-day internal time-offs.
- Public booking UI warns patients to arrive 10 minutes early and says arrivals more than 30 minutes late are automatically cancelled.
- Internal admin/staff create/edit is not limited by public date/time rules.
- Write create/edit/cancel/status history to `appointment_history`.

## Done

- Homepage content loads from admin settings.
- Default homepage fallback:
  - Brand: `Nha Khoa Thanh Binh`
  - Hotline: `0899966683 - 0985203333`
  - Address: `52 Dai An, Phuong Ha Dong, Ha Noi`
- Homepage slider uses public Supabase Storage bucket `clinic-assets`.
- Public API supports booking, lookup, edit, cancel by phone number.
- Public availability API returns daily slots without customer personal data.
- Admin API manages appointment list and status updates.
- Admin configures weekly schedule, per-slot capacity overrides, holidays, time-offs, homepage, default slot capacity, booking advance days.
- Admin manages `maintain` users.
- `maintain` can view appointments and update status.
- `admin` has full `/manage` permissions.
- Root admin login uses username `admin` and `ADMIN_PIN`.
- Dev server can run at `http://localhost:3002`.

## Pending

- Add `arrived` status.
- Add database transaction/constraint protection for slot-capacity race conditions.
- Add UI for audit history.
- Add OTP/phone verification if required.
- Add public API rate limiting.
- Expand automated tests beyond reporting helper coverage.
- Run updated `supabase/schema.sql` on production Supabase if not already applied.
- Rotate Supabase service/secret keys if any real key was exposed in chat.

## Context Archive

- Old `docs/SESSION_CONTEXT.md`: `.agents/archive/SESSION_CONTEXT.md`
- Old `docs/TODO.md`: `.agents/archive/TODO.md`
