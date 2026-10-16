AP.chapters.push(function () {
  const cv = AP.$('c2'); if (!cv) return;
  const R = AP.targets.F.runge, grid = AP.metrics.linspace(-1, 1, 2001);
  let kind = 'equi';
  const n = AP.slider('n2', null, () => fig.invalidate());
  const fig = AP.figure(cv, () => {
    const r = AP.poly.interpolate(kind, R, +n.value), g = r.f;
    AP.plot(cv, { x0: -1, x1: 1, xs: 0.5, y0: -0.6, y1: 1.6, ys: 0.4,
      gap: [{ f: g, g: R }],
      curves: [{ f: R, color: '--ink', width: 2 }, { f: g, color: '--curve', width: 3 }],
      points: [{ pts: r.nodes.map((x) => [x, -0.5]), filled: true, color: '--param' }] });
    AP.$('ro2').innerHTML = AP.S.ro.ch2(AP.metrics.maxErr(g, R, grid), r.nodes.length);
  });
  const setKind = AP.choice(AP.$('kind2'), kind, (v) => { kind = v; fig.invalidate(); });
  AP.$('break2').addEventListener('click', () => {
    kind = 'equi'; setKind('equi'); n.value = 20; AP.syncSlider('n2'); fig.invalidate();
    AP.note('bn2', AP.S.breakNote.ch2);
  });
  AP.$('reset2').addEventListener('click', () => {
    AP.resetSliders(['n2']); kind = 'equi'; setKind('equi'); AP.note('bn2', ''); fig.invalidate();
  });
});
