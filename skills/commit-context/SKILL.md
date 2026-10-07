---
name: commit-context
description: Find saved context for a specific git commit or code location. Use when the user asks why code changed or wants the recorded reasoning behind a commit.
argument-hint: '[file, function, line, or commit]'
user-invocable: true
---

1. Get the full commit SHA from git: `git blame -L <start>,<end> <file>` for lines, `git log -L :<function>:<file>` for a function, or `git log -n 1 -- <file>` for a path.
2. Call `memory_commit_lookup` with `sha`. Report only the commit and linked sessions it returns.
3. Use `recall` for relevant file names, concepts, and the SHA when more saved reasoning is needed. Verify returned session IDs before attributing context to the commit.
4. If `commit` is null, say no session link was recorded. This does not establish that the commit predates linking. Inspect `git show` for what changed and distinguish that evidence from any inferred intent.

```json
memory_commit_lookup { "sha": "9a1b2c3d4e5f60718293a4b5c6d7e8f901234567" }
```

Commit links may be absent. Use `commit-history` to list recorded links.
