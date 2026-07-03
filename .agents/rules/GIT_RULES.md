# Git Rules

## Before Edits

- Always run `git status`.
- Identify existing user/other changes.
- Do not revert changes you did not make unless requested.

## During Work

- Do not force push.
- Do not run `git reset --hard` unless explicitly requested.
- Do not use destructive delete commands unless confirmed.
- Do not commit `.env.local`, `.next`, `.tools`, `node_modules`, or secrets.
- Do not push git unless requested.

## Commit When Requested

- Stage only files in task scope.
- Review `git diff --cached` before commit.
- Use an accurate commit message.
