---
name: fixing-metadata
description: Audit and fix page metadata including titles, meta descriptions, canonical URLs, Open Graph tags, Twitter cards, favicons, JSON-LD, and robots directives. Use when adding SEO metadata, fixing social share previews, or shipping new SvelteKit pages.
---

# Fixing metadata

Audit and fix page metadata. Keep diffs minimal and scoped to metadata only — do not refactor unrelated code.

## Workflow

1. Identify pages with missing or incorrect metadata (titles, descriptions, canonical, OG tags)
2. Audit against the priority rules below — fix critical issues (duplicates, indexing) first
3. Ensure title, description, canonical, and `og:url` all agree with each other
4. Verify social cards render correctly on a real URL, not localhost
5. Keep changes scoped to metadata only

## When to apply

- Adding or changing page titles, descriptions, canonical, robots
- Implementing Open Graph or Twitter card metadata
- Setting favicons, app icons, manifest, theme-color
- Building shared SEO components or layout metadata defaults
- Adding structured data (JSON-LD)
- Changing locale, alternate languages, or canonical routing
- Shipping new pages, marketing pages, or shareable links

## Stack defaults

Unless the project clearly dictates otherwise:

- **SvelteKit** — define per-page metadata in `+page.svelte` via `<svelte:head>`, or in `+layout.svelte` for site-wide defaults
- Prefer one metadata source per page; avoid duplicating tags across layout and page
- Use absolute URLs for Open Graph images and canonical links
- Escape and sanitize dynamic strings from load functions or form data

## Rule categories by priority

| Priority | Category                    | Impact     |
| -------- | --------------------------- | ---------- |
| 1        | Correctness and duplication | Critical   |
| 2        | Title and description       | High       |
| 3        | Canonical and indexing      | High       |
| 4        | Social cards                | High       |
| 5        | Icons and manifest          | Medium     |
| 6        | Structured data             | Medium     |
| 7        | Locale and alternates       | Low-medium |
| 8        | Scope                       | Critical   |

## Quick reference

### 1. Correctness and duplication (critical)

- Define metadata in one place per page; avoid competing systems
- Do not emit duplicate title, description, canonical, or robots tags
- Metadata must be deterministic — no random or unstable values
- Escape and sanitize any user-generated or dynamic strings
- Every page must have safe defaults for title and description

### 2. Title and description (high)

- Every page must have a title
- Use a consistent title format across the site
- Keep titles short and readable; avoid stuffing
- Shareable or searchable pages should have a meta description
- Descriptions must be plain text — no markdown or quote spam

### 3. Canonical and indexing (high)

- Canonical must point to the preferred URL for the page
- Use `noindex` only for private, duplicate, or non-public pages
- Robots meta must match actual access intent
- Previews or staging pages should be `noindex` by default when possible
- Paginated pages must have correct canonical behavior

### 4. Social cards (high)

- Shareable pages must set Open Graph title, description, and image
- Open Graph and Twitter images must use absolute URLs
- Prefer correct image dimensions and stable aspect ratios
- `og:url` must match the canonical URL
- Use a sensible `og:type`, usually `website` or `article`
- Set `twitter:card` appropriately; `summary_large_image` by default

### 5. Icons and manifest (medium)

- Include at least one favicon that works across browsers
- Include `apple-touch-icon` when relevant
- Manifest must be valid and referenced when used
- Set `theme-color` intentionally to avoid mismatched UI chrome
- Icon paths should be stable and cacheable

### 6. Structured data (medium)

- Do not add JSON-LD unless it clearly maps to real page content
- JSON-LD must be valid and reflect what is actually rendered
- Do not invent ratings, reviews, prices, or organization details
- Prefer one structured data block per page unless required

### 7. Locale and alternates (low-medium)

- Set the `html` `lang` attribute correctly
- Set `og:locale` when localization exists
- Add `hreflang` alternates only when pages truly exist
- Localized pages must canonicalize correctly per locale

### 8. Scope (critical)

- Prefer minimal changes; do not refactor unrelated code
- Follow the project's existing metadata pattern
- Do not migrate frameworks or SEO libraries unless explicitly requested

## Common pattern

```svelte
<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={ogImageUrl} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>
```

## Review guidance

- Fix critical issues first (duplicates, canonical, indexing)
- Ensure title, description, canonical, and `og:url` agree
- Verify social cards on a real URL, not localhost
- Prefer stable, boring metadata over clever or dynamic
