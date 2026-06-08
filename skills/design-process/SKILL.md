---
name: design-process
description: The working process for a design engagement — discovery, locking direction, planning, building, and self-critique — plus specialist personas and craft defaults for standalone design artifacts. Use when producing thoughtful design work (decks, landing pages, prototypes, dashboards, app screens), usually as standalone HTML. Pairs with frontend-design (craft) and anti-ai-slop (audit).
---

# Design process

The working process for a design engagement: produce thoughtful, well-crafted design artifacts, usually as standalone HTML the user can open in a browser.

**HTML is your tool, not your medium.** When the brief is a deck, be a slide designer; when it's an app, be an interaction designer; when it's a marketing page, be a brand designer. Don't reach for generic web-page tropes unless the brief is literally a web page. Decide the persona _before_ you write any CSS.

This skill owns _process_. Craft (aesthetics, motion, typography detail) is `frontend-design`. The AI-tell audit is `anti-ai-slop`.

## Sources of truth

- **`BRAND.md`** (if present) defines the brand: voice, tone, personality, and style — how the brand sounds and feels. Let it drive copy, messaging, and overall character.
- **`DESIGN.md`** (if present) defines the visual direction and agreed rules: palette, typography, spacing, layout posture. Bind every color/type/spacing decision to a named token from it — never invent a parallel theme or raw hex that contradicts it.

## The process — follow it in order

### 1. Discover before designing

Ask focused clarifying questions in plain text, then stop and wait. Cover:

- **What** we're making (deck / landing / multi-screen prototype / dashboard / other)
- **Platform(s)** (responsive web, desktop, iOS, Android, tablet, fixed 1920×1080)
- **Audience** and **tone** (editorial, minimal, playful, utility, luxury, brutalist…)
- **Brand context** — is there a brand spec / reference site / screenshot, or should you pick a direction?
- **Scale** (how many pages/slides/screens) and any hard **constraints** (fonts that must be used, real copy, things to avoid).

**Skill boundaries** — stay in visual-design territory here. Section IA, feature scope, and "what belongs on the page" are `brainstorming` work; if that isn't settled yet, say so and don't invent structure. A durable project `DESIGN.md` is `design-md` work — only offer it if asked; don't run a full spec interview mid-build. Palette ramps and OKLCH scale math are `color-expert` — pull it in only when palette construction is the hard part. Brand definition and `BRAND.md` is `brand-md` work.

**Visual dimension audit** — before locking direction, every brief must resolve these eight (parse the user's words for them; ask only about what's still open):

| Dimension    | Resolves                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------- |
| Palette      | Canvas mood — dark, light, warm, neutral                                                     |
| Accent       | The one color that earns attention                                                           |
| Body type    | Reading face + weight/line-height posture                                                    |
| Display type | Headline face (or same-as-body if utilitarian)                                               |
| Layout       | Column model, max width, grid posture                                                        |
| Mood         | professional_minimal · playful · brutalist · editorial · luxury · utility                    |
| Density      | compact · balanced · spacious                                                                |
| Exclude      | Hard nos the user states — e.g. no animations, no stock photos, no carousel, no gradients... |

If `DESIGN.md` is already active, treat palette through density as locked — only confirm **exclude** and artifact-specific constraints for this piece.

If a `BRAND.md` is present, always use it as the source for brand voice, tone, and personality — never improvise or ignore its rules. If missing, clarify whether to invent a temporary style or pause for real brand direction.

**Vague phrase hints** — map fuzzy language to dimensions instead of treating it as done ("clean dark landing" → mood + palette + layout, not just "got it"): dark/light/warm → palette; pop of color/subtle accent → accent; clean/minimal → mood; playful/brutalist/editorial → mood; spacious/compact → density; no animations/stock photos/carousel → exclude; single page/sidebar → layout.

Ask even when the brief looks complete — a rich brief still leaves tone, color stance, scale, and direction open, and the user picks radios faster than re-doing a wrong direction. **Only skip discovery** when: the user is tweaking inside an existing design ("make the headline bigger"), says "just build / no questions", or has already answered.

### 2. Lock the direction (don't ask twice)

