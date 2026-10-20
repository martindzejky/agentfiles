---
name: svelte-sveltekit
description: Write modern Svelte 5 (runes) and SvelteKit code, components, routes, and load/actions. Use when touching .svelte files or SvelteKit routing/data flow.
---

# Svelte 5 + SvelteKit

Use this skill for any Svelte or SvelteKit work.

## Core rules

- Use modern Svelte 5 syntax (runes, event attributes, snippets). Do not introduce legacy patterns or migrate unrelated components while making a small change.
- Use static classes or `class={...}` expressions with complete Tailwind utility names. Follow `tailwind-cva` for conditional classes and merging; do not concatenate utility names.
- Write Svelte-style code, not React-style code.
- Use Tailwind 4 syntax supported by the project's installed dependencies. Follow `tailwind-rules`; do not add component `<style>` blocks.
- Component file names must be lowercase (e.g. `button.svelte`).
- Find the project's existing `button.svelte` as the component reference; do not assume a path or import alias.
- Svelte 4 → 5 migration guide: https://svelte.dev/docs/svelte/v5-migration-guide

## Runes and component state

Use `$state` for mutable local state and `$derived` for computed values:

```ts
let count = $state(0);
let doubled = $derived(count * 2);
```

Use `$effect` for browser side effects, with cleanup for subscriptions or timers. Effects do not run during server rendering; do not use them to synchronize derived state or perform initial page loading. Components are reused during navigation, so derive from changing props rather than copying them into one-time local variables.

## Props and binding

Use `$props()` for props. Avoid `export let`.

```ts
let { title } = $props();
```

Use `$bindable()` for props that are intended to be bindable.

Use `onclick` event attributes and `{@render children?.()}` snippets rather than `on:click` or `<slot>`. Type native-element wrappers with `svelte/elements`.

## SvelteKit routing

Always use filesystem routing:

```
+page.svelte
+layout.svelte
+page.ts
+page.server.ts
+server.ts
```

## Load and data flow

Prefer server-first loading. Use `+page.server.ts` / `+layout.server.ts` for database access and private configuration; keep those imports in server-only modules. Universal `+page.ts` / `+layout.ts` can also run in the browser. Use the event's `fetch` when loading over HTTP; do not add an internal endpoint just to call the application's own database code.

Use generated route types:

```ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('/api/items');
  if (!response.ok) throw new Error('Could not load items');
  return { items: await response.json() };
};
```

For server loads, use `PageServerLoad` / `LayoutServerLoad`. Read page data through typed props (`let { data }: PageProps = $props()`). Keep request/user state scoped to the request or component tree, never a shared server-module variable.

## Endpoints

Use `+server.ts` endpoints for HTTP consumers; type handlers with `RequestHandler` from `./$types`.

```ts
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  return new Response('ok');
};
```

## Forms

Prefer SvelteKit form actions over manual fetch. Define typed `Actions` in `+page.server.ts`; validate submitted values on the server and return `fail(...)` for expected validation errors. Use POST forms and `use:enhance` when progressive enhancement is needed. Do not catch SvelteKit's `redirect()` / `error()` and turn them into ordinary failures. Follow an existing remote-function pattern when the project already uses one rather than introducing a second mutation path.

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

Use semantic HTML and Tailwind utilities. Check current [Svelte docs](https://svelte.dev/docs/svelte/overview) and [SvelteKit docs](https://svelte.dev/docs/kit/introduction) when an API or project version differs from these examples.
