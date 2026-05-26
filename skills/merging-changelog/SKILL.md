---
name: merging-changelog
description: Resolves CHANGELOG merge or rebase conflicts without losing section intent. Use when conflicts happen in changelog files like CHANGELOG.md, especially around Unreleased vs newly tagged release headers.
---

# Merging Changelog

## Goal

Resolve `CHANGELOG.md` conflicts correctly, not mechanically.  
When entries were authored for `## [Unreleased]`, they must remain under `## [Unreleased]` after conflict resolution and rebase, even if a new release header was added on `master`.

## Rules

1. Never blindly keep both sides of a conflict block.
2. Preserve semantic placement: each entry must stay in its intended section/subsection.
3. Keep `## [Unreleased]` at the top of changelog content (after title/introduction).
4. If needed, create missing subsections under `Unreleased` (for example `### Added`, `### Changed`, `### Fixed`).
5. Do not move unreleased work under a tagged release (`## [R...]`, `## [v...]`, etc.) just because line location shifted during rebase.
6. Do not duplicate entries; each bullet should appear exactly once.

## Conflict Resolution Workflow

### 1) Inspect context before editing

- Identify top-level section headers around the conflict:
  - `## [Unreleased]`
  - versioned release headers (for example `## [R11.11] - 26.05.2026`)
- Identify subsection headers used by entries:
  - `### Added`
  - `### Changed`
  - `### Fixed`

### 2) Classify each conflicted entry by intended destination

For each bullet in the conflict block, determine the target destination:

- target section: `Unreleased` or a specific tagged release
- target subsection: `Added` / `Changed` / `Fixed`

Use branch intent, not current line position.  
If the feature branch change was made while it was under `Unreleased`, keep it under `Unreleased` after rebase.

### 3) Reconstruct final structure

- Keep all valid entries from both sides.
- Place each entry under its intended section/subsection.
- If `Unreleased` is missing a needed subsection, add it before inserting bullets.
- Keep release sections intact and in existing chronological order.

### 4) Validate before continuing rebase

- Remove all conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`, `|||||||`).
- Confirm expected entry placement:
  - unreleased entries are under `## [Unreleased]`
  - release entries are under their tagged release
- Ensure no duplicates of the same bullet line.

## Common Pitfall to Prevent

If `master` introduced a new tagged release header under `Unreleased` after your branch diverged, rebasing can place your old lines below that new header.  
This is incorrect for unreleased work. Move those lines back under `## [Unreleased]`, creating the correct subsection header if missing.

## Final Checklist

- [ ] No conflict markers remain
- [ ] `Unreleased` contains all still-unreleased branch entries
- [ ] Needed subsections under `Unreleased` exist (`Added`/`Changed`/`Fixed`)
- [ ] No unreleased entry accidentally ended up under a tagged release
- [ ] No duplicated bullets
