---
name: seo-technical
description: >-
  Use when the user asks for a technical SEO audit of a site or URL:
  crawlability, robots.txt/AI crawlers, sitemaps, indexability, canonicals,
  security headers, URL structure, mobile, Core Web Vitals (INP), JS rendering,
  IndexNow.
---
> Adapted from agricidaniel/claude-seo v2.4.2 (MIT License, © 2026 agricidaniel), https://github.com/AgricIDaniel/claude-seo. License: /workspace/seo-toolkit/LICENSE

## Grok Bot runtime
- Run all toolkit scripts on the box via the wrapper: `/workspace/seo-toolkit/seo <script> [args]` (= `/workspace/seo-toolkit/.venv/bin/python /workspace/seo-toolkit/scripts/<script>.py`). Use `--help` if unsure of flags.
- Fetch a page: `/workspace/seo-toolkit/seo fetch_page <url> --json --output /tmp/seo/page.html --max-text 2000` (add `--render always` for JS sites), then `/workspace/seo-toolkit/seo parse_html /tmp/seo/page.html --url <url> --json`.
- Sitemap sampling: `/workspace/seo-toolkit/seo sitemap_discovery <url> --json --expand --limit 10 --sample 5`.
- Rule: every ad-hoc `curl` gets `-m 15` (e.g. `curl -sI -m 15 <url>`); never run an unbounded request against http:// or an unknown port.
- Use WebFetch / WebSearch for SERPs, docs and pages the scripts can't reach. Don't crawl heavily: sample ≤20 URLs unless the user asks for more.
- Google APIs (PageSpeed/CrUX/GSC/GA4) and DataForSEO are not configured yet; say so instead of guessing field data.

# Technical SEO Audit

## Categories

### 1. Crawlability
- robots.txt: exists, valid, not blocking important resources
- XML sitemap: run `/workspace/seo-toolkit/seo sitemap_discovery <url> --json`; require a valid entry in `found`, and report stale or unsafe robots.txt declarations separately from working fallback locations
- Noindex tags: intentional vs accidental
- Crawl depth: important pages within 3 clicks of homepage
- JavaScript rendering: check if critical content requires JS execution (method in section 8)
- Crawl budget: for large sites (>10k pages), efficiency matters
- Googlebot **fetch limits**: Googlebot fetches the first **2MB of HTML** and first **64MB of a PDF** (uncompressed; 15MB is the broader crawler-infra default). Inline base64 images, oversized inline CSS/JS, or bloated nav can push critical content/JSON-LD past the cap. Keep key content + structured data within the first 2MB.
- Crawl rate **auto-adjusts**; there is **no manual crawl-rate control** (removed Jan 2024). Influence crawling via sitemaps, server responsiveness, and robots controls.
- Google's crawling/robots reference lives at **developers.google.com/crawling** (since 2025-11-20); IP-range files at `/crawling/ipranges/`, `googlebot.json` renamed `common-crawlers.json`.
- AMP has no separate ranking advantage. Since 2026-07-01, Google Search sends users directly to publisher-hosted AMP URLs, so do not recommend AMP Cache, AMP Viewer, or signed exchange maintenance.

#### AI Crawler Management

**Known AI crawlers** (full table in `seo-geo`):

| Crawler | Company | robots.txt token | Purpose |
|---------|---------|-----------------|---------|
| GPTBot | OpenAI | `GPTBot` | Model training (NOT ChatGPT Search) |
| OAI-SearchBot | OpenAI | `OAI-SearchBot` | ChatGPT Search citability |
| ChatGPT-User | OpenAI | `ChatGPT-User` | Real-time browsing (user-triggered) |
| ClaudeBot | Anthropic | `ClaudeBot` | Model training |
| Claude-SearchBot | Anthropic | `Claude-SearchBot` | Claude search citability |
| PerplexityBot | Perplexity | `PerplexityBot` | Perplexity search index |
| Bytespider | ByteDance | `Bytespider` | Model training |
| Google-Extended | Google | `Google-Extended` | Gemini training/grounding (no effect on Search inclusion or ranking) |
| Applebot-Extended | Apple | `Applebot-Extended` | Apple Intelligence training opt-out (NOT Siri/Spotlight/Safari) |
| CCBot | Common Crawl | `CCBot` | Open dataset |

**Key distinctions:**
- Blocking `Google-Extended` does NOT affect Google Search indexing or AI Overviews (those use `Googlebot`).
- Blocking `GPTBot` does NOT affect ChatGPT Search citability (`OAI-SearchBot`) or user browsing (`ChatGPT-User`).
- Blocking `ClaudeBot` does NOT affect Claude search citability (`Claude-SearchBot`).
- Blocking `Applebot-Extended` does NOT affect Siri/Spotlight/Safari (`Applebot`); it does not itself crawl.

**Example, selective AI crawler blocking:**
```
# Allow search indexing, block AI training crawlers
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: *
Allow: /
```

**Recommendation:** Consider AI visibility strategy before blocking: blocking an AI search crawler removes the site from that engine's answers. Do not promise traffic from allowing one.

> Google's user-triggered fetchers (Google-Agent, Google-GeminiNotebook, Google Messages) **cannot be blocked via robots.txt**; use server-side access controls. `Google-Extended` and `Google-CloudVertexBot` obey robots.txt. Emerging: **Web Bot Auth** (RFC 9421) via `Signature-Agent` header; reverse-DNS verification remains the fallback.

