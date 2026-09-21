# Open Questions

## Clarify When Relevant

- Should `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_JWKS_URL` be used directly by future client/auth code?
- Is OTP/SMS/Zalo phone verification required?
- Is advanced anti-spam or public API rate limiting required?
- Should holiday configuration extend beyond `internal_holidays` and `internal_time_offs`?
- Should audit-history UI filter by phone, appointment, date, status, or a combination?
- Which database transaction/constraint strategy should protect slot capacity from race conditions?
- Should the 30-minute late cancellation rule be enforced by backend automation/admin workflow, or remain a public UI note only?

## Confirmed Not Applied

- No same-day-only booking rule.
- No requirement to cancel before rescheduling.
- No 2-hour-before-cancel rule.
- No fixed Mon-Fri/Sat schedule as source of truth.
