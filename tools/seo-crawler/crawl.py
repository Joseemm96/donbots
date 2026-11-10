#!/usr/bin/env python3
"""Generic image alt-text crawler/auditor. See README.md."""
import argparse, collections, csv, json, re, sys, time
from urllib.parse import urljoin, urlparse, urldefrag, unquote, quote
import requests, threading
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/129.0 Safari/537.36")
SKIP_EXT = re.compile(r'\.(jpe?g|png|gif|webp|svg|avif|heic|pdf|zip|mp4|mov|mp3|css|js|xml|ico)$', re.I)
IMG_EXT = r'\.(jpe?g|png|gif|webp|heic|svg|avif)$'
GENERIC = {'image', 'img', 'photo', 'picture', 'pic', 'untitled', 'logo', 'banner', 'graphic',
           'icon', 'thumbnail', 'placeholder', 'default', 'image-asset', 'image asset'}
DECOR_HINT = re.compile(r'background|texture|divider|spacer|separator|pattern', re.I)
PLATFORMS = [('Squarespace', r'squarespace'), ('Wix', r'wix\.com|wixstatic'),
             ('WordPress', r'wp-content|wp-includes'), ('Shopify', r'cdn\.shopify'),
             ('Webflow', r'webflow'), ('Duda', r'dudaone|multiscreensite'), ('GoDaddy', r'godaddy|img1\.wsimg')]


def args():
    p = argparse.ArgumentParser(description="Crawl a site and audit <img> alt text.")
    p.add_argument('start_url')
    p.add_argument('--max-pages', type=int, default=300)
    p.add_argument('--rate', type=float, default=3.0, help='max requests/second (default 3)')
    p.add_argument('-o', '--output', default='alt-audit.csv', help='CSV path; a .json with raw data is written alongside')
    p.add_argument('--render', action='store_true', help='also render pages with Playwright (JS sites); merges extra images')
    p.add_argument('--chrome', default=None, help='Chrome/Chromium executable for --render (default: Playwright bundled)')
    p.add_argument('--sitewide-threshold', type=int, default=10, help='collapse an image issue seen on >= N pages into one row')
    p.add_argument('--no-sitemap', action='store_true', help='only follow links, skip sitemap discovery')
    p.add_argument('--timeout', type=int, default=30)
    p.add_argument('-x', '--xlsx', default=None, help='write full technical audit workbook (.xlsx) here')
    p.add_argument('--no-link-check', action='store_true', help='skip broken-link / redirect checking')
    p.add_argument('--no-external', action='store_true', help='do not check external links')
    p.add_argument('--no-image-check', action='store_true', help='do not status-check <img> src URLs')
    p.add_argument('--workers', type=int, default=8, help='parallel workers for external link checks')
    p.add_argument('--browser-fetch', action='store_true',
                   help='fetch pages and sitemaps with headless Chrome (Playwright) and let any normal JS challenge complete')
    p.add_argument('--challenge-wait', type=int, default=30, help='max seconds to wait for a JS challenge on first hit (default 30)')
    p.add_argument('--browser-cookies', action='store_true',
                   help='with --browser-fetch: copy browser cookies into the requests session used for link checks')
    return p.parse_args()


CHALLENGE_RE = re.compile(r'sgcaptcha|cf-chl|/cdn-cgi/challenge|Robot Challenge|Just a moment|captcha', re.I)


class _Hist:
    def __init__(self, url, code): self.url, self.status_code = url, code


class _Resp:
    """Minimal requests.Response look-alike built from a Playwright response."""
    def __init__(self, url, status, headers, text, history):
        self.url, self.status_code, self.headers, self.text, self.history = url, status, headers, text, history
    @property
    def ok(self): return self.status_code is not None and self.status_code < 400


class BrowserFetcher:
    """Fetch pages with headless Chrome. On a JS challenge page it simply waits for the page's own
    challenge to finish (first hit up to --challenge-wait s, later hits up to 15 s), then re-requests.
    The browser context (cookies) is reused for the whole session. No UA spoofing beyond a normal Chrome UA."""
    def __init__(self, a):
        from playwright.sync_api import sync_playwright
        self.a = a; self.pw = sync_playwright().start()
        self.b = self.pw.chromium.launch(headless=True, **({'executable_path': a.chrome} if a.chrome else {}))
        self.ctx = self.b.new_context(user_agent=UA, locale='en-US', viewport={'width': 1366, 'height': 900})
        self.page = self.ctx.new_page(); self.first = True
        self.challenges_seen = 0; self.challenges_cleared = 0; self.challenge_failures = []

    @staticmethod
    def _is_challenge(resp, body, title):
        return bool((resp is not None and resp.headers.get('sg-captcha')) or CHALLENGE_RE.search(title or '')
                    or (resp is not None and resp.status in (202, 403, 429, 503) and CHALLENGE_RE.search(body[:4000])))

    def _goto(self, url):
        resp = self.page.goto(url, wait_until='domcontentloaded', timeout=self.a.timeout * 1000 + 15000)
        try: body = resp.text() if resp else ''
        except Exception: body = self.page.content()
        try: title = self.page.title()
        except Exception: title = ''
        return resp, body, title

    def get(self, url):
        resp, body, title = self._goto(url)
        if self._is_challenge(resp, body, title):
            self.challenges_seen += 1
            limit = self.a.challenge_wait if self.first else 15
            t0 = time.time(); cleared = False
            while time.time() - t0 < limit:
                self.page.wait_for_timeout(1000)
                try:
                    t = self.page.title(); cu = self.page.url
                except Exception: continue
                if not CHALLENGE_RE.search(t) and 'sgcaptcha' not in cu and '/captcha' not in cu:
                    cleared = True; break
            if cleared:
                self.challenges_cleared += 1
                print(f'   challenge cleared after {time.time() - t0:.0f}s', file=sys.stderr)
                resp, body, title = self._goto(url)
            else:
                self.challenge_failures.append(url)
        self.first = False
        if resp is None: return _Resp(url, None, {}, body, [])
        hist, req = [], resp.request.redirected_from
        while req is not None:
            rr = req.response()
            hist.insert(0, _Hist(req.url, rr.status if rr else 0)); req = req.redirected_from
        ct = resp.headers.get('content-type', '')
        if 'xml' in ct or url.lower().endswith('.xml'):
            # XSL-styled sitemaps get transformed into HTML in the tab; re-read the raw XML from page context
            try: body = self.page.evaluate("u => fetch(u, {credentials: 'include'}).then(r => r.text())", resp.url)
            except Exception: pass
        if 'html' in ct and not body: body = self.page.content()
        return _Resp(resp.url, resp.status, resp.headers, body, hist)

    def cookies_to(self, session):
        for ck in self.ctx.cookies():
            session.cookies.set(ck['name'], ck['value'], domain=ck['domain'], path=ck['path'])

    def close(self):
        try: self.b.close(); self.pw.stop()
        except Exception: pass


