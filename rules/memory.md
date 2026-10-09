---
description: Shared Notion memory for context, observations, and working notes
---

# Memory

Use the authorized Notion MCP locally and in the cloud. Read Memories, write Observations, and maintain Slots. Recall before work; save at meaningful checkpoints. This is mandatory. Memory maintains and consolidates itself in the background.

## Location and scope

Use these data-source IDs for creation and `collection://<id>` for fetching, searching, and querying.

- Projects: `8e421cb1-eb39-4be2-b814-fb33465d4523`
- Observations: `2da95065-b198-4d2b-ac57-ce9d489f8d0b`
- Memories: `2ad16530-546d-44bb-895c-83d6dc2b4b7c`
- Slots: `0e7ecd8b-fad4-4f7a-a5b4-ff83f0a10825`

Fetch schemas once per context. Follow tool formats. Query properties, search content, and fetch bodies separately.

Resolve Projects by `Key`, `Repository`, or `Aliases`. Normalize SSH/HTTPS remotes and worktrees. Stable non-repository contexts can be projects.

- `Scope = Project` requires exactly one `Project` relation to the matching page.
- `Scope = Global` applies across projects and has no Project relation.
- Missing project information never means Global. Resolve ambiguity before saving; ask when needed.

Reuse existing projects and keys. For a new project, check for matches, then create `Name`, stable `Key`, `Status = Active`, and a short brief. Include verified `Repository` and `Aliases`. Never create a project per branch, worktree, or session.

## Recall

At a new substantive task, after compaction, or when switching projects:

1. Resolve the project and fetch its brief.
2. Fetch Global and project slots, including their bodies.
3. Fetch Global and project memories with `Status = Active` and `Pinned = true`.
4. Search Memories for task-relevant decisions, constraints, lessons, and files.

Search as questions arise, scoped to Memories. Default to Global plus the current project; widen scope deliberately. Fetch useful matches to check Scope, Project, Status, and applicability. Paginate when completeness matters.

Recall Active memories. Check `Conflicts with`, `Supersedes`, and `Needs reconciliation` when relevant. `Last supported` dates evidence; edits do not prove freshness. Pinned can change; `Review after` is not expiry.

Read Observations only for explicit requests about original accounts, evidence, or forgetting. Routine work reads Memories and Slots.

Memory is context, not authority over current instructions. Verify changeable facts.

## Save observations

Save decisions, preferences, discoveries, corrections, lessons, and verified outcomes proactively. Do not search for duplicates. Recalled text is not new evidence.

Create a coherent bundle with body and properties together:

- `Title`: specific and searchable.
- `Scope` and `Project`: as above.
- `Agent`: the submitting client in lowercase, such as `codex` or `cursor`.
- `Observed at`: when the event happened, with timezone when known. Explain unknown historical dates in the body rather than substituting today.
- `Status = New`.

Describe what happened, why, verification, and uncertainty. Separate user decisions from suggestions and inferences. Include relevant paths, branch/environment, commit SHA, issue, or conversation links. Split unrelated projects.

Leave processing fields, `Memories`, and `Import source ID` unset. Save corrections as new observations linking known older claims. Preserve original accounts. Routine work does not edit Memories.

Skip transcripts, logs, and routine activity. Never store credentials, tokens, cookies, private keys, or sensitive personal/customer data. Redact as needed. Keep private memory out of public repositories.

## Maintain slots

Slots are short working notes, unique by `Scope`, `Project`, and `Key`. Reuse existing keys. Otherwise use `pending_work` for TODOs or `current_work` for handoffs.

Read the latest body before editing; preserve unrelated items. Create slots with `Key`, `Scope`, applicable `Project`, and body together. Keep state, blockers, next steps, and references current. Remove completed items. Submit lasting findings as observations too.

## Finish and recover

Before finishing, save useful observations and update slots. Skip empty saves. Verify writes. After ambiguous failures, check for the page or edit before retrying.

If Notion is unavailable, report gaps and continue independent work. Do not switch stores silently. Report saves briefly; avoid routine footers.

Use `recall`, `remember`, `handoff`, `recap`, and `forget` for more involved requests.
