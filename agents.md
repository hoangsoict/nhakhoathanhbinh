# AGENTS.md

Main Codex entrypoint for `nhakhoathanhbinh`.

## Read First

1. `.agents/PROJECT_INDEX.md`
2. `.agents/ARCHITECTURE.md`
3. `.agents/TAKEOVER.md`
4. `.agents/memory/SESSION_STATE.md`
5. `.agents/memory/DECISIONS.md`
6. Relevant rules in `.agents/rules/` and skills in `.claude/skills/`

## Core Rules

- Project: appointment website for Nha Khoa Thanh Binh.
- Public users do not create accounts, log in, or use appointment codes.
- Public users use phone numbers to book, look up, edit, and cancel appointments.
- Internal area: `/manage`, user/password login, roles `admin` and `maintain`.
- `SUPABASE_SECRET_KEY` is server-only.
- Do not change business rules without explicit user request.
- Do not push git unless requested.
- Do not commit `.env.local`, `.next`, `.tools`, `node_modules`, or real secrets.

## After Each Task

- Update `.agents/memory/SESSION_STATE.md`.
- Update `.agents/memory/CHANGELOG_AI.md`.
- Update `.agents/memory/DECISIONS.md` when decisions change.
- Update `.agents/memory/OPEN_QUESTIONS.md` when questions remain.
- Update context before handoff if schema, env, business rules, or project direction changed.
