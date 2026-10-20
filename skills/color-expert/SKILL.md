---
name: color-expert
description: Use when working with color naming, color theory, color spaces, color definitions, or any task involving color knowledge - palettes, ramps, gradients, conversions, accessibility, perceptual matching, pigment mixing, print-vs-screen color, CSS color syntax, or historical color terminology. Use this skill whenever the user is choosing, comparing, generating, naming, converting, or explaining colors, even if they do not explicitly ask for "color theory."
---

# Color expert

A comprehensive knowledge base for color-related work. See `references/INDEX.md` for a one-line-per-file map of 180+ reference files; this skill file contains the essential knowledge to answer most questions directly.

## How to Use This Skill

Match the response to the user's explicit request and constraints already available in context. Read only references relevant to the task; do not load the whole archive. Five common modes:

**Concrete design or art project** — "help me pick colors for my logo / poster / illustration / app." Use the known medium (print, screen, paint, mixed), brand or mood, audience, accessibility needs, and existing colors. Ask only about material gaps, then propose. Don't lecture about CIE 1931 or OKLCH internals unless asked. Recommend specific tools and palettes that fit the constraints, not generic theory.

**Design system, ramps, or theme tokens** — "build me a 9-step accent scale", "palette for light + dark mode", "Tailwind/Radix-style ramps", "what's the right gray ramp for our brand?" Prioritize in this order:

- Use OKLCH to build approximately perceptual scales; inspect hue, lightness, gamut, and intermediate colors rather than assuming perfect uniformity.
- Build a token graph: reference tokens (palette) → semantic tokens (surface, on-surface, accent, success, warning, danger) → component usage; see _Implementation Guidance_ below.
- Verify text/background pairs against the applicable WCAG contrast requirements in each supported theme. APCA may supplement readability assessment; it does not replace WCAG conformance.
- Suggest tools only as needed: Huetone (LCH/OKLCH builder), Leonardo (contrast-ratio-driven ramps + adaptive theming, Adobe), Components.ai Color Scale (parametric), dittoTones (extract perceptual DNA from Tailwind/Radix), Color Buddy (lint). For dataviz sequential/diverging ramps specifically, CuspHanger (Wijffelaars model in OKLCH, in-gamut by construction) or viscm (the viridis editor: live perceptual-derivative diagnostics + CVD + grayscale while you drag control points).

The test for a sequential ramp is **flat perceptual derivative** — plot the perceptual step size between consecutive samples; it should be a horizontal line, in color _and_ in grayscale. Bumps are regions where the ramp exaggerates change that isn't in the data (this is jet's core failure, not its ugliness).

**Generative art / creative coding** — "color for my fxhash piece", "palette for thousands of generated strokes", "paint-like mixing in p5.js / WebGL." Different from building a palette generator: the code _is_ the artwork, and the user wants to understand the _techniques_, not copy a named artist's style. Help them compose their own system. Useful techniques to teach and combine:

- **Tight constraint, then variation** — pick 3–7 hues in a narrow lightness or chroma band; variety comes from density and interaction, not palette size.
- **Weighted / probability-based hue selection** — assign each color a weight so some appear often, others rarely; this is what makes a generative output feel curated instead of random.
- **Narrow-band hue jitter** — small random hue offset within a fixed envelope keeps strokes feeling related but not identical.
- **Lightness variation at fixed chroma** — depth and atmosphere without losing palette identity (use OKLCH).
- **Spectral / K-M mixing** (Spectral.js, Mixbox) for paint-like overlap and secondaries; RGB averaging gives muddy, dull results in the same situation.
- **IQ cosine palette** — `a + b·cos(2π(c·t + d))` for cyclic / periodic schemes from 12 floats.
- **Anchor-based interpolation** (Poline) — set 2–3 anchors in OKLCH, get an interpolated ramp.
- **Hue / lightness / chroma trajectories with easing** (RampenSau) — walk each axis along an easing function, color-space-agnostic; great when you want a deterministic ramp shape rather than random anchors.
- **Harmony-aware generation with muddy-zone avoidance** (pro-color-harmonies) — adaptive OKLCH harmony with 4 styles × 4 modifiers; skips perceptually muddy regions automatically.
- **Generation in historical / non-digital color spaces** (RYBitten) — work in RYB or one of 26 historical color cubes when you want a painterly feel that strict sRGB/OKLCH can't reach.
- **Palette cycling / indexed color** — store an index buffer and a small palette, then animate the palette (rotate, ease, or drive from an OKLCH trajectory) instead of the pixels; motion for one lookup per pixel. Works only if each cycle range is a perceptually even closed ramp. See `references/techniques/color-cycling-indexed-palette-animation.md`.
- **Scene-light sampling** (ray-color) — raytrace a sphere in a room with up to 3 colored lights and sample colors off its surface; coherence comes from shared illumination physics (like an object photographed under one light) rather than color-space geometry.
- **Sun-lit ramps** (Lightfield, tol.is) — same idea aimed at design tokens: OKLCH pigments on a flat-shaded city under a Planckian-locus sun; each 50–950 ramp is a sweep of surface orientations, re-spaced in L. Adds relative chroma, cusp pull, and a hue-profiled Bezold–Brücke/Abney warm shift (toward red going dark, toward yellow going light; cool hues untouched).

