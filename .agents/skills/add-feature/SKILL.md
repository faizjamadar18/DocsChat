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

## 2. Prepare Branch
- Create a new branch following the format: `feature/short-description` (or `feature/phase-N-description`).

## 3. Test-Driven Development (TDD) - Write Tests FIRST
- **CRITICAL**: Before writing any implementation code for the backend, you MUST write the `pytest` file in `backend/tests/`.
- Run the test autonomously via the terminal. It should fail.
- DO NOT start implementing the feature until the tests are written and clearly define the expected success and error responses.

## 4. Implement & Verify
- Write the application code to fulfill the requirement and make the tests pass.
- Run `pytest` again and autonomously debug until you achieve a 100% pass rate.
- Self-test your work using terminal scripts if necessary to ensure it works end-to-end. No babysitting by the user!
- Ensure frontend lints pass (`npm run lint`).
- Make small, atomic commits using Conventional Commits.

## 5. Review & PR
- Call the `review-changes` skill to audit your own work.
- Call the `open-pull-request` skill to submit the code.
