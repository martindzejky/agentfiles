---
name: design-process
description: Run a design engagement from brief and direction through an early artifact, iteration, and rendered review. Use for landing pages, decks, prototypes, dashboards, and app screens when the design process needs coordination.
---

# Design process

Choose the discipline before the implementation: slide design for a deck, interaction design for an app, brand design for a marketing page. HTML may be a delivery tool; it does not make every artifact a web page.

## 1. Establish the brief

Read the request, existing work, references, and project documents. `BRAND.md` owns brand voice and character; `DESIGN.md` owns the agreed visual system. Reuse decisions already settled there.

Resolve the artifact, audience, primary job, platform, scope, real content, and hard constraints. Ask focused questions only about material gaps. Do not repeat discovery when the brief is sufficient or the user has delegated judgment. When asking, make recommendations easy to accept or redirect.

For an existing design, establish whether the request is a targeted change, a visual refresh preserving recognition, or an approved new direction. Do not expand a visual task into product strategy, new features, or a brand-document interview.

## 2. Choose a direction

For exploration, offer a small number of meaningfully different directions with their trade-offs. When the user wants execution, choose the best-supported direction and state it briefly.

Ground palette, typography, density, imagery, and composition in this subject and its audience. Extract real values from provided assets or implementation; do not guess brand colors from memory. Bind the design to existing tokens, or establish a compact set appropriate to the task. Neither OKLCH nor a fixed number of tokens is a prerequisite.

Name material assumptions. Do not prescribe a light serif “editorial” theme or dark geometric “brutalist” theme from a mood word alone. Likewise, a design does not require paired fonts, an accent quota, or a decorative flourish.

## 3. Plan and show an early artifact

For substantial work, outline a short plan and keep it current. Resolve the main composition or interaction before polishing every detail. Show an early, reviewable slice when it helps the user steer; label wireframes and placeholders honestly.

Use the requested format and existing project stack. Standalone HTML is useful for an openable prototype when no application context exists. In an application, implement in its components and routes. A reference link does not by itself change the requested output medium.

Edit the current artifact in place unless alternatives or versioned deliverables are requested. Use existing project history rather than proliferating `v2`, `v3` files.

## 4. Design for the artifact

- **Marketing / portfolio:** clear promise, credible evidence, and an obvious next action. Let content determine sections and visual rhythm.
- **Deck:** one main idea per slide, readable type at the actual viewing distance, deliberate pacing, and the requested aspect ratio. Use the available slide tooling or existing presentation framework.
- **App / dashboard:** useful navigation, appropriate information density, consistent interaction patterns, real data relationships, and complete states. Decoration must not obscure the work.
- **Responsive interface:** adapt hierarchy, navigation, and controls to available space. Choose breakpoints when content requires them; check narrow layouts and long content rather than shrinking a desktop composition.

## 5. Inspect and refine

Review the rendered artifact against the brief:

- Does its visual character fit this subject and the existing brand?
- Is the primary information or action clear?
- Are type, spacing, alignment, contrast, and imagery resolved?
- Are content and claims specific and honest?
- Does ornament or motion serve a purpose?

Fix visible problems and exercise the interactions touched by the task. Check relevant widths, keyboard use, and reduced motion. Report any verification limits plainly.

Use specialist skills only when their subject is needed: palette construction, brand documentation, marketing composition, or a targeted audit. Do not load the entire design catalog for every task.
