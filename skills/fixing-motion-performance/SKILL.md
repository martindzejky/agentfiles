---
name: fixing-motion-performance
description: Audit and fix web animation performance issues including layout thrashing, compositor properties, scroll-linked motion, and blur effects. Use when animations stutter, transitions jank, or reviewing CSS and JS animation performance.
---

# Fixing motion performance

Audit and fix animation performance issues. Apply rules within the project's existing animation approach — do not migrate libraries unless explicitly requested.

## When to apply

- Adding or changing UI animations (CSS, WAAPI, framework transitions, rAF)
- Refactoring janky interactions or transitions
- Implementing scroll-linked motion or reveal-on-scroll
- Animating layout, filters, masks, gradients, or CSS variables
- Reviewing components that use `will-change`, transforms, or layout measurement

## Review output

When reviewing a file, report:

- Violations (quote the exact line or snippet)
- Why it matters (one short sentence)
- A concrete fix (code-level suggestion)

## Animation approach

- Use the project's existing styling and animation tools
- Prefer CSS transitions and animations when they meet the interaction's needs
- Use JavaScript animation when interaction requires it
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
- Prefer native scroll timelines over per-scroll JavaScript; when a fallback is needed, keep it scoped and avoid synchronous layout work
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

### 4. Scroll (high)

- Prefer Scroll or View Timelines for scroll-linked motion when available
- Use `IntersectionObserver` for visibility and pausing
- Do not poll scroll position for animation
- Pause or stop animations when off-screen
- Scroll-linked motion must not trigger continuous layout or paint on large surfaces

### 5. Paint (medium-high)

- Paint-triggering animation is allowed only on small, isolated elements
- Do not animate paint-heavy properties on large containers
- Prefer animating `transform` / `opacity` directly; CSS-variable animation is not automatically compositor-driven
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

- View transitions can animate navigation or same-document DOM updates; use them when their snapshot-based behavior fits the interaction and supported browsers
- Avoid view transitions for interaction-heavy UI
- Avoid view transitions when interruption or cancellation is required
- Treat size changes as potentially layout-triggering

### 9. Scope (critical)

- Do not migrate or rewrite animation libraries unless explicitly requested
- Apply these rules within the existing animation system
- Never partially migrate APIs or mix styles within the same component

## Common fixes

- For a sliding panel whose layout footprint should stay fixed, animate `transform` instead of its width
- For list reordering, use the existing animation tool's FLIP support rather than adding a hand-written layout-measurement loop
- Preserve focus and interaction behavior when changing the technique

## Review guidance

- Enforce critical rules first (never patterns, scope)
- Choose the least expensive rendering work that matches the intent
- For any non-default choice, state the constraint that justifies it (surface size, duration, or interaction requirement)
- Prefer actionable notes and concrete alternatives over theory
