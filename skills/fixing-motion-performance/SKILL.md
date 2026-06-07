---
name: fixing-motion-performance
description: Audit and fix animation performance issues including layout thrashing, compositor properties, scroll-linked motion, and blur effects. Use when animations stutter, transitions jank, or reviewing CSS and JS animation performance in Svelte or Tailwind UI.
---

# Fixing motion performance

Audit and fix animation performance issues. Apply rules within the project's existing animation approach — do not migrate libraries unless explicitly requested.

## When to apply

- Adding or changing UI animations (CSS, WAAPI, Svelte transitions, Motion, rAF)
- Refactoring janky interactions or transitions
- Implementing scroll-linked motion or reveal-on-scroll
- Animating layout, filters, masks, gradients, or CSS variables
- Reviewing components that use `will-change`, transforms, or layout measurement

## Review output

When reviewing a file, report:

- Violations (quote the exact line or snippet)
- Why it matters (one short sentence)
- A concrete fix (code-level suggestion)

## Stack defaults

Unless the project clearly dictates otherwise:

- Prefer **CSS transitions and animations** in component `<style>` blocks or Tailwind utilities
- Use **Svelte transitions** (`transition:`, `in:`, `out:`) for enter/exit on small elements
- Use **Motion** (or the project's JS animation library) only when interaction requires it
- Respect `prefers-reduced-motion` — disable or shorten non-essential motion

## Rendering steps glossary

- **Composite:** `transform`, `opacity`
- **Paint:** color, borders, gradients, masks, images, filters
- **Layout:** size, position, flow, grid, flex

## Rule categories by priority

| Priority | Category             | Impact      |
| -------- | -------------------- | ----------- |
| 1        | Never patterns       | Critical    |
| 2        | Choose the mechanism | Critical    |
| 3        | Measurement          | High        |
| 4        | Scroll               | High        |
| 5        | Paint                | Medium-high |
| 6        | Layers               | Medium      |
| 7        | Blur and filters     | Medium      |
| 8        | View transitions     | Low         |
| 9        | Scope                | Critical    |

## Quick reference

### 1. Never patterns (critical)

- Do not interleave layout reads and writes in the same frame
- Do not animate layout continuously on large or meaningful surfaces
- Do not drive animation from `scrollTop`, `scrollY`, or scroll events
- No `requestAnimationFrame` loops without a stop condition
- Do not mix multiple animation systems that each measure or mutate layout

### 2. Choose the mechanism (critical)

- Default to `transform` and `opacity` for motion
- Use JS-driven animation only when interaction requires it
- Paint or layout animation is acceptable only on small, isolated surfaces
- One-shot effects are acceptable more often than continuous motion
- Prefer downgrading technique over removing motion entirely

### 3. Measurement (high)

- Measure once, then animate via `transform` or `opacity`
- Batch all DOM reads before writes
- Do not read layout repeatedly during an animation
- Prefer FLIP-style transitions for layout-like effects
- In Svelte, avoid `$effect` or reactive blocks that read layout every frame

### 4. Scroll (high)

- Prefer Scroll or View Timelines for scroll-linked motion when available
- Use `IntersectionObserver` for visibility and pausing
- Do not poll scroll position for animation
- Pause or stop animations when off-screen
- Scroll-linked motion must not trigger continuous layout or paint on large surfaces

### 5. Paint (medium-high)

- Paint-triggering animation is allowed only on small, isolated elements
- Do not animate paint-heavy properties on large containers
- Do not animate CSS variables for `transform`, `opacity`, or `position`
- Do not animate inherited CSS variables
- Scope animated CSS variables locally and avoid inheritance

### 6. Layers (medium)

- Compositor motion requires layer promotion — never assume it
- Use `will-change` temporarily and surgically
- Avoid many or large promoted layers
- Validate layer behavior with tooling when performance matters

### 7. Blur and filters (medium)

- Keep blur animation small (≤ 8px)
- Use blur only for short, one-time effects
- Never animate blur continuously
- Never animate blur on large surfaces
- Prefer opacity and translate before blur

### 8. View transitions (low)

- Use view transitions only for navigation-level changes
- Avoid view transitions for interaction-heavy UI
- Avoid view transitions when interruption or cancellation is required
- Treat size changes as potentially layout-triggering

### 9. Scope (critical)

- Do not migrate or rewrite animation libraries unless explicitly requested
- Apply these rules within the existing animation system
- Never partially migrate APIs or mix styles within the same component

## Common fixes

```css
/* layout thrashing: animate transform instead of width */
/* before */
.panel {
  transition: width 0.3s;
}
/* after */
.panel {
  transition: transform 0.3s;
}

/* scroll-linked: use scroll-timeline instead of JS */
/* before */ /* scroll listener updates opacity every frame */
/* after */
.reveal {
  animation: fade-in linear;
  animation-timeline: view();
}
```

```js
// measurement: batch reads before writes (FLIP)
// before — layout thrash
el.style.left = el.getBoundingClientRect().left + 10 + 'px';
// after — measure once, animate via transform
const first = el.getBoundingClientRect();
el.classList.add('moved');
const last = el.getBoundingClientRect();
el.style.transform = `translateX(${first.left - last.left}px)`;
requestAnimationFrame(() => {
  el.style.transition = 'transform 0.3s';
  el.style.transform = '';
});
```

## Review guidance

- Enforce critical rules first (never patterns, scope)
- Choose the least expensive rendering work that matches the intent
- For any non-default choice, state the constraint that justifies it (surface size, duration, or interaction requirement)
- Prefer actionable notes and concrete alternatives over theory
