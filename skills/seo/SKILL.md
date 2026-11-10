---
name: seo
description: >-
  Use when the user asks for SEO work on a website or URL and the specific
  workflow is not obvious (audit, 'how is my SEO', rankings, Google/AI
  visibility), to pick the right seo-* skill, run the box toolkit, and apply the
  shared scoring and recommendation methodology. Also the command reference
  every seo-* skill uses.
---
> Adapted from agricidaniel/claude-seo v2.4.2 (MIT License, © 2026 agricidaniel), https://github.com/AgricIDaniel/claude-seo. License: /workspace/seo-toolkit/LICENSE

# SEO router and methodology

## Runtime (box)
- Toolkit: `/workspace/seo-toolkit` (pinned upstream, see `PINNED_VERSION`; local patches in `GROK_NOTES.md`). Python venv: `/workspace/seo-toolkit/.venv/bin/python`.
- Always call scripts through the wrapper: `/workspace/seo-toolkit/seo <script> [args]`. It sets `SEO_TOOLKIT_ROOT` and `SEO_TOOLKIT_FAKEIP=1` (needed because the box DNS resolves every host to 198.18.x fake-IPs; without it url_safety refuses public sites).
- Health check: `/workspace/seo-toolkit/seo fetch_page https://example.com --json --max-text 100` must return `status_code: 200`. If the venv is broken, report it; don't `pip install` globally.

## Command reference (shared by every seo-* skill; prefer these over ad-hoc code)
- Fetch: `/workspace/seo-toolkit/seo fetch_page <url> --json --output /tmp/seo/<host>.html --max-text 2000` (`--render always` for JS/SPA sites, `--googlebot` for Googlebot UA)
- Parse: `/workspace/seo-toolkit/seo parse_html /tmp/seo/<host>.html --url <url> --json` (title, meta, canonical, h1-h3, images, links, schema, OG, hreflang, word_count, `meta_author`, `schema_authors` for E-E-A-T)
- Sitemaps: `/workspace/seo-toolkit/seo sitemap_discovery <url> --json` (deduped `found`); sample URLs: add `--expand --limit 10 --sample 5` -> `children[]` with `url_count` + `sample`
- Headers/redirects: `/workspace/seo-toolkit/seo headers_check <url>` (HSTS, security headers, http->https, redirect chain; 15 s timeouts). Use in seo-technical.
- NAP: `/workspace/seo-toolkit/seo nap_check <url1> <url2> ...` (phones/addresses/names from visible text, tel: links, meta/og descriptions and schema; form placeholders ignored). Use for local businesses in seo-page/seo-content.
- Duplicate/doorway pages: `/workspace/seo-toolkit/seo similarity <urls...> --mask "City1,City2"` or `--auto-mask-slug` (flags >0.85). Use for location/scaled pages.
- Images: `/workspace/seo-toolkit/seo images_check <url>` (alt coverage, width/height, lazy method, sizes). Empty `alt=""` is decorative, not missing.
- Agent/JS readiness: `/workspace/seo-toolkit/seo agentic_check <url> --json`
- Schema (e-commerce): `echo '<json-ld>' | /workspace/seo-toolkit/seo schema_ecommerce_validate - --json`
- Google update ledger: `/workspace/seo-toolkit/seo seo_updates --since <yyyy-mm> --json`
- Draft cleanup: `/workspace/seo-toolkit/seo content_humanize draft.md -o cleaned.md`
- New scripts (headers_check, nap_check, similarity, images_check) emit JSON only, no `--json` flag.
- Any ad-hoc `curl` must carry `-m 15` (an unreachable http:// port otherwise hangs the shell).
- Use WebFetch/WebSearch for SERPs, competitor pages and Google docs. Keep crawling light (≤20 URLs sampled from the sitemap unless asked).

## Routing
| Request | Skill |
|---|---|
| One URL, on-page review | `seo-page` |
| Crawlability, indexing, robots, CWV, JS rendering, security headers | `seo-technical` |
| E-E-A-T, content quality, thin/AI content, draft cleanup | `seo-content` |
| JSON-LD detect/validate/generate | `seo-schema` |
| AI Overviews, ChatGPT/Perplexity visibility, llms.txt, AI crawlers | `seo-geo` |
| "Audit my site" | see "Audit sampling" below, run all five, then synthesize |

## Audit sampling
1. `sitemap_discovery <url> --json --expand --limit 10 --sample 5`; note `url_count` per child sitemap (e.g. 90+ location pages trips the quality gate).
2. Pick homepage + 3-5 templates (service/practice, location, bio/team, contact, one recent post) plus anything odd in the sample (test/thank-you pages).
3. Run `headers_check` once, `nap_check` on home/contact/one post/one location, `similarity` on 2-4 same-template pages, `images_check` on home + one template.

Not yet available (later phases): Google APIs (PageSpeed/CrUX/GSC/GA4), backlinks, keyword volumes, local/maps, drift monitoring. Say so; don't invent field data.

## Industry detection (homepage signals)
- SaaS: /pricing, /features, /integrations, /docs, "free trial"
- Local service: phone, address, service area, Maps embed
- E-commerce: /products, /cart, "add to cart", Product schema
- Publisher: /blog, article schema, authors, dates
- Agency: /case-studies, /portfolio, client logos

## Quality gates (hard rules)
- Location pages: warn at 30+ (require ≥60% unique content, check with `similarity`), stop at 50+ without user justification.
- Never recommend HowTo schema (deprecated). FAQ rich results are retired for all sites (May 2026): flag existing FAQPage as Info only, don't recommend new FAQPage for SERP benefit.
- Core Web Vitals use INP, never FID. Thresholds: `/workspace/seo-toolkit/skills/seo/references/cwv-thresholds.md`.
- Google update questions: answer from `seo_updates`, not memory; if it reports stale, check status.search.google.com.

## Methodology (every recommendation)
Walk PERCEIVE -> ANALYZE -> VALIDATE -> ACT before bucketing. Each recommendation states:
1. The observation it rests on (evidence: URL, element, script output).
2. Dependencies (what it unblocks or needs first).
3. Falsifiability: "how would we know this failed?"
4. A leading indicator to monitor.
Details: `/workspace/seo-toolkit/skills/seo/references/thinking-framework.md` and `thinking-framework-validate-act.md`.

## SEO Health Score (0-100)
| Category | Weight |
|---|---|
| Technical SEO | 22% |
| Content Quality | 23% |
| On-Page SEO | 20% |
| Schema | 10% |
| Performance (CWV) | 10% |
| AI Search Readiness | 10% |
| Images | 5% |
Mark a category "not measured" (and re-weight) when data is missing, e.g. CWV without PageSpeed.

Priorities: **Critical** blocks indexing or causes penalties (now) · **High** big ranking impact (1 week) · **Medium** opportunity (1 month) · **Low** backlog.

## References (load on demand)
`/workspace/seo-toolkit/skills/seo/references/`: cwv-thresholds, schema-types, eeat-framework, eeat-scoring-guide, quality-gates, local-seo-signals, backlink-quality.

## Output
Reply in the user's language. Lead with score + top 3 issues, then the prioritized plan. Long audits go in a canvas or a file in /workspace. Hand off: content rewrites to Don Copywriter, WordPress changes to Don WordPress Implementer, verification to Don Web QA. Never edit a live site or submit anything without explicit approval.

## Errors
- url_safety refusal on a public site: confirm the wrapper is used (FAKEIP). Private/localhost targets stay refused unless the user names them (`CLAUDE_SEO_LOCAL_TARGETS=host`).
- Fetch 403/blocked: retry `--render always`, then WebFetch; report what couldn't be read.
