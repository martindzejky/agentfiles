---
name: unslop-code
description: Remove AI-generated code slop and clean up code style in diffs
---

# Unslop code

Review the changes in scope and remove AI-generated slop introduced there. Use the actual target branch for branch work; for uncommitted work, inspect staged and unstaged diffs and relevant new files. Do not assume the base is `main`.

## Focus areas

- Extra comments that are unnecessary or inconsistent with local style
- Defensive checks or try/catch blocks that are abnormal for trusted code paths
- Casts to `any` used only to bypass type issues
- Deeply nested code that should be simplified with early returns
- Other patterns inconsistent with the file and surrounding codebase

## Guardrails

- Keep behavior unchanged unless fixing a clear bug
- Preserve necessary validation, error handling, explanatory comments, and existing user edits; judge them in context rather than deleting by pattern
- Prefer minimal, focused edits over broad rewrites
- Keep the final summary concise (1-3 sentences)
