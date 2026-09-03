# AI Changelog

## 2026-09-03 - Booking Notice Formatting

### Changed

- Split the public booking note onto separate lines after `Lưu ý:` and after the 10-minute arrival reminder.
- Highlighted the 30-minute late cancellation sentence in red.
- Bolded the appointment time and date in the successful booking popup.

### Validation

- `env PATH=/t24/nhakhoathanhbinh/.tools/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npm run lint`
- `env PATH=/t24/nhakhoathanhbinh/.tools/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npm run build`

## 2026-09-03 - Public Booking Confirmation Copy

### Changed

- Updated the public booking form note to say patients should arrive 10 minutes early and that arrivals more than 30 minutes late are automatically cancelled.
- Updated the booking success popup to include the confirmed appointment time and date.

### Validation

- `env PATH=/t24/nhakhoathanhbinh/.tools/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npm run lint`
- `env PATH=/t24/nhakhoathanhbinh/.tools/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npm run build`

## 2026-09-03 - AI Context Session Startup

### Changed

- Bootstrapped the session by reading the required AI context files:
  - `AGENTS.md`
  - `.agents/PROJECT_INDEX.md`
  - `.agents/ARCHITECTURE.md`
  - `.agents/TAKEOVER.md`
  - `.agents/memory/SESSION_STATE.md`
  - `.agents/memory/DECISIONS.md`
- Also checked `.agents/memory/OPEN_QUESTIONS.md` and documentation rules during startup.
- Updated session memory to record the context bootstrap.

### Notes

- No source-code behavior changed.
- No business rules changed.

## 2026-07-04 - Per-Slot Schedule Capacity

### Changed

- Added optional `weekly_schedule[*].slotCapacities` overrides keyed by 30-minute slot time.
- Admin schedule UI now shows generated 30-minute slot capacity inputs for each enabled working day.
- Empty per-slot inputs fall back to the default `slot_capacity`.
- Public availability, booking, and reschedule capacity checks now use the per-slot override when present.
- Updated `supabase/schema.sql` default `weekly_schedule` JSON to include `slotCapacities`.
- Updated session memory and decisions.

### Validation

- `npm run lint`
- `npm run build`
- Dev server started successfully at `http://localhost:3003`.

## 2026-07-03 - Document Dev Server Runbook

### Changed

- Updated `docs/OPERATIONS/README.md` with:
  - Required env vars.
  - Background dev server commands.
  - Default URL `http://localhost:3002`.
  - Direct dev command.
  - Codex local Node PATH command.
  - Sandbox `listen EPERM` note.
- Updated session memory.

### Validation

- Dev server started successfully at `http://localhost:3002`.

## 2026-07-03 - Standardize Deployment Environment Variables

### Changed

- Replaced canonical env vars with:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `SUPABASE_JWKS_URL`
  - `ADMIN_PIN`
- `lib/supabase.ts` now reads `SUPABASE_URL` and `SUPABASE_SECRET_KEY` only.
- `lib/admin-auth.ts` now uses:
  - `SUPABASE_SECRET_KEY` for staff token signing.
  - username `admin` plus `ADMIN_PIN` for root admin login.
- Updated `.env.example`, `README.md`, and live `.agents` context.

### Notes

- Removed live-code fallback to the previous env naming scheme.
- `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_JWKS_URL` are configured for Supabase's current key set; current code does not directly consume them yet.

## 2026-07-03 - Normalize AI Context Language

### Changed

- Converted AI instruction/context markdown to concise English:
  - `AGENTS.md`
  - `agents.md`
  - `.agents/PROJECT_INDEX.md`
  - `.agents/ARCHITECTURE.md`
  - `.agents/TAKEOVER.md`
  - `.agents/rules/*.md`
  - `.agents/skills/*/SKILL.md`
  - `.agents/workflows/*.md`
  - `.agents/memory/SESSION_STATE.md`
  - `.agents/memory/DECISIONS.md`
  - `.agents/memory/CHANGELOG_AI.md`
  - `.agents/memory/OPEN_QUESTIONS.md`