class Crawler:
    def __init__(self, a):
        self.a = a
        u = urlparse(a.start_url if '://' in a.start_url else 'https://' + a.start_url)
        self.scheme, self.host = u.scheme, u.netloc.lower()
        self.bare = self.host[4:] if self.host.startswith('www.') else self.host
        self.base = f'{self.scheme}://{self.host}'
        self.s = requests.Session(); self.s.headers['User-Agent'] = UA
        self.delay = 1.0 / a.rate if a.rate > 0 else 0
        self.last = 0.0
        self.browser = BrowserFetcher(a) if getattr(a, 'browser_fetch', False) else None

    def get(self, url):
        w = self.delay - (time.time() - self.last)
        if w > 0: time.sleep(w)
        self.last = time.time()
        if self.browser: return self.browser.get(url)
        return self.s.get(url, timeout=self.a.timeout)

    @staticmethod
    def key(u):
        """Dedupe key: treat '+' and '%20' (and other percent-encoding variants) in paths as the same URL."""
        if not u: return u
        p = urlparse(u)
        path = quote(unquote(p.path.replace('+', ' ')), safe="/:@!$&'()*,;=-._~")
        return p._replace(path=path).geturl()

    def norm(self, u):
        u = urldefrag(u)[0]; p = urlparse(u)
        if p.scheme not in ('http', 'https'): return None
        h = p.netloc.lower()
        if h not in (self.host, self.bare, 'www.' + self.bare): return None
        if SKIP_EXT.search(p.path): return None
        path = quote(unquote(p.path), safe="/:@!$&'()*,;=-._~+%")
        path = path.rstrip('/') or '/'
        q = ('?' + p.query) if p.query and re.search(r'(^|&)(page|offset|p)=', p.query) else ''
        return f'{self.scheme}://{self.host}{path}{q}'

    def sitemaps(self):
        found, cands = [], []
        try:
            r = self.get(self.base + '/robots.txt')
            if r.ok: cands += re.findall(r'(?im)^\s*sitemap:\s*(\S+)', r.text)
        except Exception: pass
        cands += [self.base + x for x in ('/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml')]
        seen, pages = set(), []
        while cands and len(seen) < 50:
            sm = cands.pop(0)
            if sm in seen: continue
            seen.add(sm)
            try: r = self.get(sm)
            except Exception: continue
            if not r.ok or '<' not in r.text[:200] or ('<urlset' not in r.text and '<sitemapindex' not in r.text): continue
            found.append(sm)
            locs = [l.strip() for l in re.findall(r'<loc>\s*(.*?)\s*</loc>', r.text, re.S)]
            if '<sitemapindex' in r.text: cands += locs
            else: pages += [l for l in re.findall(r'<url>\s*<loc>\s*(.*?)\s*</loc>', r.text, re.S)] or locs
        return found, pages


def fname(src): return unquote(urlparse(src).path.rstrip('/').split('/')[-1])


def classify(alt, src):
    if alt is None: return 'missing_alt'
    a = alt.strip(); low = a.lower()
    if not a: return 'empty_alt'
    st = re.sub(IMG_EXT, '', fname(src), flags=re.I).lower()
    if low in GENERIC or re.match(r'^(slide|image|photo|picture|img)\s*\d+$', low): return 'junk_alt_generic'
    if re.search(IMG_EXT, low): return 'junk_alt_filename'
    if st and low in (st, st.replace('-', ' ').replace('_', ' ')): return 'junk_alt_filename'
    if re.match(r'^(img|dsc|dscn|dji|pxl|screenshot|screen shot|whatsapp|fullsizerender)[ _-]?\d', low) \
            or re.match(r'^[0-9a-f]{8}-[0-9a-f-]{20,}$', low) or re.match(r'^[\d _-]+$', low):
        return 'junk_alt_filename'
    if len(a) > 125: return 'junk_alt_too_long'
    return 'ok'


