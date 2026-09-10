---
name: create-gitlab-mr
description: Opens a GitLab merge request for the current branch using the gitlab-merge-requests skill. Use when the user explicitly invokes /create-gitlab-mr or asks to open a GitLab merge request.
user-invocable: true
disable-model-invocation: true
---

# Create GitLab MR

Open a GitLab merge request for the current branch. Follow the `gitlab-merge-requests` skill — preflight, title and description conventions, then `glab mr create`.

Return the MR URL when done.
