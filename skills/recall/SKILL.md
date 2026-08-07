---
name: recall
description: Search agentmemory for past observations, sessions, and learnings about a topic using hybrid BM25 plus vector plus graph search. Use when the user says "recall", "what did we do about", "did we ever", "have we seen", or needs context from past sessions.
argument-hint: '[search query]'
user-invocable: true
---

The user wants to recall past context about: $ARGUMENTS

## Quick start

```json
memory_smart_search { "query": "jwt refresh token rotation", "limit": 10 }
```

Expected output:

```text
2 results across 2 sessions.
[importance 8] decision · "Rotate refresh tokens on every use" (session 7f3a9c21)
[importance 5] code · "limit.ts counts per-IP" (session b21d004e)
```

## Why

Only show what the tool returned. Never invent an observation, session id, or importance score. If nothing comes back, say so.

## Workflow

1. Call `memory_smart_search` with the user's text as `query` and `limit: 10`. Pass `project` when the user scopes to a specific repo.
2. Group results by session.
3. For each observation show its type, title, and narrative.
4. Lead with high-signal observations (importance >= 7).
5. If zero results, suggest 2-3 other search terms and stop. Do not guess.

## Anti-patterns

WRONG: results are empty, so you write "We probably discussed token expiry last week" from assumption.

RIGHT: "No memories matched that query. Try `refresh token`, `session expiry`, or `auth rotation`."

## Checklist

- Every observation shown came from the tool response.
- Results grouped by session, high-importance first.
- Empty results get other search terms, not invention.
- No session id or score was paraphrased or rounded.

## See also

- `remember` writes what this skill retrieves.
- `recap`, `handoff`, `session-history` for session-scoped views.
