(function (AP) {
  const M = 4000;
  const phi = (k, x) => Math.cos((k * Math.PI * (x + 1)) / 2);

  function coeffs(f, K) {
    const c = new Array(K + 1).fill(0);
    for (let i = 0; i < M; i++) {
      const x = -1 + ((i + 0.5) * 2) / M, fx = f(x);
      for (let k = 0; k <= K; k++) c[k] += fx * phi(k, x);
    }
    for (let k = 0; k <= K; k++) c[k] *= 2 / M / (k === 0 ? 2 : 1);
    return c;
  }

  const series = (c, K) => (x) => { let s = 0; for (let k = 0; k <= K; k++) s += c[k] * phi(k, x); return s; };

  // How far the partial sum rises above f itself just right of the jump, as a fraction of the jump height.
  function overshoot(g, J, f) {
    let m = -Infinity;
    for (let i = 1; i <= 2000; i++) { const x = J.x + i * 1e-4; m = Math.max(m, g(x) - f(x)); }
    return m / (J.right - J.left);
  }

  AP.fourier = { coeffs, series, overshoot };
})(globalThis.AP = globalThis.AP || {});
