---
name: svelte-sveltekit
description: Write modern Svelte 5 (runes) and SvelteKit code, components, routes, and load/actions. Use when touching .svelte files or SvelteKit routing/data flow.
---

# Svelte 5 + SvelteKit

Use this skill for any Svelte or SvelteKit work.

## Core rules

- Always use modern Svelte 5 syntax (runes). Never write Svelte 4 patterns.
- Use `class={...}` and `style={...}` in templates (no computed class/style strings).
- Write Svelte-style code, not React-style code.
- Use the latest Tailwind 4 syntax and practices.
- Component file names must be lowercase (e.g. `button.svelte`).
- See `button.svelte` as the canonical component reference.
- Svelte 4 → 5 migration guide: https://svelte.dev/docs/svelte/v5-migration-guide

## Runes and component state

Always use runes for reactivity:

```ts
let count = $state(0);
let doubled = $derived(count * 2);

$effect(() => {
  // side effects
});
```

## Props and binding

Use `$props()` for props. Avoid `export let`.

```ts
let { title } = $props();
```

Use `$bindable()` for props that are intended to be bindable.

## SvelteKit routing

Always use filesystem routing:

```
+page.svelte
+layout.svelte
+page.ts
+server.ts
```

## Load and data flow

Prefer server-first loading. Keep load functions small and explicit.

```ts
export const load = async ({ fetch }) => {
  const res = await fetch('/api/items');
  return { items: await res.json() };
};
```

Preferred data flow: load → props → component

## Endpoints

Use `+server.ts` endpoints.

```ts
export const GET = async () => {
  return new Response('ok');
};
```

## Forms

Prefer SvelteKit form actions over manual fetch.

## General preferences

Prefer:

- server rendering
- local `$state`
- small components
- explicit props

Avoid:

- global state
- client-only fetching
- writable stores for local logic
- legacy `$:` reactivity
- custom routing systems

## TypeScript and styling

Always use:

```html
<script lang="ts">
```

Prefer scoped styles and semantic HTML.
