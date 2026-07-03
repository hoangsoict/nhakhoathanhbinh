# Security Rules

## Secrets

- Do not write real Supabase privileged keys, secret keys, database passwords, GitHub tokens, cookies, admin passwords, or admin PINs into markdown/source/logs.
- Do not commit `.env`, `.env.local`, or files with real credentials.
- `.env.example` may contain variable names and placeholders only.

## Env

- `SUPABASE_PUBLISHABLE_KEY` is public-safe.
- `SUPABASE_SECRET_KEY` and `ADMIN_PIN` are private.
- `SUPABASE_SECRET_KEY` is server-route or server-side tooling only.

## Auth / Role

- Do not hard-code admin PIN/password in source.
- Admin-only APIs must check session/token and role.
- Role `maintain` must not configure the system or manage users.

## Public API

- Public APIs operate only on the phone number entered by the customer.
- Do not return other customers' appointments.
- Do not expose personal data in availability endpoints.
- Consider rate limit/OTP for anti-abuse tasks.
