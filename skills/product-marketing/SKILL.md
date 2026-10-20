---
name: product-marketing
description: Create or update MARKETING.md with product positioning, audience, customer language, proof, and marketing goals. Use for foundational marketing context or ICP work; respect BRAND.md for established brand voice.
license: Complete terms in LICENSE.txt
---

# Product Marketing Context

You help users create and maintain a product marketing context document. This captures foundational positioning and messaging information that other marketing skills reference, so users don't repeat themselves.

The document is stored at `MARKETING.md`. Read `BRAND.md` when present; it owns established brand identity and voice. Reference its decisions rather than creating a competing voice guide. Keep context concise and include only sections useful to this product. Do not require a context document before a well-scoped copy task.

## Workflow

### Step 1: Check for Existing Context

First, check if `MARKETING.md` already exists and read relevant product and brand documents.

**If it exists:**

- Read what is already captured
- Update only the requested or demonstrably outdated sections
- Ask about material gaps rather than repeating the context interview
- Preserve existing format and document ownership; do not introduce version counters, changelogs, or learning ledgers by default

**If it doesn't exist, offer two options:**

1. **Auto-draft from codebase** (recommended): You'll study the repo—README, landing pages, marketing copy, package.json, etc.—and draft a V1 of the context document. The user then reviews, corrects, and fills gaps. This is faster than starting from scratch.

2. **Start from scratch**: Walk through each section conversationally, gathering info one section at a time.

Most users prefer option 1. After presenting the draft, ask: "What needs correcting? What's missing?"

### Step 2: Gather Information

**If auto-drafting:**

1. Read the codebase: README, landing pages, marketing copy, about pages, meta descriptions, package.json, any existing docs
2. Draft applicable sections from what you find; distinguish supported facts, proposed positioning, and unknowns
3. Present the draft and ask what needs correcting or is missing
4. Iterate until the user is satisfied

**If starting from scratch:**
Walk through each section below conversationally, one at a time. Don't dump all questions at once.

For each section:

1. Briefly explain what you're capturing
2. Ask relevant questions
3. Confirm accuracy
4. Move to the next

Push for verbatim customer language — exact phrases are more valuable than polished descriptions because they reflect how customers actually think and speak, which makes copy more resonant.

---

## Sections to Capture

### 1. Product Overview

- One-line description
- What it does (2-3 sentences)
- Product category (what "shelf" you sit on—how customers search for you)
- Product type (SaaS, marketplace, e-commerce, service, etc.)
- Business model and pricing

### 2. Target Audience

- Target company type (industry, size, stage)
- Target decision-makers (roles, departments)
- Primary use case (the main problem you solve)
- Jobs to be done (2-3 things customers "hire" you for)
- Specific use cases or scenarios

### 3. Personas (B2B only)

If multiple stakeholders are involved in buying, capture for each:

- User, Champion, Decision Maker, Financial Buyer, Technical Influencer
- What each cares about, their challenge, and the value you promise them

### 4. Problems & Pain Points

- Core challenge customers face before finding you
- Why current solutions fall short
- What it costs them (time, money, opportunities)
- Emotional tension (stress, fear, doubt)

### 5. Competitive Landscape

- **Direct competitors**: Same solution, same problem (e.g., Calendly vs SavvyCal)
- **Secondary competitors**: Different solution, same problem (e.g., Calendly vs Superhuman scheduling)
- **Indirect competitors**: Conflicting approach (e.g., Calendly vs personal assistant)
- How each falls short for customers

### 6. Differentiation

- Key differentiators (capabilities alternatives lack)
- How you solve it differently
- Why that's better (benefits)
- Why customers choose you over alternatives

### 7. Objections & Anti-Personas

- Top 3 objections heard in sales and how to address them
- Who is NOT a good fit (anti-persona)

### 8. Switching Dynamics

The JTBD Four Forces:

- **Push**: What frustrations drive them away from current solution
- **Pull**: What attracts them to you
- **Habit**: What keeps them stuck with current approach
- **Anxiety**: What worries them about switching

### 9. Customer Language

- How customers describe the problem (verbatim)
- How they describe your solution (verbatim)
- Words/phrases to use
- Words/phrases to avoid
- Glossary of product-specific terms

### 10. Brand Voice

- 3-5 voice attributes, each with what it means, what it doesn't mean, and a real line from existing copy
- Tone by context: how the voice shifts for support, launches, errors, sales, and social
- Brand words: terms you own, words you never use (with the reason)

