AP.chapters.push(function () {
  const cvA = AP.$('c11a'); if (!cvA) return;
  const cvB = AP.$('c11b');
  const color = (i) => '--cat' + (i + 1);
  // Colour is never the only cue: each pinned fit also gets its own dash pattern, and the same one on its swatch.
  const DASHES = [[], [8, 4], [2, 3], [10, 3, 2, 3], [4, 4], [1, 5]];
  const SWATCH = ['solid', 'dashed', 'dotted', 'dashed', 'dashed', 'dotted'];
  const dash = (i) => DASHES[i % DASHES.length];

  const figA = AP.figure(cvA, () => {
    const d = AP.data;
    AP.plot(cvA, Object.assign({}, AP.VIEW, {
      curves: [{ f: d.f, color: '--ink', width: 2.2 }].concat(AP.pins.map((p, i) => ({ f: p.f, color: color(i), width: 2.5, dash: dash(i) }))),
      points: d.noise ? [{ pts: d.xs.map((x, i) => [x, d.ys[i]]), filled: true }, { pts: d.xv.map((x, i) => [x, d.yv[i]]) }] : [],
    }));
  });
  const figB = AP.figure(cvB, () => {
    AP.plot(cvB, { x0: -2, x1: 2, xs: 1, y0: -2.5, y1: 2.5, ys: 1, shade: [{ x0: -1, x1: 1 }],
      curves: [{ f: AP.data.f, color: '--ink', width: 2.2 }].concat(AP.pins.map((p, i) => ({ f: p.f, color: color(i), width: 2, dash: dash(i) }))) });
  });

  const list = AP.$('pinlist');
  function renderPins() {
    list.innerHTML = '';
    if (!AP.pins.length) { const li = document.createElement('li'); li.textContent = AP.S.pinEmpty; list.append(li); }
    AP.pins.forEach((p, i) => {
      const li = document.createElement('li');
      const sw = document.createElement('i'); sw.style.borderColor = AP.css(color(i)); sw.style.borderTopStyle = SWATCH[i % SWATCH.length];
      const txt = document.createElement('span');
      txt.textContent = AP.S.pinLine(p);
      const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', AP.S.pinRemove(p.name));
      x.addEventListener('click', () => AP.unpin(i));
      li.append(sw, txt, x); list.append(li);
    });
    figA.invalidate(); figB.invalidate();
  }
  AP.onPins(renderPins);
  AP.onState(() => figB.invalidate());
  renderPins();

  const PICKS = {
    smooth: ['cheb', 'spline', 'rbf', 'gp'],
    kinky: ['spline', 'knn', 'boost', 'deep'],
    noisy: ['poly', 'gp', 'boost', 'nn'],
    dims: ['boost', 'nn', 'deep'],
    sure: ['gp'],
  };
  let cur = null;
  AP.choice(AP.$('picks'), '', (v) => {
    cur = cur === v ? null : v;
    document.querySelectorAll('#cmp tbody tr').forEach((tr) => tr.classList.toggle('hit', !!cur && PICKS[cur].includes(tr.dataset.id)));
    [...AP.$('picks').querySelectorAll('button')].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === cur)));
  });
});
