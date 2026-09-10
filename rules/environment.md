---
description: Complete coding environment, local projects, and repo aliases
---

You must always have a set of global user skills, workflows, rules, and subagent definitions, placed at `~/.cursor` or `/.cursor` (Cursor) and, once installed, `~/.codex` / `~/.agents` (Codex).
If you don't, or your current environment is incomplete in any other way, warn the user explicitly and ask them for a proper setup.
You should always have access to a proper complete coding environment.
Do not proceed with implementation if your environment is incomplete or broken. Stop and ask the user to fix first.

When running locally (not in cloud), I store all of my cloned repositories under `~/Projects`.
This is useful if you need to look into a linked repository while investigating or for reference.
For example, I could mention that "look into my other project <name>", or the current repository uses some other as a dependency and you need it for extra context, for example while investigating a bug.
When you need to look into another repository, look for it in `~/Projects/<name>`.

I almost always clone repositories with the same name locally (repo name and local folder name matches).
Here are a few local aliases (remote name → local folder):

- choozer-vue → new-choozer
- chooze → old-choozer

Fallback: I don't clone everything. If I give a GitHub URL and the project isn't local, use that repo directly for reference.
