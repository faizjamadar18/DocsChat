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
- Maintain **one single unified branch** (e.g. `feature/ora-workspace-transformation`) across all tasks.
- Build each task cumulatively on this unified branch.
- Each task must be committed with suitable, atomic Conventional Commits (e.g., `feat(chat): ...`, `test(chat): ...`, `fix(auth): ...`).
- Commit types: `feat:` (new features), `fix:` (bug fixes), `refactor:` (restructuring without behavior change), `docs:` (documentation), `test:` (tests), `chore:` (dependencies, linting, etc.).
- **NEVER** push or merge directly into `main`. `main` remains untouched; the user verifies the unified branch and opens the single PR into `main` when ready.

## 3. Test-Driven Development (TDD) - Write Tests FIRST
- **CRITICAL**: Before writing any implementation code for the backend, you MUST write the `pytest` file in `backend/tests/`.
- Run the test autonomously via the terminal. It should fail.
- DO NOT start implementing the feature until the tests are written and clearly define the expected success and error responses.

## 4. Implement & Verify
- Write the application code to fulfill the requirement and make the tests pass.
- Run `pytest` again and autonomously debug until you achieve a 100% pass rate.
- Self-test your work using terminal scripts if necessary to ensure it works end-to-end. No manual user verification should be required.
- Ensure frontend lints pass (`npm run lint`) and TypeScript checks pass (`npx tsc --noEmit`).

## 5. Strict Pre-Commit Verification Gate (MANDATORY BEFORE ANY COMMIT)
Under NO circumstances should any code be committed to git before all of the following verification steps have been executed and passed with ZERO errors. Run ONLY the gates for the stack you touched (backend-only changes skip frontend gates and vice versa):
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
   - Never commit code with failing tests, broken imports, compiler errors, unaddressed linter errors, IDE problem warnings, or unverified edge cases.
   - Only execute `git commit` after all gates above have passed cleanly.

## 6. Review & Hand Off
- Call the `review-changes` skill to audit your work after each task.
- Keep commits on the unified transformation branch.
- **NEVER open a Pull Request.** The user verifies the unified branch and opens the single PR into `main` themselves when ready. If asked, provide a ready-to-paste PR title and description summarizing the branch — but do not submit anything.
