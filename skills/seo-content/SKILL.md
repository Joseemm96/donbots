---
name: seo-content
description: >-
  Use when the user asks to assess content quality, E-E-A-T, thin/AI-sounding
  content, readability, freshness or AI-citation readiness of a page or draft,
  or to clean AI phrasing from a draft.
---
> Adapted from agricidaniel/claude-seo v2.4.2 (MIT License, © 2026 agricidaniel), https://github.com/AgricIDaniel/claude-seo. License: /workspace/seo-toolkit/LICENSE

## Grok Bot runtime
- Run all toolkit scripts on the box via the wrapper: `/workspace/seo-toolkit/seo <script> [args]` (= `/workspace/seo-toolkit/.venv/bin/python /workspace/seo-toolkit/scripts/<script>.py`). Use `--help` if unsure of flags.
- Fetch a page: `/workspace/seo-toolkit/seo fetch_page <url> --json --output /tmp/seo/page.html --max-text 2000` (add `--render always` for JS sites), then `/workspace/seo-toolkit/seo parse_html /tmp/seo/page.html --url <url> --json`.
- Use WebFetch / WebSearch for SERPs, docs and pages the scripts can't reach. Don't crawl heavily: sample ≤20 URLs unless the user asks for more.
- Google APIs (PageSpeed/CrUX/GSC/GA4) and DataForSEO are not configured yet; say so instead of guessing field data.

# Content Quality & E-E-A-T Analysis

## Google's "Who / How / Why" Test
| Question | What to look for |
|---|---|
| **Who** created it? | Visible byline, author bio page, credentials. Non-negotiable for YMYL. |
| **How** was it created? | Process disclosure where readers would ask, especially AI-assisted content. Original research / first-hand evidence. |
| **Why** does it exist? | "To help people", not to attract clicks. Watch for niche entry without expertise, freshness churn, word-count writing. |

Source: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
When all three are weak, the page is at risk under core helpfulness signals (Helpful Content System merged into core, March 2024).

## E-E-A-T Framework (Sept 2025 QRG)
Full criteria: `/workspace/seo-toolkit/skills/seo/references/eeat-framework.md`; score bands: `/workspace/seo-toolkit/skills/seo/references/eeat-scoring-guide.md`.

- **Experience:** original research, case studies, before/after results, process documentation, unique data, first-hand photos/videos
- **Expertise:** author credentials and bio, relevant background, appropriate depth, accurate sourced claims
- **Authoritativeness:** external citations, authoritative backlinks, brand mentions, recognized outlets
- **Trustworthiness:** contact info and address, privacy/terms, reviews, date stamps and corrections, HTTPS

## Content Metrics

### Word count floors (topical coverage, NOT targets; word count is not a ranking factor)
| Page Type | Minimum |
|-----------|---------|
| Homepage | 500 |
| Service page | 800 |
| Blog post | 1,500 |
| Product page | 300+ (400+ complex) |
| Location page | 500-600 |

### Readability (quality indicator, not a ranking factor)
- Flesch Reading Ease 60-70 for general audience; grade level matches audience
- Sentences 15-20 words average; paragraphs 2-4 sentences

### Keywords
- Primary keyword in title, H1, first 100 words; natural density 1-3%; semantic variations; no stuffing

### Structure and media
- Logical H1 -> H2 -> H3, scannable sections, lists, TOC for long-form
- Relevant images with alt text, video/infographics/charts where useful

### Linking
- 3-5 relevant internal links per 1000 words, descriptive anchors, no orphans
- Cite authoritative external sources, reasonable count

## AI Content Assessment (QRG Jan 2025, current Sept 11 2025)
Raters assess low-quality, scaled, copied content patterns, not AI authorship itself.
- Acceptable: genuine E-E-A-T, unique value, human oversight, original insights
- Low-quality markers: generic phrasing, no original insight, repetitive structure across pages, no attribution, factual errors

## Scaled / location pages
- Measure, don't eyeball: `/workspace/seo-toolkit/seo similarity <url1> <url2> [<url3>...] --mask "Austin,Thrall"` (or `--auto-mask-slug`); pairs >0.85 are near-duplicates. Combine with the router's location-page quality gate (warn 30+, stop 50+; count via `sitemap_discovery --expand`).

