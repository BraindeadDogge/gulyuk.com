(function (AP) {
  const LOW = 1, HIGH = 8, AMP_LOW = 1, AMP_HIGH = 0.5, STEPS = 300, LR = 0.01, N = 48;
  const SIGMAS = [0, 1, 2, 4, 8, 16];
  const target = (x) => AMP_LOW * Math.sin(LOW * Math.PI * x) + AMP_HIGH * Math.sin(HIGH * Math.PI * x);
  const xs = Array.from({ length: N }, (_, i) => -1 + (2 * (i + 0.5)) / N);
  const train = { xs, ys: xs.map(target) };

  // integral of g(x) sin(k pi x) over [-1, 1]; for g = A sin(k pi x) this is A.
  function amp(g, k, M) {
    const m = M || 2000;
    let s = 0;
    for (let i = 0; i < m; i++) { const x = -1 + (2 * (i + 0.5)) / m; s += g(x) * Math.sin(k * Math.PI * x); }
    return (s * 2) / m;
  }

  const pct = (g, k, a, M) => Math.max(0, Math.floor((100 * amp(g, k, M)) / a + 1e-6));

  function make(sigma, seed) {
    const feat = AP.mlp.features(sigma, 16, seed + 1);
    const net = AP.mlp.create([feat.dim, 32, 32, 1], seed);
    const X = train.xs.map((x) => feat.map(x)), Y = train.ys;
    const run = { sigma, steps: 0, loss: AP.mlp.loss(net, X, Y), g: (x) => AP.mlp.predict(net, feat.map(x)) };
    run.advance = (k) => {
      const kk = Number.isFinite(k) ? k : 0;
      const n = Math.max(0, Math.min(kk, STEPS - run.steps));
      for (let i = 0; i < n; i++) run.loss = AP.mlp.step(net, X, Y, LR);
      run.steps += n;
    };
    return run;
  }

  AP.spectral = { LOW, HIGH, AMP_LOW, AMP_HIGH, STEPS, LR, SIGMAS, target, train, amp, pct, make };
})(globalThis.AP = globalThis.AP || {});
