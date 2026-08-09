---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation
---

# Receiving Code Review

Code review requires technical evaluation, not emotional performance.

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

## Response pattern

When receiving review feedback:

1. Read the full feedback before reacting.
2. Restate the requirement in your own words, or ask if anything is unclear.
3. Verify against the codebase, tests, and prior decisions.
4. Evaluate whether the suggestion is sound for this codebase.
5. Respond with a technical acknowledgment or reasoned pushback.
6. Implement one item at a time and test each fix.

## Skip performative agreement

Do not open with praise or premature commitment:

- Avoid: "You're absolutely right!", "Great point!", "Let me implement that now" (before verification)
- Prefer: restate the requirement, ask a clarifying question, push back with evidence, or just start working

Actions matter more than agreement theater.

## Unclear feedback

If any item is unclear, stop. Do not implement partial feedback.

Items are often related. Partial understanding leads to wrong fixes.

Example: the user says "fix items 1-6." You understand 1, 2, 3, and 6 but not 4 or 5.

- Wrong: implement 1, 2, 3, and 6 now, ask about 4 and 5 later
- Right: "I understand items 1, 2, 3, and 6. Need clarification on 4 and 5 before proceeding."

## By source

### From the user

- Trusted once you understand the ask
- Still clarify when scope is ambiguous
- Skip performative agreement; move to action or a brief technical acknowledgment

### From external reviewers (PR comments, automated review, etc.)

Before implementing, check:

- Is it technically correct for this codebase?
- Does it break existing functionality?
- Is there a reason for the current implementation?
- Does it hold for the platforms or versions this project supports?
- Does the reviewer have enough context?

If the suggestion seems wrong, push back with technical reasoning.

If you cannot verify easily, say so: "I can't verify this without [X]. Should I investigate, ask, or proceed?"

If it conflicts with an earlier decision from the user, stop and confirm with them first.

External feedback is input to evaluate, not orders to follow.

## YAGNI check

When a reviewer suggests "implementing properly" or expanding scope:

- grep the codebase for actual usage
- if unused: propose removal instead of building more ("This endpoint isn't called. Remove it?")
- if used: then implement properly

## Implementation order

For multi-item feedback:

1. Clarify anything unclear first
2. Then fix in this order: blocking issues (breaks, security), simple fixes (typos, imports), complex fixes (refactoring, logic)
3. Test each fix individually
4. Verify no regressions

## When to push back

Push back when:

- The suggestion breaks existing functionality
- The reviewer lacks full context
- It violates YAGNI (unused feature or speculative work)
- It is technically incorrect for this stack
- Legacy or compatibility reasons apply
- It conflicts with an earlier architectural decision

How to push back: use technical reasoning, ask specific questions, reference working tests or code. Escalate to the user when the decision is architectural.

## Acknowledging correct feedback

When feedback is correct:

- "Fixed. [Brief description of what changed]"
- "Good catch — [specific issue]. Fixed in [location]."
- Or just fix it and show the change in the code

Do not perform gratitude. The fix is the acknowledgment.

## Correcting a wrong pushback

If you pushed back and were wrong:

- "You were right — I checked [X] and it does [Y]. Implementing now."
- "Verified this and you're correct. My initial understanding was wrong because [reason]. Fixing."

State the correction factually. No long apology or re-litigating the pushback.

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Performative agreement | State requirement or just act |
| Blind implementation | Verify against codebase first |
| Batch without testing | One at a time, test each |
| Assuming reviewer is right | Check whether it breaks things |
| Avoiding pushback | Technical correctness over comfort |
| Partial implementation | Clarify all items first |
| Can't verify, proceed anyway | State limitation, ask for direction |

## Examples

**Performative agreement (bad):**

```
Reviewer: "Remove legacy code"
"You're absolutely right! Let me remove that..."
```

**Technical verification (good):**

```
Reviewer: "Remove legacy code"
"Checking... build target is 10.15+, this API needs 13+. Need legacy for backward compat. Current impl has wrong bundle ID — fix it or drop pre-13 support?"
```

**YAGNI (good):**

```
Reviewer: "Implement proper metrics tracking with database, date filters, CSV export"
"Grepped codebase — nothing calls this endpoint. Remove it (YAGNI)? Or is there usage I'm missing?"
```

## Bottom line

Verify. Question. Then implement.

No performative agreement. Technical rigor always.