See `references/techniques/` for tyler-hobbs, fontana, mattdesl, iq-cosine, spectraljs, poline, rampensau, pro-color-harmonies, rybitten, ray-color, lightfield (these document the techniques, not styles to imitate).

**General color question** — "what is OKLCH?", "why does my gradient go gray in the middle?", "is APCA better than WCAG?" Answer directly from this skill file or `references/INDEX.md`, and cite the relevant reference. Skip tooling unless they're asking how to do something. **Approachable and accurate usually conflict** — the tidy model (RYB primaries, 12-hue wheel, "red is opposite green") is easy precisely because it summarizes beliefs rather than measurements. Give the tidy version _and_ say where it breaks; don't let "easy" quietly become "wrong." (Color Nerd, `references/contemporary/color-theory-dogma-problem.md`)

**Building a generator, tool, or palette algorithm** — "I want to make a palette generator", "how do I generate accessible color scales?", "give me an OKLCH ramp function." Default to recommending an existing library before hand-rolling (Culori, Poline, RampenSau, Spectral.js — see Recommended Tools). Show working code in the user's stack, picking the color space per the table above.

When the user is exploring ways to generate or compare palettes, offer relevant approaches and their trade-offs before narrowing to one — anchor-based (Poline), hue-cycling (RampenSau), cosine (IQ formula), harmony-based (pro-color-harmonies), scene-lit (ray-color), and extraction-from-system (dittoTones) suit different problems. Don't be shy about presenting options.

## Color Spaces — What to Use When

| Task                             | Use                                    | Why                                                                                                                                                                                                                           |
| -------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Perceptual color manipulation    | **OKLCH**                              | Practical perceptual coordinates; improves on CIELAB in blues, without perfect uniformity.                                                                                                                                    |
| CSS gradients & palettes         | **OKLCH** or `color-mix(in oklab)`     | Often smoother lightness than RGB/HSL; complementary colors can still desaturate                                                                                                                                              |
| Gamut-aware color picking        | **OKHSL / OKHSV**                      | Ottosson's picker spaces — cylindrical like HSL but perceptually grounded                                                                                                                                                     |
| Normalized saturation (0-100%)   | **HSLuv**                              | CIELUV chroma normalized per hue/lightness. HPLuv for pastels.                                                                                                                                                                |
| Print workflows                  | **CIELAB D50**                         | ICC standard illuminant                                                                                                                                                                                                       |
| Screen workflows                 | **CIELAB D65** or OKLAB                | D65 = screen standard                                                                                                                                                                                                         |
| Cross-media appearance matching  | **CAM16 / CIECAM02**                   | Accounts for surround, adaptation, luminance, and viewing conditions                                                                                                                                                          |
| HDR                              | **Jzazbz / ICtCp**                     | Designed for extended dynamic range                                                                                                                                                                                           |
| Pigment/paint mixing simulation  | **Kubelka-Munk** (Spectral.js, Mixbox) | Spectral reflectance mixing, not RGB averaging                                                                                                                                                                                |
| Color difference (precision)     | **CIEDE2000**                          | Gold standard perceptual distance                                                                                                                                                                                             |
| Color difference (fast)          | **Euclidean in OKLAB**                 | Good enough for most applications                                                                                                                                                                                             |
| Video/image compression          | **YCbCr**                              | Luma+chroma separation enables chroma subsampling                                                                                                                                                                             |
| Dithering / optical pixel mixing | **Linearized sRGB**                    | Adjacent subpixels add _light_, so model the **device**, not the eye. Yellow-over-blue lights the same emitters as white at half area = 50% gray; CIELAB predicts pale pink. Same rule for alpha compositing and downsampling |
| Colormap uniformity              | **CAM02-UCS** (or OKLAB)               | CIELAB is decent for _distant_ colors but poor for _nearby_ ones — which is exactly what uniform sampling depends on. MATLAB's parula was made uniform in Lab and has a visible band near the bottom as a result              |

