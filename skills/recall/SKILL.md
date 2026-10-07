---
name: recall
description: Find saved decisions, facts, and unfinished work relevant to a topic. Use when the user asks about past context or current work needs prior decisions.
argument-hint: '[search query]'
user-invocable: true
---

1. Search with `memory_smart_search` using a focused `query` and a small `limit`, such as 10. Include the project name and relevant files in the query when scope matters.
2. Compact results contain titles and observation IDs. Expand relevant IDs with `memory_smart_search` and `expandIds` as a comma-separated string, or use `memory_recall` for full observations.
3. Summarize only the returned evidence. Check project, dates, and session IDs before attributing a decision. Verify facts that may have changed against the current repository.
4. If nothing relevant matches, say so and try narrower terms when useful. Do not invent past context.

```json
memory_smart_search { "query": "my-app refresh token rotation decision", "limit": 10 }
```

Saved context is selective; a missing result does not prove something never happened. Use `remember` to save knowledge and `handoff` to resume unfinished work.
