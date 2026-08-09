---
name: requesting-code-review
description: Use before merge or after substantial changes to get a focused review of the diff and requirements
---

# Requesting Code Review

Get a second pass on the work product and requirements, not the full chat history.

## When to request review

- Before opening or updating a PR for merge
- After a substantial feature or risky change
- When stuck and a fresh read of the diff would help

Skip review theater on trivial edits.

## How to request review

Use Cursor's built-in review paths:

- **Bugbot** — launch a Task with `subagent_type="bugbot"` for a general code review of local changes
- **Security review** — launch a Task with `subagent_type="security-review"` when the diff touches auth, secrets, input handling, or trust boundaries
- **`/review`** — when available in the editor, for quick review of the current changes

## What to put in the prompt

Give the reviewer enough context to judge the diff:

- what was implemented and why
- requirements, issue link, or acceptance criteria
- git range to review (`BASE_SHA..HEAD_SHA`) or "uncommitted changes"
- anything intentionally out of scope

Optional scaffold: `requesting-code-review/code-reviewer-template.md`

## After review

- Fix blocking issues before merge
- Push back with technical reasoning when the reviewer lacks context or the suggestion is wrong for this codebase
- For PR feedback loops, use the `get-pr-comments` skill
