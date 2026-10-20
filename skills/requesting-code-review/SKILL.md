---
name: requesting-code-review
description: Use when completing substantial work or before merging to verify the diff meets requirements
---

# Requesting Code Review

Get a focused review of the work product and requirements, not your full session history.

**Core principle:** Review before merge. Review when the change is substantial or risky.

## When to request review

**Usually worth it:**

- Before opening or updating a PR for merge
- After a substantial feature or risky change
- When stuck and a fresh read of the diff would help
- Before a large refactor (baseline check)
- After fixing a complex bug

**Skip when:**

- The change is trivial (typo, comment, single-line fix)
- You already ran the relevant checks and the diff is obviously safe

Do not treat review as a batch ritual after every small step.

## How to request review

Use the review tools or read-only reviewer agents actually available in the environment. When delegating, give the reviewer the scope, requirements, and actual diff or file paths. If no independent reviewer is available, review the diff yourself using the template below and say that it was a self-review.

### 1. Get the git range

Choose the comparison that matches the work: uncommitted changes, the relevant commits, or a branch against its actual target. Inspect the repository before choosing a base; do not assume `main`, `master`, a particular remote, or `HEAD~1`.

For a committed branch review, set `TARGET_REF` to the verified target ref and use its merge base:

```bash
BASE_SHA=$(git merge-base HEAD "$TARGET_REF")
HEAD_SHA=$(git rev-parse HEAD)
git diff --stat "$BASE_SHA..$HEAD_SHA"
```

For uncommitted work, inspect both `git diff` and `git diff --cached`, plus relevant untracked files. Say "uncommitted changes" rather than inventing SHAs.

### 2. Fill the prompt

Use `requesting-code-review/code-reviewer-template.md` as a scaffold. At minimum include:

- `{WHAT_WAS_IMPLEMENTED}` — what you built or changed
- `{PLAN_OR_REQUIREMENTS}` — issue link, acceptance criteria, or expected behavior
- `{BASE_SHA}` / `{HEAD_SHA}` — review range, or "uncommitted changes"
- `{DESCRIPTION}` — brief summary and anything intentionally out of scope

Give the reviewer enough context to judge the diff on its own.

### 3. Act on feedback

- **Critical** — fix before merge (breaks, security, data loss)
- **Important** — fix before merge unless you can justify deferring with evidence
- **Minor** — note for later or fix if cheap
- Push back when the reviewer lacks context or the suggestion is wrong for this codebase

Keep the review scoped to correctness and the stated requirements. Do not turn it into unrelated cleanup or speculative features. Distinguish verified failures from concerns that still need checking.

## Red flags

Never:

- Skip review because "it's simple" when the change is actually substantial
- Ignore critical issues
- Proceed with unfixed important issues without explicit acknowledgment
- Argue with valid technical feedback

When the reviewer is wrong: push back with technical reasoning, show code or tests that prove it works, or ask for clarification.

## Example prompt shape

```
Review the auth middleware changes on this branch.

WHAT_WAS_IMPLEMENTED: Session validation middleware with optional refresh
PLAN_OR_REQUIREMENTS: Closes #42 — reject expired tokens, allow refresh within 5 min grace
BASE_SHA: a7981ec
HEAD_SHA: 3df7661
DESCRIPTION: Touches middleware/auth.ts and tests/auth.test.ts only. No migration.

Focus on token expiry edge cases and test coverage gaps.
```

See template at: `requesting-code-review/code-reviewer-template.md`
