---
name: define-goal
description: Use when the user wants to clarify success criteria, set an objective, or turn a fuzzy intention into a measurable outcome before starting work
---

# Define Goal

Shape the user's intent into an objective you can pursue honestly. Prefer measurable outcomes, explicit evidence, and bounded scope over activity descriptions.

This skill is for goal definition only. Do not create planning artifacts, decision logs, or resume files from it.

## When to use

Use when:

- The user asks to define, set, or clarify a goal or success criteria
- The intended outcome is fuzzy and the wrong success bar would waste work
- You need a shared, verifiable definition of "done" before starting

Do not force goal-shaping on ordinary implementation work. If the ask is already clear, do the work.

## Workflow

1. **Confirm goal definition is needed.**
   If the user only wants implementation and the success bar is obvious, skip this skill.

2. **Restate the likely goal in concrete terms.**
   A usable goal names:
   - the specific outcome that will be true
   - the main artifact, system, repo, environment, or user-facing behavior involved
   - how completion will be verified
   - what is in scope
   - what is out of scope when ambiguity would matter
   - when to stop and ask the user instead of grinding

3. **Make it quantitative when the domain supports it.**
   Prefer numbers that represent real success, not decorative precision:
   - pass/fail validators: exact tests, checks, CI jobs, commands, or acceptance criteria
   - quality thresholds: latency, error rate, cost, accuracy, coverage, flake rate, bundle size, memory, uptime, or manual review criteria
   - artifact constraints: file paths, affected modules, allowed commands, output formats, target environments, deadlines, or maximum blast radius
   - evidence counts: reproduced failures, successful reruns, reviewed examples, migrated records, addressed comments, or verified cases

4. **Repair weak goals before proceeding.**
   - Rewrite vague goals into measurable objectives when local context makes that safe
   - Ask one concise question when missing detail changes the outcome or validation
   - Reject activity goals such as "make progress," "keep investigating," or "improve things" unless sharpened into a verifiable outcome

5. **Confirm with the user when the rewrite could miss intent.**
   State the shaped goal clearly in chat. If an earlier goal in the thread conflicts with the new request, ask whether to finish the current one first or switch.

## Quality bar

Before treating the goal as settled, it should answer:

- What concrete thing will be true when this is done?
- What evidence will prove it?
- What quantitative or binary threshold defines success?
- What scope boundaries matter?
- What should cause you to stop and ask?

**Good:**

> Reduce checkout API p95 latency below 250 ms for the documented slow path by making the smallest safe server-side change, then verify with `npm run test:checkout` and the existing local latency benchmark showing p95 under 250 ms across 3 consecutive runs.

**Good:**

> Resolve the open review comments on PR 123 that request code changes, update only the affected auth files and tests, and verify with the targeted auth test command plus `gh pr view 123` showing no unresolved change-request threads.

**Weak:**

> Make checkout faster.

**Weak:**

> Keep investigating the PR comments.

## Quantification heuristics

- **Bugs:** reproduction first, fix second, failing-then-passing validator when possible
- **Tests:** name the exact command and required pass condition
- **Performance:** metric, target threshold, measurement method, and number of runs
- **Quality work:** observable acceptance bar such as reviewed examples, lint/typecheck/test pass, or user-approved artifact
- **Research:** decision the research must enable, sources or systems in scope, and evidence standard
- **Operations:** healthy state, monitoring window, failure threshold, and rollback or escalation trigger

## Clarifying questions

Ask only when a reasonable rewrite would risk pursuing the wrong outcome. Keep the question short and oriented around the missing validator or scope boundary.

Useful shapes:

- "What metric should define success here: latency, cost, accuracy, or user-visible behavior?"
- "Which environment should I verify against: local, staging, or production?"
- "What is the minimum evidence you want before I mark this done?"

If the user cannot provide a metric, propose the most honest binary validator available and ask for confirmation.
