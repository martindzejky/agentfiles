# Working with agentfiles

`rules/` and `skills/` are the sources. `./build` produces `dist/AGENTS.md` from
rules only. Skills use the agent's native discovery and never enter that file.
`./install` consumes the build without rebuilding it. Both commands need only
Node.js 24 or newer; use their `--help` for options and examples.

## Environment setup

Use the platform's setup mechanism. Identify the runtime user, home, effective
`CODEX_HOME`, and starting task directory before choosing destinations. Clone this
repository into a persistent, readable location, preferably `~/.agentfiles`.
Inspect an existing checkout's remote and local changes before reusing it.

Run `./build` once, then inspect `./install --dry-run`. Choose rules delivery and
native skill installation independently:

- Use links in user-owned locations with absent destinations or this
  installation's existing links.
- Use a marked rules merge in an explicitly permitted instruction file when
  global instructions cannot be linked. The file must be in the agent's actual
  instruction discovery path.
- Use manual rules delivery when the platform provides an instruction setting
  instead. Put the installer's printed pointer there and keep its target readable
  across sessions.

Writability does not establish ownership. Preserve platform-managed files,
unrelated instructions, and existing skills. Select another permitted destination
or skip skills already supplied by the environment. Do not change `HOME` or
`CODEX_HOME`, authentication, or binaries, and do not add hooks.

Consult Codex's [instruction discovery](https://developers.openai.com/codex/guides/agents-md)
and [native skills](https://developers.openai.com/codex/skills) documentation when
choosing paths. Check for `AGENTS.override.md` precedence and the effective
instruction-chain limit. Never hide platform instructions with a new override or
truncate rules to fit. The rules budget is independent of the number of skills.

## Refresh and verification

Keep the installation checkout separate from an active task checkout. Configure
cloud startup to refresh it on every session, including cached sessions: confirm
it is clean, select `master`, update with `git pull --ff-only origin master`, and
run `./build`. Stop on conflicts or failures; never reset local changes.

Existing rules links follow the rebuilt file. Rerun the chosen install command
after a rules build when using merges, or when skills are added or destinations
need provisioning. Return to the task checkout for its dependency installation.

Verify rules delivery and native skill discovery separately in a fresh agent
session. For automatic rules delivery, check what arrived before reading files;
for manual delivery, check that the settings pointer was followed. Confirm native
skills are listed and their `SKILL.md` files are readable. File existence alone
does not prove loading. Report any discovery gap instead of inlining a catalog.

## Repository changes

Edit source rules and skills, never generated files. Follow existing frontmatter
conventions. Development uses pnpm; the existing DaVinci Resolve skill tests also
need Python 3.

Run `pnpm build`, `pnpm format`, `pnpm test`, and `git diff --check`. Use
`pnpm format:fix` when needed. There is no separate lint or type-check command.
