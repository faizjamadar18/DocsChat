---
name: write-tests
description: Guidelines for writing tests and checking code quality.
---

# Write Tests and Quality Checks

## Backend Testing (Python) - TDD Required
- **Test-Driven Development**: You MUST write the `pytest` test script BEFORE you write the actual code implementation.
- **Framework**: `pytest` and `pytest-asyncio` for async endpoints. Install dev dependencies first: `pip install -r requirements-dev.txt` in `backend/`.
- **Location**: Write tests in a `tests/` directory within `backend/` or alongside the code.
- **Scope**: Write only the tests that matter — paths with the highest breakage risk (permission checks, data-isolation filters, token handling, migrations, route ordering). Ensure new API endpoints have at least one success path test and one error path test.
- **Warnings**: Keep created test files warning-free. Warnings raised inside third-party packages (not our code) are left as they are.
- **Execution**: After implementing, the agent runs `pytest` itself (new tests first, then the full suite) and fixes failures until 100% pass. Obsolete old tests that contradict newly approved behavior are migrated to the new contract and documented in the handover — never left red.

## Frontend Quality (TypeScript/Next.js)
- **Framework**: None. We are currently relying strictly on TypeScript compilation and ESLint.
- **Execution**: After implementing, the agent runs `npm run lint` and `npx tsc --noEmit` itself and fixes everything to 0 errors and 0 warnings (including hook-rule warnings in newly created files).
- **Rule**: Do not attempt to configure Jest, Vitest, or Playwright unless explicitly instructed. Fix all lint and type errors before handover.
