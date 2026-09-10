---
name: create-github-pr
description: Opens a GitHub pull request for the current branch using the github-pull-requests skill. Use when the user explicitly invokes /create-github-pr or asks to open a GitHub pull request.
user-invocable: true
disable-model-invocation: true
---

# Create GitHub PR

Open a GitHub pull request for the current branch. Follow the `github-pull-requests` skill — preflight, title and description conventions, then create the PR (local: `gh pr create`; cloud: `ManagePullRequest` `create_pr` with `"draft": false`).

Return the PR URL when done.
