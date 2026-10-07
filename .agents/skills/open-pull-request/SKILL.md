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

## 2. Branch & Delivery Workflow
- Maintain **one single unified branch** (e.g. `feature/ora-workspace-transformation`) for all roadmap phases.
- Do NOT create fragmented branches per phase.
- All commits must use Conventional Commits with phase annotations (e.g., `feat(phase-2): add persistent workspace shell`).
- Keep `main` untouched until all phases are complete and locally tested.

## 3. PR Template
Use this exact markdown structure for the Pull Request description:

```markdown
## What does this PR do?
[Provide a clear, 1-2 sentence description of the change.]

## Related Phase
Implementation Plan Phase: [Insert Phase Number or "All Phases (Full Transformation)"]

## Changes
- [Detail 1]
- [Detail 2]

## Checklist
- [ ] Code follows project conventions
- [ ] Backend tests pass and frontend lints pass
- [ ] Self-tested via terminal scripts/pytest (No manual user verification required)
- [ ] No hardcoded secrets
- [ ] Self-reviewed against the `review-changes` skill
```

## 4. Execution
A Pull Request to `main` is opened ONLY after all roadmap phases are finished and verified end-to-end locally.
Use the GitHub MCP tool `create_pull_request` to submit the PR. Do NOT merge it yourself; the user is the gatekeeper.
