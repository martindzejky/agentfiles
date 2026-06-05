---
name: brand-md
description: Write or revise a project's BRAND.md (brand kit) following the brand.md spec. Use when creating or updating BRAND.md, drafting a brand kit, or when the user mentions brand voice, personality, tagline, positioning, microcopy, say/never-say rules, or the brand.md format.
---

# BRAND.md

Help the user create or maintain a `BRAND.md` file at the project root. `BRAND.md` is the canonical source for **strategy, voice, personality, positioning, tagline, and microcopy**. It is not the place for product details, visual tokens, or implementation.

## Spec

Reference: [brand.md spec](https://raw.githubusercontent.com/thebrandmd/brand.md/main/spec/brand-md.md) (site: <https://thebrand.md>).

Follow the spec mildly — use its section order and vocabulary as a guide, not as a rulebook to satisfy line-for-line.

## House style (always)

These defaults apply at any project size or complexity. Override only when the user explicitly asks.

- **Concise always.** Every section, sentence, and bullet earns its place. Cut warm-ups, restatements, and section preambles. Density is the goal regardless of scope.
- **No frontmatter by default.** Skip the YAML block unless the user explicitly asks for it or the project has tooling that consumes it. The markdown body is the source of truth either way.
- **Include only what carries weight.** Skip optional sections that would just restate adjacent ones. Combine sections when they would otherwise repeat each other. Expand only when the brand actually has more to say.
- **One source of truth per fact.** Do not duplicate `README.md` or `DESIGN.md`. Defer instead.

## What belongs in BRAND.md

- Strategy: what the brand is, where it stands, who it is as a character, what it promises, the guardrails around it.
- Voice: identity, tagline, owned phrases, message pillars, tonal rules.
- Microcopy guidance, including say / never-say.
- Optional: manifesto, social bios, per-platform language.
- A short visual section that points to `DESIGN.md` for the actual visual system.

## What does NOT belong

- Product features, routes, architecture, environment — those live in `README.md`.
- Visual tokens, hex values, layout details, component specs, motion specs — those live in `DESIGN.md`.
- Implementation details, code samples, framework references.
- Anything that simply repeats `README.md` or `DESIGN.md` instead of adding brand meaning.

## Canonical structure

Follow the spec's three-layer order: Strategy → Voice → Visual. A name/origin note at the end is useful when the name carries meaning.

```markdown
# <Brand>

> <Tagline>

<Optional one-line context: what this file is, what it pairs with.>

## Strategy

### Overview
<What it is. Origin if relevant. The deep description, not the surface feature. The problem it solves. Before → after. Long-term ambition.>

### Positioning
<Category it occupies or creates. What it is not. Competitive landscape. Structural differentials. Territory it owns.>

### Personality
<Dominant archetype. Attribute words. What it is. What it is not.>

### Promise
<Core promise as a few declarative statements. Base message. One synthesizing phrase.>

### Guardrails
<Tone summary. What the brand cannot be. A one-line litmus test.>

## Voice

### Identity
<Who we are, written in first person. One-line essence.>

### Tagline & Slogans
<Primary tagline with usage. 2–3 alternatives. Context-specific slogans.>

### Message Pillars
<4–6 pillars, each with one or two statements.>

### Phrases
<5–8 ownable one-liners. If any line still works after swapping in another brand name, it is not ownable.>

### Tonal Rules
<Communication rules. Identity boundaries ("what we are not"). A say / never-say table.>

## Visual

<Short paragraph that points to `DESIGN.md` for tokens, layout, shape, motion. Mentions only brand-level anchors (palette spirit, type families, layout pattern). No hex values.>

## Name

<Origin of the name in 1–2 sentences when it carries meaning.>
```

Optional sections from the spec — include them when they earn their place:

- **Voice → Manifesto** — when the brand benefits from a longer declaration.
- **Voice → Social Bios** — when bios need to be ready-to-use across platforms.

Sections may be combined when they would otherwise repeat each other (for example, folding Promise into Personality), or expanded with deeper sub-sections when the brand is large enough to justify them.

## Frontmatter

Default: omit. Include the spec's YAML frontmatter (`name`, `tagline`, `version`, `language`, optional hierarchy fields) only when the user asks for it or the project has tooling that consumes it.

## Workflow — creating a new BRAND.md

1. **Read context first.** `README.md` (product reality), `DESIGN.md` if present (so the brand voice can reference it), any current `BRAND.md` draft, and any parent `BRAND.md` if this is a product within a larger brand house.
2. **Confirm scope.** Ask which spec sections to include and (for product brands) the relationship to a parent brand (branded-house, endorsed, sub-brand, independent). Default to no frontmatter; ask only if the project looks like it might consume it.
3. **Interview the user — one question at a time.** Walk through the canonical sections in order. Cover at minimum:
   - Overview: what the brand really does, deeper than the surface feature.
   - Positioning: category, primary/secondary audience, what it is not, differentials.
   - Personality: archetype, attribute words.
   - Promise and guardrails: what the brand commits to and what it must never become.
   - Identity and tagline.
   - Message pillars (when the brand has clear themes).
   - Voice / microcopy lane (plain vs warm vs poetic; ask for a concrete example such as an empty state or an error).
   - Anti-patterns the brand must avoid.
   - Owned phrases and name origin.
4. **Interview style.**
   - Ask only one question per turn. Number it (`Question N of ~M`).
   - Pre-propose options as lettered picks so the user can answer fast, but accept free-form answers.
   - Recommend a pick when there is a clear right answer; explain the trade-off briefly.
   - After each answer, restate what was captured in one line before the next question.
   - Push back when an answer fights an earlier choice (for example, "a loud color for static errors fights the calm-error tone you just chose"). Do not agree by default.
   - Stop asking once you have enough to write a coherent section; do not run the user through every spec sub-section if the answers are already clear.
5. **Draft the file** using the canonical structure. Keep every line earning its place — density is a virtue at any scale.
6. **Cross-doc sweep.** Update files that should now reference `BRAND.md`:
   - `README.md` documentation map / file index.
   - `AGENTS.md` source-of-truth list and any "follow X for copy" lines.
   - `.cursor/rules/global.mdc` required-reads list (if the project uses one).
   - Skills under `.cursor/skills/*` that touch UI or copy (for example `frontend-design`) — make sure their constraints reference `BRAND.md` and that any conflicting generic guidance is explicitly overridden.
7. **Flag conflicts.** If `BRAND.md` describes visuals that disagree with `DESIGN.md`, fix the brand kit to defer rather than duplicate.

## Workflow — updating an existing BRAND.md

1. Read the current `BRAND.md`, `DESIGN.md`, and `README.md` before editing.
2. Make focused, surgical edits. Preserve the density of what is already there — do not turn a one-line statement into a paragraph unless the brand actually grew.
3. If a change in `DESIGN.md` invalidates a visual claim in `BRAND.md`, fix the brand kit in the same change.
4. If a change in `BRAND.md` invalidates voice or microcopy choices in code, flag the follow-up work; do not silently expand scope.
5. When inheriting from a parent brand, only include sections that diverge from the parent.

## Writing principles

- Dense over polite. Cut warm-up sentences, restatements, and any line that says "this section will…".
- Concrete over abstract. "Tap to start." beats "engaging onboarding microcopy".
- Use tables for parallel pairs (say / never say). Use bullets for short lists. Use prose for tone rules.
- Never advertise the AI or the implementation; describe what the product does for the user.
- Emojis only when the brand is explicitly playful.
- Match register to the brand: lowercase microcopy fits a warm minimal brand, formal capitalization fits an institutional one.

## Anti-patterns to surface

If the user has not decided what the brand should avoid, propose categories like these for confirmation or rejection:

- AI hype ("unlock", "supercharge", "AI-powered").
- Productivity-bro ("crush", "10x", "hustle").
- Cute/quirky mascot energy ("Oopsie!", emoji-heavy).
- Corporate/SaaS-y ("seamless workflow", "holistic", "empower").
- Loud/urgent ("Don't miss out!", flashing badges).
- Therapy/wellness ("breathe", "mindful", "your journey").

Drop or add categories based on the brand's actual neighbors.

## Done check

Before handing back:

- Every section that is included earns its place; there is no padding.
- No frontmatter unless the user explicitly asked for it.
- No hex values, no token names, no route names, no component specs.
- No product or feature details that duplicate `README.md`.
- Visual section is a short pointer to `DESIGN.md`, not a second palette.
- Cross-doc references are updated.
