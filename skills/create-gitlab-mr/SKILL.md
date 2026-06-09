---
name: create-gitlab-mr
description: Creates GitLab merge requests with glab using title and description conventions. Use when the user asks to open, create, or push a GitLab MR/merge request, or when finishing work on a feature branch that needs an MR.
---

# Create GitLab MR

Use `glab`, not `gh`. Also see the `gitlab-merge-requests-with-glab` skill for working with `glab`.

## Title

- Include jira ticket number in title if you have any
- Follow by MR name, all lowercase

**Good example:**

```
EPIK-14400 overlapping user info max-width
```

Pattern: `{JIRA-TICKET} {short mr name}` — ticket prefix when known, then lowercase words, no punctuation.

Derive the name from branch name or commits when the ticket is already in the branch (e.g. `EPIK-14400-max-width-text` → `EPIK-14400 overlapping user info max-width`).

## Description

Some principles for the description: keep it short and concise, bullet points, lowercase; unless a bigger description is needed, in which case prose is fine.

Default structure:

```markdown
## Summary

- {what changed, lowercase bullets}

## Test plan

- [ ] {how to verify}
```

Use `[x]` for steps already verified before opening the MR.

Keep bullets lowercase. Skip filler. Add prose only when the change is large, risky, or needs context that bullets would hide.

## Preflight

Run these checks before creating the MR. Batch the git commands in parallel where possible.

1. **Branch state** — understand what will be in the MR:
   - `git status`
   - `git diff` and `git diff --staged`
   - whether the branch tracks a remote and is up to date with it
   - `git log master..HEAD --oneline`
   - `git diff master...HEAD`

2. **Existing MR** — `glab mr view` on the current branch. If an open MR already exists, return its URL instead of creating a duplicate.

3. **Changelog** — check whether the repo has `CHANGELOG.md` at the root.
   - **If it exists:** ensure the current feature branch already includes a changelog entry for this work (usually under `[Unreleased]`). If it does not, stop and ask the user whether to update it — use the `/changelog` command workflow, then commit before opening the MR.
   - **If it does not exist:** skip; do not invent a changelog file.

Do not open the MR until preflight passes: changelog handled (updated + committed, or user explicitly declines), branch state reviewed, and no duplicate MR.

## Workflow

1. Complete **Preflight** above
2. Push if needed: `git push -u origin HEAD`
3. Create MR:

```bash
glab mr create \
  -t "EPIK-1234 short mr name" \
  -d "$(cat <<'EOF'
## Summary

- change one
- change two

## Test plan

- [ ] verify thing
EOF
)" \
  -b master \
  -a martindzejky \
  --yes
```

4. Return the MR URL from command output.

## Checklist

- [ ] Preflight complete (branch state, no duplicate MR, changelog handled)
- [ ] Title has Jira ticket when available
- [ ] Title suffix is lowercase
- [ ] Description is short; bullets lowercase
- [ ] Test plan included
- [ ] Assignee set to martindzejky
- [ ] MR URL returned to user
