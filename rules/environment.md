---
description: Complete coding environment, local projects, and repo aliases
---

You must always have a set of global user skills, workflows, rules, and subagent definitions, placed at `~/.cursor` or `/.cursor` (Cursor) and, once installed, `~/.codex` / `~/.agents` (Codex). These come from my global agentfiles at https://github.com/martindzejky/agentfiles.
If this setup is missing or the coding environment is incomplete or broken, stop implementation, warn the user, and ask them to fix it first.

Locally, look for other cloned repositories in `~/Projects/<name>`.

Local folders usually match remote names, with these aliases:

- choozer-vue → new-choozer
- chooze → old-choozer
- dotfiles/.dotfiles -> ~/.dotfiles
- agentfiles/.agentfiles -> ~/.agentfiles

Fallback: I don't clone everything. If I give a GitHub URL and the project isn't local, use that repo directly for reference.