def context(img):
    fig = img.find_parent('figure')
    if fig:
        cap = fig.find('figcaption')
        if cap and cap.get_text(strip=True): return 'caption: ' + cap.get_text(' ', strip=True)[:150]
    h = img.find_previous(['h1', 'h2', 'h3', 'h4'])
    return 'heading: ' + h.get_text(' ', strip=True)[:150] if h else ''


def img_src(img, page):
    src = (img.get('data-src') or img.get('data-image') or img.get('data-lazy-src') or img.get('src') or '').strip()
    if not src and img.get('srcset'): src = img['srcset'].split(',')[0].split()[0]
    if src.startswith('data:'): return 'inline-data-uri'
    return urljoin(page, src).split('?')[0].rstrip('/') if src else ''


def analyse_img(img, page):
    src = img_src(img, page); alt = img.get('alt')
    issue = classify(alt, src)
    a = img.find_parent('a')
    anc = ' '.join(' '.join(x.get('class') or []) for x in img.find_parents(limit=3) if hasattr(x, 'get'))
    if issue == 'empty_alt':
        if a: issue = 'empty_alt_linked'
        elif DECOR_HINT.search(anc + ' ' + src) or img.get('role') == 'presentation' or img.get('aria-hidden') == 'true':
            issue = 'empty_alt_decorative_ok'
        else: issue = 'empty_alt_content_image'
    if a is not None and issue in ('missing_alt', 'empty_alt_linked'):
        named = a.get_text(' ', strip=True) or a.get('aria-label') or a.get('title') or \
            any((i.get('alt') or '').strip() for i in a.find_all('img'))
        if not named: issue = 'linked_image_no_alt_no_text' if issue == 'empty_alt_linked' else 'missing_alt+linked_no_text'
    return dict(image_src=src, issue_type=issue, current_alt=alt if alt is not None else '',
                in_link=('yes -> ' + a.get('href', '')) if a is not None else 'no',
                suggested_context=context(img),
                lazy=' '.join(k for k in ('data-src', 'data-lazy-src', 'data-image') if img.get(k)) +
                     (' loading=lazy' if img.get('loading') == 'lazy' else ''))


def render_pages(urls, chrome):
    try: from playwright.sync_api import sync_playwright
    except ImportError:
        print('!! --render needs playwright (pip install playwright && playwright install chromium)', file=sys.stderr); return {}
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, **({'executable_path': chrome} if chrome else {}))
        ctx = b.new_context(user_agent=UA)
        for u in urls:
            pg = ctx.new_page()
            try:
                pg.goto(u, wait_until='load', timeout=45000)
                pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); pg.wait_for_timeout(1500)
                out[u] = {'html': pg.content(), 'bg': pg.evaluate(
                    "()=>[...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).backgroundImage.includes('url(')).length")}
            except Exception as e: out[u] = {'err': str(e)[:200]}
            pg.close()
        b.close()
    return out


