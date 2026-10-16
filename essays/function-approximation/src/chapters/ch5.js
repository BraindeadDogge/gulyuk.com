AP.chapters.push(function () {
  const cv = AP.$('c5a'); if (!cv) return;
  const cvB = AP.$('c5b'), BV = AP.biasvar, DMAX = BV.DMAX;
  let seed = BV.SEED, cache = null;
  const pts = (xs, ys) => xs.map((x, i) => [x, ys[i]]);
  const deg = AP.slider('deg5', null, () => { figA.invalidate(); figB.invalidate(); });

  function model() {
    const key = AP.dataKey() + '|' + seed;
    if (!cache || cache.key !== key) {
      const f = AP.data.f, s = BV.sample(f, 30, seed, BV.SD);
      cache = { key, f, s, held: BV.sample(f, 20, seed + 1000, BV.SD), curves: BV.curves(f, s, DMAX, AP.data.xt), dec: {}, grid: AP.metrics.linspace(-1, 1, 101) };
    }
    return cache;
  }
  const decomp = (m, d) => {
    if (!m.dec[d]) m.dec[d] = BV.decompose(m.f, d, 30, BV.TRIALS, seed * 100, BV.SD, m.grid);
    return m.dec[d];
  };

  const figA = AP.figure(cv, () => {
    const m = model(), d = +deg.value, g = BV.fit(m.s.xs, m.s.ys, d);
    AP.plot(cv, Object.assign({}, AP.VIEW, {
      gap: [{ f: g, g: m.f }],
      curves: [{ f: m.f, color: '--ink', width: 2 }, { f: g, color: '--curve', width: 3 }],
      points: [{ pts: pts(m.s.xs, m.s.ys), filled: true }, { pts: pts(m.held.xs, m.held.ys) }],
    }));
    const dc = decomp(m, d);
    AP.$('ro5').innerHTML = AP.S.ro.ch5({ tr: m.curves.train[d], te: m.curves.test[d], bias2: dc.bias2, variance: dc.variance });
  });

  const lin = (arr) => (x) => { const i = Math.max(0, Math.min(DMAX - 1, Math.floor(x))), t = Math.max(0, Math.min(DMAX, x)) - i; return arr[i] * (1 - t) + arr[i + 1] * t; };
  const figB = AP.figure(cvB, () => {
    const m = model(), top = Math.min(0.8, Math.max(0.3, Math.max(...m.curves.test.slice(0, 12)) * 1.05));
    AP.plot(cvB, { x0: 0, x1: DMAX, xs: 5, y0: 0, y1: top, ys: top > 0.5 ? 0.2 : 0.1,
      vlines: [{ x: +deg.value, color: '--param' }],
      curves: [{ f: lin(m.curves.train), color: '--curve', width: 2.5 }, { f: lin(m.curves.test), color: '--err', width: 2.5, dash: [6, 4] }] });
  });

  AP.$('resample5').addEventListener('click', () => { seed += 1; figA.invalidate(); figB.invalidate(); });
  AP.$('break5').addEventListener('click', () => { deg.value = DMAX; AP.syncSlider('deg5'); AP.note('bn5', AP.S.breakNote.ch5); });
  AP.$('reset5').addEventListener('click', () => {
    seed = BV.SEED; AP.resetSliders(['deg5']); AP.note('bn5', ''); figA.invalidate(); figB.invalidate();
  });
});