If `BRAND.md` already defines voice, reference it here. Otherwise build a provisional profile from the founder's own writing, approved copy, and relevant performance evidence rather than adjectives alone. See [references/brand-voice.md](references/brand-voice.md) for the extraction steps, a worked profile, before/after examples, and per-person voice guides.

### 11. Proof Points

- Key metrics or results to cite
- Notable customers/logos
- Testimonial snippets
- Main value themes and supporting evidence

### 12. Goals

- Primary business goal
- Key conversion action (what you want people to do)
- Current metrics (if known)

### 13. Paid Ads (optional, only if they run ads)

Capture only when paid advertising is relevant to the project.

- Margin reality: the target CPA or ROAS that keeps the business profitable, and the hard floor (the ROAS below which, or CPA above which, to flag immediately)
- Budget and pacing: monthly budget and acceptable daily variance
- Conversion truth: which conversion actions count and what each is worth, known tracking weaknesses (lag, double counting, offline gaps), and what separates a good lead from a form fill
- Campaign naming convention and what each campaign is for, one line each
- What the agent may do (read, compare, flag, draft, recommend) and may not do without approval (change budgets or bids, pause or launch, edit tracking, publish ads)

## Step 3: Create the Document

After gathering information, create or update `MARKETING.md`. Use the following as a worksheet, omit irrelevant or empty sections, and defer to existing sources of truth rather than duplicating them:

```markdown
# Product Marketing Context

## Product Overview

**One-liner:**

**What it does:**

**Product category:**

**Product type:**

**Business model:**

## Target Audience

**Target companies:**

**Decision-makers:**

**Primary use case:**

**Jobs to be done:**

**Use cases:**

## Personas

| Persona | Cares about | Challenge | Value we promise |
| ------- | ----------- | --------- | ---------------- |
|         |             |           |                  |

## Problems & Pain Points

**Core problem:**

**Why alternatives fall short:**

**What it costs them:**

**Emotional tension:**

## Competitive Landscape

**Direct:** [Competitor] — falls short because...

**Secondary:** [Approach] — falls short because...

**Indirect:** [Alternative] — falls short because...

## Differentiation

**Key differentiators:**

**How we do it differently:**

**Why that's better:**

**Why customers choose us:**

## Objections

| Objection | Response |
| --------- | -------- |
|           |          |

**Anti-persona:**

## Switching Dynamics

**Push:**

**Pull:**

**Habit:**

**Anxiety:**

## Customer Language

**How they describe the problem:**

- "[verbatim]"

**How they describe us:**

- "[verbatim]"

**Words to use:**

**Words to avoid:**

**Glossary:**

| Term | Meaning |
| ---- | ------- |
|      |         |

## Brand Voice

Reference `BRAND.md` when it already owns voice; otherwise capture the provisional profile below.

| Attribute | Means | Doesn't mean | Example line |
| --------- | ----- | ------------ | ------------ |
|           |       |              |              |

**Tone by context:**

- Support:
- Launch:
- Errors:
- Sales:
- Social:

**Terms we own:**

**Never use (and why):**

## Proof Points

**Metrics:**

**Customers:**

**Testimonials:**

> "[quote]" — [who]

**Value themes:**

| Theme | Proof |
| ----- | ----- |
|       |       |

## Goals

**Business goal:**

**Conversion action:**

**Current metrics:**

## Paid Ads (optional)

**Target CPA / ROAS:**

**Hard floor:**

**Monthly budget and daily variance:**

**Conversions that count:**

| Action | Means | Value | Feeds bidding? |
| ------ | ----- | ----- | -------------- |
|        |       |       |                |

**Known tracking weaknesses:**

**Good lead vs. form fill:**

**Campaigns:** [name] — [what it's for]

**Agent may:** read, compare, flag, draft, recommend

**Agent may not (without approval):** change budgets or bids, pause or launch, edit tracking, publish ads
```

---

## Step 4: Confirm and save

- Show the completed context or focused edits and ask about unresolved decisions
- Save to `MARKETING.md` when creating or updating it is the task
- Preserve existing references to `BRAND.md` and other project documents
- Read relevant campaign lessons when the project already records them; do not invent results or create a parallel memory workflow
- Update context when product facts or approved positioning change; do not require a version bump and changelog for every edit

---

## Tips

- **Be specific**: Ask "What's the #1 frustration that brings them to you?" not "What problem do they solve?"
- **Capture exact words**: Customer language beats polished descriptions
- **Ask for examples**: "Can you give me an example?" unlocks better answers
- **Validate as you go**: Summarize each section and confirm before moving on
- **Skip what doesn't apply**: Not every product needs all sections (e.g., Personas for B2C, Paid Ads if they don't run ads)
