---
name: create-github-pr
description: Opens a GitHub pull request for the current branch using the github-pull-requests skill.
user-invocable: true
disable-model-invocation: true
---

# Create GitHub PR

Open a GitHub pull request for the current branch. Follow the `github-pull-requests` skill — preflight, title and description conventions, then create the PR (`gh pr create` locally or in Codex; Cursor Cloud: `ManagePullRequest` `create_pr` with `"draft": false` when that tool is available).

Never merge or enable auto-merge; the user merges on their own.

Return the PR URL when done.
