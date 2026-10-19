"""Génère le site publié : une vraie page par langue (/fr/, /es/…), plan du site et balises pour les moteurs de recherche.

Usage : python tools/build_langs.py [dossier_de_sortie]   (par défaut _site)
Le HTML source est en anglais ; les textes des autres langues viennent de lang/<code>.json.
"""
import json, shutil, sys
from datetime import date
from pathlib import Path
from bs4 import BeautifulSoup

SRC = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC / '_site'
BASE = 'https://marctt69.github.io/28JoursBox-communaute/'
LANGS = ['en', 'fr', 'es', 'de', 'it', 'pt']
LOCALE = {'en': 'en_US', 'fr': 'fr_FR', 'es': 'es_ES', 'de': 'de_DE', 'it': 'it_IT', 'pt': 'pt_BR'}
PAGES = ['index.html', 'pourquoi.html', 'telecharger.html', 'guide.html', 'acces-exterieur.html', 'forum.html', 'don.html']
OG_IMAGE = BASE + 'img/photos/og.jpg'
SKIP = {'_site', '.git', '.github', 'tools', 'README.md'}
ATTRS = ['content', 'alt', 'aria-label', 'placeholder']
dicts = {c: json.load(open(SRC / f'lang/{c}.json', encoding='utf-8')) for c in LANGS}


def url(lang, page):
    path = '' if page == 'index.html' else page
    return BASE + ('' if lang == 'en' else f'{lang}/') + path


def translate(soup, d):
    for el in soup.select('[data-i18n]'):
        s = d.get(el['data-i18n'])
        if s is None: continue
        if el.name == 'title': el.string = s
        else:
            el.clear()
            for c in list(BeautifulSoup(s, 'html.parser').contents): el.append(c)
    for a in ATTRS:
        for el in soup.select(f'[data-i18n-{a}]'):
            s = d.get(el[f'data-i18n-{a}'])
            if s is not None: el[a] = s


def relink(soup):
    """Pages d'un sous-dossier de langue : les ressources (css, js, img, lang) remontent d'un niveau ; les pages .html restent dans la langue."""
    for el in soup.find_all(['link', 'script', 'img', 'source']):
        for a in ('href', 'src'):
            v = el.get(a)
            if v and not v.startswith(('http', '/', '#', 'data:', 'mailto:')) and not v.split('?')[0].split('#')[0].endswith('.html'):
                el[a] = '../' + v
    for el in soup.select('[style*="url("]'):
        el['style'] = el['style'].replace("url('img/", "url('../img/")


def seo(soup, lang, page, d):
    head = soup.head
    html = soup.html
    html['lang'] = lang
    html['data-static-lang'] = lang
    if lang != 'en': html['data-root'] = '../'
    for m in head.find_all('meta', attrs={'property': True}) + head.find_all('meta', attrs={'name': ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']}):
        m.decompose()
    for l in head.find_all('link', rel=['canonical', 'alternate']): l.decompose()
    for s in head.find_all('script', type='application/ld+json'): s.decompose()
    title = soup.title.get_text()
    desc = (head.find('meta', attrs={'name': 'description'}) or {}).get('content', '')
    def add(name, **attrs):
        tag = soup.new_tag(name)
        for k, v in attrs.items(): tag[k.replace('_', '-') if k != 'http_equiv' else 'http-equiv'] = v
        head.append(tag); return tag
    add('link', rel='canonical', href=url(lang, page))
    for c in LANGS: add('link', rel='alternate', hreflang=c, href=url(c, page))
    add('link', rel='alternate', hreflang='x-default', href=url('en', page))
    for k, v in [('og:type', 'website'), ('og:site_name', '28JoursBox'), ('og:title', title), ('og:description', desc),
                 ('og:url', url(lang, page)), ('og:image', OG_IMAGE), ('og:locale', LOCALE[lang])]:
        m = soup.new_tag('meta'); m['property'] = k; m['content'] = v; head.append(m)
    for c in LANGS:
        if c != lang:
            m = soup.new_tag('meta'); m['property'] = 'og:locale:alternate'; m['content'] = LOCALE[c]; head.append(m)
    for k, v in [('twitter:card', 'summary_large_image'), ('twitter:image', OG_IMAGE)]:
        m = soup.new_tag('meta'); m['name'] = k; m['content'] = v; head.append(m)
    if page == 'index.html':
        ld = {
            '@context': 'https://schema.org', '@type': 'SoftwareApplication', 'name': '28JoursBox',
            'description': desc, 'url': url(lang, page), 'image': OG_IMAGE, 'inLanguage': lang,
            'applicationCategory': 'MultimediaApplication', 'operatingSystem': 'Windows 10, Windows 11, iOS, Android (web)',
            'downloadUrl': 'https://github.com/MarcTT69/28JoursBox-communaute/releases/latest',
            'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'EUR'},
        }
        sc = soup.new_tag('script', type='application/ld+json'); sc.string = json.dumps(ld, ensure_ascii=False); head.append(sc)
    gsc = (SRC / 'tools' / 'google-site-verification.txt')
    if gsc.exists() and gsc.read_text().strip():
        m = soup.new_tag('meta'); m['name'] = 'google-site-verification'; m['content'] = gsc.read_text().strip(); head.append(m)


# 1. copie de tout le site (sauf outils et dépôt)
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
for p in SRC.iterdir():
    if p.name in SKIP or p.name.startswith('.'): continue
    (shutil.copytree if p.is_dir() else shutil.copy2)(p, OUT / p.name)

# 2. pages : anglais à la racine (avec balises), autres langues dans leur dossier
for lang in LANGS:
    for page in PAGES:
        soup = BeautifulSoup((SRC / page).read_text(encoding='utf-8'), 'html.parser')
        if lang != 'en':
            translate(soup, dicts[lang])
            relink(soup)
        seo(soup, lang, page, dicts[lang])
        target = OUT / page if lang == 'en' else OUT / lang / page
        target.parent.mkdir(exist_ok=True)
        target.write_text(str(soup), encoding='utf-8')

# 3. plan du site et robots.txt
today = date.today().isoformat()
entries = []
for page in PAGES:
    for lang in LANGS:
        alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{c}" href="{url(c, page)}"/>' for c in LANGS)
        entries.append(f'<url><loc>{url(lang, page)}</loc><lastmod>{today}</lastmod>{alts}'
                       f'<xhtml:link rel="alternate" hreflang="x-default" href="{url("en", page)}"/></url>')
(OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + '\n'.join(entries) + '\n</urlset>\n', encoding='utf-8')
(OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n', encoding='utf-8')
print(f'{len(LANGS) * len(PAGES)} pages générées dans {OUT}')