# ---------------------------------------------------------------- link / redirect checking
EMAIL_RE = re.compile(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')


def sanity_href(href):
    """Return an issue string for malformed hrefs, or None."""
    h = href.strip()
    low = h.lower()
    if low.startswith('mailto:'):
        rawaddr = unquote(h[7:].split('?')[0])
        addr = rawaddr.strip()
        if not addr: return 'mailto: empty address'
        if '*' in addr: return 'obfuscated mailto (JS-decoded): ' + addr
        if rawaddr != addr: return 'mailto: leading/trailing space ' + repr(rawaddr)
        bad = [x for x in addr.split(',') if not EMAIL_RE.match(x.strip())]
        return f'mailto: invalid address {addr!r}' if bad else None
    if low.startswith('tel:'):
        d = re.sub(r'\D', '', h[4:])
        return f'tel: suspicious number {h[4:]!r}' if not (7 <= len(d) <= 15) else None
    if low.startswith(('javascript:', '#', 'sms:', 'data:')): return None
    if re.match(r'^[^/:?#\s]+@[^/\s]+\.[a-z]{2,}', h, re.I): return 'email without mailto:'
    if re.match(r'^(www\.|[a-z0-9-]+\.(com|net|org|io|co)(/|$))', h, re.I): return 'missing scheme (resolves as relative path)'
    if re.match(r'^https?://[^/]*@', h, re.I): return 'email/userinfo inside URL host'
    if re.match(r'^https?:/[^/]|^https?:[^/]', h, re.I) or re.match(r'^https?://\d{6,}', h, re.I): return 'malformed URL'
    if re.match(r'^\+?[\d\s().-]{7,}$', h): return 'phone number without tel:'
    if re.match(r'^https?://[^/]*\.[a-z]+\d{5,}', h, re.I): return 'malformed host (phone/text appended)'
    return None


class Checker:
    def __init__(self, crawler, a):
        self.c, self.a = crawler, a
        self.cache, self.lock = {}, threading.Lock()
        self.ilock = threading.Lock()

    def _req(self, method, url):
        internal = urlparse(url).netloc.lower() in (self.c.host, self.c.bare, 'www.' + self.c.bare)
        if internal:
            with self.ilock:
                w = self.c.delay - (time.time() - self.c.last)
                if w > 0: time.sleep(w)
                self.c.last = time.time()
        r = self.c.s.request(method, url, allow_redirects=False, timeout=min(self.a.timeout, 20), stream=True)
        r.close(); return r

    def check(self, url):
        with self.lock:
            if url in self.cache: return self.cache[url]
        res = self._check(url)
        with self.lock: self.cache[url] = res
        return res

    def _check(self, url):
        res = self._check_requests(url)
        if url.startswith('http://') and res['status'] is None and res['error'] in ('timeout', 'connection error'):
            alt = self._check_requests('https://' + url[7:])
            res['error'] = f"http:// unreachable from crawler network (https:// version: {alt['status'] or alt['error']})"
            res['http_unverified'] = True
        if res.get('challenge'):
            b = self.c.browser
            if b is not None and threading.current_thread() is threading.main_thread():
                try:
                    r = b.get(url)
                    chain = [(h.url, h.status_code) for h in r.history]
                    still = bool(r.headers.get('sg-captcha')) or (r.status_code == 202 and CHALLENGE_RE.search(r.text[:3000] or ''))
                    return dict(status=r.status_code, error='challenge not cleared' if still else '', chain=chain,
                                final=r.url, method='BROWSER', challenge=bool(still))
                except Exception as e:
                    return dict(status=None, error='browser error: ' + type(e).__name__, chain=res['chain'], final=res['final'], method='BROWSER', challenge=True)
            res['error'] = 'bot challenge, unverified'
        return res

    def _check_requests(self, url):
        chain, cur, err = [], url, ''
        for method in ('HEAD', 'GET'):
            chain, cur, err, code = [], url, '', None
            try:
                for _ in range(10):
                    r = self._req(method, cur)
                    code = r.status_code
                    if r.headers.get('sg-captcha') or (code == 202 and 'captcha' in r.headers.get('location', '') + str(r.headers.get('content-type'))):
                        return dict(status=code, error='', chain=chain, final=cur, method=method, challenge=True)
                    if code in (301, 302, 303, 307, 308) and r.headers.get('location'):
                        nxt = urljoin(cur, r.headers['location'])
                        chain.append((cur, code)); cur = nxt
                        if any(cur == c for c, _ in chain): err = 'redirect loop'; break
                        continue
                    break
                else: err = 'too many redirects'
            except requests.exceptions.SSLError as e: code, err = None, 'SSL error'
            except requests.exceptions.ConnectionError as e:
                code = None
                err = 'DNS failure' if re.search(r'Name or service not known|getaddrinfo|NameResolution|nodename', str(e)) else 'connection error'
            except requests.exceptions.Timeout: code, err = None, 'timeout'
            except Exception as e: code, err = None, 'error: ' + type(e).__name__
            if method == 'HEAD' and (code is None and err not in ('DNS failure',) or (code and code >= 400)):
                continue  # retry with GET
            break
        return dict(status=code, error=err, chain=chain, final=cur, method=method)


def link_verdict(res, internal):
    s, e = res['status'], res['error']
    if e in ('redirect loop', 'too many redirects'): return e
    if res.get('challenge'): return 'bot challenge, unverified'
    if res.get('http_unverified'): return 'http unverified'
    if s is None: return e or 'error'
    if s in (401, 403, 429, 999) and not internal: return 'blocked, unverified'
    if s >= 500: return 'server error'
    if s >= 400: return 'broken'
    return 'ok'


# ---------------------------------------------------------------- headings
def extract_headings(s):
    out = []
    for h in s.find_all(re.compile(r'^h[1-6]$')):
        if h.find_parent(['noscript', 'template']): continue
        out.append((int(h.name[1]), re.sub(r'\s+', ' ', h.get_text(' ', strip=True))))
    return out


def heading_issues(hs, title):
    iss = []
    h1 = [t for l, t in hs if l == 1]
    if not h1: iss.append(('missing H1', ''))
    if len(h1) > 1: iss.append(('multiple H1', ' | '.join(h1)[:300]))
    if any(not t for t in h1): iss.append(('empty H1', ''))
    empt = [f'H{l}' for l, t in hs if not t and l > 1]
    if empt: iss.append(('empty headings', ', '.join(empt)))
    if h1:
        first = next(i for i, (l, _) in enumerate(hs) if l == 1)
        if first > 0: iss.append(('headings before H1', ', '.join(f'H{l}: {t[:40]}' for l, t in hs[:first])[:300]))
    prev = 0
    skips = []
    for l, t in hs:
        if prev and l > prev + 1: skips.append(f'H{prev}->H{l} ({t[:40]})')
        prev = l
    if skips: iss.append(('skipped heading level', '; '.join(skips)[:300]))
    if h1 and title:
        a = set(re.findall(r'\w+', h1[0].lower())); b = set(re.findall(r'\w+', title.lower()))
        if h1[0].strip().lower() == title.strip().lower(): pass
        elif a and len(a & b) / len(a) < 0.3: iss.append(('H1 unrelated to title', f'H1={h1[0][:80]!r} title={title[:80]!r}'))
    return iss


# ---------------------------------------------------------------- xlsx
def write_xlsx(path, sheets):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter
    wb = Workbook(); wb.remove(wb.active)
    for name, header, rows in sheets:
        ws = wb.create_sheet(name[:31]); ws.append(header)
        for r in rows: ws.append([('' if v is None else (v if isinstance(v, (int, float)) else str(v)[:32000])) for v in r])
        for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='305496')
        ws.freeze_panes = 'A2'
        if rows: ws.auto_filter.ref = ws.dimensions
        for i, h in enumerate(header, 1):
            width = max([len(str(h))] + [len(str(r[i - 1])) for r in rows[:500] if i - 1 < len(r)])
            ws.column_dimensions[get_column_letter(i)].width = min(max(width + 2, 10), 70)
    wb.save(path)


