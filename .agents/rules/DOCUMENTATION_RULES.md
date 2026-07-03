# Documentation Rules

## After Each Task

- Update `.agents/memory/SESSION_STATE.md`.
- Update `.agents/memory/CHANGELOG_AI.md`.
- Update `.agents/memory/DECISIONS.md` when decisions change.
- Update `.agents/memory/OPEN_QUESTIONS.md` when questions remain.

## Writing Rules

- Do not record guesses as facts.
- Label status clearly: `Done`, `Pending`, `Blocked`.
- Mark proposals as proposals.
- Put confirmed decisions in `DECISIONS.md`.
- Do not keep rejected business rules as source of truth.

## Storage

- Do not permanently delete old markdown during context cleanup.
- Move unused old markdown to `.agents/archive/`.
- Keep Vietnamese reader-facing URD/design/operations docs in `docs/`.
