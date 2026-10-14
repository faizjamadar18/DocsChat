---
name: add-feature
description: Workflow for adding a new feature or implementing a user-directed task.
---

# Add Feature Workflow

When instructed to add a new feature or implement a task described by the user, follow this exact workflow:

## 1. Evaluate and Plan
- Read the user's requirements or task description carefully.
- Evaluate the feasibility of the plan based on the current codebase.
- **DO NOT blindly follow flawed instructions.** If the plan is impossible or you see a significantly better external approach, STOP and ask the user for clarification or propose your alternative.

## 2. Branch & Git Strategy
- **DO NOT** create a new branch for each individual task.
- Work directly on the `main` branch. The build phase is done — only small tweaks remain. Historical branches exist on the remote for the record only; do not create new branches and do not commit to them.
- Each task must be committed with suitable, atomic Conventional Commits (e.g., `feat(chat): ...`, `test(chat): ...`, `fix(auth): ...`).
- Commit types: `feat:` (new features), `fix:` (bug fixes), `refactor:` (restructuring without behavior change), `docs:` (documentation), `test:` (tests), `chore:` (dependencies, linting, etc.).

## 3. Test-Driven Development (TDD) - Write Tests FIRST
- **CRITICAL**: Before writing any implementation code for the backend, you MUST write the `pytest` file in `backend/tests/`.
- Write only the tests that matter: cover paths with the highest breakage risk (permission checks, data-isolation filters, token/secret handling, migrations/backfills, route ordering). Skip low-risk UI copy/styling — those are covered by `tsc` + visual check.
- New API endpoints need at least one success path test and one error path test.
- Keep the test files you create warning-free. Third-party library warnings raised inside external packages (not our code) are left as they are — never add suppression config for them.
- DO NOT start implementing the feature until the tests are written and clearly define the expected success and error responses.

## 4. Implement
- Write the application code to fulfill the requirement, slice by slice.

## 5. Verify (agent runs everything)
After implementing, the agent itself runs ALL verifications — no user action needed:
1. Run the gates for the stack touched (backend-only changes skip frontend gates and vice versa):
   - **Backend**: dev deps installed, full `pytest` 100% pass (warnings raised inside third-party packages are left as they are), `flake8 app/ --select=F,E9` clean (no syntax or unhandled-import errors; pre-existing repo-wide style noise is out of scope).
   - **Frontend**: `npm run lint` (0 errors, 0 warnings), `npx tsc --noEmit` (clean), theme-grep clean on touched scope, dev-server logs clean.
   - **Reported Diagnostics**: resolve all IDE/`current_problems` errors and warnings.
   - **Edge Case Walkthrough**: sanity-check empty/null states, boundaries, clipping/overflow.
2. If anything fails: fix it, re-run until green. Obsolete old tests that contradict the newly approved behavior are migrated to the new contract (fixture updates, renamed expectations) and the migration is documented in the handover. Do not commit failing code.
3. Call the `review-changes` skill to audit the work (security, contracts, cleanliness).

## 6. Hand Over With User-Side Config (NO commit, NO push yet)
- STOP and hand the finished, green work to the user with:
  - What changed (files + behavior).
  - Test results (new + full suite numbers).
  - ALL configuration the user must do on their side: env vars for local `.env` (never committed), third-party setup (API keys, domains, quotas), local verification steps, and production notes (what to set in hosting dashboards, free-tier limits, what to check live).
- The user verifies on their own environment (local first — nothing goes to production before their verification). If they report a failure with an error, fix it and re-run the gates.

## 7. Push Gate (ONLY AFTER EXPLICIT USER CONFIRMATION)
- Ask for explicit confirmation to push the code to `main`.
- **Zero-Tolerance Commit & Push Rule**:
  - Never commit or push without explicit user confirmation, even if all checks pass.
  - Never commit code with failing tests, broken imports, compiler errors, unaddressed linter errors, IDE problem warnings, or unverified edge cases.
  - Only execute `git commit` (atomic Conventional Commit) after user confirmation and all gates green.
  - Only execute `git push origin main` after committing.
- The single user confirmation authorizes the commit → push chain for that task. Never start it without confirmation.
