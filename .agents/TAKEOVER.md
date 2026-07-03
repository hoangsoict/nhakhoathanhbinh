# Takeover

## New Session

1. Read `AGENTS.md`.
2. Read `.agents/PROJECT_INDEX.md`.
3. Read `.agents/ARCHITECTURE.md`.
4. Read `.agents/memory/SESSION_STATE.md`.
5. Read `.agents/memory/DECISIONS.md`.
6. Read `.agents/memory/OPEN_QUESTIONS.md`.
7. Select relevant rule/skill/workflow before edits.

## Before Edits

```bash
git status
rg --files
```

For markdown/context tasks:

```bash
find . -name "*.md" -type f | sort
```

## Do Not

- Do not change source code outside task scope.
- Do not change business rules without explicit request.
- Do not write real secrets into markdown, source, `.env.example`, logs, or replies.
- Do not hard reset, force push, delete files, or revert others' changes unless requested.
- Do not push git unless requested.

## Handoff

- List created/modified/moved files.
- List validation commands.
- List unfinished items or residual risks.
- Update memory/changelog before final reply.
