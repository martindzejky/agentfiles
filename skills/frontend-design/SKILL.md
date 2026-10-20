---
name: frontend-design
description: Create or reshape frontend interfaces with a deliberate visual identity. Use for aesthetic direction, typography, layout, imagery, motion, and visual refinement of websites or product UI.
license: Complete terms in LICENSE.txt
---

# Frontend design

Make deliberate choices specific to the product, audience, and task. Distinctiveness comes from understanding the subject and executing well, not adding a fashionable treatment to every brief. Existing brand guidance and design systems take precedence over generic advice here.

## Ground the direction in the subject

Read the brief, real content, existing interface, and available assets before styling. Use `BRAND.md` and `DESIGN.md` when present. Find what belongs to this subject: its materials, visual vocabulary, audience expectations, and the action someone came to take.

Distinguish a marketing page people read from a product interface people work in. A landing page may benefit from a characteristic opening image, headline, or demonstration; a working tool should make navigation, information, and actions immediately useful. Do not turn every app screen into a landing page.

For a new direction, briefly state the palette roles, type roles, layout idea, and what gives it character. Reuse existing tokens rather than inventing a parallel theme. A short wireframe can resolve composition before implementation. Ask about missing decisions that materially affect the result; use judgment when the user delegates.

## Typography

Choose type for the subject, reading conditions, language coverage, and available font assets. One family can carry an entire interface; use a second when it adds a clear role. A generic font is not automatically wrong, and an unusual font does not make a design distinctive.

Build hierarchy through scale, weight, width, line height, spacing, and alignment. Treat display typography as part of the composition. Keep body measure comfortable, generally under 80 characters, and check actual wrapping at narrow widths and with real content.

Avoid reflexive headline word accents, random font changes for one word, and tracked uppercase labels above every heading. Use emphasis when it communicates meaning.

## Composition and color

Visual structure carries information. Group related content; use borders, containers, dividers, and labels when they clarify relationships. Number content when order matters. Do not manufacture a sequence or card grid to decorate unrelated facts.

Let the content determine the layout. Repeated items often deserve a consistent pattern; different kinds of information may need different treatments. Neither forced variation nor identical cards everywhere creates hierarchy.

Use a coherent palette with explicit surface, text, action, and status roles. Check actual foreground/background pairs and interaction states. Pure white, pure black, quiet neutrals, and saturated colors are all valid when they fit the direction. Texture, gradients, shadows, and ornament must earn their place.

Spend boldness where it helps the brief. A strong opening or signature element usually benefits from quieter surroundings. Precision in spacing, alignment, and proportion matters as much as novelty.

## Imagery and motion

Inventory available photography, illustrations, screenshots, and logos. Use real, relevant assets when they communicate better than text; an intentionally typographic design need not include images. Check crop, resolution, aspect ratio, rights, and loading behavior. Use honest placeholders when an asset or claim is unavailable.

Use motion to explain an action, state change, or relationship. Non-user-triggered motion should have a clear purpose. Repeated fade-and-slide section entrances, every-card hover effects, custom cursors, and perpetual decorative loops are common defaults, not an automatic quality improvement. Respect reduced motion and preserve access to content without animation.

## Words are interface content

Write from the user's perspective, using the product's established vocabulary. Actions should say what happens: “Save changes” instead of “Submit.” Keep the same action name throughout the flow.

Explain failures and how to recover. Empty states should make the next useful action clear. Prefer specific content, plain verbs, and sentence case; match the brand's voice. Do not invent testimonials, usage figures, or product capabilities. Avoid visible commentary about how the design was made.

## Build and inspect

Follow the project's stack and component conventions. Match implementation complexity to the job; do not add a framework or animation dependency just to express a visual idea.

Inspect the rendered result, including mobile and desktop when relevant. Check hierarchy, typography, cropping, spacing, contrast, and content specificity. Exercise controls and navigation; inspect loading, empty, error, focus, and disabled states that the work touches. A screenshot can reveal composition problems but cannot prove interaction works.

Before delivery, remove decoration and copy that do not serve the brief. Familiar AI defaults now include cream/serif/terracotta, black/acid-green, faux-broadsheet hairlines, and rounded SaaS card kits as well as purple gradients. These are contextual warning signs, not forbidden styles. The question is whether the choices belong to this product.
