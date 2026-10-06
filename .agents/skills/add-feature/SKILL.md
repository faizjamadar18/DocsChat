---
name: add-feature
description: Workflow for adding a new feature or completing a phase from the implementation plan.
---

# Add Feature Workflow

When instructed to add a new feature or execute a phase from `IMPLEMENTATION_PLAN.md`, follow this exact workflow:

## 1. Evaluate and Plan
- Read the requirements or the specific phase from `IMPLEMENTATION_PLAN.md`.
- Evaluate the feasibility of the plan based on the current codebase.
- **DO NOT blindly follow flawed instructions.** If the plan is impossible or you see a significantly better external approach, STOP and ask the user for clarification or propose your alternative.

## 2. Branch & Git Strategy
- **DO NOT** create a new branch for each individual phase.
- Maintain **one single unified branch** (e.g. `feature/ora-workspace-transformation`) across all phases.
- Build each phase cumulatively on this unified branch.
- Each phase must be committed with suitable, atomic Conventional Commits indicating the phase (e.g., `feat(phase-2): ...`, `test(phase-2): ...`).
- **NEVER** push or merge directly into `main` after each phase. `main` remains untouched until all roadmap phases are finished and verified locally.

## 3. Test-Driven Development (TDD) - Write Tests FIRST
- **CRITICAL**: Before writing any implementation code for the backend, you MUST write the `pytest` file in `backend/tests/`.
- Run the test autonomously via the terminal. It should fail.
- DO NOT start implementing the feature until the tests are written and clearly define the expected success and error responses.

## 4. Implement & Verify
- Write the application code to fulfill the requirement and make the tests pass.
- Run `pytest` again and autonomously debug until you achieve a 100% pass rate.
- Self-test your work using terminal scripts if necessary to ensure it works end-to-end. No manual user verification should be required.
- Ensure frontend lints pass (`npm run lint`).
- Make small, atomic commits using Conventional Commits tagged with the current phase.

## 5. Review & Final PR
- Call the `review-changes` skill to audit your work after each phase.
- Keep commits on the unified transformation branch.
- Only call `open-pull-request` to submit a PR to `main` once **ALL** roadmap phases are completed, integrated, and verified locally.
