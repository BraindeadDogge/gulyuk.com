AP.chapters.push(function () {
  const cv = AP.$('c6a'); if (!cv) return;
  const cvR = AP.$('c6b');
  let mode = 'knn', cache = { key: '', b: null };
  const pts = (xs, ys) => xs.map((x, i) => [x, ys[i]]);
  const K = AP.slider('k6', null, () => fig.invalidate());
  const M = AP.slider('m6', null, () => { fig.invalidate(); figR.invalidate(); });
  const boosted = () => {
    if (cache.key !== AP.dataKey()) cache = { key: AP.dataKey(), b: AP.trees.boost(AP.data.xs, AP.data.ys, 60, 0.5) };
    return cache.b;
  };
  const model = () => (mode === 'knn' ? AP.trees.knn(AP.data.xs, AP.data.ys, +K.value) : boosted().predict(+M.value));

  const fig = AP.figure(cv, () => {
    const d = AP.data, g = model();
    AP.plot(cv, Object.assign({}, AP.VIEW, {
      gap: [{ f: g, g: d.f }],
      curves: [{ f: d.f, color: '--ink', width: 2 }, { f: g, color: '--curve', width: 3 }],
      points: [{ pts: pts(d.xs, d.ys), filled: true }, { pts: pts(d.xv, d.yv) }],
    }));
    AP.$('ro6').innerHTML = AP.S.ro.score(AP.score(g), mode === 'knn'
      ? [['k', K.value], ['stores', d.xs.length + ' points']]
      : [['stumps', M.value], ['parameters', 3 * +M.value + 1]]);
  });
  const figR = AP.figure(cvR, () => {
    if (mode !== 'boost') return;
    const b = boosted(), m = +M.value, s = b.next(m), d = AP.data;
    AP.plot(cvR, Object.assign({}, AP.VIEW, {
      curves: s ? [{ f: (x) => (x <= s.t ? s.l : s.r), color: '--curve', width: 2.5 }] : [],
      points: [{ pts: pts(d.xs, b.residuals(m)), filled: true, color: '--err' }],
    }));
  });

  function sync() {
    AP.$('k6wrap').hidden = mode !== 'knn';
    AP.$('m6wrap').hidden = mode !== 'boost';
    cvR.hidden = mode !== 'boost';
    fig.invalidate(); figR.invalidate();
  }
  const setMode = AP.choice(AP.$('mode6'), mode, (v) => { mode = v; sync(); });

  AP.$('break6').addEventListener('click', () => {
    AP.setState({ target: 'noisy' }); mode = 'knn'; setMode('knn');
    K.value = 1; AP.syncSlider('k6'); sync(); AP.note('bn6', AP.S.breakNote.ch6);
  });
  AP.$('reset6').addEventListener('click', () => {
    mode = 'knn'; setMode('knn'); AP.resetSliders(['k6', 'm6']); AP.note('bn6', ''); sync();
  });
  AP.$('pin6').addEventListener('click', () => {
    const d = AP.data, t = performance.now();
    if (mode === 'knn') {
      const f = AP.trees.knn(d.xs, d.ys, +K.value);
      AP.pin({ name: AP.S.pin.knn(+K.value), f, params: d.xs.length, paramText: d.xs.length + ' stored points', ms: performance.now() - t });
    } else {
      const b = AP.trees.boost(d.xs, d.ys, +M.value, 0.5);
      AP.pin({ name: AP.S.pin.boost(+M.value), f: b.predict(+M.value), params: 3 * +M.value + 1, ms: performance.now() - t });
    }
  });
});