SEV = {  # issue -> severity
    'broken internal link': 'High', 'broken internal image': 'High', 'internal server error': 'High',
    'malformed href': 'High', 'redirect loop': 'High', 'missing H1': 'High',
    'linked_image_no_alt_no_text': 'High', 'missing_alt+linked_no_text': 'High',
    'broken external link': 'Medium', 'internal link to redirect': 'Medium', 'redirect chain (2+ hops)': 'Medium',
    'multiple H1': 'Medium', 'empty H1': 'Medium', 'duplicate H1 across pages': 'Medium', 'missing_alt': 'Medium',
    'empty_alt_content_image': 'Medium', 'junk_alt_filename': 'Medium', 'H1 unrelated to title': 'Low',
    'skipped heading level': 'Low', 'headings before H1': 'Low', 'empty headings': 'Low', 'empty_alt_linked': 'Low',
    'junk_alt_generic': 'Medium', 'junk_alt_too_long': 'Low', 'blocked, unverified (external)': 'Low',
    'external redirect': 'Low', 'internal link to non-canonical host/scheme': 'Medium',
    'bot challenge, unverified': 'Low', 'link uses http:// (unverified from crawler)': 'Medium', 'mailto with stray space': 'Low', 'obfuscated mailto (JS-decoded)': 'Low',
    'missing title': 'High', 'noindex page (in sitemap)': 'High', 'noindex page': 'Medium',
    'canonicalised to another URL': 'Medium', 'multiple canonicals': 'High', 'missing canonical': 'Medium',
    'duplicate title': 'Medium', 'duplicate meta description': 'Low', 'missing meta description': 'Medium',
    'title too long (>60)': 'Low', 'title too short (<30)': 'Low',
    'meta description too long (>160)': 'Low', 'meta description too short (<70)': 'Low',
}


