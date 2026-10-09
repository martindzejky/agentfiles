---
name: recall
description: Investigate saved decisions, facts, or prior reasoning in Notion memory when a question needs more than routine startup recall.
argument-hint: '[topic, file, or decision]'
user-invocable: true
---

Use the data sources and scope rules in [the global memory rule](../../rules/memory.md).

1. Search Memories with specific project names, concepts, file paths, or commit SHAs. Fetch useful matches and inspect their status, applicability, and conflict links.
2. Use Memories for rationale and context. Follow `Source observations` only when the user asks for original accounts or supporting evidence. A missing memory is not a reason to browse Observations.
3. For historical questions, include Superseded and Archived memories deliberately. Explain what applied then and what applies now. For code questions, use Git to verify the commit or file before attributing saved reasoning to it.
4. Answer with links to supporting pages. Separate recorded facts, current verification, and inference. Report conflicting evidence or missing coverage.

A missing search result does not prove something never happened. Try relevant alternate terms before concluding that no saved context was found.
