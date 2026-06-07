---
name: fixing-accessibility
description: Audit and fix accessibility issues including ARIA labels, keyboard navigation, focus management, color contrast, and form errors. Use when adding interactive controls, forms, dialogs, or reviewing WCAG compliance in Svelte, HTML, or Tailwind UI.
---

# Fixing accessibility

Audit and fix accessibility issues with minimal, targeted changes. Do not rewrite large parts of the UI.

## When to apply

- Adding or changing buttons, links, inputs, menus, dialogs, tabs, dropdowns
- Building forms, validation, error states, helper text
- Implementing keyboard shortcuts or custom interactions
- Working on focus states, focus trapping, or modal behavior
- Rendering icon-only controls
- Adding hover-only interactions or hidden content

## Review output

When reviewing a file, report:

- Violations (quote the exact line or snippet)
- Why it matters (one short sentence)
- A concrete fix (code-level suggestion)

## Stack defaults

Unless the project clearly dictates otherwise:

- **Svelte 5 + SvelteKit** with semantic HTML in `.svelte` templates
- **Tailwind CSS** for styling — never remove focus outlines without a visible replacement
- Prefer native elements (`button`, `a`, `input`, `label`) over `role`-based hacks
- For complex widgets (menu, dialog, combobox), use the project's existing accessible components instead of hand-rolling keyboard and focus behavior

## Rule categories by priority

| Priority | Category            | Impact      |
| -------- | ------------------- | ----------- |
| 1        | Accessible names    | Critical    |
| 2        | Keyboard access     | Critical    |
| 3        | Focus and dialogs   | Critical    |
| 4        | Semantics           | High        |
| 5        | Forms and errors    | High        |
| 6        | Announcements       | Medium-high |
| 7        | Contrast and states | Medium      |
| 8        | Media and motion    | Low-medium  |
| 9        | Scope               | Critical    |

## Quick reference

### 1. Accessible names (critical)

- Every interactive control must have an accessible name
- Icon-only buttons must have `aria-label` or `aria-labelledby`
- Every `input`, `select`, and `textarea` must be labeled
- Links must have meaningful text (no "click here")
- Decorative icons must be `aria-hidden="true"`

### 2. Keyboard access (critical)

- Do not use `div` or `span` as buttons without full keyboard support
- All interactive elements must be reachable by Tab
- Focus must be visible for keyboard users
- Do not use `tabindex` greater than 0
- Escape must close dialogs or overlays when applicable

### 3. Focus and dialogs (critical)

- Modals must trap focus while open
- Restore focus to the trigger on close
- Set initial focus inside dialogs
- Opening a dialog should not scroll the page unexpectedly

### 4. Semantics (high)

- Prefer native elements over `role`-based hacks
- If a role is used, required ARIA attributes must be present
- Lists must use `ul` or `ol` with `li`
- Do not skip heading levels
- Tables must use `th` for headers when applicable

### 5. Forms and errors (high)

- Errors must be linked to fields using `aria-describedby`
- Required fields must be announced
- Invalid fields must set `aria-invalid="true"`
- Helper text must be associated with inputs
- Disabled submit actions must explain why

### 6. Announcements (medium-high)

- Critical form errors should use `aria-live`
- Loading states should use `aria-busy` or status text
- Toasts must not be the only way to convey critical information
- Expandable controls must use `aria-expanded` and `aria-controls`

### 7. Contrast and states (medium)

- Ensure sufficient contrast for text and icons
- Hover-only interactions must have keyboard equivalents
- Disabled states must not rely on color alone
- Do not remove focus outlines without a visible replacement

### 8. Media and motion (low-medium)

- Images must have correct `alt` text (meaningful or empty)
- Videos with speech should provide captions when relevant
- Respect `prefers-reduced-motion` for non-essential motion
- Avoid autoplaying media with sound

### 9. Scope (critical)

- Prefer minimal changes; do not refactor unrelated code
- Do not add ARIA when native semantics already solve the problem
- Do not swap UI libraries unless explicitly requested

## Common fixes

```svelte
<!-- icon-only button: add aria-label -->
<!-- before -->
<button><svg>...</svg></button>
<!-- after -->
<button aria-label="Close"><svg aria-hidden="true">...</svg></button>

<!-- div as button: use native element -->
<!-- before -->
<div onclick={save}>Save</div>
<!-- after -->
<button onclick={save}>Save</button>

<!-- form error: link with aria-describedby -->
<!-- before -->
<input id="email" />
<span>Invalid email</span>
<!-- after -->
<input id="email" aria-describedby="email-err" aria-invalid="true" />
<span id="email-err">Invalid email</span>
```

## Review guidance

- Fix critical issues first (names, keyboard, focus, scope)
- Prefer native HTML before adding ARIA
- Quote the exact snippet, state the failure, propose a small fix
