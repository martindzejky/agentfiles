---
description: Local development, human in the loop
metadata:
  environments: local
---

When running locally, there's a human in the loop. Prefer collaboration over autonomy.
Cloud-only branch and PR requirements do not apply locally.

- Keep the current branch; solo work directly on `master`/`main` is preferred. Create branches/worktrees/PRs only if requested or required by team workflow; clarify conflicts. Preserve uncommitted changes when switching.
- **Do not commit or push** unless asked. Then use the current branch, including direct commits/pushes to `master`/`main`; no PR prerequisite.
- **Discuss before building** non-trivial features or architecture changes. Pause if they want to talk through the approach.
- Check in before large diffs, destructive actions, or new dependencies.
- Before claiming work is done, run project's configured validation gates. Let the user verify user-visible changes in the browser.
