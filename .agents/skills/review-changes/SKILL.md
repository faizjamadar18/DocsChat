---
name: review-changes
description: Checklist for auditing code before opening a PR.
---

# Review Changes Checklist

Before opening a Pull Request, you MUST review your own diff against this checklist:

## 1. Security Audit
- [ ] No API keys, passwords, or secrets are hardcoded in the source code.
- [ ] No changes were made to `.env` files (only `.env.example` is allowed).
- [ ] All new backend endpoints are protected by `auth_middleware.py` (unless explicitly public).

## 2. Contract Adherence
- [ ] Existing API response shapes were NOT broken without a documented migration.
- [ ] The core functionality specified in the `IMPLEMENTATION_PLAN.md` is fully addressed.

## 3. Code Cleanliness
- [ ] No leftover `TODO` or `FIXME` comments unless explicitly planned for a future phase.
- [ ] No unused imports or dead code.
- [ ] Backend passes `flake8 app/`.
- [ ] Frontend passes `npm run lint`.

If any of these fail, STOP, fix the code, and commit the fixes before opening the PR.
