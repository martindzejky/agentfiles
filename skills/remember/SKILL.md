---
name: remember
description: Save durable decisions, preferences, and discoveries to shared memory. Use when the user asks to remember something or when useful context should survive the current session.
argument-hint: '[what to remember]'
user-invocable: true
---

Save the useful fact or decision, including its reason and any limits that matter later. Preserve the user's intent; skip full transcripts and routine output.

1. Search existing memory with `memory_smart_search` or `memory_recall` to avoid duplicates or surface an older decision that this replaces.
2. Call `memory_save` with concise `content`, 2-5 specific concepts as a comma-separated string, and real file paths in `files` when relevant.
3. For project-specific knowledge, use the established project identifier in `project`. Prefer the existing project slug; never use an absolute directory as the identifier. Omit project for global preferences.
4. Confirm success from the response and briefly report what was saved. If the tool fails, say so.

Example:

```json
memory_save {
  "content": "Staging deploys must run migrations before app rollout because the new routes require the updated schema.",
  "concepts": "staging-deploy, migration-ordering",
  "project": "my-app"
}
```

Use `recall` to retrieve saved context and `forget` to remove it.
