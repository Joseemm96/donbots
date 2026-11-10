---
name: seo-schema
description: >-
  Use when the user asks to detect, validate, fix or generate Schema.org /
  JSON-LD structured data for a page or site, or asks which schema types are
  still supported by Google.
---
> Adapted from agricidaniel/claude-seo v2.4.2 (MIT License, © 2026 agricidaniel), https://github.com/AgricIDaniel/claude-seo. License: /workspace/seo-toolkit/LICENSE

## Grok Bot runtime
- Run all toolkit scripts on the box via the wrapper: `/workspace/seo-toolkit/seo <script> [args]`. Use `--help` if unsure of flags.
- Fetch a page: `/workspace/seo-toolkit/seo fetch_page <url> --json --output /tmp/seo/page.html --max-text 2000` (add `--render always` for JS sites), then `/workspace/seo-toolkit/seo parse_html /tmp/seo/page.html --url <url> --json`.
- Validate e-commerce JSON-LD: `echo '<json-ld>' | /workspace/seo-toolkit/seo schema_ecommerce_validate - --json`.
- Use WebFetch / WebSearch for docs and pages the scripts can't reach.

# Schema Markup Analysis & Generation

## Detection
1. Extract JSON-LD with `parse_html` (or scan `<script type="application/ld+json">`). Flag any block without `@context` or `@type`: Google cannot attach it to an entity.
2. Check Microdata (`itemscope`, `itemprop`) and RDFa (`typeof`, `property`).
3. Always recommend JSON-LD as primary format.

## Validation
- Required properties per type; Google's supported rich result types
- Common errors: missing @context, invalid @type, wrong data types, placeholder text, relative URLs, invalid dates
- Flag deprecated types

## Schema Type Status (as of June 2026)
Full list: `/workspace/seo-toolkit/skills/seo/references/schema-types.md`. Templates: `/workspace/seo-toolkit/schema/templates.json`.

**ACTIVE:** Organization, LocalBusiness, SoftwareApplication, WebApplication, Product (with Certification, Apr 2025), ProductGroup, Offer, Service, Article, BlogPosting, NewsArticle, Review, AggregateRating, BreadcrumbList, WebSite, WebPage, Person, ProfilePage, ContactPage, VideoObject, ImageObject, Event, JobPosting, Course, DiscussionForumPosting. Video/specialized: BroadcastEvent, Clip, SeekToAction, SoftwareSourceCode.

> JS-generated Product markup can make Shopping crawls less reliable (Google guide, 2025-12-10). Put Product/Offer JSON-LD in initial server HTML.

**NO RICH RESULTS, KEEP IF USEFUL:** FAQPage (FAQ rich results retired for all sites May 7, 2026). Flag at Info, don't push removal. Use QAPage for genuine user Q&A.

**DEPRECATED (never recommend):** HowTo (Sept 2023), SpecialAnnouncement (July 2025), CourseInfo/EstimatedSalary/LearningVideo (June 2025), ClaimReview for SERP (June 2025; Fact Check Explorer still uses it), VehicleListing (June 2025), Practice Problem (docs removed 2026-01-06).

**Still supported:** Book Actions (phase-out banner removed 2025-11-05); Dataset (Dataset Search only, don't advise removal); QAPage (comment-thread properties 2026-03-24), DiscussionForumPosting, Education Q&A. E-commerce: `hasAdultConsideration` (2026-05-20, `https://schema.org/SexualContentConsideration`) required for adult products; `Product.category` accepts Text, CategoryCode, or mixed arrays.

## Generation
1. Identify page type from content
2. Select schema type(s)
3. Generate valid JSON-LD with required + recommended properties
4. Only truthful, verifiable data; clearly marked placeholders for the user
5. Validate before presenting
6. Reject fake or undisclosed incentivized reviews

## Templates

### Organization
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Company Name]",
  "url": "[Website URL]",
  "logo": "[Logo URL]",
  "contactPoint": {"@type": "ContactPoint", "telephone": "[Phone]", "contactType": "customer service"},
  "sameAs": ["[Facebook URL]", "[LinkedIn URL]", "[X URL]"]
}
```

### LocalBusiness
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[Business Name]",
  "address": {"@type": "PostalAddress", "streetAddress": "[Street]", "addressLocality": "[City]", "addressRegion": "[State]", "postalCode": "[ZIP]", "addressCountry": "[Country code]"},
  "telephone": "[Phone]",
  "openingHours": "Mo-Fr 09:00-17:00",
  "geo": {"@type": "GeoCoordinates", "latitude": "[Lat]", "longitude": "[Long]"}
}
```

### Article/BlogPosting
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Title]",
  "author": {"@type": "Person", "name": "[Author Name]"},
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "image": "[Image URL]",
  "publisher": {"@type": "Organization", "name": "[Publisher]", "logo": {"@type": "ImageObject", "url": "[Logo URL]"}}
}
```

## Output
- `SCHEMA-REPORT.md` (detection + validation) and `generated-schema.json` (snippets) in /workspace when long

| Schema | Type | Status | Issues |
|--------|------|--------|--------|
| ... | ... | ok/warn/fail | ... |

Then: missing opportunities, fixes needed, generated code.

## Error Handling
| Scenario | Action |
|----------|--------|
| URL unreachable | Report status code; suggest verifying URL/auth. |
| No schema found | Say so; recommend types from content. |
| Invalid JSON-LD | Report the specific syntax errors and give corrected JSON-LD. |
| Deprecated type | Flag with retirement date; recommend replacement or removal. |
