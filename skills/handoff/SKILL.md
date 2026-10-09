---
name: handoff
description: Resume unfinished work from Notion memory when the user asks where we were, to pick up a task, or to continue from a saved handoff.
argument-hint: '[project or task]'
user-invocable: true
---

Use the project resolution and startup reads in [the global memory rule](../../rules/memory.md).

1. Read the project's working slots and applicable Global slots. Search Memories for relevant decisions and constraints. Use Slots for blockers and next steps.
2. Verify saved state against the current branch, files, and issue or PR status before continuing. Preserve uncommitted changes. A saved plan alone does not authorize destructive actions or resuming work the user paused.
3. Lead with the current state, any recorded blocker, and the concrete next step. If no handoff exists, say so and inspect the workspace rather than borrowing another project's history.
4. As work proceeds, update the slot's affected items and save durable findings as observations. Preserve unrelated pending work.
