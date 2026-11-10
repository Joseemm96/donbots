# seo-crawler: technical SEO audit

Crawls a website and audits four things: image alt text, broken links, redirects, and headings. Writes an alt-text CSV, an optional Excel workbook (`-x`), and a JSON file with the raw crawl data.

## Install
```bash
python3 -m venv .venv
.venv/bin/pip install requests beautifulsoup4 openpyxl
# optional, only needed for --render (JavaScript-built sites)
.venv/bin/pip install playwright && .venv/bin/playwright install chromium
```

## Usage
```bash
.venv/bin/python crawl.py https://example.com/                          # sitemaps + links, up to 300 pages
.venv/bin/python crawl.py https://example.com/ --max-pages 50 --rate 2 -o example-alt.csv
.venv/bin/python crawl.py https://example.com/ --render                 # also render each page in headless Chromium
.venv/bin/python crawl.py https://example.com/ --render --chrome /usr/bin/google-chrome
.venv/bin/python crawl.py https://example.com/ --no-sitemap --sitewide-threshold 5
```

| Flag | Default | Meaning |
|---|---|---|
| `start_url` | (required) | Homepage. The crawl stays on this host; www and non-www count as the same site. |
| `--max-pages` | 300 | Maximum number of HTML pages to crawl |
| `--rate` | 3 | Maximum requests per second |
| `-o/--output` | alt-audit.csv | Where the CSV goes. A `.json` file with raw data is written next to it. |
| `--render` | off | Render each page with Playwright after the crawl and add any images that only appear after JavaScript runs (rows marked `source: rendered` in the JSON) |
| `--chrome` | bundled | Path to a Chrome/Chromium executable for `--render` |
| `--sitewide-threshold` | 10 | An image with the same issue on at least this many pages becomes a single `REPEATED ON N PAGES` row |
| `--no-sitemap` | off | Skip the sitemaps and only follow links |

How pages are found: sitemaps listed in robots.txt, plus `/sitemap.xml`, `/sitemap_index.xml` and `/wp-sitemap.xml` (sitemap indexes are followed), plus internal links followed breadth-first from the homepage. URL fragments and most query strings are dropped; pagination parameters (`page`, `offset`, `p`) are kept.

## Full technical audit (.xlsx)
```bash
.venv/bin/python crawl.py https://example.com/ -x example-technical-audit.xlsx -o example-alt.csv
.venv/bin/python crawl.py https://example.com/ -x audit.xlsx --no-external --no-image-check   # faster run
```
Extra flags: `-x/--xlsx PATH`, `--no-link-check`, `--no-external`, `--no-image-check`, `--workers N` (parallel external checks, default 8).

Every tab has a frozen header row and filters. Tabs:
- **Summary**: crawl facts, http/https and www/non-www behaviour, and each issue with a High/Medium/Low severity, instance count, affected URLs, and source pages.
- **Broken Links**: every `<a href>` and `<img src>` that isn't a clean 200, with source page, anchor text or alt, status, error (timeout, DNS failure, SSL error, connection error), verdict, and redirect chain. Each URL is checked with HEAD first and retried with GET on an error or a 4xx/5xx response. Redirects are followed by hand, up to 10 hops. An external 401, 403, 429 or 999 is reported as `blocked, unverified`, not broken. Malformed hrefs are flagged without a request: email without `mailto:`, invalid mailto, tel numbers with the wrong number of digits, phone number without `tel:`, missing scheme, malformed host.
- **Redirects**: each redirecting URL with hop count, chain, final URL, and the pages that link to it. Internal links that point at a redirect are flagged, and so are links to the wrong host or scheme.
- **Headings**: missing, multiple or empty H1; H1 shared by several pages; H1 that doesn't match the title (less than 30% word overlap); skipped levels; headings before the H1; empty headings.
- **Heading Outline**: the heading tree of each page.
- **Alt Text**: the same rows as the CSV, plus a severity column.
- **All Links**: every extracted link and image URL with its check result.
- **Host Variants**: what http/https and www/non-www each return.

