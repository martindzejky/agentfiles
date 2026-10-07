---
description: Cloud agent, autonomous delivery
metadata:
  environments: cloud
---

When running in the cloud, run autonomously unless the user is only asking a question.
Don't wait for the user. Be proactive and autonomous.
Follow the project's `README.md` file.

## Environment

- In Cursor Cloud, secrets usually come from the Cursor dashboard. In other hosted environments, use that platform's secret injection.
- If env vars fail, notify the user and stop.

## Memory before finishing

**You MUST manually save relevant, high-signal session information through the agentmemory MCP before your final response. Do not rely on hooks to have captured it.** Codex Cloud hooks may not run at all; Cursor Cloud hooks may miss the initial prompt. Treat cloud hook capture as incomplete even when hooks are configured.

- Review the initial request and the session for decisions, constraints, discoveries, lessons, and unfinished work that would help a future agent. Save concise, reusable context with `memory_save` or the appropriate lesson, action, or slot tool.
- In the cloud, this requirement overrides the general memory rule to skip information already present in the transcript: the transcript may never have reached memory. Check existing memory and avoid duplicating information already stored.
- Do not save the full transcript, routine tool output, or unnecessary details. If there is no relevant, high-signal information to preserve, skip the write.
- Complete useful memory writes near the end of work, before the final response. If memory is unavailable, report that the information could not be saved.

## Git and PRs

- Work on feature branches. Never push to `master`/`main`.
- Finish with an **open, ready-for-review PR** (not draft), unless the task was question-only.
- Before a write-capable subagent runs, be on a feature branch.
- PR titles start with a capital letter. Keep the description cumulative and current with all commits.
- For create/update/review flow, follow the `github-pull-requests` skill. In Cursor Cloud, PR writes use `ManagePullRequest` when available; otherwise use `gh` when writes are allowed.
- **Before every `git commit`:** read the `git-commit-style` skill and follow it exactly. Always use the `git-commit-style` skill for writing the commit messages. If instructions conflict on commit messages, `git-commit-style` wins over generic "descriptive commit" wording.
- **Issue-driven PRs:** When work comes from a GitHub issue, the PR description must include a **References** section with `Closes #<number>` (linked to the issue) so the issue auto-closes on merge. Use proper capitalization.
- **Tagged on an issue/PR (Cursor Cloud):** Your final output may be posted as a bot comment on the issue. The user usually does not see WIP messages, so end with a short summary, link to the open PR, any blockers, and anything else relevant. Keep it concise.

## Verification gate

Before commit/push/PR update, run the project's configured verification gates.
Verify your own work using screenshots, videos, tests, or manual code checks as relevant.
Attach verification artifacts (screenshots/recordings) to the PR for user-visible changes.

## Browser use and videos

In the cloud you have access to browser tools and screenshot and video recording and inspection tools.
Use them to verify your work, and capture artifacts and proof for the user.

**Note about animations, transitions, and motion:** the video inspection tools usually work with lower FPS, so you might not see quick animations or transitions. In that case, do not rely on video only and instead perform manual checks via code and logs.
