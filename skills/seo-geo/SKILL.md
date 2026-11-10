---
name: seo-geo
description: >-
  Use when the user asks about AI search visibility (Google AI Overviews/AI
  Mode, ChatGPT, Perplexity, Gemini), GEO, citability, AI crawlers, llms.txt or
  brand mentions for a URL.
---
> Adapted from agricidaniel/claude-seo v2.4.2 (MIT License, © 2026 agricidaniel), https://github.com/AgricIDaniel/claude-seo. License: /workspace/seo-toolkit/LICENSE

## Grok Bot runtime
- Run all toolkit scripts on the box via the wrapper: `/workspace/seo-toolkit/seo <script> [args]`. Use `--help` if unsure of flags.
- Fetch a page: `/workspace/seo-toolkit/seo fetch_page <url> --json --output /tmp/seo/page.html --max-text 2000` (add `--render always` for JS sites), then `/workspace/seo-toolkit/seo parse_html /tmp/seo/page.html --url <url> --json`.
- Raw-HTML vs rendered check: `/workspace/seo-toolkit/seo agentic_check <url> --json`.
- Use WebFetch / WebSearch for robots.txt, SERPs, brand-mention searches (Wikipedia, Reddit, YouTube, LinkedIn). Don't crawl heavily.
- DataForSEO / SE Ranking are not configured: per-platform AI visibility is NOT measured; say so.

# AI Search / GEO Optimization

## Primary source
Google: "optimizing for generative AI search is optimizing for the search experience, and thus **still SEO**." Full synthesis and myth list (llms.txt, chunking, AI-rephrasing, mention-farming rejected as ineffective): `/workspace/seo-toolkit/skills/seo-geo/references/google-ai-optimization-guide.md`. Frame GEO findings as SEO fundamentals applied to AI surfaces; when community advice contradicts Google, defer to Google and note it.

## Brand mentions vs backlinks (third-party, Ahrefs 75k brands, 2025-12-12)
| Signal | Correlation with AI citations |
|--------|------|
| YouTube mentions | ~0.737 (strongest) |
| Reddit mentions | High |
| Wikipedia presence | High |
| LinkedIn presence | Moderate |
| Domain Rating | ~0.266 (weak) |

Only ~11% of domains are cited by both ChatGPT and AI Overviews for the same query. Label these as third-party studies in reports.

## GEO Analysis Criteria

### 1. Citability (25%)
- Self-contained answer blocks (~130-170 words is a third-party heuristic, not a Google rule); ~44% of AI citations come from the first 30% of a page (SE Ranking), so front-load
- Strong: quotable facts/stats, direct answer in first 40-60 words of a section, attributed claims, "X is..." definitions, unique data
- Weak: vague statements, opinion without evidence, buried conclusions

### 2. Structural readability (20%)
- ~92% of AIO citations come from top-10 pages, yet 47% from below position 5
- Strong: clean H1->H2->H3, question headings, short paragraphs, tables, lists, clear Q&A sections
- Weak: walls of text, inconsistent headings

### 3. Multi-modal (15%)
Images, video, infographics, interactive tools, supporting structured data (third-party claims only).

### 4. Authority & brand (20%)
- Bylines with credentials, published/updated dates
- Recency: content <3 months ~3x more likely cited; 6+ months stale loses eligibility (SE Ranking). A refresh program is high leverage.
- Primary-source citations, expert quotes, Wikipedia/Wikidata entity, Reddit/YouTube/LinkedIn mentions

### 5. Technical accessibility (20%)
- Many AI crawlers (GPTBot, PerplexityBot) don't run JS; Googlebot does. SSR keeps content visible to all.
- AI crawler access in robots.txt
- llms.txt presence: report only, **no weight** (evidence: `/workspace/seo-toolkit/skills/seo-geo/references/llmstxt-evidence.md`)
- RSL 1.0 licensing terms

## AI Crawler Detection
| Crawler | Owner | Purpose | Obeys robots.txt? |
|---------|-------|---------|---|
| GPTBot | OpenAI | Training only | yes |
| OAI-SearchBot | OpenAI | ChatGPT Search citability | yes |
| ChatGPT-User | OpenAI | User-triggered browsing | "may not apply" |
| ClaudeBot | Anthropic | Training only | yes |
| Claude-SearchBot | Anthropic | Claude search citability | yes |
| Claude-User | Anthropic | User-triggered browsing | yes |
| PerplexityBot | Perplexity | Perplexity search | yes |
| Perplexity-User | Perplexity | User-triggered fetch | generally ignores |
| CCBot | Common Crawl | Training data | yes |
| Bytespider | ByteDance | TikTok/Douyin AI | yes |
| cohere-ai | Cohere | Cohere models | yes |
| Google-Extended | Google | Gemini/Vertex training & grounding (NOT Search inclusion/ranking) | yes |
| Google-CloudVertexBot | Google | Owner-requested Vertex crawls | yes |
| Google-Agent | Google | User-triggered agent fetches | no |
| Google-GeminiNotebook | Google | User-added source URLs (replaced Google-NotebookLM) | no |
| Google Messages | Google | User-triggered fetch | no |
| Applebot-Extended | Apple | Apple Intelligence training opt-out only (doesn't crawl) | yes |

Sources: [OpenAI crawlers](https://platform.openai.com/docs/bots), [Google crawlers](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers), [Anthropic crawlers](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Applebot-Extended](https://support.apple.com/en-us/119829).

**Recommendation:** allow OAI-SearchBot, Claude-SearchBot and PerplexityBot for AI search visibility. GPTBot, ClaudeBot, CCBot, Applebot-Extended are training-only: decide on licensing preference. Never claim "blocked from AI search" from a training-bot block alone.

## llms.txt
Google's AI optimization guide (2026-05-15, updated 2026-07-10) says llms.txt is not needed for Google Search and doesn't help or hurt rankings. Never recommend it as a Google lever; it may serve non-Google systems. No major AI provider has confirmed using it.

Format (at `/llms.txt`):
```
# Title of site
> Brief description

## Main sections
- [Page title](url): Description

## Optional: Key facts
- Fact 1
```

## Platform specifics, RSL 1.0, citation surfaces
Full upstream text: `/workspace/seo-toolkit/skills/seo-geo/SKILL.md` (sections "RSL 1.0", "Platform-Specific Optimization", "Citation surfaces").

## Google Update Correlation
For AIO/AI Mode changes: `/workspace/seo-toolkit/seo seo_updates --kind product --kind core --json`. Treat `freshness.stale` as incomplete.

## Output (GEO-ANALYSIS)
1. GEO Readiness Score: XX/100
2. Platform breakdown: score only if measured with a tool; otherwise qualitative and "not measured"
3. AI crawler access: training access and search citability as separate findings, never merged
4. llms.txt status
5. Brand mentions (Wikipedia, Reddit, YouTube, LinkedIn)
6. Passage-level citability
7. SSR / JS dependency check
8. Top 5 highest-impact changes
9. Schema recommendations
10. Specific passages to rewrite (hand rewrites to Don Copywriter)

## Quick Wins
1. "What is [topic]?" definition in first 60 words
2. Self-contained answer blocks
3. Question-based H2/H3s
4. Statistics with sources
5. Publication/update dates
6. Person schema for authors
7. Allow key AI search crawlers

## Error Handling
| Scenario | Action |
|----------|--------|
| URL unreachable | Report clearly; don't guess content. |
| AI crawlers blocked | List blocked vs allowed; give exact robots.txt directives. |
| No llms.txt | Note it's optional (Google ignores it); offer a template for non-Google systems. |
| No structured data | Recommend Article, Organization, Person schema. |
