(() => {
  const S = window.SITE || {};
  const repo = S.github || 'MarcTT69/28JoursBox';
  const gh = `https://github.com/${repo}`;

  // Menu mobile
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // Apparition des blocs au défilement
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }), { threshold: 0.12 })
    : null;
  document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  // Forme d'onde animée de la maquette
  document.querySelectorAll('.wave').forEach((w) => {
    for (let i = 0; i < 46; i++) {
      const b = document.createElement('i');
      b.style.height = `${25 + Math.abs(Math.sin(i * 0.7) * 60 + Math.cos(i * 1.9) * 15)}%`;
      b.style.animationDelay = `${(i % 9) * 0.11}s`;
      w.appendChild(b);
    }
  });

  const T = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const locale = () => (window.I18N ? I18N.lang : 'en');

  // Liens vers GitHub (refaits après chaque changement de langue : les textes traduits en contiennent)
  function fixLinks() {
    document.querySelectorAll('[data-gh]').forEach((a) => { a.href = gh + (a.dataset.gh || ''); });
    document.querySelectorAll('[data-dl]').forEach((a) => {
      a.href = `${gh}/releases/latest/download/${a.dataset.dl}`;
    });
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  // Version et taille des installateurs (dernière Release GitHub)
  const metas = document.querySelectorAll('[data-dl-meta]');
  let release = null;
  function renderMetas() {
    if (!release) return;
    const date = new Date(release.published_at).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
    metas.forEach((m) => {
      const asset = (release.assets || []).find((x) => x.name === m.dataset.dlMeta);
      const size = asset ? ` · ${Math.round(asset.size / 1048576).toLocaleString(locale())} ${T('js.mb')}` : '';
      m.textContent = T('js.version', { v: release.tag_name, d: date }) + size;
    });
  }
  if (metas.length) {
    fetch(`https://api.github.com/repos/${repo}/releases/latest`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rel) => { release = rel; renderMetas(); })
      .catch(() => {});
  }

  // Dons PayPal
  const donBtn = document.getElementById('don-btn');
  let amount = 10;
  function renderDon() {
    if (!donBtn) return;
    const msg = document.getElementById('don-msg');
    if (!S.paypalMe) {
      donBtn.removeAttribute('href');
      donBtn.setAttribute('aria-disabled', 'true');
      donBtn.style.opacity = '.55';
      msg.textContent = T('js.don_soon');
      return;
    }
    donBtn.href = `https://www.paypal.com/paypalme/${encodeURIComponent(S.paypalMe)}${amount ? `/${amount}EUR` : ''}`;
    donBtn.querySelector('span').textContent = amount ? T('js.don_amount', { n: amount }) : T('js.don_free');
  }
  document.querySelectorAll('.amount').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.amount').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    amount = Number(b.dataset.v) || 0;
    renderDon();
  }));

  // Tableaux empilés sur mobile : chaque cellule reçoit le titre de sa colonne
  function labelTables() {
    document.querySelectorAll('table.stack-sm').forEach((tb) => {
      const heads = [...tb.querySelectorAll('thead th')].map((th) => th.textContent.trim());
      tb.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((cell, i) => { if (heads[i]) cell.dataset.label = heads[i]; }));
    });
  }

  const refresh = () => { fixLinks(); renderMetas(); renderDon(); labelTables(); };
  refresh();
  document.addEventListener('langchange', refresh);

  // Forum intégré (giscus)
  const box = document.getElementById('giscus');
  if (box) {
    const g = S.giscus || {};
    if (g.repoId && g.categoryId) {
      const s = document.createElement('script');
      s.src = 'https://giscus.app/client.js';
      Object.entries({
        'data-repo': repo, 'data-repo-id': g.repoId,
        'data-category': g.category || 'General', 'data-category-id': g.categoryId,
        'data-mapping': 'specific', 'data-term': 'Forum 28JoursBox',
        'data-strict': '0', 'data-reactions-enabled': '1', 'data-emit-metadata': '0',
        'data-input-position': 'top', 'data-theme': 'transparent_dark', 'data-lang': locale(),
        'data-loading': 'lazy', crossorigin: 'anonymous',
      }).forEach(([k, v]) => s.setAttribute(k, v));
      s.async = true;
      box.innerHTML = '';
      box.appendChild(s);
    }
  }

})();
