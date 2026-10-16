AP.chapters.push(function () {
  const cv = AP.$('c1'); if (!cv) return;
  let basis = 'mono', res = null, ms = 0;
  const deg = AP.slider('deg1', null, () => fig.invalidate());
  const pts = (xs, ys) => xs.map((x, i) => [x, ys[i]]);

  function compute() {
    const t = performance.now(), d = AP.data;
    res = AP.poly.fit(d.xs, d.ys, +deg.value, basis);
    ms = performance.now() - t;
  }
  const fig = AP.figure(cv, () => {
    compute();
    const d = AP.data, g = res.f;
    AP.plot(cv, Object.assign({}, AP.VIEW, {
      gap: [{ f: g, g: d.f }],
      curves: [{ f: d.f, color: '--ink', width: 2 }, { f: g, color: '--curve', width: 3 }],
      points: [{ pts: pts(d.xs, d.ys), filled: true }, { pts: pts(d.xv, d.yv) }],
    }));
    AP.$('ro1').innerHTML = AP.S.ro.ch1({
      tr: AP.metrics.rmsePts(g, d.xs, d.ys), te: AP.metrics.rmse(g, d.f, d.xt), params: +deg.value + 1, unstable: res.unstable,
    });
  });
  const setBasis = AP.choice(AP.$('basis1'), basis, (v) => { basis = v; fig.invalidate(); });
  AP.$('break1').addEventListener('click', () => {
    deg.value = 18; AP.syncSlider('deg1'); basis = 'mono'; setBasis('mono'); fig.invalidate();
    AP.note('bn1', AP.S.breakNote.ch1);
  });
  AP.$('reset1').addEventListener('click', () => {
    AP.resetSliders(['deg1']); basis = 'mono'; setBasis('mono'); AP.note('bn1', ''); fig.invalidate();
  });
  AP.$('pin1').addEventListener('click', () => {
    compute();
    AP.pin({ name: AP.S.pin.poly(+deg.value, basis === 'cheb'), f: res.f, params: +deg.value + 1, ms });
  });
});
