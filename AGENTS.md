# Agentfiles setup

This repository supplies global rules and skills. Local installation is `./install`; keep cloud setup separate. Do not add hooks.

## Cloud setup

Use the platform's environment setup mechanism.

1. Identify the actual runtime user, home directory, and starting task directory. Provision Git, Node.js 24, Python 3, and pnpm.
2. Clone `https://github.com/martindzejky/agentfiles` into a persistent location, preferably the runtime user's `~/.agentfiles`. Reuse an existing checkout after checking its remote and local changes. If stored elsewhere, create `~/.agentfiles` only when absent, or retain an existing link to that checkout. Do not overwrite another installation.
3. Follow the platform section below. Run generation again after updating rules or skills. Keep files readable by the runtime user and paths stable across sessions.

### Cursor Cloud

Run `./install` as the runtime user. It generates `dist/` and links `~/.cursor/rules`, `~/.cursor/skills`, `~/.codex/AGENTS.md`, and `~/.agents/skills`. Inspect existing destinations first; the local installer deliberately replaces conflicting links and files.

During root-capable image provisioning, create `/.cursor` pointing to that user's `~/.cursor`. Cursor cloud workspaces can sit outside the home directory, so the root link makes the rules visible during upward discovery. For a runtime user whose home is `/home/ubuntu`:

```sh
ln -s /home/ubuntu/.cursor /.cursor
```

Use the actual user's path. If the link already resolves there, leave it alone. If `/.cursor` exists elsewhere, stop and report the conflict. Create this link during provisioning if task sessions lack root access.

The user previously verified this workaround.

### Codex Cloud

Run `./install` as the runtime user, then run the Codex helper. Inspect the installer's destinations first. If they are platform-managed or contain unrelated configuration, use `./install --only shell` instead. This runs submodule setup and distribution generation while skipping cleanup and links.

```sh
cd ~/.agentfiles
./install
pnpm setup:codex-cloud /workspace
```

Replace `/workspace` with the actual starting task directory. The helper creates a regular `AGENTS.md` there with global rules and a compact catalog from current skills, including names, descriptions, and absolute `SKILL.md` paths. It updates only its marked region, preserves unrelated instructions, and refuses symlinks, ambiguous markers, or files over its byte budget. Review conflicts manually; do not discard existing instructions.

The default budget is 32 KiB. Check the effective `project_doc_max_bytes` and other loaded instruction files, then pass the remaining allowance as the optional second argument. The helper checks this file only. Do not silently truncate rules or remove skills to fit. Check for an `AGENTS.override.md` that would take precedence, and preserve it when resolving discovery conflicts. See the [Codex instruction guide](https://developers.openai.com/codex/guides/agents-md).

Keep existing `~/.codex/AGENTS.md` and `~/.agents/skills` links when they belong to this installation. Add them only in user-owned, unmanaged locations with absent destinations. Do not modify platform-managed `.codex` or `.agents` directories, override `HOME` or `CODEX_HOME`, or replace authentication. `CODEX_HOME` under `/run` was recreated between tested sessions, so snapshotting it is insufficient.

A fresh hosted session previously received both rules and the catalog from `/workspace/AGENTS.md` without reading files. Instructions only under `/workspace/dotfiles` did not load when the task started at `/workspace`. The catalog exposes filesystem skills; it does not register native plugins. These are prior findings, not proof that a new environment works.

## Refresh at session start

Configure the cloud environment's install or startup script to refresh agentfiles on every session, including sessions using a cached environment. Run this before the agent loads its instructions. Keep the workspace's dependency installation in the same startup flow.

Use a dedicated agentfiles installation checkout on `master` tracking `origin/master`, separate from the active task checkout. Each run must:

1. Pull the latest agentfiles with `git pull --ff-only` from that checkout.
2. Rerun `./install`, or `./install --only shell` for the managed-directory case described above, to regenerate the rules and refresh permitted links.
3. In Codex Cloud, rerun `pnpm setup:codex-cloud <task-root>` with the configured byte allowance. In Cursor Cloud, verify that `/.cursor` still points to the runtime user's `~/.cursor`.
4. Return to the task checkout and run its usual dependency installation.

Check that the installation checkout is clean and on the expected branch before pulling. If the update or generation fails, stop and report it. Do not reset local changes or silently continue with stale instructions. Configure network access for the update during this startup phase. Editing agentfiles should then reach every configured environment at its next session without another setup visit.

## Verify a new environment

Start a fresh hosted task after setup. Before it reads files, ask:

> Were the global agentfiles rules and skill catalog injected into your initial instructions? Name three skills you received. Do not read files to answer.

For Cursor, also check whether skills were supplied through its native discovery. After this initial check, confirm that the runtime user can read the named `SKILL.md` files. File existence alone does not prove injection. Report what loaded, what failed, and which checks were actually run.

## Repository changes

Edit global rules in `rules/` and skills in `skills/`; `dist/` is generated and ignored. Follow existing frontmatter conventions. Keep local installation working.

Run `pnpm generate:dist`, `pnpm format`, `pnpm test`, and `git diff --check`. Use `pnpm format:fix` when needed. There is no separate build or lint step. Local work stays on `master` unless requested otherwise; leave commits to the user.
