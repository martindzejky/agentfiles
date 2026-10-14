---
description: Engineering defaults for incremental, conventional work
---

Engineering rules:

- Make small, targeted changes that compile and pass tests; adapt to project reality
- Follow the repository's architecture, conventions, typing, and validation patterns
- Keep designs simple, maintainable, and easy to evolve; behavior predictable and easy to review
- Prefer explicit, readable code, established patterns, and platform features over clever solutions
- Prefer the standard library and established, well-maintained libraries over custom solutions
- Preserve existing abstractions unless there is a clear reason to change them
- Only refactor or make unrelated improvements if asked to
- Do not introduce new dependencies unless necessary
- Do not invent APIs, config values, or behaviors without evidence in code or task input
- When fixing a bug, reproduce the symptom and trace to root cause before changing code
- Single responsibility per function/class
- Avoid premature abstractions
- If you need to explain it, it's too complex

Before finishing:

- Run the project's configured validation gates, including formatters/linters and relevant type checks or builds; fix all failures
- Self-review changes

Learning the codebase:

- Study and plan before implementing; find 3 similar features/components
- Follow their patterns and conventions, including tests; reuse libraries/utilities when possible
- Update plans and checklists as you go

Tooling:

- Use project's existing build system, test framework, and formatter/linter settings
- Don't introduce new tools without strong justification and always confirm with user

You must never:

- Use `--no-verify` to bypass commit hooks - let the hooks pass
- Disable tests instead of fixing them
- Make assumptions - verify with existing code and with user, ask questions
- Commit code that doesn't compile or pass validations, fix problems instead

Commits:

- Locally, leave review and commits to the user unless they explicitly ask you to commit
- Always use the "git-commit-style" skill when committing, including autonomous cloud work
- Commit working code incrementally

Branches:

- Prefer rebasing a feature branch on master instead of merging master to it
- Feature branches, when ready, merge to master with a merge commit, no fast forward

PRs:

- Always open ready PRs, never drafts, this is mandatory
- Always follow the relevant PR skill (GitHub or GitLab)
