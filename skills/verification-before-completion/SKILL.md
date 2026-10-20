---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, or before handing off changes - requires fresh, task-appropriate evidence and checking actual results before making success claims
---

# Verification Before Completion

## Overview

Do not claim work is complete without verification.

**Core principle:** Evidence before claims.

## The Rule

NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

If you have not performed the check that supports the claim, do not make the claim. Use commands for tests and builds, and direct inspection or browser interaction where that is what verifies the behavior.

## Required Sequence

Before making a completion or success claim:

1. Identify the check that supports the claim.
2. Run the relevant command or perform the direct check using available tooling.
3. Inspect the actual result; for commands, read the output and check the exit code.
4. Confirm the evidence supports the scope of the claim.
5. Only then state the result.

If verification fails, report the real status with evidence.

## What Counts

| Claim              | Required evidence                          | Not enough                        |
| ------------------ | ------------------------------------------ | --------------------------------- |
| Tests pass         | Fresh test run with 0 failures             | "Should pass now"                 |
| Linter clean       | Fresh lint output with 0 errors            | Partial check                     |
| Build succeeds     | Fresh build exit code 0                    | Passing lint                      |
| Bug fixed          | Reproduced symptom no longer occurs        | Code changed                      |
| Regression covered | Verified red-green-pass cycle              | Test written once                 |
| Task completed     | Verified requirements and current diff     | Assuming implementation is enough |
| UI behavior works  | Exercise the affected user flow and states | A screenshot alone                |

## Red Flags

Stop if you are about to:

- say "done", "fixed", "working", or similar without a fresh check
- rely on confidence instead of observed results
- trust a partial verification for a broader claim
- move to commit, PR, or handoff without verifying
- use "should", "probably", or "seems" to imply success without verification

## Verification Patterns

**Tests**

Run the real test command.
Read the full result.
Then say: "Tests pass" only if they actually pass.

**Build**

Run the real build command.
Check exit code and errors.
Then say: "Build passes" only if it exits successfully.

**Bug fixes**

Reproduce the original issue.
Apply the fix.
Run the check that proves the symptom is gone.
Only then say the bug is fixed.

**Requirements**

Re-read the requested scope.
Check each requirement against the current implementation.
Report what is complete and what is still missing.

## Tooling Guidance

Use the available project and IDE tooling to verify claims:

- run the project's configured verification gates and relevant checks
- inspect command output directly rather than inferring
- inspect delegated or generated work and verify the relevant behavior; a reviewer's confidence is not execution evidence
- prefer complete checks over partial evidence when making broad claims

## Verification limits

A passing check supports only what it covers. If tooling, credentials, or the environment blocks verification, report what was checked, what remains unverified, and why. Do not substitute confidence for missing evidence.

Checks apply to the version inspected. After relevant changes, rerun the affected checks before relying on them again.

## Bottom Line

Perform the check. Inspect the result. Then state what it establishes.

No evidence, no completion claim.
