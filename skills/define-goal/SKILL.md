---
name: define-goal
description: Use when the user wants to clarify success criteria, set an objective, or turn a fuzzy intention into a measurable outcome before starting work
---

# Define Goal

Shape intent into an objective you can pursue honestly. Prefer measurable outcomes and explicit evidence over activity descriptions.

Do not force goal-shaping on ordinary implementation work. Use this when the outcome or success bar is genuinely unclear.

## Workflow

1. Restate the likely goal in concrete terms:
   - what will be true when done
   - the artifact, system, or behavior involved
   - how completion will be verified
   - what is in scope and out of scope when ambiguity matters

2. Make it quantitative when the domain supports it:
   - pass/fail validators: tests, checks, CI jobs, commands, acceptance criteria
   - thresholds: latency, error rate, coverage, flake rate, bundle size, and similar metrics
   - artifact constraints: file paths, affected modules, environments, blast radius

3. Repair weak goals before proceeding:
   - rewrite vague goals into measurable objectives when local context makes that safe
   - ask one concise question when missing detail changes the outcome or validation
   - reject activity goals such as "make progress" or "keep investigating" unless sharpened into a verifiable outcome

4. Confirm the shaped goal with the user when the rewrite could still miss intent.

## Quality bar

Before treating the goal as settled, it should answer:

- What concrete thing will be true when this is done?
- What evidence will prove it?
- What binary or numeric threshold defines success?
- What scope boundaries matter?
- When should you stop and ask instead of grinding?

**Good:** Reduce checkout API p95 latency below 250 ms for the documented slow path with the smallest safe server-side change, verified by `npm run test:checkout` and three consecutive local benchmark runs under 250 ms.

**Weak:** Make checkout faster.

## Clarifying questions

Ask only when a reasonable rewrite would risk pursuing the wrong outcome. Keep questions short and oriented around the missing validator or scope boundary.

If the user cannot provide a metric, propose the most honest binary validator available and ask for confirmation.
