---
name: remember
description: Save an insight, decision, or learning to agentmemory's long-term storage with searchable concept tags. Use when the user says "remember this", "save this", "note that", "don't forget", or wants to preserve knowledge for future sessions.
argument-hint: '[what to remember]'
user-invocable: true
---

The user wants to save this to long-term memory: $ARGUMENTS

## Quick start

```json
memory_save {
  "content": "We rotate JWT refresh tokens on every use; the old token is revoked server-side in auth/refresh.ts.",
  "concepts": "jwt-refresh-rotation, token-revocation, auth-flow",
  "files": "src/auth/refresh.ts",
  "project": "my-app"
}
```

Expected output:

```text
Saved memory abc12345 with 3 concepts: jwt-refresh-rotation, token-revocation, auth-flow (project: my-app).
```

## Why

A memory is only as useful as the terms that find it later. Tag with specific concepts so a future `recall` hits, and keep the user's own phrasing.

Without `project`, the memory lands in global search only. Per-project recall and filtering skip it.

## Workflow

1. Pull the core insight, decision, or fact out of `$ARGUMENTS`.
2. Extract 2-5 lowercased concept phrases. Prefer specific over generic (`jwt-refresh-rotation` beats `auth`).
3. Extract referenced file paths (absolute or repo-relative). Empty if none.
4. Set `project` to the repo folder name for the workspace you are in (e.g. `agentmemory-cursor-importer`, `honeymoon-trip`). Use the same slug hooks send on `/observe`, not a full filesystem path.
5. Call `memory_save` with `content`, `concepts`, `files`, and `project`.
6. Confirm the save. Echo the concepts and project so the user knows the retrieval terms.

## Anti-patterns

WRONG: `concepts: "stuff, code, notes"` (generic tags nothing can find later).

WRONG: `project: "/Users/me/Projects/my-app"` (paths change across machines).

WRONG: omitting `project` (memory becomes global-only).

RIGHT: `concepts: "jwt-refresh-rotation, token-revocation"` and `project: "my-app"`.

## Checklist

- Content keeps the user's phrasing, not a paraphrase.
- Concepts are specific, lowercased, 2-5 items.
- File paths are real references, not guesses.
- `project` is the repo folder name, always included.
- Confirmation echoes the exact concepts and project tagged.

## See also

- `recall` retrieves what you save here.
- `forget` removes a memory you saved by mistake.
