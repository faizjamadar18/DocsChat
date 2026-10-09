---
name: write-tests
description: Guidelines for writing tests and checking code quality.
---

# Write Tests and Quality Checks

## Backend Testing (Python) - TDD Required
- **Test-Driven Development**: You MUST write the `pytest` test script BEFORE you write the actual code implementation.
- **Framework**: `pytest` and `pytest-asyncio` for async endpoints. Install dev dependencies first: `pip install -r requirements-dev.txt` in `backend/`.
- **Location**: Write tests in a `tests/` directory within `backend/` or alongside the code.
- **Scope**: Ensure new API endpoints have at least one success path test and one error path test.
- **Execution**: Do NOT run `pytest` or `flake8 app/` on your own. First ask: "Code is ready. Shall I run lint/tests and commit?" Only run them after explicit user YES, and ensure 100% pass rate before committing.

## Frontend Quality (TypeScript/Next.js)
- **Framework**: None. We are currently relying strictly on TypeScript compilation and ESLint.
- **Execution**: Do NOT run `npm run lint` on your own. Only run after explicit user YES.
- **Rule**: Do not attempt to configure Jest, Vitest, or Playwright unless explicitly instructed. Fix all lint and type errors before committing (only after user YES).
