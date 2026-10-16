AP.chapters.push(function () {
  const cvA = AP.$('c8a'); if (!cvA) return;
  const sig = (z) => 1 / (1 + Math.exp(-z));

  // ---- 8a: one sigmoid, four knobs
  const ids = ['a-w', 'a-b', 'a-w2', 'a-b2'];
  const sl = ids.map((id, i) => AP.slider(id, i < 2 ? (v) => v.toFixed(1) : (v) => v.toFixed(2), () => figA.invalidate()));
  const figA = AP.figure(cvA, () => {
    const [w, b, w2, b2] = sl.map((s) => +s.value);
    AP.plot(cvA, { x0: -8, x1: 8, xs: 2, y0: -2, y1: 2.5, ys: 0.5,
      vlines: w !== 0 ? [{ x: -b / w, color: '--param' }] : [],
      curves: [{ f: sig, color: '--ghost', dash: [6, 5], width: 2 }, { f: (x) => w2 * sig(w * x + b) + b2, color: '--curve', width: 3 }] });
  });
  AP.$('reset8a').addEventListener('click', () => {
    [1, 0, 1, 0].forEach((v, i) => { sl[i].value = v; AP.syncSlider(ids[i]); });
  });

  // ---- 8b: N neurons approximating the shared target
  const cvB = AP.$('c8b');
  let kind = 'step', net = null, ms = 0;
  const N = AP.slider('n8', null, () => figB.invalidate());
  const S = AP.slider('s8', null, () => figB.invalidate());
  const figB = AP.figure(cvB, () => {
    const t = performance.now();
    net = AP.nets.build(AP.data.f, +N.value, kind, +S.value);
    ms = performance.now() - t;
    const d = AP.data;
    AP.plot(cvB, Object.assign({}, AP.VIEW, {
      vlines: +N.value <= 20 ? net.units.map((u) => ({ x: u.c, color: '--param' })) : [],
      gap: [{ f: net.out, g: d.f }],
      curves: [{ f: d.f, color: '--ink', width: 2 }, { f: net.out, color: '--curve', width: 3 }],
    }));
    AP.$('ro8').innerHTML = AP.S.ro.score(AP.score(net.out), [['neurons', N.value], ['parameters', net.params]]);
  });
  const setKind = AP.choice(AP.$('kind8'), kind, (v) => { kind = v; AP.$('s8wrap').hidden = v !== 'sigmoid'; figB.invalidate(); });
  AP.$('pin8').addEventListener('click', () => {
    const n = AP.nets.build(AP.data.f, +N.value, kind, +S.value);
    AP.pin({ name: AP.S.pin.net(kind, N.value), f: n.out, params: n.params, ms });
  });
  AP.$('reset8').addEventListener('click', () => {
    AP.resetSliders(['n8', 's8']); kind = 'step'; setKind('step'); AP.$('s8wrap').hidden = true; figB.invalidate();
  });
});