If a page returns a bot challenge (SiteGround `sgcaptcha`, Cloudflare and similar), it is marked `BOT CHALLENGE` and skipped. The crawler does not try to get past the challenge. Ask the site owner or host to allowlist the crawler instead.

## Sites behind a JS bot challenge (`--browser-fetch`)
```bash
.venv/bin/pip install playwright && .venv/bin/playwright install chromium   # or pass --chrome /usr/bin/google-chrome
.venv/bin/python crawl.py https://example.com/ --browser-fetch --browser-cookies -x audit.xlsx -o alt.csv
```
- `--browser-fetch`: pages, robots.txt and sitemaps are loaded in one headless Chrome session with a normal desktop Chrome user agent. If the page is a JavaScript challenge (SiteGround `sgcaptcha`, Cloudflare "Just a moment", and similar), the crawler waits for the page's own challenge to finish: up to `--challenge-wait` seconds (default 30) on the first hit and 15 seconds after that. Then it requests the URL again. Cookies are reused for the rest of the session. Raw XML is read even when the sitemap uses an XSL stylesheet.
- `--browser-cookies`: copies the browser's cookies into the requests session that checks link status.
- During link checks, an internal URL that still returns a challenge is re-checked in the browser. Anything that can't be verified is reported as `bot challenge, unverified`, not as broken.
- The crawler does nothing else to get past bot protection: it doesn't pretend to be a search engine, use proxies, or solve CAPTCHAs. If the challenge doesn't clear, the page is marked `BOT CHALLENGE`.

## SEO meta (`SEO Meta` tab)
For each page the crawler records the title and its length, the meta description and its length, canonical tag(s), meta robots/googlebot, the X-Robots-Tag header, whether the page is noindex, and whether it is in the sitemap. Issues flagged: missing/short (<30)/long (>60) title, duplicate title, missing/short (<70)/long (>160) meta description, duplicate description, missing, multiple or non-self canonical, noindex (High if the page is in the sitemap).

## URL normalisation
Fragments are dropped. Only pagination query strings are kept. Paths are percent-encoded the same way every time, and `+` and `%20` count as the same URL when deduplicating, so tag pages like `/tag/Balloon+Drop` and `/tag/Balloon%20Drop` are crawled once.

Malformed-link checks also report JS-obfuscated mailto links (for example CleanTalk's `Se****@***`) as Low (`obfuscated mailto (JS-decoded)`), and mailto links with a stray space as `mailto with stray space`.

## Output
CSV columns: `page_url, image_src, issue_type, current_alt, in_link, suggested_context`

`issue_type` values:
- `missing_alt`: the image has no alt attribute
- `missing_alt+linked_no_text` / `linked_image_no_alt_no_text`: the image is a link, and the link has no alt, no text, and no aria-label or title, so it has no accessible name
- `empty_alt_linked`: `alt=""` inside a link that does have text
- `empty_alt_content_image`: `alt=""` on an image that looks like content
- `junk_alt_filename`: the alt is the filename or camera-style text (IMG_1234, a UUID, an image extension)
- `junk_alt_generic`: the alt is generic ("image", "logo", "Slide 3")
- `junk_alt_too_long`: the alt is longer than 125 characters (often a pasted caption or keyword stuffing)

`ok` images and images guessed to be decorative (`empty_alt_decorative_ok`, for example backgrounds and textures) are left out of the CSV but kept in the JSON.

The image source comes from `data-src`, `data-image`, `data-lazy-src`, `src`, or `srcset`, so lazy-loaded images are included. Images inside `<noscript>` are skipped because they duplicate the real image. CSS background images can't have alt text. They are counted in the JSON (`inline_bg`, and `rendered_css_bg` with `--render`) but not classified.

The run ends with a console summary: platform guess, sitemaps found, pages crawled, non-200 URLs, counts by issue, site-wide repeats, and the top pages. If many pages have no images and little text, it suggests rerunning with `--render`.

## Limits
- Decorative vs. content is a heuristic based on class and filename hints. Check it by hand.
- `suggested_context` is the nearest preceding heading or figcaption, which may be empty.
- `--render` waits for the page `load` event plus a scroll. Infinite scroll and click-to-load galleries may still be missed.
