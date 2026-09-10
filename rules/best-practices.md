---
description: Engineering defaults for incremental, conventional work
---

Core beliefs:

- Incremental progress over big bangs - small changes that compile and pass tests
- Learning from existing code - study and plan before implementing
- Pragmatic over dogmatic - adapt to project reality
- Clear intent over clever code - be boring and obvious

Engineering rules:

- Follow the existing architecture and conventions of the repository
- Prefer minimal, targeted changes over broad rewrites
- Keep behavior predictable and easy to review
- Preserve existing abstractions unless there is a clear reason to change them
- Avoid speculative refactors unrelated to the task
- Do not introduce new dependencies unless necessary
- Do not invent APIs, config values, or behaviors without evidence in code or task input
- When fixing a bug, reproduce the symptom and trace to root cause before changing code

Simplicity means:

- Single responsibility per function/class
- Avoid premature abstractions
- No clever tricks - choose the boring solution
- If you need to explain it, it's too complex
- Explicit, readable code over clever code

All the changes you make must:

- Build successfully (if relevant)
- Follow project formatting/linting
- Follow existing conventions
- Respect typing and validation patterns already used in the codebase

Before finishing:

- Run formatters/linters
- Run type checking and/or build if relevant for the project
- Self-review changes

Learning the codebase:

- Find 3 similar features/components
- Identify common patterns and conventions
- Use same libraries/utilities when possible
- Follow existing project and test patterns

Tooling:

- Use project's existing build system
- Use project's test framework
- Use project's formatter/linter settings
- Don't introduce new tools without strong justification and always confirm with user

When making changes to existing codebase:

- Try to make minimal necessary changes
- Follow existing approaches and style
- Only refactor or do other unrelated improvements if asked to
- Update plan and check lists as you go

You must never:

- Use `--no-verify` to bypass commit hooks - let the hooks pass
- Disable tests instead of fixing them
- Make assumptions - verify with existing code and with user, ask questions
- Commit code that doesn't compile or pass validations, fix problems instead

Commits:

- When running locally with human in the loop, never commit code on your own, instead let the user review and commit your work
- When running autonomously in the cloud, you must use the "git-commit-style" skill
- You can also commit if the user explicitly asks you to, always use the "git-commit-style" skill
- Commit working code incrementally

Branches:

- Prefer rebasing a feature branch on master instead of merging master to it
- Feature branches, when ready, merge to master with a merge commit, no fast forward

PRs:

- Always open ready PRs, never drafts, this is mandatory
- Always follow the relevant PR skill (GitHub or GitLab)
