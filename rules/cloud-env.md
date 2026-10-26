---
description: Cloud agent, autonomous delivery
metadata:
  environments: cloud
---

Cloud execution only, not local use of remote services. Unless question-only:
Don't wait for the user. Be proactive and autonomous.
Follow the project's `README.md`.

## Environment

- For global agentfiles setup, follow [agentfiles/AGENTS.md](https://github.com/martindzejky/agentfiles/blob/master/AGENTS.md). Do not add hooks or replace platform-managed configuration.
- In Cursor Cloud, secrets usually come from the Cursor dashboard. In other hosted environments, use that platform's secret injection.
- Wait for readiness per the environment rule. If required env vars or secrets are still unavailable after setup, notify the user and stop.

## Git and PRs

- Work on feature branches. Never push to `master`/`main`.
- Finish with an **open, ready-for-review PR** (not draft), unless the task was question-only.
- Before a write-capable subagent runs, be on a feature branch.
- PR titles start with a capital letter. Keep the description cumulative and current with all commits.
- For create/update/review flow, follow the `github-pull-requests` skill. In Cursor Cloud, PR writes use `ManagePullRequest` when available; otherwise use `gh` when writes are allowed.
- Before every commit, read and follow `git-commit-style`; it overrides generic message guidance.
- Issue-driven PRs need a **References** section with `Closes #<number>` linked to the issue for auto-closing on merge.
- When tagged on an issue/PR in Cursor Cloud, final output may become a bot comment. Include a short summary, open PR link, and blockers; WIP messages usually aren't visible.

## Verification gate

Before commit/push/PR update, run configured gates and verify with tests, manual checks, or browser artifacts as relevant. Attach screenshots/recordings to PRs for user-visible changes.

## Browser use and videos

Use cloud browser and recording tools to verify work and capture proof.

Video inspection has low FPS and may miss quick motion/transitions; also check code and logs.
