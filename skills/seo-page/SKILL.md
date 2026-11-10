---
name: seo-page
description: >-
  Use when the user wants a deep SEO review of ONE specific URL (on-page: title,
  meta, headings, content, links, images, schema, technical basics) with a page
  score card and fixes.
---
> Adapted from agricidaniel/claude-seo v2.4.2 (MIT License, © 2026 agricidaniel), https://github.com/AgricIDaniel/claude-seo. License: /workspace/seo-toolkit/LICENSE

## Grok Bot runtime
- Run all toolkit scripts on the box via the wrapper: `/workspace/seo-toolkit/seo <script> [args]` (= `/workspace/seo-toolkit/.venv/bin/python /workspace/seo-toolkit/scripts/<script>.py`). Use `--help` if unsure of flags.
- Fetch a page: `/workspace/seo-toolkit/seo fetch_page <url> --json --output /tmp/seo/page.html --max-text 2000` (add `--render always` for JS sites), then `/workspace/seo-toolkit/seo parse_html /tmp/seo/page.html --url <url> --json`.
- Use WebFetch / WebSearch for SERPs, docs and pages the scripts can't reach. Don't crawl heavily: sample ≤20 URLs unless the user asks for more.
- Google APIs (PageSpeed/CrUX/GSC/GA4) and DataForSEO are not configured yet; say so instead of guessing field data.

# Single Page Analysis

## What to Analyze

### On-Page SEO
- Title tag: 50-60 characters, includes primary keyword, unique
- Meta description: 150-160 characters, compelling, includes keyword
- Meta description is not a restatement of the title: run `/workspace/seo-toolkit/seo metadata_template --title "<title>" --description "<desc>" --json` (heuristic, deterministic string comparison). A description that opens by repeating its own title and closes on a stock CTA ("Try it free now.", "Start free!") is templated metadata, the shape bulk generation jobs produce site-wide, and duplicated or templated metadata is a documented content-quality problem regardless of how original the body copy is
- H1: exactly one, matches page intent, includes keyword
- H2-H6: logical hierarchy (no skipped levels), descriptive
- URL: short, descriptive, hyphenated, no parameters
- Internal links: sufficient, relevant anchor text, no orphan pages
- External links: to authoritative sources, reasonable count

### Content Quality
- Word count vs page type minimums (see quality-gates.md)
- Readability: Flesch Reading Ease score, grade level
- Keyword density: natural (1-3%), semantic variations present
- E-E-A-T signals: author bio, credentials, first-hand experience markers. Read `meta_author` and `schema_authors` from `parse_html` (a CMS username like "admin"/"sam" as Article author is a finding on YMYL pages)
- Location/service page? Compare with a sibling: `/workspace/seo-toolkit/seo similarity <this-url> <sibling-url> --auto-mask-slug` (>0.85 = scaled/doorway risk)
- Local business? `/workspace/seo-toolkit/seo nap_check <this-url> <contact-url>` for phone/address/name consistency
- Content freshness: publication date, last updated date

### Technical Elements
- Canonical tag: present, self-referencing or correct
- Meta robots: index/follow unless intentionally blocked
- Open Graph: og:title, og:description, og:image, og:url
- Twitter Card: twitter:card, twitter:title, twitter:description
- Hreflang: if multi-language, correct implementation

### Schema Markup
- Detect all types (JSON-LD preferred)
- Validate required properties
- Identify missing opportunities
- Never recommend HowTo (deprecated) or FAQ for rich results (retired May 2026); existing FAQPage need not be removed, use QAPage for genuine Q&A

### Images
Run `/workspace/seo-toolkit/seo images_check <url>`: alt coverage (missing vs empty/decorative), width/height, lazy method per image, byte sizes via HEAD (first 15), and a warning if the first image is lazy-loaded.
- Alt text: present, descriptive, includes keywords where natural
- File size: flag >200KB (warning), >500KB (critical)
- Format: recommend WebP/AVIF over JPEG/PNG
- Dimensions: width/height set for CLS prevention
- Lazy loading: report `lazy_method` per image (native | perfmatters | ewww | js-generic | none). Do not flag "not lazy-loaded" when JS lazy-loaders (Perfmatters, EWWW, lazysizes) are detected, they intentionally strip the native `loading="lazy"` attribute and use `data-src` placeholders

### Core Web Vitals (reference only, not measurable from HTML alone)
- Flag potential LCP issues (huge hero images, render-blocking resources)
- Flag potential INP issues (heavy JS, no async/defer)
- Flag potential CLS issues (missing image dimensions, injected content)

## Output

### Page Score Card
```
Overall Score: XX/100

On-Page SEO:     XX/100  ████████░░
Content Quality: XX/100  ██████████
Technical:       XX/100  ███████░░░
Schema:          XX/100  █████░░░░░
Images:          XX/100  ████████░░
```

### Issues Found
Organized by priority: Critical -> High -> Medium -> Low

### Recommendations
Specific, actionable improvements with expected impact

### Schema Suggestions
Ready-to-use JSON-LD code for detected opportunities

## Error Handling

| Scenario | Action |
|----------|--------|
| URL unreachable (DNS failure, connection refused) | Report the error clearly. Do not guess page content. Suggest the user verify the URL and try again. |
| Page requires authentication (401/403) | Report that the page is behind authentication. Suggest the user provide the rendered HTML directly or a publicly accessible URL. |
| JavaScript-rendered content (empty body in HTML) | Note that key content may be rendered client-side. Analyze the available HTML and flag that results may be incomplete. Suggest using a browser-rendered snapshot if available. |
