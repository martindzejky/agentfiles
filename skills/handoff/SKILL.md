---
name: handoff
description: Resume unfinished work from saved project context. Use when the user says where were we, resume, handoff, or pick up where I left off.
argument-hint: '[optional project path]'
user-invocable: true
---

1. Identify the requested project, defaulting to the current workspace. Read relevant `pending_items` and `guidance` slots with `memory_slot_get` when available.
2. Use `recall` to find saved decisions, blockers, and next steps for that project. Historical sessions from `memory_sessions` can supplement this context when available.
3. Match project paths by directory boundary, never raw prefix. Do not fall back to an unrelated project's session when no match exists.
4. Lead with any recorded unanswered question or blocker, then describe the current state and concrete next step. Verify branch, files, and status against the repository before continuing.

Memory is selective. If no handoff was saved, report the gap and inspect the current workspace; do not invent previous work or infer an open question merely from a sentence ending in a question mark.
