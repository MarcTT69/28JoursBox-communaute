// Mode d'emploi : sommaire repliable sur mobile, recherche, section en cours surlignée.
(() => {
  const toc = document.querySelector('.toc');
  if (!toc) return;
  const details = toc.querySelector('details');
  const wide = matchMedia('(min-width: 961px)');
  const syncOpen = () => { details.open = wide.matches; };
  syncOpen();
  wide.addEventListener('change', syncOpen);

  // Sur mobile, refermer le sommaire après un choix
  toc.addEventListener('click', (e) => { if (e.target.closest('a') && !wide.matches) details.open = false; });

  // Recherche : filtre les entrées du sommaire et les sections par leur texte
  const input = document.getElementById('toc-search');
  const nores = document.getElementById('toc-nores');
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const items = [...toc.querySelectorAll('li')].map((li) => {
    const a = li.querySelector(':scope > a');
    const target = document.getElementById(a.getAttribute('href').slice(1));
    let text = target ? target.textContent : '';
    if (target && target.tagName === 'H3') {
      // Le texte d'une sous-section va jusqu'au titre suivant
      for (let n = target.nextElementSibling; n && !/^H[23]$/.test(n.tagName); n = n.nextElementSibling) text += ' ' + n.textContent;
    }
    return { li, text: norm(text) };
  });
  input.addEventListener('input', () => {
    const q = norm(input.value.trim());
    let any = false;
    items.forEach(({ li, text }) => {
      const hit = !q || text.includes(q) || [...li.querySelectorAll('li')].some((sub) => items.find((x) => x.li === sub && x.text.includes(q)));
      li.hidden = !hit;
      if (hit) any = true;
    });
    nores.hidden = any;
  });

  // Section en cours
  const links = new Map([...toc.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
  const heads = [...document.querySelectorAll('.guide h2, .guide h3[id], .guide section[id]')].filter((h) => links.has(h.id));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove('on'));
        const a = links.get(e.target.id);
        if (a) { a.classList.add('on'); if (wide.matches) a.scrollIntoView({ block: 'nearest' }); }
      });
    }, { rootMargin: '-90px 0px -70% 0px' });
    heads.forEach((h) => io.observe(h));
  }
})();
