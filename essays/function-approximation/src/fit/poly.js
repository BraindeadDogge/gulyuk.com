(function (AP) {
  const monoBasis = (d, x) => { const r = []; let p = 1; for (let k = 0; k <= d; k++) { r.push(p); p *= x; } return r; };
  const chebBasis = (d, x) => {
    const r = [1];
    if (d >= 1) r.push(x);
    for (let k = 2; k <= d; k++) r.push(2 * x * r[k - 1] - r[k - 2]);
    return r;
  };

  function fit(xs, ys, d, basis) {
    const B = basis === 'cheb' ? chebBasis : monoBasis;
    const sol = AP.linalg.lstsq(xs.map((x) => B(d, x)), ys);
    const w = sol.w;
    const f = (x) => { const b = B(d, x); let s = 0; for (let k = 0; k <= d; k++) s += w[k] * b[k]; return s; };
    return { f, w, unstable: sol.unstable };
  }

  const nodes = (kind, n) =>
    kind === 'cheb' ? Array.from({ length: n + 1 }, (_, j) => -Math.cos((Math.PI * j) / n)) : AP.metrics.linspace(-1, 1, n + 1);

  function weights(kind, n) {
    const w = [];
    if (kind === 'cheb') {
      for (let j = 0; j <= n; j++) w.push((j % 2 ? -1 : 1) * (j === 0 || j === n ? 0.5 : 1));
    } else {
      let c = 1; // binomial C(n, j)
      for (let j = 0; j <= n; j++) { w.push((j % 2 ? -1 : 1) * c); c = (c * (n - j)) / (j + 1); }
    }
    return w;
  }

  const bary = (xs, ys, ws) => (x) => {
    let num = 0, den = 0;
    for (let j = 0; j < xs.length; j++) {
      const d = x - xs[j];
      if (d === 0) return ys[j];
      const t = ws[j] / d;
      num += t * ys[j]; den += t;
    }
    return num / den;
  };

  function interpolate(kind, f, n) {
    const xs = nodes(kind, n);
    return { f: bary(xs, xs.map(f), weights(kind, n)), nodes: xs };
  }

  AP.poly = { monoBasis, chebBasis, fit, nodes, interpolate };
})(globalThis.AP = globalThis.AP || {});