# ---------------------------------------------------------------- main
def main():
    a = args(); c = Crawler(a)
    sm_found, sm_pages = ([], []) if a.no_sitemap else c.sitemaps()
    queue = [c.norm(c.base + '/')] + [c.norm(u) for u in sm_pages]
    seen, pages, status, meta, rows, platform = set(), [], {}, {}, [], collections.Counter()
    links = []        # (source_page, kind, raw_href, abs_url, anchor_text)
    heads, titles, page_redirects, seo = {}, {}, {}, {}
    sm_keys = {c.key(c.norm(x)) for x in sm_pages if c.norm(x)}
    while queue and len(pages) < a.max_pages:
        u = queue.pop(0)
        if not u or c.key(u) in seen: continue
        seen.add(c.key(u))
        try: r = c.get(u)
        except Exception as e: status[u] = 'error: ' + str(e)[:120]; continue
        status[u] = r.status_code
        if r.history: page_redirects[u] = ([(h.url, h.status_code) for h in r.history], r.url, r.status_code)
        if re.search(r'sgcaptcha|cf-chl|captcha|Robot Challenge|Just a moment', r.text[:3000], re.I) or r.headers.get('sg-captcha'):
            status[u] = f'{r.status_code} BOT CHALLENGE'
            print(f'!! bot challenge at {u} (status {r.status_code}); crawler is blocked. Ask the host to allowlist the crawler IP/UA.', file=sys.stderr)
            continue
        if r.status_code != 200 or 'html' not in r.headers.get('content-type', ''): continue
        final = c.norm(r.url)
        if final and final != u:
            if c.key(final) in seen and c.key(final) != c.key(u): continue
            seen.add(c.key(final))
        pages.append(u); html = r.text
        for name, pat in PLATFORMS:
            if re.search(pat, html[:200000], re.I): platform[name] += 1
        s = BeautifulSoup(html, 'html.parser')
        titles[u] = s.title.get_text(' ', strip=True) if s.title else ''
        heads[u] = extract_headings(s)
        md = s.find('meta', attrs={'name': re.compile('^description$', re.I)})
        mr = s.find_all('meta', attrs={'name': re.compile('^(robots|googlebot)$', re.I)})
        cl = s.find_all('link', rel=lambda v: v and 'canonical' in (v if isinstance(v, list) else [v]))
        seo[u] = dict(title=titles[u], title_len=len(titles[u]),
                      desc=(md.get('content') or '').strip() if md else None,
                      canonical=[urljoin(r.url, x.get('href', '')) for x in cl],
                      robots=', '.join((m.get('content') or '') for m in mr),
                      x_robots=r.headers.get('x-robots-tag', ''), final_url=r.url,
                      in_sitemap=c.key(u) in sm_keys)
        for l in s.find_all('a', href=True):
            raw = l['href']
            txt = l.get_text(' ', strip=True) or l.get('aria-label') or l.get('title') or \
                ' '.join('[img alt=' + (i.get('alt') or '') + ']' for i in l.find_all('img'))
            absu = urldefrag(urljoin(r.url, raw.strip()))[0]
            links.append((u, 'a', raw, absu, txt[:120]))
            n = c.norm(absu)
            if n and c.key(n) not in seen: queue.append(n)
        imgs = [i for i in s.find_all('img') if not i.find_parent('noscript')]
        for i in imgs:
            src = img_src(i, r.url)
            if src and src.startswith('http'): links.append((u, 'img', src, src, (i.get('alt') or '')[:120]))
        meta[u] = dict(imgs=len(imgs), noscript_imgs=len(s.select('noscript img')), picture=len(s.find_all('picture')),
                       inline_bg=len(re.findall(r'background(-image)?\s*:[^;"]*url\(', html)),
                       text_chars=len(s.get_text(' ', strip=True)))
        for img in imgs: rows.append(dict(page_url=u, source='raw', **analyse_img(img, r.url)))
        print(f'[{len(pages)}/{a.max_pages}] {u} imgs={len(imgs)}', file=sys.stderr)

    browser_info = None
    if c.browser:
        b = c.browser
        browser_info = f'browser-fetch: challenges seen {b.challenges_seen}, cleared {b.challenges_cleared}, failed {len(b.challenge_failures)}'
        if a.browser_cookies: b.cookies_to(c.s)
    rendered = {}
    if a.render:
        rendered = render_pages(pages, a.chrome)
        for u, v in rendered.items():
            if 'html' not in v: continue
            have = {r['image_src'] for r in rows if r['page_url'] == u}
            s = BeautifulSoup(v['html'], 'html.parser'); extra = 0
            for img in s.find_all('img'):
                if img.find_parent('noscript'): continue
                d = analyse_img(img, u)
                if d['image_src'] and d['image_src'] not in have:
                    have.add(d['image_src']); extra += 1; rows.append(dict(page_url=u, source='rendered', **d))
            meta[u].update(rendered_extra_imgs=extra, rendered_css_bg=v['bg'])

    # ---- alt text (as before)
    seen_k, uniq = set(), []
    for r in rows:
        k = (r['page_url'], r['image_src'], r['issue_type'], r['current_alt'])
        if k not in seen_k: seen_k.add(k); uniq.append(r)
    by_img = collections.defaultdict(set)
    for r in uniq: by_img[(r['image_src'], r['issue_type'], r['current_alt'])].add(r['page_url'])
    out, done = [], set()
    for r in uniq:
        if r['issue_type'] in ('ok', 'empty_alt_decorative_ok'): continue
        k = (r['image_src'], r['issue_type'], r['current_alt']); n = len(by_img[k])
        row = {f: r[f] for f in ('page_url', 'image_src', 'issue_type', 'current_alt', 'in_link', 'suggested_context')}
        if n >= a.sitewide_threshold:
            if k in done: continue
            done.add(k); row['page_url'] = f'REPEATED ON {n} PAGES (e.g. {sorted(by_img[k])[0]})'
        out.append(row)
    if a.output:
        with open(a.output, 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=['page_url', 'image_src', 'issue_type', 'current_alt', 'in_link', 'suggested_context'])
            w.writeheader(); w.writerows(out)

    # ---- links & redirects
    is_int = lambda u: urlparse(u).netloc.lower() in (c.host, c.bare, 'www.' + c.bare)
    link_rows, redirect_rows, issues = [], [], collections.defaultdict(list)   # issue -> [(url, source, detail)]
    targets = collections.defaultdict(list)
    for src, kind, raw, absu, txt in links:
        bad = sanity_href(raw)
        if bad:
            link_rows.append([src, kind, raw, absu, txt, 'internal' if is_int(absu) else 'external', '', '', 'malformed href', bad, ''])
            ikey = 'obfuscated mailto (JS-decoded)' if bad.startswith('obfuscated') else ('mailto with stray space' if 'leading/trailing space' in bad else 'malformed href')
            if ikey != 'malformed href': link_rows[-1][8] = ikey
            issues[ikey].append((raw, src, bad)); continue
        if not absu.startswith('http'): continue
        if kind == 'img' and a.no_image_check: continue
        if not is_int(absu) and a.no_external: continue
        targets[absu].append((src, kind, raw, txt))
    if not a.no_link_check:
        ck = Checker(c, a)
        ints = [t for t in targets if is_int(t)]; exts = [t for t in targets if not is_int(t)]
        print(f'Checking {len(ints)} internal + {len(exts)} external unique URLs...', file=sys.stderr)
        for t in ints: ck.check(t)  # rate limited
        with ThreadPoolExecutor(a.workers) as ex: list(ex.map(ck.check, exts))
        for t, refs in targets.items():
            res = ck.cache[t]; internal = is_int(t)
            v = link_verdict(res, internal)
            chain = ' -> '.join(f'{u} [{s}]' for u, s in res['chain'])
            for src, kind, raw, txt in refs:
                link_rows.append([src, kind, raw, t, txt, 'internal' if internal else 'external', res['status'] or '',
                                  res['error'], v, chain, res['final'] if res['chain'] else ''])
            first = refs[0][0]
            if v in ('broken', 'server error') or (v not in ('ok', 'blocked, unverified', 'bot challenge, unverified', 'http unverified') and internal) or v in ('DNS failure', 'SSL error', 'timeout', 'connection error', 'redirect loop', 'too many redirects'):
                key = ('broken internal image' if refs[0][1] == 'img' else 'broken internal link') if internal else 'broken external link'
                if v == 'server error' and internal: key = 'internal server error'
                if v == 'redirect loop': key = 'redirect loop'
                for src, *_ in refs: issues[key].append((t, src, f"{res['status'] or res['error']}"))
            elif v == 'http unverified':
                for src, *_ in refs: issues['link uses http:// (unverified from crawler)'].append((t, src, res['error']))
            elif v == 'bot challenge, unverified':
                for src, *_ in refs: issues['bot challenge, unverified'].append((t, src, str(res['status'])))
            elif v == 'blocked, unverified':
                for src, *_ in refs: issues['blocked, unverified (external)'].append((t, src, str(res['status'])))
            if res['chain']:
                hops = len(res['chain'])
                fin_int = is_int(res['final'])
                redirect_rows.append([t, 'internal' if internal else 'external', hops, chain, res['final'], res['status'] or res['error'],
                                      len(refs), len({x[0] for x in refs}), ' | '.join(sorted({x[0] for x in refs})[:5])])
                if internal:
                    p0, p1 = urlparse(t), urlparse(res['final'])
                    key = 'internal link to non-canonical host/scheme' if (p0.netloc, p0.scheme) != (p1.netloc, p1.scheme) and p0.path.rstrip('/') == p1.path.rstrip('/') else 'internal link to redirect'
                    for src, *_ in refs: issues[key].append((t, src, f'-> {res["final"]} ({hops} hop)'))
                    if hops >= 2:
                        issues['redirect chain (2+ hops)'].append((t, first, chain))
                elif refs[0][1] == 'a':
                    issues['external redirect'].append((t, first, f'-> {res["final"]}'))
    for u, (ch, fin, st) in page_redirects.items():
        if not any(r[0] == u for r in redirect_rows):
            redirect_rows.append([u, 'crawled (sitemap/link)', len(ch), ' -> '.join(f'{x} [{s}]' for x, s in ch), fin, st, '', '', 'sitemap/queue'])

    if c.browser:
        b = c.browser
        browser_info = f'browser-fetch: challenges seen {b.challenges_seen}, cleared {b.challenges_cleared}, failed {len(b.challenge_failures)}'
        b.close(); c.browser = None

    # ---- host / scheme variants
    variants = []
    for v in {f'http://{c.bare}/', f'http://www.{c.bare}/', f'https://{c.bare}/', f'https://www.{c.bare}/'}:
        try:
            r = c.s.get(v, timeout=20, allow_redirects=True)
            variants.append([v, ' -> '.join(f'{h.url} [{h.status_code}]' for h in r.history) or '(no redirect)', r.url, r.status_code])
        except Exception as e: variants.append([v, 'error', str(e)[:100], ''])
    variants.sort()

    # ---- headings
    head_rows, outline_rows, h1map = [], [], collections.defaultdict(list)
    for u in pages:
        hs = heads.get(u, [])
        for l, t in hs:
            if l == 1 and t: h1map[t.strip().lower()].append(u)
        for iss, det in heading_issues(hs, titles.get(u, '')):
            head_rows.append([u, iss, SEV.get(iss, 'Low'), det, titles.get(u, ''), ' | '.join(t for l, t in hs if l == 1)])
            issues[iss].append((u, u, det))
        outline_rows.append([u, titles.get(u, ''), sum(1 for l, _ in hs if l == 1), len(hs),
                             '\n'.join('  ' * (l - 1) + f'H{l}: {t}' for l, t in hs)])
    for t, us in h1map.items():
        if len(us) > 1:
            for u in us:
                head_rows.append([u, 'duplicate H1 across pages', 'Medium', f'{len(us)} pages share H1 {t[:80]!r}', titles.get(u, ''), t])
                issues['duplicate H1 across pages'].append((u, u, f'{len(us)} pages: {t[:60]}'))
    for r in uniq:
        if r['issue_type'] not in ('ok', 'empty_alt_decorative_ok'):
            issues[r['issue_type']].append((r['image_src'], r['page_url'], r['current_alt']))

    # ---- SEO meta (title / description / canonical / robots)
    seo_rows, t_map, d_map = [], collections.defaultdict(list), collections.defaultdict(list)
    for u in pages:
        m = seo.get(u)
        if not m: continue
        t, d = m['title'].strip(), m['desc']
        if t: t_map[t.lower()].append(u)
        if d: d_map[d.lower()].append(u)
        robots = (m['robots'] + ', ' + m['x_robots']).lower()
        noindex = 'noindex' in robots
        canon = m['canonical']
        canon_self = bool(canon) and c.key(c.norm(canon[0]) or canon[0]) == c.key(c.norm(m['final_url']) or m['final_url'])
        found = []
        if not t: found.append(('missing title', ''))
        elif len(t) > 60: found.append(('title too long (>60)', f'{len(t)} chars'))
        elif len(t) < 30: found.append(('title too short (<30)', f'{len(t)} chars'))
        if d is None or not d: found.append(('missing meta description', ''))
        elif len(d) > 160: found.append(('meta description too long (>160)', f'{len(d)} chars'))
        elif len(d) < 70: found.append(('meta description too short (<70)', f'{len(d)} chars'))
        if not canon: found.append(('missing canonical', ''))
        elif len(canon) > 1: found.append(('multiple canonicals', ' | '.join(canon)))
        elif not canon_self: found.append(('canonicalised to another URL', canon[0]))
        if noindex: found.append(('noindex page' + (' (in sitemap)' if m['in_sitemap'] else ''), robots.strip(', ')))
        for iss, det in found: issues[iss].append((u, u, det))
        seo_rows.append([u, t, len(t), d or '', len(d) if d else 0, ' | '.join(canon), 'self' if canon_self else ('none' if not canon else 'other'),
                         m['robots'], m['x_robots'], 'yes' if noindex else 'no', 'yes' if m['in_sitemap'] else 'no',
                         '; '.join(i for i, _ in found)])
    for mp, name in ((t_map, 'duplicate title'), (d_map, 'duplicate meta description')):
        for v, us in mp.items():
            if len(us) > 1:
                for u in us: issues[name].append((u, u, f'{len(us)} pages: {v[:60]}'))

    # ---- report
    summ = []
    order = {'High': 0, 'Medium': 1, 'Low': 2}
    for iss, lst in sorted(issues.items(), key=lambda x: (order[SEV.get(x[0], 'Low')], -len({y[0] for y in x[1]}))):
        affected = sorted({x[0] for x in lst}); srcs = sorted({x[1] for x in lst})
        summ.append([SEV.get(iss, 'Low'), iss, len(lst), len(affected), len(srcs), ' | '.join(affected[:5]), ' | '.join(srcs[:5])])
    plat = platform.most_common(1)[0][0] if platform else 'unknown'
    info = [['Start URL', a.start_url], ['Platform guess', f'{plat} {dict(platform)}'],
            ['Sitemaps', ', '.join(sm_found) or 'none found'], ['Sitemap URLs', len(sm_pages)],
            ['Pages crawled (HTML 200)', len(pages)], ['Max pages', a.max_pages],
            ['Queue remaining (not crawled)', len({c.key(q) for q in queue if q and c.key(q) not in seen})],
            ['Non-200 crawled URLs', '; '.join(f'{u} [{s}]' for u, s in status.items() if s != 200)],
            ['Links/images extracted', len(links)], ['Unique URLs checked', len(targets) if not a.no_link_check else 0],
            ['<img> tags', len(rows)], ['JS render', 'yes' if a.render else 'no'],
            ['Fetch mode', browser_info or 'requests']]
    for v in variants: info.append([f'Variant {v[0]}', f'{v[1]} => {v[2]} [{v[3]}]'])
    print('\n'.join(f'{k}: {v}' for k, v in info))
    print('\nSeverity | issue | instances | affected | source pages')
    for s in summ: print(f'{s[0]:6s} {s[1]:42s} {s[2]:5d} {s[3]:5d} {s[4]:5d}  e.g. {s[5][:110]}')
    if a.xlsx:
        sheets = [('Summary', ['Severity / Item', 'Issue / Value', 'Instances', 'Affected URLs', 'Source pages', 'Example affected', 'Example sources'],
                   [[k, v] for k, v in info] + [[''] * 7] + summ),
                  ('Broken Links', ['source_page', 'type', 'raw_href', 'url', 'anchor_or_alt', 'scope', 'status', 'error', 'verdict', 'redirect_chain', 'final_url'],
                   sorted((r for r in link_rows if r[8] != 'ok' or r[9]), key=lambda r: (r[8] == 'ok', r[8] == 'blocked, unverified', r[3]))),
                  ('Redirects', ['url', 'scope', 'hops', 'chain', 'final_url', 'final_status', 'link_instances', 'source_page_count', 'example_sources'],
                   sorted(redirect_rows, key=lambda r: (-int(r[2] or 0), r[0]))),
                  ('Headings', ['page_url', 'issue', 'severity', 'detail', 'title', 'h1'], sorted(head_rows, key=lambda r: (order[r[2]], r[1], r[0]))),
                  ('SEO Meta', ['page_url', 'title', 'title_len', 'meta_description', 'desc_len', 'canonical', 'canonical_type',
                                'meta_robots', 'x_robots_tag', 'noindex', 'in_sitemap', 'issues'], seo_rows),
                  ('Heading Outline', ['page_url', 'title', 'h1_count', 'heading_count', 'outline'], outline_rows),
                  ('Alt Text', ['page_url', 'image_src', 'issue_type', 'severity', 'current_alt', 'in_link', 'suggested_context'],
                   [[o['page_url'], o['image_src'], o['issue_type'], SEV.get(o['issue_type'], 'Low'), o['current_alt'], o['in_link'], o['suggested_context']] for o in out]),
                  ('All Links', ['source_page', 'type', 'raw_href', 'url', 'anchor_or_alt', 'scope', 'status', 'error', 'verdict', 'redirect_chain', 'final_url'], link_rows),
                  ('Host Variants', ['requested', 'redirect chain', 'final', 'status'], variants)]
        write_xlsx(a.xlsx, sheets); print('XLSX:', a.xlsx)
    jpath = re.sub(r'\.(csv|xlsx)$', '', a.xlsx or a.output or 'audit') + '.json'
    json.dump(dict(start=a.start_url, sitemaps=sm_found, pages=pages, status=status, meta=meta, rows=rows,
                   headings=heads, titles=titles, seo=seo, issues=issues, variants=variants,
                   render_errors={u: v['err'] for u, v in rendered.items() if 'err' in v}), open(jpath, 'w'), indent=1, default=str)
    if a.output: print(f'Alt CSV: {a.output} ({len(out)} rows)')


if __name__ == '__main__':
    main()