## Authorship & NAP (YMYL / local)
- Author: `parse_html` → `meta_author` + `schema_authors` (Article/BlogPosting author resolved against Person `@id`). Flag CMS usernames or missing author on YMYL content; recommend the credentialed expert as author or reviewer.
- NAP: `/workspace/seo-toolkit/seo nap_check <home> <contact> <post> <location>`; reports canonical phone (from schema), phones in visible text vs meta/og/schema descriptions, schema name/address variants. Form placeholders like (999) 999-9999 are ignored. Multiple numbers can be legitimate: confirm before calling it an error.

> Helpfulness is weighted within every core update; Google also runs continuous smaller unannounced core updates (changelog 2025-12-09).

> **Gen-AI optimization is SEO** (Google docs, 2026-05-15, updated 2026-07-10): no new AI files, markup, Markdown, chunking or AI-specific rewrites needed; chasing inauthentic "mentions" is unhelpful.

> **Honest scoping** (Google docs, 2026-06-05): no tool guarantees rankings or sees Google's internal data. These scores are heuristics; say so in reports, and treat Search Console as the first-party source.

## Draft Cleanup: AI Phrasing & Invisible Watermarks
For "humanize this", "remove watermarks", or "clean up this draft" on the user's own content:

```bash
/workspace/seo-toolkit/seo content_humanize draft.md -o cleaned.md
cat draft.md | /workspace/seo-toolkit/seo content_humanize --json
```

1. **Invisible characters** (`invisible_removed`): strips zero-width codepoints, directional marks, Unicode tag characters, exotic spaces; preserves emoji sequences.
2. **AI-typical phrasing** (`changes`): conservative 1:1 swaps ("delve into" -> "explore"). Nothing paraphrased or added.

Statistical watermarks (SynthID-style) live in word choice; no tool reliably detects or removes them, so never claim otherwise. Only for the user's own drafts; decline stripping provenance from content they don't own.

## AI Citation Readiness (GEO signals)
- Clear, quotable statements with facts/statistics
- Answer-first formatting, strong heading hierarchy, tables/lists for comparisons
- Clear attribution and source citations
- First-party data and topical clusters
- Entity clarity via Organization/Person schema
- FAQPage no longer yields Google rich results; QAPage only for genuine user Q&A
- Track AI Overviews, AI Mode, ChatGPT, Perplexity, Copilot citations as a KPI alongside rankings
- Never tie advice to a specific AI Mode model version; treat third-party AI Mode stats as methodology-dependent

GEO is SEO fundamentals applied to AI surfaces. For detailed workflows use `seo-geo`; primary-source synthesis: `/workspace/seo-toolkit/skills/seo-geo/references/google-ai-optimization-guide.md`.

## Freshness
- Visible publication and last-updated dates
- Flag content >12 months old without update on fast-changing topics

## Google Update Correlation
Before attributing a traffic/ranking change, list confirmed updates in that window:
```bash
/workspace/seo-toolkit/seo seo_updates --since <yyyy-mm> --json
```
Every entry cites a Google URL. If `freshness.stale` is true, check status.search.google.com. A date overlap is a hypothesis, never proof.

## Output

### Content Quality Score: XX/100

### E-E-A-T Breakdown
| Factor | Score | Key Signals |
|--------|-------|-------------|
| Experience | XX/20 | ... |
| Expertise | XX/25 | ... |
| Authoritativeness | XX/25 | ... |
| Trustworthiness | XX/30 | ... |

> Weights are this skill's own model, ordered by Google's statement that trust is most important. Google publishes no numeric weights; don't use an equal split.

### AI Citation Readiness: XX/100
### Issues Found
### Recommendations

## Error Handling
| Scenario | Action |
|----------|--------|
| URL unreachable | Report clearly; don't guess content; suggest verifying the URL. |
| Paywall/login wall (402/403) | Analyze only visible parts (meta, headers) and note the limitation. |
| Thin content (<100 words retrievable) | Report as-is; flag possible JS rendering or gating; ask for the full text. |
