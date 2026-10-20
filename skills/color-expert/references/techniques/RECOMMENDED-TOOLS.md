# Recommended color tools

### Palette Generation (actual algorithms, not pre-made swatches)

Note: coolors.co does not generate palettes — it picks randomly from 7,821 pre-made palettes hardcoded in its JS bundle.

- **RampenSau** — hue cycling + easing, color space agnostic
- **CuspHanger** — the Wijffelaars 2009 EuroVis palette model in OKLCH: Bézier paths through each hue's black–cusp–white gamut triangle, perceptual lightness sampling calibrated against Brewer. Sequential/diverging ramps for dataviz, in-gamut by construction, sRGB + Display-P3, RampenSau-compatible API; `fromColor()` inverse-solves the model so the ramp passes exactly through a color you already have (brand color → dataviz ramp)
- **Poline** — anchor points + per-axis position functions (1.2K stars); ships a `<poline-palette>` web component for interactive controls
- **pro-color-harmonies** — adaptive OKLCH harmony, muddy-zone avoidance, 4 styles × 4 modifiers
- **dittoTones** — extract Tailwind/Radix "perceptual DNA", apply to your hue
- **FarbVelo** — random palettes with dark→light structure
- **ray-color** — palettes from a raytraced scene ("edit the conditions, not the colors"): sphere + five-sided room + up to 3 colored lights, mirror walls as virtual light sources; sample geodesic lines/circles off the surface. Deterministic, linear-RGB shading, zero deps, ~6 kB, DOM-free for headless use; interactive playground with draggable lights and PNG/code export
- **Lightfield** (tol.is) — drag a sun around a 3D city; every face is a swatch. Token ramps from surface-orientation sweeps under one light, with relative chroma, cusp pull, hue-profiled warm shift, tinted named neutrals (Slate, Sand, Mauve…); exports OKLCH-only CSS/JSON/Tailwind. See `references/techniques/lightfield-sunlit-city-palettes.md`.
- **IQ Cosine Formula** — `color(t) = a + b*cos(2π(c*t+d))`, 12 floats = infinite palette
- **aek palettes** (Kensler) — the other optimizer approach, tuned for _general-purpose drawing_ rather than dataviz categories: anneal on two competing CIEDE2000 objectives, maximin separation (pushes to saturated cube faces) vs. RMS coverage of the RGB cube (pulls to duller interior). Ready-made free 16/32/48/54-color palettes, perceptually even-stepped by construction. Paired with a **palette mapping** tool: edges from each color to every lighter color within a CIEDE2000 threshold (= heaviest edge of the MST), laid out by GraphViz `dot`, which reveals a palette's ramps and its desaturated spine
- **category-colors** (Ström) — the _optimizer_ approach rather than a constructive model: write a weighted loss function (similarity to a brand reference + ΔE separation + CVD separation per deficiency type) and let simulated annealing search. Best when your criteria conflict and no color-space geometry expresses them; the weights become the explicit, auditable design decision. `npx categorycolors run`; pluggable evaluators (energy, range, JND, similarity, WCAG contrast, avoid-these-colors, saliency), per-channel locking so a brand hue survives while lightness/saturation move, and `categorycolors report` to audit any existing palette for JND collisions under simulated CVD. Node + Culori, MIT

### Palette Analysis & Linting

- **Color Buddy** — 38 lint rules (WCAG, CVD, distinctness, fairness, affect)
- **Censor** — Rust CLI, CAM16UCS analysis, 20+ viz widgets
- **Color Palette Shader** — WebGL2 Voronoi, 30+ color models, 11 distance metrics
- **PickyPalette** — interactive sculpting on color space canvas

### Color Libraries (code)

