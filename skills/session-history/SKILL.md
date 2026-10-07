---
name: session-history
description: Show recorded project sessions as a timeline. Use when the user explicitly asks for session history or an overview of past sessions.
user-invocable: true
---

1. Call `memory_sessions` using its exposed schema and filter results to the requested project, defaulting to the current workspace.
2. Sort by `startedAt` descending and present dates in the user's timezone. Include session ID, returned summary or first prompt, status, and observation count when useful.
3. Retrieve supporting observations with `memory_recall` only when needed. Check session IDs before attaching highlights.
4. If no sessions match, say there are no recorded sessions for this project. Use `recall` for separately saved context when useful.

Recorded sessions are partial historical evidence. Zero observations means no observations were recorded, not that no work occurred. Do not fabricate titles, highlights, or complete coverage.
