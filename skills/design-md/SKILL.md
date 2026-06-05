---
name: design-md
description: Write or revise a project's DESIGN.md (visual identity guide) following the design.md spec. Use when creating or updating DESIGN.md, drafting a visual identity, or when the user mentions design tokens, palette, typography, layout, shape, motion, or the design.md format.
---

# DESIGN.md

Help the user create or maintain a `DESIGN.md` file at the project root. `DESIGN.md` is the canonical source for the project's **visual identity** — overview, colors, typography, layout and spacing, elevation and depth, shapes, components, and do / don't guardrails. It does not own brand voice and it is not a feature spec.

## Spec

Reference: [design.md spec](https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md).

Follow the spec mildly — use its section order and vocabulary as a guide, not as a rulebook to satisfy line-for-line.

## House style (always)

These defaults apply at any project size or complexity. Override only when the user explicitly asks.

- **Concise always.** Every section, sentence, and bullet earns its place. Cut warm-ups, restatements, and section preambles. Density is the goal regardless of scope.
- **No frontmatter by default.** Skip the YAML token block unless the user explicitly asks for it or the project has tooling that consumes it. When the frontmatter is omitted, code (Tailwind theme, CSS variables, token file) is the source of truth for concrete values, and DESIGN.md references token names in prose.
- **Include only what carries weight.** Skip optional sections that would just restate adjacent ones. Combine sections when they would otherwise repeat each other.
- **One source of truth per fact.** Do not duplicate `BRAND.md` or `README.md`. Defer instead. For each concrete value, pick exactly one home — frontmatter tokens here, or the code's token file — never both.

## What belongs in DESIGN.md

- An overview that anchors the visual character to the brand personality.
- Color palette and roles.
- Typography levels and roles.
- Layout and spacing strategy.
- Elevation and depth.
- Shape language.
- Component guidance (when DESIGN.md is the source of truth for components).
- Do / don't guardrails specific to this product.

## What does NOT belong

- Voice, microcopy, personality content — that lives in `BRAND.md`.
- Product features, routes, environment, runtime details — those live in `README.md`.
- Hardcoded UI references (route names, page names like "Ideas ↔ Record"). Describe the pattern, not the instance.
- Anything that duplicates the brand kit or the README without adding visual meaning.

## Tokens vs prose

Tokens and prose can coexist, but each has a job:

- **Tokens** (in frontmatter or a referenced file) — the normative machine-readable values that tooling consumes (Figma variables, Tailwind theme, design-token pipeline).
- **Prose** — the rationale and constraints that explain how to apply the tokens, the rules tooling cannot enforce (when an accent is allowed, what depth method is preferred, what shape language fits the brand).

If the project already stores tokens in code (Tailwind theme, CSS variables, design-token file), reference token **names** in DESIGN.md rather than duplicating hex values. The code is the source of truth for concrete values; DESIGN.md is the source of truth for intent and roles.

## Canonical structure

Follow the spec's section order:

```markdown
# <Project>

<One sentence: what this file is, what it pairs with. Note where the actual tokens live (CSS variables, Tailwind theme, token file).>

## Overview

<Short paragraph anchoring the visual character to the brand personality from `BRAND.md`. The emotional response the UI should evoke.>

## Colors

<One-line palette philosophy.>

| Role          | Token        | Use                                |
| ------------- | ------------ | ---------------------------------- |
| <role>        | `<token>`    | <where it appears>                 |

<Any constraints or no-go's, e.g. "no new color families", "this accent only when X is active".>

## Typography

- **<Level>** — <family> (`<token>`). <Role and any voice link (display, body, label, caption).>
- **<Level>** — <family> (`<token>`). <Role.>

<Principles about hierarchy, line-height, sizing rhythm.>

## Layout

**<Pattern name>** — <abstract description of the layout pattern, route-agnostic>.

<Spacing strategy: grid model, scale in tokens, density principle. Mention responsive behavior if it differs.>

## Elevation & Depth

<How visual hierarchy is conveyed: shadows, tonal layers, borders, contrast.>

## Shapes

<Corner radius philosophy and ranges. Any exceptions.>

## Components

<Either: brief notes on signature components and their states — buttons, inputs, cards, chips, etc.
Or: a one-line statement that components live in code and DESIGN.md only defines tokens and principles.>

## Do / Don't

- **Do** <product-specific rule>.
- **Don't** <product-specific anti-pattern>.
```

Optional sections from the spec — include them when they earn their place:

- **Photography** — when the product uses imagery and the mood needs guardrails.
- **Style** — when the design has a distinct point of view worth naming (design keywords, reference brands, direction statement).

Sections may be combined (Layout often covers Spacing) or expanded with sub-sections when the system is large enough to justify them.

