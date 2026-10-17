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

  // Liens vers GitHub
  document.querySelectorAll('[data-gh]').forEach((a) => { a.href = gh + (a.dataset.gh || ''); });
  document.querySelectorAll('[data-dl]').forEach((a) => {
    a.href = `${gh}/releases/latest/download/${a.dataset.dl}`;
  });

  // Version et taille des installateurs (dernière Release GitHub)
  const metas = document.querySelectorAll('[data-dl-meta]');
  if (metas.length) {
    fetch(`https://api.github.com/repos/${repo}/releases/latest`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rel) => {
        const date = new Date(rel.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        metas.forEach((m) => {
          const asset = (rel.assets || []).find((x) => x.name === m.dataset.dlMeta);
          const size = asset ? ` · ${Math.round(asset.size / 1048576).toLocaleString('fr-FR')} Mo` : '';
          m.textContent = `Version ${rel.tag_name} du ${date}${size}`;
        });
      })
      .catch(() => metas.forEach((m) => { m.textContent = 'Windows 10 / 11 · 64 bits'; }));
  }

  // Dons PayPal
  const donBtn = document.getElementById('don-btn');
  if (donBtn) {
    let amount = 10;
    const msg = document.getElementById('don-msg');
    const update = () => {
      if (!S.paypalMe) {
        donBtn.removeAttribute('href');
        donBtn.setAttribute('aria-disabled', 'true');
        donBtn.style.opacity = '.55';
        msg.textContent = 'Le lien PayPal sera bientôt disponible.';
        return;
      }
      donBtn.href = `https://www.paypal.com/paypalme/${encodeURIComponent(S.paypalMe)}${amount ? `/${amount}EUR` : ''}`;
      donBtn.querySelector('span').textContent = amount ? `Donner ${amount} € avec PayPal` : 'Donner le montant de mon choix';
    };
    document.querySelectorAll('.amount').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.amount').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      amount = Number(b.dataset.v) || 0;
      update();
    }));
    update();
  }

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
        'data-input-position': 'top', 'data-theme': 'transparent_dark', 'data-lang': 'fr',
        'data-loading': 'lazy', crossorigin: 'anonymous',
      }).forEach(([k, v]) => s.setAttribute(k, v));
      s.async = true;
      box.innerHTML = '';
      box.appendChild(s);
    }
  }

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