### 2. Indexability
- Canonical tags: self-referencing, no conflicts with noindex
- Duplicate content: near-duplicates, parameter URLs, www vs non-www
- Canonical fixes can take **up to two weeks** to be re-evaluated; an unchanged canonical right after a fix is not proof it failed.
- Thin content: pages below minimum word counts per type
- Pagination: crawlable `<a href>` links to each page (rel=next/prev unused since 2019); self-referencing canonical per page; load-more/infinite scroll need paginated URLs behind them
- Hreflang: correct for multi-language/multi-region sites
- Index bloat: unnecessary pages consuming crawl budget

### 3. Security
- HTTPS: enforced, valid SSL certificate, no mixed content
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Measure with `/workspace/seo-toolkit/seo headers_check <url>`: reports present/missing headers with severity, HSTS max-age/includeSubDomains/preload, whether `http://` 301/308s to `https://`, and redirect chains (all requests 15 s timeout; "http:// unreachable" is itself a finding)
- HSTS preload for high-security sites
- **Back-button hijacking** via `history.pushState`/`replaceState` (incl. third-party ad scripts): spam-policy violation, enforced since 2026-06-15. Treat as Critical.

### 4. URL Structure
- Clean, descriptive, hyphenated URLs; no query parameters for content
- Logical folder hierarchy
- Redirects: no chains (max 1 hop), 301 for permanent moves
- Flag URLs >100 characters
- Consistent trailing slashes

### 5. Mobile Optimization & Page Experience
- Viewport meta tag, responsive CSS, no horizontal scroll
- Touch targets: WCAG 2.2 AA minimum 24x24 CSS px (48x48 comfortable, not a Google rule)
- Readable font size (16px base is convention, not a Google rule)
- Mobile-first indexing: the real risk is **content/parity loss**, not exclusion.
- **Mobile/desktop parity** (highest-value check): same primary content, robots meta, titles/descriptions, structured data, crawlable resources.
- **Intrusive interstitials / ad density**: flag full-page interstitials, consent-redirect pages, persistent blocking dialogs, excessive ads.
- Keep key content **visible on load** (not behind tabs/accordions); preserve hash fragments.

> Page experience is guidance. Only **Core Web Vitals** feeds ranking directly; HTTPS is a lightweight signal. Don't over-weight security headers. The standalone Page Experience report was removed from Search Console.

### 6. Core Web Vitals
- **LCP** <=2.5s
- **INP** <=200ms (replaced FID March 2024; never reference FID)
- **CLS** <=0.1
- 75th percentile of real user data
- PageSpeed/CrUX not configured yet: flag likely issues from HTML only and mark CWV "not measured".

### 7. Structured Data
- Detect JSON-LD (preferred), Microdata, RDFa; validate against Google's supported types. See `seo-schema`.

### 8. JavaScript Rendering
- Method: `/workspace/seo-toolkit/seo agentic_check <url> --json` reports visible words in raw HTML; compare with `/workspace/seo-toolkit/seo render_page <url> --mode always --json` (Chromium is installed).
- Identify CSR vs SSR; flag SPA frameworks that may cause indexing issues.
- Dynamic rendering is technical debt ("a workaround and not a recommended solution", https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering).

| Strategy | Use Case |
|----------|----------|
| **SSR** | Public SEO content, dynamic pages |
| **SSG** | Static content, blogs, docs |
| **CSR** | Authenticated content only |

Preferred frameworks: Next.js, Astro, React Router v7, SvelteKit.

#### JS SEO rules (Google, Dec 2025)
1. Raw-HTML canonical vs JS-injected canonical: Google may use either; keep them identical.
2. Raw-HTML noindex removed by JS may still be honored; serve correct robots in initial HTML.
3. Google does NOT render JS on non-200 pages.
4. JS-injected structured data may be delayed; put Product/Article markup in server HTML.

Best practice: canonical, meta robots, structured data, title and meta description in the initial server-rendered HTML.

### 9. IndexNow
- Check support (Bing, Yandex, Naver; not Google); recommend for faster non-Google indexing.

## Agent readiness
Record two signals only: primary content missing from raw HTML, and a 5xx robots.txt (read as "disallow everything"). Optional heuristic: `/workspace/seo-toolkit/seo agent_ux_check <url> --json` (local 0-100 score; report findings as opportunities, not failures). A dedicated agentic skill is not installed yet.

## Output

### Technical Score: XX/100
Score only what was measured. Each category score is the share of its checks passed, adjusted for severity; unmeasured categories are "not measured", never a number. Show the checks behind every score.

| Category | Status | Score |
|----------|--------|-------|
| Crawlability | pass/warn/fail | XX/100 |
| Indexability | pass/warn/fail | XX/100 |
| Security | pass/warn/fail | XX/100 |
| URL Structure | pass/warn/fail | XX/100 |
| Mobile | pass/warn/fail | XX/100 |
| Core Web Vitals | pass/warn/fail | XX/100 |
| Structured Data | pass/warn/fail | XX/100 |
| JS Rendering | pass/warn/fail | XX/100 |
| IndexNow | pass/warn/fail | XX/100 |

Then: Critical (now), High (1 week), Medium (1 month), Low (backlog).

## Error Handling
| Scenario | Action |
|----------|--------|
| URL unreachable | Report the error with status code; suggest verifying URL/DNS/public access. |
| robots.txt not found | Note it, recommend creating one, continue. |
| HTTPS not configured | Critical: report HTTP without redirect, mixed content, or missing/expired cert. |
| CWV data unavailable | Say field data isn't available; use HTML-based hints only. |
