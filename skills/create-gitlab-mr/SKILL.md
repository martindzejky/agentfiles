---
name: create-gitlab-mr
description: Opens a GitLab merge request for the current branch using the gitlab-merge-requests skill.
user-invocable: true
disable-model-invocation: true
---

# Create GitLab MR

Open a GitLab merge request for the current branch. Follow the `gitlab-merge-requests` skill — preflight, title and description conventions, then `glab mr create`.

Never merge or enable auto-merge; the user merges on their own.

Return the MR URL when done.
