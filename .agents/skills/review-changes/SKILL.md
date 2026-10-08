---
name: review-changes
description: Checklist for auditing code before committing.
---

# Review Changes & Pre-Commit Verification Checklist

User-confirmation gate: do NOT run any check or commit on your own.
First ask: "Code is ready. Shall I run lint/tests and commit?" Only if the user says YES, review and execute this checklist:

## 1. Pre-Commit Quality & Verification Gate (only after explicit user YES)

## 1. Pre-Commit Quality & Verification Gate
Run ONLY the gates for the stack you touched (backend-only changes skip frontend gates and vice versa):
- [ ] Backend: All `pytest` tests pass with a 100% pass rate (`pytest` executed in virtual environment with `requirements-dev.txt` installed).
- [ ] Backend: Code passes `flake8 app/` with no syntax or unhandled import errors.
- [ ] Frontend: `npm run lint` passes with 0 errors.
- [ ] Frontend: `npx tsc --noEmit` passes with 0 errors (all imports and path aliases resolve).
- [ ] Terminal: Running dev servers (Next.js, FastAPI) show zero 500 runtime or module resolution errors.
- [ ] **Reported Diagnostics**: All errors and warnings surfaced by the IDE or `current_problems` tooling are resolved before committing.
- [ ] **Edge Case Walkthrough**: Briefly review subtle edge cases (null/empty states, boundary inputs, layout clipping/overflow, modal/overlay behavior) before committing.
- [ ] Under NO circumstance should code be committed before the user said YES and all checks above are green.
- [ ] Never run `pytest`, `flake8`, `npm run lint`, or `npx tsc --noEmit` without explicit user YES.

## 2. Security Audit
- [ ] No API keys, passwords, or secrets are hardcoded in the source code.
- [ ] No changes were made to `.env` files (only `.env.example` is allowed).
- [ ] All new backend endpoints are protected by `auth_middleware.py` (unless explicitly public).

## 3. Contract Adherence
- [ ] Existing API response shapes were NOT broken without a documented migration.
- [ ] The core functionality requested by the user is fully addressed.

## 4. Code Cleanliness
- [ ] No leftover `TODO` or `FIXME` comments unless explicitly deferred by the user.
- [ ] No unused imports, broken paths, or dead code.

If any of these fail, STOP, fix the code, and wait for the next user YES before re-verifying or committing. Never auto-verify or auto-commit.
