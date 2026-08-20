---
name: tailwind-cva
description: Style Svelte UI with Tailwind, cn(), and CVA. Use when writing or editing component classes, variants, class props, or conditional Tailwind.
---

# Tailwind, cn(), and CVA

Pick the smallest tool that works.

1. **Static `class="..."`** for one-off layout and copy. No helper.
2. **Svelte `class={[...]}` or `class={{ ... }}`** for conditionals that cannot
   collide. Since Svelte 5.16 this is [clsx](https://github.com/lukeed/clsx).
3. **`cn()`** from `$lib/cn` when a parent `class` prop (or any later string)
   might collide with existing utilities (`p-2` vs `p-4`). `cn()` is
   `twMerge(clsx(...))`.
4. **`cva()`** for reusable components with named variants (for example
   `intent`). Define it in `<script module>`, type props with `VariantProps`,
   merge the parent `class` last with `cn()`.

Canonical example: the project's `button.svelte`.

```svelte
<button {...rest} class={cn(buttonVariants({ intent }), rest.class)}>
  {@render children?.()}
</button>
```

Order is always: base → variants → state conditionals → parent `class`.

```svelte
class={cn(buttonVariants({ intent }), disabled && 'opacity-70', rest.class)}
```

Svelte's `class` arrays do not run `tailwind-merge`. Use `cn()` when utilities
can conflict.

The HTML attribute and the component prop are both `class`. Do not add a
`className` prop. CVA 0.7 accepts `className` for React. Ignore that key.

Events are `onclick`, not `onClick`. Wrap native elements with types from
`svelte/elements` (`HTMLButtonAttributes`, `HTMLAnchorAttributes`). Render
content with `{@render children?.()}`.

## Don't

- Concatenate Tailwind names (`bg-${color}-500`). The compiler will drop them.
- Reach for `cva` for a single boolean. `cn('base', open && 'translate-x-0')`
  or `class={[...]}` is enough.
- Pass extra classes into `cva()`. Merge with `cn(..., rest.class)` last.
- Duplicate a global focus outline that already lives in the root stylesheet.
- Use React `className` / `onClick`, Vue `:class`, `export let`, or `<slot>`.
