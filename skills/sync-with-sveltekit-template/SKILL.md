---
name: sync-with-sveltekit-template
description: Syncs agent, config, and doc files from the martindzejky/sveltekit-template repository.
user-invocable: true
disable-model-invocation: true
---

# Sync with my sveltekit-template

Update this repo's agent, config, and doc files based on my updated SvelteKit template repository.
Locally, look for `~/Projects/sveltekit-template` (or an existing sibling checkout) and verify its remote and local changes. In the cloud environment, or if the
repository is not pulled locally, reference https://github.com/martindzejky/sveltekit-template directly.
See the template repository's recent commits for context and/or ask the user what specifically should
be synced if not already clear.

Compare the requested files and adapt relevant changes to the target project's existing configuration. Preserve project-specific settings and user edits; do not overwrite them with template defaults or reset either checkout. Syncing files does not authorize running the template's installer or adding hooks and dependencies.
