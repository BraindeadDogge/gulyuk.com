(function (AP) {
  const SD = 0.15, SEED = 5, TRIALS = 40, DMAX = 20;

  // Chebyshev-basis least squares with a small relative ridge, so degree 20 on 30 random points stays sane.
  const RIDGE = 3e-4;
  function fit(xs, ys, d) {
    const w = AP.linalg.lstsq(xs.map((x) => AP.poly.chebBasis(d, x)), ys, RIDGE).w;
    return (x) => { const b = AP.poly.chebBasis(d, x); let t = 0; for (let k = 0; k <= d; k++) t += w[k] * b[k]; return t; };
  }

  // n noisy measurements of f at sorted uniform positions.
  function sample(f, n, seed, sd) {
    const rand = AP.rng(seed);
    const xs = Array.from({ length: n }, () => -1 + 2 * rand()).sort((a, b) => a - b);
    return { xs, ys: xs.map((x) => f(x) + sd * AP.gauss(rand)) };
  }

  // Train RMSE (on the sample) and test RMSE (against the true f on grid) for each polynomial degree 0..dmax.
  function curves(f, s, dmax, grid) {
    const train = [], test = [];
    for (let d = 0; d <= dmax; d++) {
      const g = fit(s.xs, s.ys, d);
      train.push(AP.metrics.rmsePts(g, s.xs, s.ys));
      test.push(AP.metrics.rmse(g, f, grid));
    }
    return { train, test };
  }

  // Refit the degree-d polynomial on `trials` fresh samples; split the mean test error into bias^2 and variance.
  function decompose(f, d, n, trials, seed, sd, grid) {
    const preds = [];
    for (let t = 0; t < trials; t++) {
      const s = sample(f, n, seed + t, sd), g = fit(s.xs, s.ys, d);
      preds.push(grid.map(g));
    }
    let bias2 = 0, variance = 0;
    grid.forEach((x, j) => {
      let m = 0;
      for (let t = 0; t < trials; t++) m += preds[t][j];
      m /= trials;
      let v = 0;
      for (let t = 0; t < trials; t++) v += (preds[t][j] - m) ** 2;
      variance += v / trials;
      bias2 += (m - f(x)) ** 2;
    });
    return { bias2: bias2 / grid.length, variance: variance / grid.length };
  }

  AP.biasvar = { SD, SEED, TRIALS, DMAX, fit, sample, curves, decompose };
})(globalThis.AP = globalThis.AP || {});
