---
name: review-changes
description: Checklist for auditing code before handover and commit.
---

# Review Changes & Pre-Commit Verification Checklist

Run this audit yourself after implementing and going green — before handing over to the user.

## 1. Verification Gate (agent-run, before handover)
Run ONLY the gates for the stack you touched (backend-only changes skip frontend gates and vice versa):
- [ ] Backend: All `pytest` tests pass with a 100% pass rate (`pytest` executed in virtual environment with `requirements-dev.txt` installed). Warnings raised inside third-party packages are left as they are.
- [ ] Backend: Code passes `flake8 app/ --select=F,E9` with no syntax or unhandled import errors.
- [ ] Frontend: `npm run lint` passes with 0 errors and 0 warnings.
- [ ] Frontend: `npx tsc --noEmit` passes with 0 errors and 0 warnings (all imports and path aliases resolve).
- [ ] Theme gate: no banned classes in touched frontend scope (per `DESIGN.md`).
- [ ] Terminal: Running dev servers (Next.js, FastAPI) show zero 500 runtime or module resolution errors.
- [ ] **Reported Diagnostics**: All errors and warnings surfaced by the IDE or `current_problems` tooling are resolved.
- [ ] **Edge Case Walkthrough**: Briefly review subtle edge cases (null/empty states, boundary inputs, layout clipping/overflow, modal/overlay behavior).
- [ ] Obsolete old tests were migrated to the newly approved behavior (not deleted silently) and the migration is documented in the handover.

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

## 5. Handover Package (NO commit, NO push yet)
Hand over with:
- [ ] What changed (files + behavior).
- [ ] Test results (new + full suite numbers, lint/tsc status).
- [ ] ALL user-side configuration: local `.env` values, third-party setup (keys, domains, quotas), local verification steps, production notes.
- [ ] Explicit request for confirmation to push to `main`.

## 6. Push Gate (ONLY AFTER EXPLICIT USER CONFIRMATION)
- [ ] User confirmed. Commit with an atomic Conventional Commit, then `git push origin main`.
- [ ] Never commit or push without that confirmation. Never commit failing code.
- [ ] If the user reports a production/live failure with an error, fix it and re-run the gates.
