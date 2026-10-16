AP.chapters.push(function () {
  const cv = AP.$('c7'); if (!cv) return;
  const centers = AP.metrics.linspace(-1, 1, 12), pts = (xs, ys) => xs.map((x, i) => [x, ys[i]]);
  let mode = 'gp';
  const W = AP.slider('l7', (v) => v.toFixed(2), () => fig.invalidate());

  function model() {
    const d = AP.data, ell = +W.value;
    if (mode === 'rbf') return { f: AP.kernel.rbf(d.xs, d.ys, centers, ell, AP.kernel.RBF_RIDGE).f };
    const g = AP.kernel.gp(d.xs, d.ys, ell, Math.max(AP.kernel.MIN_NOISE, d.noise));
    return { f: g.mean, sd: g.sd };
  }
  const fig = AP.figure(cv, () => {
    const d = AP.data, m = model(), g = m.f;
    AP.plot(cv, Object.assign({}, AP.VIEW, {
      band: m.sd ? [{ lo: (x) => g(x) - 2 * m.sd(x), hi: (x) => g(x) + 2 * m.sd(x) }] : [],
      curves: [{ f: d.f, color: '--ink', width: 2 }, { f: g, color: '--curve', width: 3 }],
      points: [{ pts: pts(d.xs, d.ys), filled: true }, { pts: pts(d.xv, d.yv) }],
    }));
    AP.$('ro7').innerHTML = AP.S.ro.score(AP.score(g), mode === 'rbf'
      ? [['width', (+W.value).toFixed(2)], ['parameters', centers.length]]
      : [['width', (+W.value).toFixed(2)], ['stores', d.xs.length + ' points']]);
  });
  const setMode = AP.choice(AP.$('mode7'), mode, (v) => { mode = v; fig.invalidate(); });

  AP.$('break7').addEventListener('click', () => {
    mode = 'rbf'; setMode('rbf'); W.value = 0.03; AP.syncSlider('l7'); AP.note('bn7', AP.S.breakNote.ch7);
  });
  AP.$('reset7').addEventListener('click', () => {
    mode = 'gp'; setMode('gp'); AP.resetSliders(['l7']); AP.note('bn7', ''); fig.invalidate();
  });
  AP.$('pin7').addEventListener('click', () => {
    const t = performance.now(), m = model(), ell = +W.value, d = AP.data;
    const ms = performance.now() - t;
    AP.pin(mode === 'rbf'
      ? { name: AP.S.pin.rbf(ell), f: m.f, params: centers.length, ms }
      : { name: AP.S.pin.gp(ell), f: m.f, params: d.xs.length, paramText: d.xs.length + ' stored points', ms });
  });
});
