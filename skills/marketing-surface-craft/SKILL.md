---
name: marketing-surface-craft
description: Execution discipline for landing pages, portfolios, and marketing redesigns. Catches AI layout and composition tells, enforces section craft, and guides redesign QA. Use when building or polishing marketing surfaces, when a page looks templated, or when the user mentions anti-slop, landing page craft, portfolio layout, or marketing site redesign. Not for dashboards or dense product UI.
---

# Marketing surface craft

Execution discipline for **landing pages, portfolios, and marketing redesigns**. This skill catches lazy AI defaults in layout and composition — not bold creative choices the brief or project docs already justify.

## Hierarchy

1. **Project docs win.** When `BRAND.md`, `DESIGN.md`, or `MARKETING.md` exist, follow them. Do not override settled brand, palette, type, or voice choices.
2. **Bold direction wins over guardrails here.** Intentional serif, purple palettes, experimental motion, maximalist chaos — all valid when the brief or docs call for them. These rules target _unthinking defaults_, not creative risk.
3. **Accessibility and trust constraints override aesthetics.** Contrast, readable CTAs, reduced-motion respect, and public-sector sobriety are non-negotiable when the audience requires them.

Every rule below is **contextual**. Pull only what fits the surface and brief.

## In scope

- Landing pages (SaaS, consumer, agency, event)
- Portfolios (developer, designer, studio)
- Marketing-site redesigns (preserve or overhaul)
- Editorial / blog fronts with a marketing job

## Out of scope

- Dashboards, admin panels, dense analytics UI
- Data tables and multi-step product flows
- General app components and feature UI

For those surfaces, apply product-appropriate patterns — not landing-page theatrics.

## Sources first

Before applying rules from this skill:

1. Read project docs if present (`BRAND.md`, `DESIGN.md`, `MARKETING.md`, README).
2. Read the user's brief, references, screenshots, and named competitors.
3. Note existing brand assets — logo, colors, type, photography. On redesigns, these are starting material, not suggestions.

If direction is unsettled, help the user establish it through normal discovery — do not invent a parallel aesthetic system inside this skill.

## Three dials

After sources are clear, calibrate three mental dials. They tune _how much_ of an already-chosen direction to apply — they do not pick the direction.

| Dial         | Low                             | High                                           |
| ------------ | ------------------------------- | ---------------------------------------------- |
| **Variance** | Symmetrical, predictable grids  | Asymmetric, editorial, broken-grid composition |
| **Motion**   | Static; hover feedback only     | Scroll-driven, cinematic choreography          |
| **Density**  | Gallery-like air and whitespace | Cockpit-like information packing               |

**Brief signals (starting points, not mandates):**

| Signal                                      | Variance       | Motion      | Density        |
| ------------------------------------------- | -------------- | ----------- | -------------- |
| Minimalist / calm / editorial / trust-first | Low–medium     | Low         | Low–medium     |
| Premium consumer / brand-led                | Medium–high    | Medium      | Low–medium     |
| Playful / agency / experimental             | High           | High        | Low–medium     |
| Default marketing surface                   | Medium–high    | Medium–high | Medium         |
| Redesign — preserve                         | Match existing | Slightly up | Match existing |
| Redesign — overhaul                         | Higher         | Higher      | Match existing |

## Layout discipline

Rules for marketing surfaces. Failing these usually means the page reads as templated, not broken engineering.

### Hero (marketing pages)

- **Fits the first viewport.** Headline ≤ 2 lines on desktop. Subtext short (roughly ≤ 20 words). Primary CTA visible without scrolling.
- **Scale type and asset together.** Long headlines need smaller display size, not four stacked lines.
- **Modest top spacing.** Hero content should not float halfway down the viewport. Add presence through type or imagery, not excessive padding.
- **Max four text layers:** optional small label, headline, subtext, CTAs (one primary + one secondary). No feature lists, trust strips, pricing teasers, or logo walls inside the hero.
- **Trust logos live below the hero** in their own section.

### Navigation

- Single line on desktop. Condense or collapse — never wrap to two lines.
- Modest height. Navigation should not consume a large share of the viewport.

### Section rhythm

- **Layout variety.** Do not reuse the same section template twice on one page. A long page needs several distinct layout families.
- **Zigzag cap.** Alternating image-left / text-right rows: max two consecutive. Break with full-width, vertical stack, bento, or another family.
- **Eyebrow restraint.** Small caps labels above every headline is an AI tell. Rough guide: at most one eyebrow per three sections (hero counts as one). Often the headline alone is enough.
- **Split-header ban.** Avoid a giant headline left plus a tiny floating explainer right with no compositional purpose. Stack vertically, or use a real two-column header where both columns earn their place.
- **Bento grids.** Cell count = content count — no empty placeholder tiles. Mix visual treatments (image, tint, pattern); not six identical text-only cards on identical backgrounds.

### Composition by variance

- **Higher variance:** prefer split heroes, asymmetry, overlap, scroll-pinned moments. Centered manifesto heroes are fine for editorial or launch-announcement briefs.
- **Lower variance:** symmetry and predictable rhythm are appropriate for trust-first and public-sector contexts.

## Imagery and content density

Marketing surfaces are **visual products**. Minimalism is not a text-only page.

- Use real photography, real product screenshots, or clearly labeled placeholders — never fake UI built from boxes pretending to be a product preview.
- Even restrained sites need real images (hero + at least one supporting visual).
- **Logo walls:** real marks when possible; logo-only (no industry subtitle under each logo). Invented brands deserve a simple mark, not plain styled text.
- **Per section (default):** short headline (≤ ~8 words) + short supporting line (≤ ~25 words) + one visual or one CTA.
- **Long lists (>5 items):** change the pattern — grouped chunks, tabs, card grid, carousel, marquee for breadth — not twenty identical rows with dividers.
- **Spec-heavy products:** feature 3–4 hero specs visually; collapse the rest behind a disclosure.
- **Testimonials:** ≤ 3 lines of quote body; name + role + company attribution.
- **One register per page.** Do not mix faux-technical mono stats, editorial prose, and marketing punch unless the brand voice explicitly calls for it.

