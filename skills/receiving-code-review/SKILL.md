---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable
---

# Receiving Code Review

## Core principle

Verify before implementing. Ask when unclear. Push back with technical reasoning when a suggestion is wrong for this codebase.

## Process

1. Read the full feedback before reacting.
2. Restate what you think is being asked, or ask one concise question if anything is ambiguous.
3. Check the suggestion against the codebase, tests, and prior decisions.
4. Fix what holds up; push back with evidence when it does not.
5. Skip performative agreement. State the fix or start working.

## Push back when

- The suggestion breaks existing behavior or tests
- The reviewer lacks context you can verify locally
- It adds unused work (YAGNI)
- It conflicts with an earlier architectural decision

If multiple items are unclear, clarify all of them before implementing any.
