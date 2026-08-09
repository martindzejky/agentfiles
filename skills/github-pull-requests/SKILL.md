---
name: github-pull-requests
description: Work with GitHub pull requests — create, update, comment, check CI, and review. Local IDE uses gh for writes; Cursor Cloud uses ManagePullRequest for writes and gh for reads. Use when opening or creating a PR, finishing work on a feature branch, or operating on the current branch's pull request.
---

# GitHub Pull Requests

Use `gh`, not `glab`.

## Core Rule

- Start with `gh pr`.
- If a command accepts `[<number> | <url> | <branch>]`, omit it by default.
- In the usual feature-branch workflow, `gh` resolves the open PR for the current branch.
- Only pass a number, URL, or branch when intentionally targeting a different PR.
- If unsure about flags, run `gh pr <subcommand> --help`.

## Cloud vs Local

**Local IDE:** use `gh` for PR reads and writes.

**Cursor Cloud:** `gh` is read-only for PR writes. Use the `ManagePullRequest` tool for writes — do not run `gh pr create`, `gh pr edit`, `gh pr ready`, `gh pr comment`, `gh pr review`, `gh pr close`, or `gh pr reopen` as write operations.

| Task              | Local                          | Cloud (`ManagePullRequest`)           |
| ----------------- | ------------------------------ | ------------------------------------- |
| Create PR         | `gh pr create`                 | `create_pr` — always `"draft": false` |
| Update title/body | `gh pr edit`                   | `update_pr`                           |
| Mark ready        | `gh pr ready`                  | `update_pr` with `"draft": false`     |
| Comment           | `gh pr comment`                | `post_comment`                        |
| Resolve thread    | (UI or API)                    | `resolve_comment`                     |
| CI status         | `gh pr checks`                 | `get_ci_status` or `gh pr checks`     |
| Open/close PR     | `gh pr close` / `gh pr reopen` | `set_pr_status`                       |

Reads (`gh pr view`, `gh pr diff`, `gh pr checks`, `--json` inspect) work in both environments.

**Merge:** never merge or enable auto-merge. The user merges on their own. `ManagePullRequest` has no merge action — do not run `gh pr merge`.

**Review writes** (`gh pr review --approve`, `--request-changes`): local only. In cloud, read review state with `gh pr view`; post replies with `post_comment` when relevant or when the user asks.

Always pass `branch_name` (and `base_branch` when creating) to `ManagePullRequest`. Do not use `gh` for any PR writes in cloud.

## PR Policy (Critical)

**All agent-opened GitHub PRs must be ready for review — never drafts.**

- Do not use `gh pr create --draft`.
- In cloud, `ManagePullRequest` `create_pr` must always include `"draft": false` (do not rely on defaults).
- If a draft PR is created by mistake, mark it ready before finishing — local: `gh pr ready`; cloud: `update_pr` with `"draft": false`.
- Never leave work with an open draft PR.

## Quick Reference

**Reads (local and cloud):**

- Inspect current branch PR: `gh pr view`
- Show comments: `gh pr view --comments`
- View structured PR data: `gh pr view --json number,url,title,body,isDraft,mergeStateStatus,statusCheckRollup`
- View PR diff: `gh pr diff`
- PR checks: `gh pr checks`
- Watch checks: `gh pr checks --watch --fail-fast`

**Writes — local only:**

- Create PR: `gh pr create`
- Add a comment: `gh pr comment -b "message"`
- Approve: `gh pr review --approve`
- Request changes: `gh pr review --request-changes -b "message"`
- Mark ready: `gh pr ready`
- Edit title/body: `gh pr edit -t "title" -b "body"` or `-F file`
- Do not merge: never run `gh pr merge` or enable auto-merge — the user merges

**Writes — cloud only:** see **Cloud vs Local** (`ManagePullRequest`: `create_pr`, `update_pr`, `post_comment`, `resolve_comment`, `get_ci_status`, `set_pr_status`).

For merge-ready PR loops (conflicts, review comments, CI), use the `autopilot` skill (`/autopilot`).

## Create PR

### Title

- Start with a capital letter (unlike commits, which stay lowercase).
- Keep it short and descriptive.
- Do not prefix commits with GitHub issue numbers; link issues in the PR body instead (see Description).

**Good examples:**

```
Fix recorder upload retry on slow networks
Add Notion export settings page
```

### Description

Keep it short and concise — bullet points when possible. Start each bullet with a capital letter (unlike commits, which stay lowercase). Use prose only when the change is large, risky, or needs context that bullets would hide.

Default structure:

```markdown
## Summary

- {What changed}

## Test plan

- [ ] {How to verify}
```

