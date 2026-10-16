(function (AP) {
  function knn(xs, ys, k) {
    const n = xs.length, kk = Math.max(1, Math.min(Math.round(k), n));
    return (x) => {
      const idx = xs.map((_, i) => i).sort((a, b) => Math.abs(xs[a] - x) - Math.abs(xs[b] - x) || a - b);
      let s = 0;
      for (let j = 0; j < kk; j++) s += ys[idx[j]];
      return s / kk;
    };
  }

  // Best single split of the residuals r over ascending xs: maximises the drop in squared error.
  function bestStump(xs, r) {
    const n = xs.length;
    let tot = 0;
    for (const v of r) tot += v;
    let best = { t: xs[0], l: tot / n, r: tot / n }, gain = -Infinity, sl = 0;
    for (let i = 1; i < n; i++) {
      sl += r[i - 1];
      if (!(xs[i] > xs[i - 1])) continue; // cannot split between equal x values
      const g = (sl * sl) / i + ((tot - sl) * (tot - sl)) / (n - i);
      if (g > gain) { gain = g; best = { t: (xs[i - 1] + xs[i]) / 2, l: sl / i, r: (tot - sl) / (n - i) }; }
    }
    return best;
  }

  function boost(xs, ys, M, lr) {
    const rate = lr === undefined ? 0.5 : lr, n = xs.length;
    let base = 0;
    for (const y of ys) base += y;
    base /= n;
    const stumps = [], res = [ys.map((y) => y - base)];
    let pred = ys.map(() => base);
    for (let m = 0; m < M; m++) {
      const s = bestStump(xs, res[m]);
      stumps.push(s);
      pred = pred.map((p, i) => p + rate * (xs[i] <= s.t ? s.l : s.r));
      res.push(ys.map((y, i) => y - pred[i]));
    }
    const upto = (m) => Math.max(0, Math.min(Math.round(m), M));
    return {
      base, stumps,
      predict: (m) => (x) => { let p = base; for (let j = 0; j < upto(m); j++) p += rate * (x <= stumps[j].t ? stumps[j].l : stumps[j].r); return p; },
      residuals: (m) => res[upto(m)],
      next: (m) => stumps[upto(m)] || null,
    };
  }

  // Edge length of a cube that holds `frac` of uniformly spread data in `dim` dimensions.
  const cubeEdge = (frac, dim) => Math.pow(frac, 1 / dim);

  AP.trees = { knn, boost, cubeEdge };
})(globalThis.AP = globalThis.AP || {});