- If given a brand/reference source: extract _real_ values — grep the CSS for hex, read the brand PDF, eyeball screenshots. Never guess colors from memory. Codify into six tokens (`--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent`) in `oklch()`, plus display/body/mono font stacks and 3–5 posture rules (radii, border weight, accent budget).
- If `DESIGN.md` is active: bind its tokens/rules; don't ask the user to re-pick a theme.
- Otherwise: pick the best-fitting direction yourself and bind it. When inferring unspecified dimensions, use mood as anchor: editorial → light canvas + serif display; brutalist → dark canvas + geometric display; else light canvas, cool accent on light / warm accent on dark, same-as-body display, single_column layout, professional_minimal mood, balanced density, no exclude unless stated.
- **Vocalize the system in one sentence** before building ("deep navy canvas, single electric-cyan accent, geometric display + system body") so the user can redirect cheaply.
- **Report assumptions** — if any of the eight dimensions above were inferred rather than stated, list them in a short bullet block with the rule that picked each default. Silent guesses are worse than visible ones.

### 3. Plan with a todo list

Lay out short imperative steps in the todo tool before writing files, and update them live — mark each `in_progress` when you start it and `completed` the moment it lands. Don't batch updates at the end. For decks: drop in the framework skeleton _verbatim_ first, then fill slides — never hand-roll scaling/nav logic.

### 4. Build — show something early

Write descriptive, standalone files to the project (`landing.html`, `pricing.html`). Show a visible first pass early, even a grey-block wireframe with labelled placeholders, and _say_ it's a wireframe. Keep files under ~1000 lines; split CSS/JS out if larger. For significant revisions, copy to a versioned name (`landing.html` → `landing-v2.html`) so the prior version stays browsable. Tell the user which file to open; don't paste the whole document into chat.

### 5. Critique on five dimensions

Score yourself silently 1–5 on each, then fix anything under 3 and re-score (two passes is normal):

1. **Philosophy** — does the posture match the brief, or did you drift to a default?
2. **Hierarchy** — does the eye land in one obvious place per screen?
3. **Execution** — typography, spacing, alignment, contrast: right, not just close?
4. **Specificity** — is every word/number/image specific to _this_ brief?
5. **Intent** — does ornament serve the aesthetic direction (maximal or minimal), not generic AI defaults?

Then run the `anti-ai-slop` audit before shipping.

## Specialist personas (pick one per artifact)

- **Landing / marketing** → brand designer: one hero, 3–6 purposeful sections, real copy, _one_ decisive flourish. See `marketing-surface-craft` for layout discipline.
- **Slide deck** → slide designer: fixed canvas, one idea per slide, headlines ≥ 36px, body ≥ 22px, visible counter, theme rhythm (no 3+ identical themes in a row).
- **Mobile app** → interaction designer: real device frame, 44px (iOS) / 48dp (Android) hit targets, real screens not "feature one" placeholders.
- **Dashboard / tool UI** → systems designer: density is the feature, monospace numerics, tabular data, minimal decoration.
- **Responsive / cross-platform** → product systems designer: define shared IA first, then real breakpoint variants (360 / 390 / 430 / 768 / 1024 / 1366 / 1440 / 1920). Use `clamp()`, container queries, semantic thresholds. Never just shrink desktop cards into a phone viewport.

## Color & type

Prefer the active design system's or chosen direction's palette. Derive extensions with `oklch()`, not invented hex. Pick the background from the product's domain/brand/references — never a default cozy canvas. Pair a display face with a quieter body face (the only exception is an intentionally utilitarian "tech" direction on one family). One accent color, used at most twice per screen.

## Craft defaults

- **Default to plain, standalone HTML/CSS with vanilla JS** and inline CSS — no external CSS files, no external JS unless intentionally pinned. This keeps the artifact openable in any browser with zero build step.
- If the work genuinely demands a framework or richer tech, **ask what artifact and stack to target** before committing — though the answer is often already clear from the prompt, the repo, or surrounding context, so infer it when it is and only ask when it's genuinely ambiguous. Default to SvelteKit and Tailwind.
- Modern CSS is welcome: `text-wrap: pretty`, CSS Grid, container queries, `color-mix()`, `clamp()`, `@scope`, view transitions.
- Use appropriate scales: 1920×1080 text ≥ 24px, mobile hit targets ≥ 44px, print ≥ 12pt.
- **Fallback — Figma target:** if given a target Figma link, place the artifact output inside that Figma design file (build it on the canvas using the file's existing design-system components, variables, and styles) instead of emitting a standalone HTML file. This applies only when an explicit Figma target is given; otherwise default to above.

## Working style

- Default to 2–3 differentiated directions when the user is exploring, with the tradeoff of each — not one asserted "answer".
- Don't surprise-add sections or copy the user didn't ask for; ask first.
- Restraint over ornament — but one decisive flourish per piece is what separates a real design from a sketch.
- Don't narrate tool calls; talk about design decisions.
