(function (AP) {
  function locate(xs, x) {
    let lo = 0, hi = xs.length - 2;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (xs[m] <= x) lo = m; else hi = m - 1; }
    return lo;
  }

  function linear(xs, ys) {
    return (x) => {
      const i = locate(xs, x);
      return ys[i] + ((x - xs[i]) / (xs[i + 1] - xs[i])) * (ys[i + 1] - ys[i]);
    };
  }

  function natural(xs, ys) {
    const n = xs.length;
    if (n < 3) return linear(xs, ys);
    const h = []; for (let i = 0; i < n - 1; i++) h.push(xs[i + 1] - xs[i]);
    const m = n - 2, a = [], b = [], c = [], r = [];
    for (let i = 0; i < m; i++) {
      a.push(h[i]); b.push(2 * (h[i] + h[i + 1])); c.push(h[i + 1]);
      r.push(6 * ((ys[i + 2] - ys[i + 1]) / h[i + 1] - (ys[i + 1] - ys[i]) / h[i]));
    }
    for (let i = 1; i < m; i++) { const w = a[i] / b[i - 1]; b[i] -= w * c[i - 1]; r[i] -= w * r[i - 1]; }
    const M = new Array(n).fill(0);
    M[m] = r[m - 1] / b[m - 1];
    for (let i = m - 2; i >= 0; i--) M[i + 1] = (r[i] - c[i] * M[i + 2]) / b[i];

    const seg = (i, x) => {
      const hh = h[i], l = xs[i + 1] - x, rr = x - xs[i];
      return (M[i] * l ** 3 + M[i + 1] * rr ** 3) / (6 * hh) + (ys[i] / hh - (M[i] * hh) / 6) * l + (ys[i + 1] / hh - (M[i + 1] * hh) / 6) * rr;
    };
    const dseg = (i, x) => {
      const hh = h[i], l = xs[i + 1] - x, rr = x - xs[i];
      return (-M[i] * l * l + M[i + 1] * rr * rr) / (2 * hh) - (ys[i] / hh - (M[i] * hh) / 6) + (ys[i + 1] / hh - (M[i + 1] * hh) / 6);
    };
    const s0 = dseg(0, xs[0]), s1 = dseg(n - 2, xs[n - 1]);
    return (x) => {
      if (x < xs[0]) return ys[0] + s0 * (x - xs[0]);
      if (x > xs[n - 1]) return ys[n - 1] + s1 * (x - xs[n - 1]);
      return seg(locate(xs, x), x);
    };
  }

  // Knots placed so each interval carries equal sqrt(|f''|) mass (optimal density for linear interpolation).
  function densityKnots(f, n) {
    const G = 4000, e = 1e-3, xs = AP.metrics.linspace(-1, 1, G + 1);
    const rho = xs.map((x) => {
      const c = Math.min(1 - e, Math.max(-1 + e, x));
      return Math.sqrt(Math.abs(f(c + e) - 2 * f(c) + f(c - e)) / (e * e));
    });
    const floor = 0.05 * Math.max(...rho);
    const cum = [0];
    for (let i = 1; i <= G; i++) cum.push(cum[i - 1] + (rho[i] + rho[i - 1]) / 2 + floor);
    const total = cum[G], out = [-1];
    let j = 0;
    for (let k = 1; k < n - 1; k++) {
      const t = (k / (n - 1)) * total;
      while (j < G && cum[j + 1] < t) j++;
      const frac = (t - cum[j]) / (cum[j + 1] - cum[j]);
      out.push(xs[j] + frac * (xs[j + 1] - xs[j]));
    }
    out.push(1);
    return out;
  }

  const JUMP_GAP = 0.02; // half-width of the steep ramp that stands in for a jump; equals the drag spacing in chapter 3

  // x positions where f changes by more than 5% of its range between neighbouring grid points.
  function jumpsOf(f) {
    const G = 4000, xs = AP.metrics.linspace(-1, 1, G + 1), ys = xs.map(f);
    const range = Math.max(...ys) - Math.min(...ys), out = [];
    for (let i = 0; i < G; i++) {
      if (Math.abs(ys[i + 1] - ys[i]) > 0.05 * range) {
        const c = (xs[i] + xs[i + 1]) / 2;
        if (!out.length || c - out[out.length - 1] > 0.1) out.push(c);
      }
    }
    return out.filter((c) => c - 2 * JUMP_GAP > -1 && c + 2 * JUMP_GAP < 1);
  }

  // Knots by curvature, plus a ramp pair (c - gap, c + gap) at every jump so a linear spline can follow it.
  function autoKnots(f, n) {
    const J = jumpsOf(f).slice(0, Math.floor((n - 2) / 2));
    const base = densityKnots(f, n - 2 * J.length);
    if (!J.length) return base;
    const keep = base.filter((x, i) => i === 0 || i === base.length - 1 || J.every((c) => Math.abs(x - c) > 2 * JUMP_GAP));
    const xs = keep.concat(J.flatMap((c) => [c - JUMP_GAP, c + JUMP_GAP])).sort((a, b) => a - b);
    while (xs.length < n) { // refill by splitting the widest gap
      let bi = 0;
      for (let i = 1; i < xs.length - 1; i++) if (xs[i + 1] - xs[i] > xs[bi + 1] - xs[bi]) bi = i;
      xs.splice(bi + 1, 0, (xs[bi] + xs[bi + 1]) / 2);
    }
    return xs;
  }

  const remap = (knots, f) => knots.map((k) => ({ x: k.x, y: f(k.x) }));

  AP.spline = { linear, natural, autoKnots, remap };
})(globalThis.AP = globalThis.AP || {});
