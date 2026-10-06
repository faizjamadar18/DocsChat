---
name: open-pull-request
description: Standard operating procedure for submitting code via GitHub MCP.
---

# Open Pull Request Protocol

When a feature is complete, tested, and self-reviewed, use the GitHub MCP to open a Pull Request.

## 1. Commit Standards
All commits MUST follow Conventional Commits:
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code restructuring without changing behavior
- `docs:` for documentation updates
- `test:` for adding/updating tests
- `chore:` for dependency updates, linting, etc.

## 2. Branch Naming
- Features: `feature/<kebab-case-name>` (e.g., `feature/phase-1-qdrant`)
- Fixes: `fix/<kebab-case-name>`

## 3. PR Template
Use this exact markdown structure for the Pull Request description:

```markdown
## What does this PR do?
[Provide a clear, 1-2 sentence description of the change.]

## Related Phase
Implementation Plan Phase: [Insert Phase Number or "N/A"]

## Changes
- [Detail 1]
- [Detail 2]

## Checklist
- [ ] Code follows project conventions
- [ ] Backend tests pass and frontend lints pass
- [ ] Self-tested via terminal scripts/pytest (NO manual user babysitting required)
- [ ] No hardcoded secrets
- [ ] Self-reviewed against the `review-changes` skill
```

## 4. Execution
Use the GitHub MCP tool `create_pull_request` to submit the PR. Do NOT merge it yourself; the user is the gatekeeper.
