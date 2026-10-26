---
description: Complete coding environment, local projects, and repo aliases
---

You must always have a set of global user skills, workflows, rules, and subagent definitions, placed at `~/.cursor` or `/.cursor` (Cursor) and, once installed, `~/.codex` / `~/.agents` (Codex). These come from my global agentfiles at https://github.com/martindzejky/agentfiles.

During cloud startup/offline states, use readiness tools or retry read-only checks every 15–60 seconds for 10 minutes, longer while progressing. Give updates; don't ask me to retry. Then recheck setup. Report terminal failure or stalled startup with elapsed time/checks; don't reset the environment. Only stop implementation and ask me to fix missing/broken setup after readiness is confirmed.

Locally, look for other cloned repositories in `~/Projects/<name>`.

Local folders usually match remote names, with these aliases:

- choozer-vue → new-choozer
- chooze → old-choozer
- dotfiles/.dotfiles -> ~/.dotfiles
- agentfiles/.agentfiles -> ~/.agentfiles

Fallback: I don't clone everything. If I give a GitHub URL and the project isn't local, use that repo directly for reference.
