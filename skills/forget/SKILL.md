---
name: forget
description: Find and delete specific saved memories after the user approves the exact matches. Use when the user asks to forget or remove stored information.
argument-hint: '[what to forget]'
user-invocable: true
---

1. Search with `memory_smart_search` or `memory_recall`. Expand relevant results and verify the IDs accepted by the deletion tool; do not assume an observation ID is a saved-memory ID.
2. Show the exact memories to delete, without repeating secrets. Ask for confirmation of this concrete set before deleting.
3. After confirmation, call `memory_governance_delete` with `memoryIds` as a comma-separated string and a short `reason`.
4. Report the actual deletion count and any failures from the response.

```json
memory_governance_delete {
  "memoryIds": "abc12345,def67890",
  "reason": "user request"
}
```

Never pass a bare session ID. Search results may be incomplete; do not claim to delete an entire session from a limited search. If exact deletion targets cannot be verified, stop and explain the limitation.
