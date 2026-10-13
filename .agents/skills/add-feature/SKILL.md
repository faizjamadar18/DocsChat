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
- User-gated workflow (applies to EVERY task, even small tweaks): implement the change, then STOP and hand it to the user to verify on their side. NEVER commit or push on your own — only commit and push to `main` after the user gives an explicit YES.

## 3. Test-Driven Development (TDD) - Write Tests FIRST
- **CRITICAL**: Before writing any implementation code for the backend, you MUST write the `pytest` file in `backend/tests/`.
- NEVER run any verification command before the user's green signal — not even once, not even "just a quick check."
- After writing code, STOP and ask the user to verify the change. Only on their explicit YES (green signal), run verifications, then commit and push. If the user says NO or stays silent, leave code uncommitted.
- DO NOT start implementing the feature until the tests are written and clearly define the expected success and error responses.

## 4. Implement (No Verify, No Commit — User Runs All Checks)
## 4. Implement (No Verify Before Green Signal, No Commit)
- Write the application code to fulfill the requirement.
- Run NOTHING after writing code — no `pytest`, no linters, no TypeScript checks, no terminal test scripts.
- Ask the user to verify the change and wait for their explicit YES (green signal).

## 5. Green-Signal Gate (VERIFY → COMMIT → PUSH, ONLY AFTER EXPLICIT USER YES)
After implementing, STOP and ask the user to verify the change. NOTHING runs until the user replies YES.
Only after the green signal, in this order:
1. Run the gates for the stack touched (backend-only changes skip frontend gates and vice versa):
   - **Frontend** (only if `frontend/` changed): `npm run lint` (0 errors), `npx tsc --noEmit` (clean), dev-server logs clean.
   - **Backend** (only if `backend/` changed): dev deps installed, `pytest` 100% pass, backend linter clean.
   - **Reported Diagnostics**: resolve all IDE/`current_problems` errors and warnings.
   - **Edge Case Walkthrough**: sanity-check empty/null states, boundaries, clipping/overflow.
2. If anything fails: fix it, re-run until green — then proceed. Do not commit failing code.
3. Commit with an atomic Conventional Commit, then `git push origin main`.
The single user YES authorizes the whole verify → commit → push chain for that task. Never start the chain without it.
5. **Zero-Tolerance Commit & Push Rule**:
    - Never commit or push without explicit user YES, even if all checks would pass.
    - Never commit code with failing tests, broken imports, compiler errors, unaddressed linter errors, IDE problem warnings, or unverified edge cases.
    - Only execute `git commit` after user said YES and all gates above passed cleanly.
    - Only execute `git push origin main` after committing — pushing without an explicit user YES is forbidden.

## 6. Review & Hand Off
- Call the `review-changes` skill to audit your work after each task.
- Keep commits on the `main` branch.
- Push to `main` directly only after the user's explicit YES — no Pull Request workflow, and never push unapproved.
