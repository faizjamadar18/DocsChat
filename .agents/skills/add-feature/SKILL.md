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
- Maintain **one single `staging` branch** across all tasks.
- Build each task cumulatively on this unified branch.
- Each task must be committed with suitable, atomic Conventional Commits (e.g., `feat(chat): ...`, `test(chat): ...`, `fix(auth): ...`).
- Commit types: `feat:` (new features), `fix:` (bug fixes), `refactor:` (restructuring without behavior change), `docs:` (documentation), `test:` (tests), `chore:` (dependencies, linting, etc.).
- **NEVER** push or merge directly into `main`. `main` remains untouched; the user verifies the unified branch and opens the single PR into `main` when ready.

## 3. Test-Driven Development (TDD) - Write Tests FIRST
- **CRITICAL**: Before writing any implementation code for the backend, you MUST write the `pytest` file in `backend/tests/`.
- Do NOT run `pytest`, `npm run lint`, `npx tsc --noEmit`, or any verification command on your own.
- After writing code, STOP and ask the user for confirmation: "Code is ready. Shall I run lint/tests and commit?"
- Only if the user says YES, run verifications and commit. If the user says NO or stays silent, leave code uncommitted.
- DO NOT start implementing the feature until the tests are written and clearly define the expected success and error responses.

## 4. Implement (No Auto-Verify, No Auto-Commit)
- Write the application code to fulfill the requirement.
- Do NOT run `pytest`, linters, or TypeScript checks autonomously.
- Do NOT self-test via terminal scripts unless the user explicitly asked.
- The user verifies from their side. Wait for their signal.

## 5. User-Confirmed Verification Gate (ONLY AFTER EXPLICIT USER YES)
Ask first: "Code is ready. Shall I run lint/tests and commit?" Run NOTHING until the user replies YES.
Only after explicit user YES, execute the gates for the stack you touched (backend-only changes skip frontend gates and vice versa):
1. **Frontend Verification** (only if `frontend/` changed):
   - Run `npm run lint` in `frontend/` — must pass with 0 errors.
   - Run `npx tsc --noEmit` in `frontend/` — all module imports, types, and paths must resolve without errors.
   - Check the terminal logs of any running dev servers (e.g., Next.js dev server) to confirm zero compilation or module resolution errors.
2. **Backend Verification** (only if `backend/` changed):
   - Ensure dev dependencies are installed (`pip install -r requirements-dev.txt` in `backend/`).
   - Run `pytest` in `backend/` using the virtual environment (`.\venv\Scripts\pytest` or `$env:PYTHONPATH="."; .\venv\Scripts\pytest`) — must achieve a 100% pass rate.
   - Run backend linter (`flake8 app/` or equivalent) with zero syntax or import errors.
3. **Reported Diagnostics**:
   - Resolve all errors and warnings reported by the IDE or `current_problems` tooling before committing. (Tool-neutral: use whatever diagnostics the current harness surfaces.)
4. **Edge Case Walkthrough**:
   - Perform a quick sanity check for minute edge cases (empty/null states, boundary inputs, layout clipping/overflow, overlay positioning) so the user does not need to babysit.
5. **Zero-Tolerance Commit Rule**:
    - Never commit without explicit user YES, even if all checks would pass.
    - Never commit code with failing tests, broken imports, compiler errors, unaddressed linter errors, IDE problem warnings, or unverified edge cases.
    - Only execute `git commit` after user said YES and all gates above passed cleanly.

## 6. Review & Hand Off
- Call the `review-changes` skill to audit your work after each task.
- Keep commits on the `staging` branch.
- **NEVER open a Pull Request.** The user verifies the unified branch and opens the single PR into `main` themselves when ready. If asked, provide a ready-to-paste PR title and description summarizing the branch — but do not submit anything.
