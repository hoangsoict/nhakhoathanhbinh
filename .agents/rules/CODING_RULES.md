# Coding Rules

## Code Changes

- Make the smallest change that completes the task.
- Prefer existing repo patterns.
- Do not refactor outside scope.
- Do not change business rules without explicit request.
- Do not add abstractions without real need.
- Keep existing Vietnamese UI copy unless requested.
- For schema changes, update `supabase/schema.sql` with idempotent SQL.
- For API/frontend changes, run `npm run lint` and `npm run build` when feasible.

## Next.js/Supabase

- Keep server routes and client components clearly separated.
- Use secrets only server-side.
- Validate input in API routes, not only UI.
- Public APIs must not expose other customers' personal data.
- Admin-only operations require server-side auth and role checks.

## Checks

- Read related files before edits.
- Review `git diff` for touched files before handoff.
- If lint/build/test cannot run, state why in final.
