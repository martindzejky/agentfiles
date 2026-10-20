---
name: gitlab-merge-requests
description: Work with GitLab merge requests using glab — create, review, comment, check pipelines, and update. Use when opening or creating an MR, finishing work on a feature branch, or operating on the current branch's merge request from the terminal.
---

# GitLab Merge Requests

Use `glab`, not `gh`.

## Core Rule

- Start with `glab mr`.
- If a command accepts `[<id> | <branch>]`, omit it by default.
- In the usual feature-branch workflow, `glab` resolves the open MR for the current branch.
- Only pass an ID or branch when intentionally targeting a different MR.
- If unsure about flags, run `glab mr <subcommand> --help`.

## Delivery policy

Open ready merge requests, never drafts. If an MR is accidentally created as a draft, mark it ready and verify before finishing. Never merge or enable auto-merge; the user merges on their own.

## Quick Reference

- Create MR: `glab mr create`
- Inspect current branch MR: `glab mr view`
- Show comments and activity: `glab mr view --comments`
- Show unresolved threads only: `glab mr view --comments --unresolved`
- View structured MR data: `glab mr view --output json`
- View MR diff: `glab mr diff`
- List discussions: `glab mr note list`
- List unresolved diff discussions: `glab mr note list --state unresolved --type diff`
- Add a note: `glab mr note -m "message"`
- Open editor for a longer note: `glab mr note`
- Resolve a discussion: `glab mr note resolve <discussion-id>`
- Reopen a discussion: `glab mr note reopen <discussion-id>`
- Approve current MR: `glab mr approve`
- Mark ready: `glab mr update --ready`
- Mark draft (reference only; agent-opened MRs must stay ready): `glab mr update --draft`
- Update title/body from commits: `glab mr update --fill --fill-commit-body --yes`
- Merge current MR (reference only; the user performs the merge): `glab mr merge`

## Create MR

### Title

- Include jira ticket number in title if you have any
- After the ticket, start the MR name with a capital letter

**Good example:**

```
EPIK-14400 Overlapping user info max-width
```

Pattern: `{JIRA-TICKET} {Short mr name}` — ticket prefix when known, then a title starting with a capital letter after the ticket, no punctuation.

Derive the name from branch name or commits when the ticket is already in the branch (e.g. `EPIK-14400-max-width-text` → `EPIK-14400 Overlapping user info max-width`).

### Description

Keep it short and concise — bullet points when possible. Start each bullet with a capital letter. Use prose only when the change is large, risky, or needs context that bullets would hide.

Default structure:

```markdown
## Summary

- {What changed}

## Test plan

- [ ] {How to verify}
```

Use `[x]` for steps already verified before opening the MR. Skip filler.

### Preflight

Run before creating the MR. Batch the git commands in parallel where possible.

1. **Branch state** — understand what will be in the MR:
   - `git status`
   - `git diff` and `git diff --staged`
   - whether the branch tracks a remote and is up to date with it
   - `git log <base>..HEAD --oneline`
   - `git diff <base>...HEAD`

   Verify the intended target branch; use the repository default when no other target is specified. Use that target consistently for the comparison and MR creation.

2. **Existing MR** — `glab mr view` on the current branch. If an open MR already exists, return its URL instead of creating a duplicate.

3. **Changelog** — check whether the repo has `CHANGELOG.md` at the root.
   - **If it exists:** ensure the current feature branch already includes a changelog entry for this work (usually under `[Unreleased]`). If it does not, stop and ask the user whether to update it — use the `/changelog` command workflow, then commit before opening the MR.
   - **If it does not exist:** skip; do not invent a changelog file.

Do not open the MR until preflight passes: changelog handled (updated + committed, or user explicitly declines), branch state reviewed, and no duplicate MR.

### Workflow

1. Complete **Preflight** above
2. Push if needed: `git push -u origin HEAD`
3. Create a ready MR. Set `TARGET_BRANCH` to the verified target and write the description to a temporary file:

```bash
MR_BODY_FILE=$(mktemp)
cat > "$MR_BODY_FILE" <<'EOF'
## Summary

- Change one
- Change two

## Test plan

- [ ] Verify thing
EOF
glab mr create \
  -t "EPIK-1234 Short mr name" \
  --description-file "$MR_BODY_FILE" \
  -b "$TARGET_BRANCH" \
  -a martindzejky \
  --remove-source-branch=true \
  --yes
```

4. Verify `glab mr view --output json` reports `draft: false` and the intended target branch. If needed, use `glab mr update --ready` and recheck.
5. Return the MR URL from command output.

Do not use `--fill` when applying the title and description conventions above.

### Create Checklist

- [ ] Preflight complete (branch state, no duplicate MR, changelog handled)
- [ ] Title has Jira ticket when available
- [ ] Title name starts with a capital letter after the ticket
- [ ] Description is short; bullets start with capitals
- [ ] Test plan included
- [ ] Assignee set to martindzejky
- [ ] `--remove-source-branch=true` passed on create
- [ ] MR verified ready with the intended target branch
- [ ] MR URL returned to user

## Pipeline Checks

Use `glab mr view --output json` when you need MR-linked status without leaving the terminal.

Look for:

- `pipeline.status` (older pipeline summary)
- `head_pipeline.status` and its `sha` / `web_url` (prefer this more complete field)
- `detailed_merge_status`
- `has_conflicts`
- `web_url`

A missing or inaccessible pipeline is not a successful pipeline. Check that the reported pipeline applies to the current MR head before claiming CI passed.

## Review Workflow

```bash
glab mr view --comments --unresolved
glab mr diff
glab mr note list --state unresolved
glab mr note -m "addressed in the latest commit"
glab mr view --output json
```

## Common Mistakes

- Looking up the MR ID first when the current branch is already enough.
- Using `glab mr list` for the active branch instead of `glab mr view`.
- Using `--fill` when a custom title and description are required.
- Creating drafts, merging, or enabling auto-merge.
- Lowercase titles or bullets.
- Assuming `glab mr note list` is fully stable; it is marked experimental.
- Assuming `glab mr note -m` posts an in-thread reply. Check `glab mr note --help` first if thread-specific behavior matters.
