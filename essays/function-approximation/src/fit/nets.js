(function (AP) {
  function build(f, N, kind, s) {
    const a = -1, h = 2 / N, units = [], base = f(a);
    let out;
    if (kind === 'relu') {
      let prev = 0;
      for (let i = 0; i < N; i++) {
        const slope = (f(a + (i + 1) * h) - f(a + i * h)) / h;
        units.push({ c: a + i * h, v: slope - prev });
        prev = slope;
      }
      out = (x) => base + units.reduce((t, u) => t + u.v * Math.max(0, x - u.c), 0);
    } else {
      for (let i = 1; i <= N; i++) units.push({ c: a + (i - 0.5) * h, v: f(a + i * h) - f(a + (i - 1) * h) });
      const slope = s === undefined ? 8 : s;
      const act = kind === 'step' ? (z) => (z >= 0 ? 1 : 0) : (z) => 1 / (1 + Math.exp(-(slope * z) / h));
      out = (x) => base + units.reduce((t, u) => t + u.v * act(x - u.c), 0);
    }
    return { out, units, params: 3 * N + 1 };
  }
  AP.nets = { build };
})(globalThis.AP = globalThis.AP || {});