- Kept Vietnamese reader-facing docs unchanged:
  - `docs/URD/*`
  - `docs/DESIGN/*`
  - `docs/OPERATIONS/*`

### Notes

- No source-code behavior changed.
- No business rules changed.

## 2026-07-02 - Multiple Same-Day Internal Time-Offs

### Changed

- `lib/appointments.ts`:
  - `validateInternalTimeOffs` now keeps multiple valid `{ date, start, end }` entries on the same day.
  - Duplicate filtering uses composite key `${date}_${start}_${end}`.
  - Replaced `getInternalTimeOffForDate` with `getInternalTimeOffsForDate`.
  - `isWithinInternalTimeOff` checks any same-day time-off with `.some()`.
- `app/manage/page.tsx`:
  - Added index-based edit/remove handlers for same-day time-offs.
  - `addInternalTimeOff` supports multiple default time-offs for one day.
  - UI renders all time-off rows for a day and keeps add action at the bottom.

## 2026-07-02 - Homepage Loading State

### Changed

- `app/page.tsx`:
  - Added `isPageLoading` and `loadError`.
  - `loadHomepageContent` now uses `try/catch/finally`.
  - Shows a sticky loading/error banner.
- `app/globals.css`:
  - Added `.topLoadingBanner` and `.topLoadingBanner.error`.
- `app/api/settings/homepage/route.ts`:
  - Removed the 1.5s `Promise.race` timeout so Supabase data can load fully.

## 2026-07-02 - Markdown/Context Structure

### Scope

- Markdown and context only.
- No functional source-code changes.

### Added

- `agents.md`
- `.agents/PROJECT_INDEX.md`
- `.agents/ARCHITECTURE.md`
- `.agents/TAKEOVER.md`
- `.agents/memory/SESSION_STATE.md`
- `.agents/memory/DECISIONS.md`
- `.agents/memory/CHANGELOG_AI.md`
- `.agents/memory/OPEN_QUESTIONS.md`
- `.agents/rules/CODING_RULES.md`
- `.agents/rules/GIT_RULES.md`
- `.agents/rules/SECURITY_RULES.md`
- `.agents/rules/DOCUMENTATION_RULES.md`
- `.agents/skills/nextjs-supabase-web/SKILL.md`
- `.agents/skills/clinic-booking-business/SKILL.md`
- `.agents/skills/ba-urd-writing/SKILL.md`
- `.agents/workflows/START_SESSION.md`
- `.agents/workflows/BEFORE_CHANGE.md`
- `.agents/workflows/AFTER_CHANGE.md`
- `.agents/workflows/HANDOVER.md`
- `docs/DESIGN/README.md`
- `docs/OPERATIONS/README.md`

### Moved

- `docs/SESSION_CONTEXT.md` -> `.agents/archive/SESSION_CONTEXT.md`
- `docs/TODO.md` -> `.agents/archive/TODO.md`
- `URD_Website_Phong_Kham_Da_Khoa_v1.0.md` -> `docs/URD/URD_Website_Phong_Kham_Da_Khoa_v1.0.md`

### Source Of Truth

- Split project index, architecture, takeover, rules, skills, workflows, memory.
- Removed rejected business rules.
- Kept current behavior: `booking_advance_days`, valid reschedule by phone, edit/cancel blocked at or after appointment time, flexible admin schedule.

## 2026-07-02 - Default Homepage Content

### Changed

- `lib/appointments.ts`: updated `defaultHomepageContent`.
- `supabase/schema.sql`: updated default `homepage_content` JSON.
- `.agents/memory/SESSION_STATE.md`: recorded new fallback content.

### Content

- Brand: `Nha Khoa Thanh Binh`
- Hotline: `0899966683 - 0985203333`
- Address: `52 Dai An, Phuong Ha Dong, Ha Noi`
- Eyebrow: `NHA KHOA THANH BINH`
- Description: customer can book, look up, edit, and cancel appointments.
