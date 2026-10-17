// Langues du site : l'anglais est dans le HTML, les autres dans lang/<code>.json.
(() => {
  const LANGS = [
    ['en', 'English'], ['fr', 'Français'], ['es', 'Español'],
    ['de', 'Deutsch'], ['it', 'Italiano'], ['pt', 'Português'],
  ];
  const codes = LANGS.map((l) => l[0]);
  // Pages générées (une par langue) : la langue est dans l'adresse, les autres versions dans <link rel=alternate>
  const staticLang = document.documentElement.dataset.staticLang;
  const root = document.documentElement.dataset.root || '';
  const altUrl = (code) => document.querySelector(`link[rel="alternate"][hreflang="${code}"]`)?.href;
  const cache = {};
  let dict = {};

  const store = {
    get() { try { return localStorage.getItem('lang'); } catch { return null; } },
    set(v) { try { localStorage.setItem('lang', v); } catch { /* navigation privée */ } },
  };

  function t(key, vars = {}) {
    const s = dict[key] || cache.en?.[key] || key;
    return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  }

  function load(code) {
    if (cache[code]) return Promise.resolve(cache[code]);
    return fetch(`${root}lang/${code}.json?v=18`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => (cache[code] = d));
  }

  function apply(d) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const s = d[el.dataset.i18n];
      if (s == null) return;
      if (el.tagName === 'TITLE') el.textContent = s; else el.innerHTML = s;
    });
    ['content', 'alt', 'aria-label', 'placeholder'].forEach((attr) => {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => {
        const s = d[el.getAttribute(`data-i18n-${attr}`)];
        if (s != null) el.setAttribute(attr, s);
      });
    });
  }

  function setLang(code, save) {
    if (!codes.includes(code)) code = 'en';
    if (save) store.set(code);
    return Promise.all([load('en'), load(code)]).then(([en, d]) => {
      dict = d;
      apply(d);
      document.documentElement.lang = code;
      I18N.lang = code;
      renderMenu();
      document.dispatchEvent(new CustomEvent('langchange', { detail: code }));
    }).catch(() => { /* fichier de langue introuvable (ouverture en file://) : on reste en anglais */ });
  }

  // Menu : globe + code de la langue, liste déroulante
  const box = document.getElementById('lang');
  function renderMenu() {
    if (!box) return;
    const cur = I18N.lang;
    box.innerHTML = `
      <button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${t('js.language')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>
        <span>${cur.toUpperCase()}</span>
      </button>
      <ul class="lang-menu" role="menu" hidden>
        ${LANGS.map(([c, n]) => `<li role="none"><button type="button" role="menuitemradio" aria-checked="${c === cur}" data-lang="${c}" lang="${c}">${n}</button></li>`).join('')}
      </ul>`;
    const btn = box.querySelector('.lang-btn');
    const menu = box.querySelector('.lang-menu');
    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      btn.setAttribute('aria-expanded', String(!menu.hidden));
    });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lang]');
      if (!b) return;
      close();
      const url = staticLang && altUrl(b.dataset.lang);
      if (url) { store.set(b.dataset.lang); if (b.dataset.lang !== staticLang) location.href = url + location.hash; return; }
      setLang(b.dataset.lang, true);
    });
    box.onkeydown = (e) => { if (e.key === 'Escape') { close(); btn.focus(); } };
  }
  document.addEventListener('click', () => {
    const menu = box?.querySelector('.lang-menu');
    if (menu && !menu.hidden) { menu.hidden = true; box.querySelector('.lang-btn').setAttribute('aria-expanded', 'false'); }
  });

  const I18N = window.I18N = { lang: 'en', t, setLang, langs: LANGS };

  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (staticLang) {
    // ?lang=xx, ou un choix mémorisé quand on arrive sur la version anglaise : aller à la bonne page
    const wanted = codes.includes(fromUrl) ? fromUrl : (staticLang === 'en' ? store.get() : null);
    if (codes.includes(fromUrl)) store.set(fromUrl);
    const url = wanted && wanted !== staticLang && altUrl(wanted);
    if (url) { location.replace(url + location.hash); return; }
    I18N.lang = staticLang;
    renderMenu();
    Promise.all([load('en'), load(staticLang)]).then(([, d]) => {
      dict = d; renderMenu();
      document.dispatchEvent(new CustomEvent('langchange', { detail: staticLang }));
    }).catch(() => {});
    return;
  }

  // Aperçu local (source non générée) : ?lang=xx, puis le choix mémorisé, sinon anglais
  const initial = codes.includes(fromUrl) ? fromUrl : (store.get() || 'en');
  if (codes.includes(fromUrl)) store.set(fromUrl);
  renderMenu();
  if (initial !== 'en') setLang(initial, false);
  else load('en').then((d) => { dict = d; renderMenu(); }).catch(() => {});
})();
