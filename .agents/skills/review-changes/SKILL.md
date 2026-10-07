---
name: review-changes
description: Checklist for auditing code before opening a PR.
---

# Review Changes & Pre-Commit Verification Checklist

Before making ANY commit or opening a Pull Request, you MUST review and execute this checklist:

## 1. Pre-Commit Quality & Verification Gate
- [ ] Backend: All `pytest` tests pass with a 100% pass rate (`pytest` executed in virtual environment).
- [ ] Backend: Code passes `flake8 app/` with no syntax or unhandled import errors.
- [ ] Frontend: `npm run lint` passes with 0 errors.
- [ ] Frontend: `npx tsc --noEmit` passes with 0 errors (all imports and path aliases resolve).
- [ ] Terminal: Running dev servers (Next.js, FastAPI) show zero 500 runtime or module resolution errors.
- [ ] Under NO circumstance should code be committed before all checks above are green.

## 2. Security Audit
- [ ] No API keys, passwords, or secrets are hardcoded in the source code.
- [ ] No changes were made to `.env` files (only `.env.example` is allowed).
- [ ] All new backend endpoints are protected by `auth_middleware.py` (unless explicitly public).

## 3. Contract Adherence
- [ ] Existing API response shapes were NOT broken without a documented migration.
- [ ] The core functionality specified in the `IMPLEMENTATION_PLAN.md` is fully addressed.

## 4. Code Cleanliness
- [ ] No leftover `TODO` or `FIXME` comments unless explicitly planned for a future phase.
- [ ] No unused imports, broken paths, or dead code.

If any of these fail, STOP, fix the code, and autonomously verify before committing.
