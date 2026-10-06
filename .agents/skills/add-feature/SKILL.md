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

## 3. Implement (Code First)
- Write the application code to fulfill the requirement.
- Make small, atomic commits using Conventional Commits (e.g., `feat: add Google OAuth endpoint`).
- Do not make major architectural deviations without communicating.

## 4. Test (Backend) & Lint (Frontend)
- Write or update `pytest` tests for the backend code you touched.
- Ensure all backend tests pass (`pytest`).
- Ensure frontend lints pass (`npm run lint` in frontend dir). No frontend unit tests are required at this time.

## 5. Review & PR
- Call the `review-changes` skill to audit your own work.
- Call the `open-pull-request` skill to submit the code.