When work closes a GitHub issue, add a references section:

```markdown
## References

Closes #42
```

Use `[x]` for steps already verified before opening the PR. Skip filler.

Keep the description cumulative and current — it must reflect all commits in the PR as the branch evolves. Update when needed — local: `gh pr edit -F -`; cloud: `ManagePullRequest` `update_pr`.

For user-visible or cross-service changes (especially in cloud/autonomous runs), include verification artifacts in the description — screenshots or screen recordings of the working flow.

### Preflight

Run before creating the PR. Batch the git commands in parallel where possible.

1. **Branch state** — understand what will be in the PR:
   - `git status`
   - `git diff` and `git diff --staged`
   - whether the branch tracks a remote and is up to date with it
   - `git log <base>..HEAD --oneline` (use the repo default branch: `main`, `master`, etc.)
   - `git diff <base>...HEAD`

2. **Existing PR** — `gh pr view` on the current branch. If an open PR already exists, return its URL instead of creating a duplicate.

3. **Changelog** — check whether the repo has `CHANGELOG.md` at the root.
   - **If it exists:** ensure the current feature branch already includes a changelog entry for this work (usually under `[Unreleased]`). If it does not, stop and ask the user whether to update it — use the `/changelog` command workflow, then commit before opening the PR.
   - **If it does not exist:** skip; do not invent a changelog file.

Do not open the PR until preflight passes: changelog handled (updated + committed, or user explicitly declines), branch state reviewed, and no duplicate PR.

### Workflow

1. Complete **Preflight** above
2. Push if needed: `git push -u origin HEAD`
3. Create PR (never as draft):

**Local:**

```bash
gh pr create \
  --title "Fix recorder upload retry on slow networks" \
  --body "$(cat <<'EOF'
## Summary

- Retry upload when the connection drops mid-transfer
- Surface a clearer error when all retries fail

## Test plan

- [ ] Upload a recording on a throttled connection
- [ ] Confirm retry succeeds after a brief disconnect

## References

Closes #42
EOF
)"
```

**Cloud:** `ManagePullRequest` with `"action": "create_pr"`, same title and body, `"branch_name"`, `"base_branch"`, and `"draft": false`. Do not use `gh pr create`.

4. Confirm the PR is not a draft: `gh pr view --json isDraft,url` — `isDraft` must be `false`.
5. Return the PR URL.

Do not use `--fill` when applying the title and description conventions above.

### Create Checklist

- [ ] Preflight complete (branch state, no duplicate PR, changelog handled)
- [ ] Title starts with a capital letter
- [ ] Description is short; bullets start with capitals
- [ ] Test plan included
- [ ] Issue linked in body with `Closes #N` when applicable
- [ ] PR created as ready (not draft)
- [ ] `isDraft` verified false after create
- [ ] PR URL returned to user

## CI Checks

Use `gh pr checks` as the source of truth for PR-attached checks.

```bash
gh pr view --json number,url,headRefName,isDraft,mergeStateStatus,statusCheckRollup
gh pr checks --json name,bucket,state,workflow,link
gh pr checks --watch --fail-fast
```

For iterating until merge-ready (comments + CI), follow the `autopilot` skill (`/autopilot`).

## Review Workflow

Reads (local and cloud):

```bash
gh pr view --comments
gh pr diff
gh pr view --json number,url,reviewDecision,statusCheckRollup
```

Local review writes:

```bash
gh pr review --comment -b "addressed in the latest commit"
gh pr review --approve
gh pr review --request-changes -b "message"
```

Cloud: use `post_comment` when a PR comment is relevant (for example replying after addressing review feedback) or when the user asks. Do not use `gh pr review` for writes.

For triaging review feedback on an open PR, use the `autopilot` skill (`/autopilot`).

## Common Mistakes

- Creating draft PRs (`--draft`, or omitting `"draft": false` in cloud `create_pr`).
- Using `gh pr create` / `gh pr edit` / `gh pr ready` / `gh pr comment` / `gh pr review` / `gh pr close` / `gh pr reopen` as writes in Cursor Cloud — use `ManagePullRequest` instead.
- Merging or enabling auto-merge — the user merges on their own.
- Looking up the PR number first when the current branch is already enough.
- Using `gh pr list` for the active branch instead of `gh pr view`.
- Using `--fill` when a custom title and description are required.
- Lowercase titles or bullets copied from commit message style.
- Prefixing commits with `#42` instead of linking the issue in the PR body.
- Letting the PR description go stale as new commits land.
- Using `gh run list` alone for PR CI status — prefer `gh pr checks`.