## Frontmatter and tokens

Default: omit. Include the spec's YAML token frontmatter (`colors`, `typography`, `spacing`, `rounded`, `components`, with `{path.to.token}` references) only when the user asks for it, the project has a token pipeline that consumes it, or DESIGN.md is the single normative document shared between Figma and code. Otherwise let the code own concrete values and reference token names in prose and tables.

## Workflow — creating a new DESIGN.md

1. **Read context first.** `BRAND.md` (personality drives visuals — must read), `README.md`, existing CSS / Tailwind theme files or token file (so you know what already exists), any current `DESIGN.md` draft, any design references the user provides (Figma file, reference brands, mood imagery).
2. **Confirm scope.** Ask:
   - Whether components belong in this file or in code (default: code, unless the project needs DESIGN.md to spec them).
   - Whether the brand voice / personality is settled in `BRAND.md`. If not, suggest doing that first.

   Default to no frontmatter; ask only if the project looks like it might consume token YAML.
3. **Interview the user — one question at a time.** Walk through the canonical sections in order. Cover at minimum:
   - Overall direction: light refresh, palette tweak, type tweak, full rethink.
   - Palette: primary / accent / neutral roles, tonal layers, restriction rules.
   - Typography: families (display, body, mono if needed), hierarchy.
   - Layout & spacing: pattern, grid, density.
   - Elevation & depth: shadows vs tonal layers vs borders.
   - Shape: corner radius, exceptions.
   - Components: in-file spec vs code is source of truth.
   - Motion intensity, if relevant.
   - Do / don't guardrails.
4. **Interview style.**
   - Ask only one question per turn. Number it (`Question N of ~M`).
   - Pre-propose options as lettered picks so the user can answer fast.
   - Recommend a pick and explain the trade-off, especially when the user is not opinionated.
   - For palette and motion decisions, point out conflicts with the brand personality from `BRAND.md` (for example, a loud accent fights a "recedes, never interrupts" personality).
   - Make small judgment calls yourself when the user defers, and state what you chose and why.
   - Stop asking once you have enough to write a coherent section.
5. **Draft the file** using the canonical structure. Reference token names; defer concrete values to the source of truth (frontmatter tokens or code).
6. **Identify follow-up code work.** A spec change usually implies code follow-ups — flag them explicitly without doing them unless asked:
   - New tokens that need to be added to the CSS / Tailwind theme / token file.
   - Role changes that imply component refactors (for example, a primary action color moved).
   - Constraints that imply rework (for example, "this color only when X is active" means existing static usages need to be revisited).
7. **Cross-doc sweep.** Update files that should reference `DESIGN.md`:
   - `BRAND.md` visual paragraph — make sure it agrees with the new palette roles.
   - `README.md` documentation map / file index.
   - `AGENTS.md` source-of-truth list and any "follow X for UI" lines.
   - `.cursor/rules/global.mdc` required-reads list (if the project uses one).
   - Skills under `.cursor/skills/*` that touch UI (for example `frontend-design`) — make sure their constraints reference `DESIGN.md` and that any conflicting generic guidance is explicitly overridden.

## Workflow — updating an existing DESIGN.md

1. Read the current `DESIGN.md`, `BRAND.md`, `README.md`, and the CSS / theme / token files before editing.
2. Make focused, surgical edits. Preserve the density of what is already there.
3. Keep the file route-agnostic. If the doc references specific routes or component names, rewrite to describe the pattern abstractly.
4. If a token's role changes, flag the implied code refactor; do not silently expand scope unless the user asks.
5. If a change here invalidates a claim in `BRAND.md`, fix `BRAND.md` in the same change.

## Writing principles

- Dense over polite. Cut warm-up sentences and section preambles.
- Token names over hex when code owns the values; tokens in frontmatter when DESIGN.md owns the values. Pick one source of truth per value, never both.
- Route-agnostic. Describe the layout pattern, not the instance.
- Tables for palette roles. Bullets for short lists. Prose for principles.
- Motion specs (durations, easings) belong here only when they are normative; otherwise prose intensity is enough.
- The Do / Don't list stays product-specific; do not pad with generic accessibility platitudes.

## Done check

Before handing back:

- Every section that is included earns its place; there is no padding.
- No frontmatter or token YAML unless the user explicitly asked for it.
- For each concrete value (color, font size, spacing unit), exactly one source of truth — either DESIGN.md frontmatter or the code's token file, never both.
- No route names, page names, or hardcoded UI references.
- No voice or personality content that duplicates `BRAND.md`.
- Brand personality from `BRAND.md` is reflected in the Overview.
- Follow-up code work is flagged when the spec changed.
- Cross-doc references are updated.
