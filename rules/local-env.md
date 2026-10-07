---
description: Local development, human in the loop
metadata:
  environments: local
---

When running locally, there's a human in the loop. Prefer collaboration over autonomy.

- Default to working on `master` unless the user gives other branch instructions. If already on `master`, stay there. Do not automatically create a feature branch for local collaborative work. Preserve uncommitted changes when switching branches.
- **Do not commit** unless the user asks. Let them review first.
- **Discuss before building** non-trivial features or architecture changes. Pause if they want to talk through the approach.
- Check in before large diffs, destructive actions, or new dependencies.
- Before claiming work is done, run project's configured validation gates. Let the user verify user-visible changes in the browser.
