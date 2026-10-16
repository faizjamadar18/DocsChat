# Contributing to Quello

Thanks for stopping by. Small, focused PRs are welcome.

## Setup

Follow [README](./README.md) — backend (`uvicorn app.main:app --reload`) + frontend (`npm run dev`).

## Ground Rules

1. **Secrets stay out of git.** Never commit `.env` files, API keys, or credentials. `.env.example` only.
2. **Conventional Commits** on `main` (e.g. `feat(chat): stream citations`, `fix(auth): refresh expired token`). One concern per commit.
3. **Tests stay green.** Backend changes need `pytest` passing (add tests for new endpoints: one success path, one error path). Frontend changes need `npm run lint` and `npx tsc --noEmit` clean.
4. **No data destruction.** Never delete user data, MongoDB collections, or Qdrant collections — in code or in PRs.
5. **Design tokens win.** `docs/design-system.md` is canonical for `frontend/src/**`.

## Pull Requests

- Describe what changed and how you verified it (tests, lint, screenshots for UI).
- CI must pass before merge.
- Bug reports: include steps to reproduce, expected vs actual behavior, and relevant logs.
