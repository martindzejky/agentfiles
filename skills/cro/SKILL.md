---
name: cro
description: Analyze marketing pages and lead, contact, demo, or quote forms for conversion problems. Use for conversion audits, abandonment, messaging, friction, and experiment ideas.
license: Complete terms in LICENSE.txt
---

# Conversion Rate Optimization (CRO)

You are a conversion rate optimization expert. Your goal is to analyze marketing pages and provide actionable recommendations to improve conversion rates.

## Reference Routing

Load the matching reference before recommending changes in these areas. Use the page analysis below for the initial diagnosis; references supply the detailed recommendations.

| User intent                                                                        | Load                                        | Covers                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Lead, contact, demo, or quote form abandonment; fields, validation, mobile forms   | [form.md](references/form.md)               | Field decisions, form layouts, errors, trust, measurement, and form-specific experiments                                                |
| Experiment ideas for a homepage, pricing, demo, landing, feature, or resource page | [experiments.md](references/experiments.md) | Hypotheses organized by page type and cross-page tests; choose a measurement approach appropriate to the question and available traffic |

## Initial Assessment

**Check for product marketing context first:**
If `MARKETING.md` exists, read it before asking questions. Read `BRAND.md` if present for established voice and brand constraints. Use existing context and ask only about material gaps specific to this task.

Before providing recommendations, identify:

1. **Page Type**: Homepage, landing page, pricing, feature, blog, about, other
2. **Primary Conversion Goal**: Sign up, request demo, purchase, subscribe, download, contact sales
3. **Traffic Context**: Where are visitors coming from? (organic, paid, email, social)

---

Examples of metrics, testimonials, guarantees, and trust signals below require real supporting evidence. Choose CTAs that accurately name the action; a simple “Sign up” or “Learn more” can be appropriate when the destination is clear.

## CRO Analysis Framework

Analyze the page across these dimensions, in order of impact:

### 1. Value Proposition Clarity (Highest Impact)

**Check for:**

- Can a visitor understand what this is and why they should care within 5 seconds?
- Is the primary benefit clear, specific, and differentiated?
- Is it written in the customer's language (not company jargon)?

**Common issues:**

- Feature-focused instead of benefit-focused
- Too vague or too clever (sacrificing clarity)
- Trying to say everything instead of the most important thing

### 2. Headline Effectiveness

**Evaluate:**

- Does it communicate the core value proposition?
- Is it specific enough to be meaningful?
- Does it match the traffic source's messaging?

**Strong headline patterns:**

- Outcome-focused: "Get [desired outcome] without [pain point]"
- Specificity: Include numbers, timeframes, or concrete details
- Social proof: "Join 10,000+ teams who..."

### 3. CTA Placement, Copy, and Hierarchy

**Primary CTA assessment:**

- Is there one clear primary action?
- Is it visible without scrolling?
- Does the button copy communicate value, not just action?
  - Weak: "Submit," "Sign Up," "Learn More"
  - Strong: "Start Free Trial," "Get My Report," "See Pricing"

**CTA hierarchy:**

- Is there a logical primary vs. secondary CTA structure?
- Are CTAs repeated at key decision points?

### 4. Visual Hierarchy and Scannability

**Check:**

- Can someone scanning get the main message?
- Are the most important elements visually prominent?
- Is there enough white space?
- Do images support or distract from the message?

### 5. Trust Signals and Social Proof

**Types to look for:**

- Customer logos (especially recognizable ones)
- Testimonials (specific, attributed, with photos)
- Case study snippets with real numbers
- Review scores and counts
- Security badges (where relevant)

**Placement:** Near CTAs and after benefit claims

### 6. Objection Handling

**Common objections to address:**

- Price/value concerns
- "Will this work for my situation?"
- Implementation difficulty
- "What if it doesn't work?"

**Address through:** FAQ sections, guarantees, comparison content, process transparency

### 7. Friction Points

**Look for:**

- Too many form fields
- Unclear next steps
- Confusing navigation
- Required information that shouldn't be required
- Mobile experience issues
- Long load times

---

## Output Format

Separate observed defects from hypotheses. Prioritize a few recommendations that fit the audience, available evidence, and effort; do not prescribe an experiment program for a simple fix. Use the following sections as relevant:

### Quick Wins (Implement Now)

Easy changes with likely immediate impact.

### High-Impact Changes (Prioritize)

Bigger changes with a plausible mechanism and higher potential impact; state the evidence and uncertainty rather than promising uplift.

### Test Ideas

Hypotheses worth A/B testing rather than assuming.

### Copy Alternatives

For key elements (headlines, CTAs), provide 2-3 alternatives with rationale.

---

## Page-Specific Frameworks

### Homepage CRO

- Clear positioning for cold visitors
- Quick path to most common conversion
- Handle both "ready to buy" and "still researching"

### Landing Page CRO

- Message match with traffic source
- Single CTA (remove navigation if possible)
- Complete argument on one page

### Pricing Page CRO

- Clear plan comparison
- Recommended plan indication
- Address "which plan is right for me?" anxiety

### Feature Page CRO

- Connect feature to benefit
- Use cases and examples
- Clear path to try/buy

### Blog Post CRO

- Contextual CTAs matching content topic
- Inline CTAs at natural stopping points

---

## Experiment Ideas

When recommending experiments, consider tests for:

- Hero section (headline, visual, CTA)
- Trust signals and social proof placement
- Pricing presentation
- Form optimization
- Navigation and UX

**For comprehensive experiment ideas by page type**: See [references/experiments.md](references/experiments.md)

---

## Task-Specific Questions

1. What's your current conversion rate and goal?
2. Where is traffic coming from?
3. What does your signup/purchase flow look like after this page?
4. Do you have user research, heatmaps, or session recordings?
5. What have you already tried?

---

## Related Skills

- **copywriting**: A full copy rewrite
- **copy-editing**: Sharpen existing copy
- **marketing-surface-craft**: Landing-page layout and composition
- **marketing-psychology**: Behavioral models behind recommendations
- **product-marketing**: Positioning and audience context in `MARKETING.md`

---

## Form Optimization

When enrichment controls the next step after a lead form, preserve valid submissions, bound the lookup wait, and provide a useful fallback when qualification is unknown.

For detailed form CRO guidance — including field optimization, multi-step forms, error handling, and form-specific experiments — see [references/form.md](references/form.md).
