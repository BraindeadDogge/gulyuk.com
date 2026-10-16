(function (AP) {
  AP.initGlossary = function () {
    const defs = {};
    AP.glossary.forEach((g) => { defs[g.key] = g; });

    const dl = AP.$('gloss');
    if (dl) {
      [...AP.glossary].sort((a, b) => a.term.localeCompare(b.term)).forEach((g) => {
        const dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.id = 'g-' + g.key; dt.textContent = g.term; dd.textContent = g.def;
        dl.append(dt, dd);
      });
    }

    const pop = document.createElement('div');
    pop.id = 'gpop'; pop.setAttribute('role', 'tooltip'); pop.hidden = true;
    document.body.append(pop);
    AP.defer(() => pop.remove());
    let cur = null;
    const close = () => { pop.hidden = true; if (cur) cur.removeAttribute('aria-describedby'); cur = null; };
    const open = (a) => {
      const g = defs[a.dataset.g]; if (!g) return;
      pop.textContent = '';
      const b = document.createElement('b'); b.textContent = g.term + '. ';
      pop.append(b, g.def);
      pop.hidden = false; a.setAttribute('aria-describedby', 'gpop'); cur = a;
      const r = a.getBoundingClientRect();
      pop.style.top = (window.scrollY + r.bottom + 6) + 'px';
      pop.style.left = '8px'; /* measure at the widest shrink-to-fit width */
      pop.style.left = Math.max(8, Math.min(window.scrollX + r.left, document.documentElement.clientWidth - pop.offsetWidth - 8)) + 'px';
    };
    document.querySelectorAll('abbr[data-g]').forEach((a) => {
      a.tabIndex = 0; a.setAttribute('role', 'button');
      const toggle = () => (cur === a ? close() : open(a));
      a.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
      a.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        if (e.key === 'Escape') close();
      });
    });
    AP.on(document, 'click', (e) => { if (!pop.contains(e.target)) close(); });
    AP.on(document, 'keydown', (e) => { if (e.key === 'Escape') close(); });
    AP.on(window, 'resize', close);
  };
})(globalThis.AP = globalThis.AP || {});