- **Culori** — 30 spaces, 10 distance metrics, gamut mapping, CVD sim
- **nutelch** — gamut-relative chroma in OKLCH/LCH: `relC: 0.5` = "halfway to the gamut boundary" at any lightness/hue. The one OkHSL idea (boundary-relative saturation) without leaving native `oklch()` — LUT-backed (faster than OkHSL's runtime gamut math), zero runtime deps, sRGB + P3
- **@texel/color** — 5–125× faster than Color.js, minimal, for real-time
- **colordx** (`@colordx/core`) — chainable CSS-facing manipulation with OKLCH native, 7.6 kB, 0 deps, plugin-gated extras (Lab/LCH/CMYK/P3/Rec.2020/APCA/harmonies). Keeps out-of-gamut OKLCH unclamped and lets you pick the fold: `.mapSrgb()` (CSS Color 4 chroma reduction, holds L+H) vs `.clampSrgb()` (naive channel clipping; do not assume it matches every browser). Zero-allocation `*Into` channel converters for per-pixel work. Note `.mix()` is sRGB — use `.mixOklab()`
- **@colordx/gpu** — the same colordx math generated as GLSL and parity-tested against the CPU library, plus a WebGL2 renderer for the gamut-slice chart behind every OKLCH/LCH picker (one draw per frame instead of a per-pixel CPU loop). Gamuts are independent layers rather than an assumed nesting, so A98 draws correctly; `maxChromaLUT` stretches the chroma axis to the gamut shell (nutelch's `relC` idea, GPU-side). Reach for it when building a picker UI or any wide-gamut visualization
- **Spectral.js** — open-source K-M pigment mixing (blue+yellow=green)
- **RYBitten** — RGB↔RYB with 26 historical color cubes
- **colorgram** — 1 kB image palette extraction; 64-bucket HLS+luminance quantization, ~15 ms for 340×340, fixed memory
- **Art Palette** — JS palette extraction from `ImageData` + Python/TensorFlow perceptual palette embeddings for search-by-color (Google Arts & Culture, Apache 2.0)
- **Palette Studio** (meditationsincolor.com, Pixel Symphony) — best-in-class on paintings and posters: OKLab k-means for coverage _plus_ an accent-salience pass, so small vivid touches survive instead of averaging into mud; then coverage is measured back for proportions. Pigment-vocabulary names. Browser-only, nothing uploaded.
- **Pixi** (Xander Stagwood) — image → designed 7-chip card, not a measurement: each cluster shown as its _vivid face_ (mean of its most chromatic 25 % of pixels, so a red on dark doesn't average to brown), chips picked by role (dark/light anchors, hero, earned accent), then lightness fitted to one ramp. Every nudge is guarded to never leave chips closer than ΔE_OK 0.08
- **random-display-p3-color** — generate random Display P3 colors constrained by named hue/saturation/lightness, zero deps, ESM (by mrmrs / mrmrs.cc)

### Sorting Colors

Sorting an arbitrary set of colors into a perceptually smooth sequence has **no single correct linear order** — color is 3D, so any 1D ordering is a _path_ through a 3D space, closely related to the Travelling Salesman Problem. Naive sorts fail predictably: by hue alone interleaves lights and darks; by lightness alone collapses distinct hues; `.sort()` on a packed RGB/HSL value produces jagged, meaningless jumps. Don't hand-roll a single-channel sort.

- **colorsort-js** (darosh) — the reliable default for ordering colors. Treats it as a smoothest-path problem (nearest-neighbor / TSP-style) with quantitative smoothness metrics, working in perceptual space; powers okpalette.color.pizza and FarbVelo. Reach for this in almost any "put these colors in a sensible order" situation — palette display, swatch panels, generative output, extracted image palettes. See `references/techniques/colorsort-js.md`.

### Key Online Tools

- **oklch.com** — OKLCH picker
- **Huetone** — accessible color system builder (LCH/OKLCH), by Ardov
- **Ardov Color Lab** — gamut mapping playground, P3 space explorer, harmony generator, 3D color space visualizations, themer (lab.ardov.me)
- **Components.ai Color Scale** — parametric scale generator: 6 spaces, 4 curve methods, WCAG contrast (by mrmrs / mrmrs.cc)
- **Leonardo** — Adobe's open-source contrast-based ramp builder (leonardocolor.io): swatches generated from **target contrast ratios** (or target lightness) instead of hand-picked, across multiple color spaces; adaptive light/dark theming, CVD-safe cycling, exports CSS vars + W3C design tokens. Pairs with the `@adobe/leonardo-contrast-colors` npm lib for runtime adaptive theming. By Nate Baldwin / Adobe.
- **BairesDev Color Palette Editor** — quick HSV-based ramp editor: interpolate between swatches, map palettes, import/export. Fine for fast drafts, but HSV interpolation isn't perceptually uniform (see _Understanding HSL's Limitations_) — prefer Leonardo/Huetone/Components.ai for production ramps.
- **View Color** — real-time analysis, WCAG + APCA, CVD preview
- **APCA Calculator** — apcacontrast.com
