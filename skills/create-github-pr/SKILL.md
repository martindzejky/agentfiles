---
name: create-github-pr
description: Opens a GitHub pull request for the current branch using the github-pull-requests skill.
user-invocable: true
disable-model-invocation: true
---

# Create GitHub PR

Open a GitHub pull request for the current branch. Follow the `github-pull-requests` skill — preflight, title and description conventions, then create the PR (local: `gh pr create`; cloud: `ManagePullRequest` `create_pr` with `"draft": false`).

Never merge or enable auto-merge; the user merges on their own.

Return the PR URL when done.