### Understanding HSL's Limitations

HSL isn't "bad" — it's a simple, fast geometric rearrangement of RGB into a cylinder. It's fine for quick color picking and basic UI work. But its three channels don't correspond to human perception:

- **Lightness (L):** fully saturated yellow (`hsl(60,100%,50%)`) and fully saturated blue (`hsl(240,100%,50%)`) have the same L=50% but vastly different perceived brightness. L is a mathematical average, not a perceptual measurement.
- **Hue (H):** non-uniform spacing. A 20° shift near red produces a dramatic change; the same 20° near green is barely visible. The green region is compressed, reds are stretched.
- **Saturation (S):** doesn't correlate with perceived saturation. A color can have S=100% and still look muted (e.g., dark saturated blue).

**When HSL is fine:** simple color pickers, quick CSS tweaks, situations where perceptual accuracy doesn't matter. When it isn't, the table above gives the perceptual alternative per task (OKLCH for scales, OKLAB for gradients, OKHSL for picking, HSLuv for normalized saturation).

### Named Hue (HSL/HSV) Ranges

Use these degree ranges when generating or constraining colors by hue name. Source: [random-display-p3-color](https://github.com/mrmrs/random-display-p3-color) by mrmrs / mrmrs.cc.

| Name       | Degrees       |
| ---------- | ------------- |
| **red**    | 345–360, 0–15 |
| **orange** | 15–45         |
| **yellow** | 45–70         |
| **green**  | 70–165        |
| **cyan**   | 165–195       |
| **blue**   | 195–260       |
| **purple** | 260–310       |
| **pink**   | 310–345       |
| **warm**   | 0–70          |
| **cool**   | 165–310       |

### Key Distinctions

- **Chroma** = colorfulness relative to a same-lightness neutral reference
- **Saturation** = perceived colorfulness relative to the color's own brightness
- **Lightness** = perceived reflectance relative to a similarly lit white
- **Brightness** = perceived intensity of light coming from a stimulus
- Same chroma ≠ same saturation. These are different dimensions.

### Gamut Mapping in Practice

The most common OKLCH mistake: picking a chroma that doesn't exist in the target gamut. `oklch(70% 0.3 150)` asks for more chroma than sRGB (or even P3) can show, so it needs gamut mapping before display or export. The mapping can change its appearance.

- **Validate the target renderer.** Browsers map out-of-gamut CSS colors for display, but behavior can differ across implementations. JavaScript conversion libraries also differ: explicitly choose a gamut-mapping method for deterministic exports rather than assuming conversion to hex preserves appearance.
- **Reduce chroma, not lightness or hue.** Clipping R/G/B shifts the hue; pulling chroma toward the gamut boundary preserves the color's identity. Use Culori's `clampChroma(color, 'oklch')` (holds L and H) or `toGamut()` rather than naive RGB clamping.
- **Test against the actual target:** `inGamut('rgb')` vs `inGamut('p3')` — a color valid in P3 can still clip in sRGB.
- **Or avoid the problem by construction:** nutelch expresses chroma _relative to the gamut boundary_ (`relC: 0.5` = halfway to the shell at that L/H), so generated colors can't accidentally ask for chroma that isn't there.

## Implementation Guidance — Code and CSS

When using colors in a program or CSS, add a semantic layer between raw color values and UI roles.

The examples below are pseudocode, not literal CSS requirements. They express the decision structure an agent should preserve even if the target stack uses different syntax.

Across CSS, JS/TS, Swift, design-token JSON, templates, or pseudocode, default to the same structure:

- **Reference tokens/palette values** for concrete colors
- **Semantic tokens/roles** that map meaning onto those colors
- **Component usage** that consumes semantic tokens rather than raw literals

Raw color literals should usually appear only in palette/reference definitions, conversions, diagnostics, or deliberately one-off examples.

- **Use reference tokens for concrete colors**: `ref.red = #f00`
- **Use semantic tokens for meaning/role**: `semantic.warning = ref.red`
- **Prefer semantic tokens in components** so themes can swap meaning without rewriting component code.
- **This default applies in any language**; translate to the target system's equivalent alias/reference mechanism (CSS custom properties, Swift enums, design-token JSON, etc.).
- **Encode color decisions when possible** instead of freezing one manual choice into a literal.

Pseudocode examples:

- `ref.red := closest('red', generatedPalette)`
- `semantic.warning := ref.red`
- `semantic.onSurface := mostReadableOn(surface)`

Good pattern: palette/reference tokens define available colors; semantic tokens map those colors to roles like surface, text, accent, success, warning, and danger.

If a system can derive a decision from constraints, encode that derivation. Examples: nearest named hue in a generated palette, foreground chosen by a WCAG contrast target, hover state computed from the base token in OKLCH instead of hand-picking a second unrelated hex.

**Especially when applying generated colors to a UI**: the generator gives you primitives, but the _mapping_ onto roles is where designs rot. Don't freeze one manual mapping into literals — emit the rule. A useful decision vocabulary (from Design Book, see below):

- `text := bestContrastWith(surface, palette)` — recomputes when the palette regenerates
- `accent := mostVivid(palette, { against: surface, minContrast: 4.5, not: [error, success] })` — vividness gated by readability, role-reserved tokens excluded
- `surface := nth(ramp, 0)`, `text := nth(ramp, -1)` — ramp roles pinned to _position_, so they survive regenerating the ramp with a different stop count
- `hover := colorMix(accent, ink, 0.12)` or adaptive `shade(surface)` — flips darken/lighten by the input's lightness, so it never collapses on dark themes

In CSS, many decisions can stay native (the browser re-runs them): `var()` for references, `color-mix()` for hover states, relative color syntax for channel edits — see the cheat sheet below.

For larger systems, prefer a **token graph** over a flat token dump: references, semantic roles, derived functions, and scope inheritance. This makes theme changes, accessibility guarantees, and multi-platform export auditable and easier to maintain. **Design Book** is one implementation described in the references: a reactive constraint system where tokens store _how values are chosen_, dependents recompute on change, and `inspect()` explains why a value won; renders to CSS vars, JSON, and W3 design tokens. See `references/techniques/designbook-reactive-design-token-spec.md`.

## CSS Color 4/5 — Syntax Cheat Sheet

Modern CSS does perceptual color natively; reach for these before pulling in a JS library.

- **Perceptual color:** `oklch(70% 0.12 250)`, `oklab(0.7 -0.1 0.1)`, wide gamut via `color(display-p3 1 0.2 0.3)`.
- **Mixing:** `color-mix(in oklab, blue 30%, white)` — interpolation in `oklab` often gives smoother lightness, but complementary endpoints can still produce muted midpoints; `oklch` follows a hue path. For cylinders, set a hue strategy: `color-mix(in oklch longer hue, …)`.
- **Relative color syntax (derive from a base):** `oklch(from var(--brand) l c h / 0.5)`, or compute a shade/hover without a second hard-coded hex: `oklch(from var(--brand) calc(l * 0.9) c h)`.
- **Light/dark without a media query:** `light-dark(white, black)` (requires `color-scheme: light dark`).
- **Gamut targeting:** `@media (color-gamut: p3) { … }`.
- **Gradients in a chosen space:** `linear-gradient(in oklch, red, blue)`.

Check support for the project's target browsers, especially relative syntax and wide-gamut rendering. See `references/techniques/` CSS Color 4/5 for edge cases.

## Accessibility — Key Numbers

Of ~281 trillion hex color pairs (research by @mrmrs\_, computed via a Rust brute-force run):

| Threshold                 | % passing | Odds            |
| ------------------------- | --------- | --------------- |
| WCAG 3:1 (large text)     | 26.49%    | ~1 in 4         |
| WCAG 4.5:1 (AA body text) | 11.98%    | ~1 in 8         |
| WCAG 7:1 (AAA)            | 3.64%     | ~1 in 27        |
| APCA 60                   | 7.33%     | ~1 in 14        |
| APCA 75 (fluent reading)  | 1.57%     | ~1 in 64        |
| APCA 90 (preferred body)  | **0.08%** | **~1 in 1,250** |

These sampled pass rates compare different thresholds, not equivalent readability or conformance levels. APCA Lc targets depend on text size, weight, and polarity; use the appropriate guidance rather than treating Lc 90 as a universal minimum. JPEG compression exploits the same biology: chroma subsampling (4× less color data) is invisible because human vision resolves brightness at higher resolution than color.

**Charts — meaningful boundaries.** Essential adjacent graphical regions need sufficient contrast under the applicable WCAG non-text requirements; not every color must contrast with every other color. Borders, spacing, labels, or patterns can make boundaries and categories discernible. Check each actual neighboring pair, including the border against both fills when the border carries the distinction. Do not rely on color alone. (Ström, see `references/techniques/strom-least-wrong-colors-simulated-annealing.md`.)

## Color Harmony — What Actually Works

### Hue-first harmony is a weak standalone heuristic

Complementary, triadic, tetradic intervals are weak predictors of mood, legibility, or accessibility on their own. Every hue plane has a different shape in perceptual space, so geometric hue intervals do not guarantee perceptual balance. Complements are also **pigment-specific**, not name-specific: measured in OKLAB, cadmium red, quinacridone red and alizarin crimson all sit opposite cobalt teal, and chrome oxide green sits opposite a purple, not red. Compute the opposite from the actual color (OKLCH hue + 180°), never from its category name.

### Character-first harmony works (Ellen Divers' research)

Organize by character (pale/muted/deep/vivid/dark), not hue. Finding: **hue is usually a weaker predictor of emotional response than chroma and lightness** — a muted palette often reads as calm across many hues. Relaxed vs intense is driven more by chroma + lightness than hue alone.

### Colour meaning in a story is per-story, not a symbolism table (Lewis Bond)

For narrative work (film, games, illustration, brand storytelling) ask two questions instead of "what does red mean": what subject is the colour **associated** with by repetition, and does it **transition** as that subject changes (_The Godfather_ makes orange mean death; _Blue Is the Warmest Colour_ tracks the affair by blue's saturation). A single saturated outlier on a balanced scheme is a focal device; a new hue entering a settled scheme reads as disruption. See `references/contemporary/colour-in-storytelling-lewis-bond.md`.

### Legibility = lightness variation

Grayscale is a quick sanity check for lightness separation, not an accessibility proof. You still need to verify applicable WCAG contrast requirements, optionally supplement with APCA, and consider text size, weight, polarity, and CVD. Same character + varied lightness is often more readable. Same lightness regardless of hue is usually illegible.

### The 60-30-10 rule

60% dominant color, 30% secondary, 10% accent. One color dominates to prevent "three equally-sized gorillas fighting."

## Pigment Mixing — Not What You Think

- **Pigment mixing is not well described by the simple subtractive model alone** — "integrated mixing" (Küppers/Briggs) is a better practical description. It behaves like a compromise between subtractive and additive averaging.
- **CMY mixing paths curve outward** (retain chroma = vivid secondaries) — "extroverted octopus"
- **RGB mixing paths curve inward** (lose chroma = dull browns) — "introverted octopus"
- **Mixing is non-linear**: proportion of paint ≠ proportional hue change. You "turn a corner" at certain ratios.
- **Blue→yellow is a LONG road**, red→yellow is SHORT. Traditional wheel massively misrepresents distances.
- **Tinting strength varies**: blues are concentrated/strong, yellows are weak.
- **White doesn't just lighten** — it shifts hue AND kills chroma.
- **For spectral/K-M mixing in code**: use Spectral.js (open source) or Mixbox (commercial).

## Color Temperature

- **Temperature ≠ hue** — it's a systematic shift of BOTH hue AND saturation, dependent on starting hue
- **Spectral bias**: which end of the spectrum a light favors (short λ = cool, long λ = warm)
- **Cool daylight**: blue atmospheric scatter fills shadows; paint neutral highlights, blue shadows
- **Warm incandescent**: favors long wavelengths including infrared (literally felt as heat)
- **Green and purple** do not map cleanly to warm/cool in the same way as red-orange or blue-cyan; perceived temperature depends strongly on context

## Color Naming — Multiple Systems for Different Registers

| System                | Register                   | Example                               |
| --------------------- | -------------------------- | ------------------------------------- |
| ISCC-NBS              | Scientific precision       | "vivid yellowish green"               |
| Munsell               | Systematic notation        | "5GY 7/10"                            |
| XKCD                  | Common perception          | "ugly yellow", "hospital green"       |
| Traditional Japanese  | Cultural/poetic            | "wasurenagusa-iro" (forget-me-not)    |
| RAL                   | Industrial reproducibility | RAL 5002                              |
| Ridgway (1912)        | Ornithological             | 1,115 named colors, public domain     |
| CSS Named Colors      | Web standard               | 148 names, 138 unique colors          |
| color-description lib | Emotional adjectives       | "pale, delicate, glistening"          |
| colornames-oklab      | Perceptually even coverage | "Smaragdine" (rec2020 tier)           |
| COLIBRI (fuzzy)       | Graded / "between" naming  | 0.6 cyan · 0.4 light blue, medium sat |

Use `color-name-lists` npm package for 18 naming systems in one import. For _naming arbitrary or generated colors_ — especially wide-gamut — use `colornames-oklab`: 4444 names blue-noise sampled over the Rec2020 gamut in OKLab, so no query lands far from a name (crowd-sourced lists cluster in reds/skin tones/pastels and leave gamut regions empty). Tiered srgb/p3/rec2020, zero-dep `closest()` with a unique-assignment mode for palettes.

**Naming colours _from an image_ — don't eyeball, sample.** Vision-language models (this agent included) name prototypical high-chroma hues reliably and degrade on non-prototypical shades, near-neutrals and fine lightness steps; CLIP-style encoders read the _word_ "red" over blue ink and rarely label white/grey/black; no vision encoder yet matches human discrimination thresholds. Extract pixel values with code (sample regions → OKLCH → `colornames-oklab` / ISCC-NBS) and treat a visual impression as a hypothesis. Measured: six VLMs score 83–100% on focal Munsell chips but 64–83% on the full 330, and all converge on the same 21 names (Gomez-Villa 2025). For genuine boundary colours, humans themselves split their votes (COLIBRI, n = 2,496) — report proportions, not a winner. See `references/contemporary/colour-in-computer-vision-vlm.md` and `color-names-in-vlms-gomez-villa.md`.

## Historical Corrections

- **Moses Harris (1769)** was first to place RYB at equal 120° — Newton, Boutet, Schiffermüller didn't. His own wheel needed a 4th pigment. The origin of bad color theory.
- **Von Bezold (1874)** killed "indigo" as a spectral color — Newton's "blue" ≈ modern cyan, Newton's "indigo" ≈ modern blue.
- **The word "magenta"** wasn't used for the subtractive primary until 1907 (Carl Gustav Zander). Before: "pink" (Benson 1868), "crimson," "purpur."
- **Amy Sawyer (1911)** patented a CMY wheel (primrose/rose/turquoise) decades before it became mainstream.
- **Elizabeth Lewis (1931)** married trichromatic + opponent process on one wheel, anticipating CIE Lab/Luv by decades.

## Tools

See [Recommended color tools](references/techniques/RECOMMENDED-TOOLS.md) for the upstream palette, analysis, naming, conversion, and online-tool catalog. Prefer tools already in the project; verify current APIs and licensing before adding a dependency. Tool examples are options, not prerequisites.

## Deep References

Start at `references/INDEX.md` — a compact map, one line per file, cheap to read whole. When that
line is too terse to choose between two files, the per-directory indexes
(`references/historical/INDEX.md`, `contemporary/INDEX.md`, `techniques/INDEX.md`) carry the full
summaries and source links, and `references/techniques/ONLINE-TOOLS.md` lists the online tools.
The three directories hold:

- **`historical/`** — Ostwald, Helmholtz, Bezold, Ridgway 1912, ISCC-NBS, Munsell, Albers, Caravaggio's pigments, Moses Harris, Lewis/Ladd-Franklin
- **`contemporary/`** — Ottosson's OKLAB articles, Briggs lectures, Fairchild, Hunt, CIECAM02, MacAdam ellipses, Koenderink 2026 empirical 3D metric field (RGB supports ~1,000 qualitative regions; cool side coarser than warm; chromatic circle is not well-tempered), Pointer's gamut, CIE 1931/standard observer, Pixar Color Science, Acerola, Juxtopposed, Computerphile, bird tetrachromacy, OLO, GenColor paper, colour in computer vision / VLM colour deficiencies (ColorBench, CLIP Stroop test, encoder thresholds). Full scrapes: huevaluechroma.com and colorandcontrast.com
- **`techniques/`** — All tools above documented in detail, plus: CSS Color 4/5, ICC workflows, Tyler Hobbs generative color, Harvey Rayner Fontana approach, Goethe edge colors as design hack, mattdesl workshop + K-M simplex, CSS-native generation, IQ cosine presets, Erika Mulvenna interview, Bruce Lindbloom math reference, image extraction tools, Aladdin color analysis
