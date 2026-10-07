---
name: recap
description: Summarize saved project activity over a requested period. Use when the user asks for a recap of today, this week, or recent sessions.
argument-hint: '[last N | today | this week]'
user-invocable: true
---

1. Resolve the project and time window using the user's timezone. Default to the latest 10 recorded sessions when no window is given.
2. Call `memory_sessions` and filter the returned sessions to the project and window. Use only parameters supported by the exposed tool schema; filter locally when necessary.
3. Retrieve highlights with `memory_recall` using project and topic terms. Check each result's session ID and date before attributing it to a session.
4. Group the evidence by date and summarize useful outcomes, decisions, and unfinished work. Use returned summaries or first prompts when a session has no title.
5. Report missing coverage plainly. Session records are historical and curated saves may not belong to a session; use dated saved memories when relevant.

Do not treat an empty window as proof that no work happened or present this as a complete activity log. Use `session-history` for a timeline and `handoff` for next steps.
