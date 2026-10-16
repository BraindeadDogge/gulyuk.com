AP.chapters.push(function () {
  const cv = AP.$('c0'); if (!cv) return;
  const rand = AP.rng(11), f = AP.targets.F.smooth;
  const pts = [];
  for (let i = 0; i < 24; i++) { const x = -1 + (2 * (i + 0.5)) / 24; pts.push([x, f(x) + 0.12 * AP.gauss(rand)]); }
  const hx = AP.metrics.linspace(-1, 1, 7);
  const zero = () => hx.map((x) => ({ x, y: 0 }));
  let hs = zero(), sel = 0;
  const curve = () => AP.spline.natural(hs.map((h) => h.x), hs.map((h) => h.y));
  const mse = (g) => pts.reduce((s, [x, y]) => s + (g(x) - y) ** 2, 0) / pts.length;

  const fig = AP.figure(cv, () => {
    const g = curve();
    AP.plot(cv, Object.assign({}, AP.VIEW, {
      curves: [{ f: g, color: '--curve', width: 3 }],
      points: [{ pts, filled: true }],
      handles: hs.map((h, i) => ({ x: h.x, y: h.y, active: i === sel })),
    }));
    AP.$('ro0').innerHTML = AP.S.ro.ch0(mse(g));
  });
  AP.handles(cv, {
    get: () => hs, step: [0, 0.02],
    move: (i, x, y) => { hs[i].y = Math.max(-1.2, Math.min(1.2, y)); fig.invalidate(); },
    select: (i) => { sel = i; fig.invalidate(); },
  });
  AP.$('fit0').addEventListener('click', () => {
    const r = AP.poly.fit(pts.map((p) => p[0]), pts.map((p) => p[1]), 5, 'cheb');
    hs.forEach((h) => { h.y = r.f(h.x); }); fig.invalidate();
  });
  AP.$('reset0').addEventListener('click', () => { hs = zero(); fig.invalidate(); });
});
