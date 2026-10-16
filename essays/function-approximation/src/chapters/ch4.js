AP.chapters.push(function () {
  const cv = AP.$('c4'); if (!cv) return;
  const KMAX = 60;
  let cache = { key: '', c: null };
  const coeffs = () => {
    if (cache.key !== AP.dataKey()) cache = { key: AP.dataKey(), c: AP.fourier.coeffs(AP.data.f, KMAX) };
    return cache.c;
  };
  const K = AP.slider('k4', null, () => fig.invalidate());
  const fig = AP.figure(cv, () => {
    const c = coeffs();
    const k = +K.value, g = AP.fourier.series(c, k), d = AP.data;
    AP.plot(cv, Object.assign({}, AP.VIEW, {
      gap: [{ f: g, g: d.f }],
      curves: [{ f: d.f, color: '--ink', width: 2 }, { f: g, color: '--curve', width: 3 }],
    }));
    const s = AP.score(g), parts = [['parameters', k + 1]];
    if (AP.state.target === 'jump') parts.push(['overshoot', (100 * AP.fourier.overshoot(g, AP.targets.JUMP, d.f)).toFixed(1) + '% of the jump']);
    AP.$('ro4').innerHTML = AP.S.ro.score(s, parts);
  });
  AP.$('break4').addEventListener('click', () => { AP.setState({ target: 'jump' }); K.value = 40; AP.syncSlider('k4'); fig.invalidate(); AP.note('bn4', AP.S.breakNote.ch4); });
  AP.$('reset4').addEventListener('click', () => { AP.resetSliders(['k4']); AP.note('bn4', ''); fig.invalidate(); });
  AP.$('pin4').addEventListener('click', () => {
    const k = +K.value, t = performance.now(), c = AP.fourier.coeffs(AP.data.f, k), ms2 = performance.now() - t;
    AP.pin({ name: AP.S.pin.cosine(k), f: AP.fourier.series(c, k), params: k + 1, ms: ms2 });
  });
});
