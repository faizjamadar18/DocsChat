---
name: write-tests
description: Guidelines for writing tests and checking code quality.
---

# Write Tests and Quality Checks

## Backend Testing (Python)
- **Framework**: `pytest` and `pytest-asyncio` for async endpoints.
- **Location**: Write tests in a `tests/` directory within `backend/` or alongside the code.
- **Scope**: Ensure new API endpoints have at least one success path test and one error path test.
- **Execution**: Run `pytest` and ensure 100% pass rate before committing. Run `flake8 app/` for linting.

## Frontend Quality (TypeScript/Next.js)
- **Framework**: None. We are currently relying strictly on TypeScript compilation and ESLint.
- **Execution**: Run `npm run lint` in the `frontend` directory.
- **Rule**: Do not attempt to configure Jest, Vitest, or Playwright unless explicitly instructed. Fix all lint and type errors before committing.
