---
name: commit-history
description: List commits with recorded memory session links. Use when the user asks for agent-linked commits or their saved session context.
argument-hint: '[branch=... repo=... limit=...]'
user-invocable: true
---

1. Parse requested `branch`, remote `repo`, and `limit` filters. A bare number is a limit; default to 20 and cap at the tool's supported maximum of 500.
2. Call `memory_commits` with the supported filters. Scope to the current repository's verified remote when no other repository is requested.
3. Present returned commits newest first, using their SHA, authored date, message, and linked session IDs. Do not invent observation counts or session details absent from the response.
4. If no commits match, say no recorded links match. This does not imply no commits were made; use git history if the user needs the actual repository history.

```json
memory_commits { "branch": "master", "limit": 20 }
```

Use `commit-context` to investigate one commit. Recorded links are historical evidence, not a complete activity log.
