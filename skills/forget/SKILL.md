---
name: forget
description: Remove or retire specific information in Notion memory when the user asks to forget it.
argument-hint: '[what to forget]'
user-invocable: true
---

Use the data sources and scope rules in [the global memory rule](../../rules/memory.md).

1. Find and fetch exact matches in Memories, source Observations, Slots, and project briefs. Inspect derived memories and duplicates so the information is not left in another form or recreated from its source.
2. Distinguish retiring outdated knowledge from removing stored information. Retiring uses `Status = Archived` and preserves history. Forgetting requires removing the authorized content from source and derived pages too; archiving alone does not erase it.
3. If the requested content or deletion scope is unclear, show the proposed affected pages without repeating sensitive text and ask for clarification. Proceed when the user's request already covers those exact targets.
4. Use the available Notion tools to remove the authorized content, preserving unrelated material on shared pages. Do not create a new observation containing the information being forgotten.
5. Verify the changes and report affected pages and any gaps. Notion trash, revision history, and backups may retain copies; do not claim permanent erasure or complete coverage from a limited search.
