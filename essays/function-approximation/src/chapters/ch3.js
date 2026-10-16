AP.chapters.push(function () {
  const cv = AP.$('c3'); if (!cv) return;
  let mode = 'linear', knots = [], sel = 0, moved = false; // moved: knots were dragged by hand since the last reset
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cnt = AP.slider('k3', null, () => { reset(false); fig.invalidate(); });
  function reset(auto) {
    const n = +cnt.value, f = AP.data.f;
    const xs = auto ? AP.spline.autoKnots(f, n) : AP.metrics.linspace(-1, 1, n);
    knots = xs.map((x) => ({ x, y: f(x) }));
    moved = false;
  }
  const curve = () => {
    const xs = knots.map((k) => k.x), ys = knots.map((k) => k.y);
    return mode === 'linear' ? AP.spline.linear(xs, ys) : AP.spline.natural(xs, ys);
  };
  reset(false);

  let ms = 0;
  const fig = AP.figure(cv, () => {
    const t = performance.now(), g = curve(); ms = performance.now() - t;
    const d = AP.data;
    AP.plot(cv, Object.assign({}, AP.VIEW, {
      gap: [{ f: g, g: d.f }],
      curves: [{ f: d.f, color: '--ink', width: 2 }, { f: g, color: '--curve', width: 3 }],
      handles: knots.map((k, i) => ({ x: k.x, y: k.y, active: i === sel })),
    }));
    AP.$('ro3').innerHTML = AP.S.ro.score(AP.score(g), [['knots', knots.length], ['parameters', 2 * knots.length]]);
  });
  AP.handles(cv, {
    get: () => knots, step: [0.02, 0.02],
    move: (i, x, y) => {
      const k = knots[i]; if (!k) return;
      moved = true;
      k.y = clamp(y, -1.2, 1.2);
      if (i > 0 && i < knots.length - 1) k.x = clamp(x, knots[i - 1].x + 0.02, knots[i + 1].x - 0.02);
      fig.invalidate();
    },
    select: (i) => { sel = i; fig.invalidate(); },
  });
  const setMode = AP.choice(AP.$('mode3'), mode, (v) => { mode = v; fig.invalidate(); });
  AP.$('auto3').addEventListener('click', () => { reset(true); fig.invalidate(); });
  AP.$('break3').addEventListener('click', () => { cnt.value = 3; AP.syncSlider('k3'); reset(false); fig.invalidate(); AP.note('bn3', AP.S.breakNote.ch3); });
  AP.$('reset3').addEventListener('click', () => {
    AP.resetSliders(['k3']); mode = 'linear'; setMode('linear'); sel = 0; reset(false); AP.note('bn3', ''); fig.invalidate();
  });
  AP.$('pin3').addEventListener('click', () => AP.pin({ name: AP.S.pin.spline(mode, knots.length), f: curve(), params: 2 * knots.length, ms }));
  AP.onState(() => {
    knots = AP.spline.remap(knots, AP.data.f);
    if (moved) { AP.notice(AP.S.notice.knotsSnapped); moved = false; }
    fig.invalidate();
  });
});