## Color, type, and materiality

Defer to project docs when they exist. When inferring:

- **One accent** per page. One neutral family (warm _or_ cool, not both drifting mid-page).
- Accent stays consistent everywhere — no surprise CTA color in a late section.
- Avoid AI-default purple glow and neon-for-the-sake-of-it unless the brand owns purple.
- **Premium-consumer trap:** default "cream + brass + oxblood + espresso" makes every artisan brand identical. Rotate palette families unless the brand literally owns that look.
- Prefer off-black and off-white over pure black and pure white for depth.
- **Serif:** do not reach for serif as a lazy "creative" default. Bold serif is fine when editorial, luxury, or brand docs justify it. Emphasize within a headline using italic or bold of the **same** family — not a random second family for one word.
- **Cards** only when elevation communicates hierarchy; otherwise spacing, hairlines, or grouping.
- Shadows tinted to the background hue — not generic gray drops on light surfaces.
- **Shape lock:** one corner-radius language per page (sharp / soft / pill). Mixed radii need a documented rule and consistent application.

## Motion and theme

- **Motion must communicate something:** hierarchy, storytelling, feedback, or state change — not decoration for its own sake.
- If motion is part of the vision, execute it fully. If not, ship clean and static — half-built motion is worse than none.
- **Marquee / kinetic strips:** at most one per page.
- **Glass / frosted treatments:** premium and overlay contexts; always plan a solid fallback for reduced transparency.
- Infinite loops only where live or status meaning exists — not on every card.
- **Reduced motion:** parallax, scroll hijacks, and loops collapse to static or instant transitions.
- **One theme per page.** Section tints within a family are fine; mid-page light/dark flips read broken unless a deliberate single theme-switch moment is the concept.
- Design and check both light and dark when consumer-facing, unless the brand insists on one mode.

## States and interaction (visual)

Design beyond the happy path:

- Loading, empty, and error states should feel composed — not afterthoughts.
- Buttons: readable contrast; primary labels fit one line at desktop; **one label per intent** across the page (pick "Contact" or "Get in touch" — not both).
- Forms: label above field; placeholder is not a label.

## AI tells (default traps)

See the `anti-ai-slop` skill for the full catalog of generic visual, layout, and
copy tells to avoid **unless the brief explicitly asks for them**. The
marketing-specific traps (purple-gradient hero on mesh, eyebrow on every section,
third consecutive zigzag row, fake product UI in the hero, version badges, scroll
cues, decoration strips, generic names, fake-precise stats, filler verbs) all
live there. Audit against it before declaring a surface done.

## Pattern vocabulary

Names to reach for when the brief and dials call for them — not a checklist to implement everything.

**Hero:** asymmetric split, editorial manifesto, media mask, kinetic type, scroll-pinned

**Layout:** bento grid, masonry, sticky-stack sections, split-screen scroll

**Containers:** glass panel, spotlight border, parallax tilt (sparingly on marketing pages)

**Scroll:** sticky stack, horizontal pan, stagger reveal, zoom parallax

**Media:** coverflow carousel, accordion image slider, mesh gradient atmosphere

**Type:** kinetic marquee (max one per page), text mask reveal, gradient stroke on display type

## Redesign protocol

### Detect the mode

- **Greenfield** — no existing site, or full visual overhaul approved
- **Preserve** — modernise without breaking brand recognition
- **Overhaul** — new visual language; keep content and information architecture

If ambiguous, ask whether to preserve the existing brand or start visually fresh.

### Audit before changing

Document before proposing:

- Brand tokens (color, type, logo, radii)
- Information architecture (page tree, nav, conversion paths)
- Content blocks (what works, what's filler)
- Patterns to keep vs retire
- SEO-sensitive URLs, meta, and ranking pages

### Preservation rules

Unless explicitly asked:

- Keep URL structure, primary nav labels, form field names, logo, and legal/consent copy
- Extract existing brand colors before recalibrating palette
- Preserve copy voice — visual refresh ≠ content rewrite
- Do not regress accessibility wins (focus, contrast, alt text, keyboard nav)

### Modernise in order

Stop when the brief is satisfied:

1. Typography
2. Spacing and rhythm
3. Color recalibration (unify neutrals; keep brand accent)
4. Motion layer appropriate to dials
5. Hero and key-section recomposition
6. Full block replacement (only when unsalvageable)

**Targeted evolution** (IA and content sound): steps 1–4 usually deliver most value at lowest risk.

**Full redesign** (structural visual debt): new visuals with strict content preservation.

## Pre-flight

Run before declaring a marketing surface done. Skip items that do not apply to the surface type.

- [ ] Project docs honored when present
- [ ] Dials match the brief (not generic marketing defaults on a trust-first site)
- [ ] One accent, one neutral family, one shape language
- [ ] Hero fits viewport; trust logos below hero (marketing pages)
- [ ] Section layout variety; zigzag and eyebrow caps respected
- [ ] Bento cell count matches content; visual variation in grid cells
- [ ] Real assets or honest placeholders — no fake UI mockups
- [ ] Motion motivated; reduced-motion considered
- [ ] Loading, empty, and error states designed
- [ ] Button contrast and one label per CTA intent
- [ ] Both themes checked if consumer-facing and dual-mode
- [ ] No AI tells from the `anti-ai-slop` skill unless brief-justified

If a checkbox fails, fix it before delivering.
