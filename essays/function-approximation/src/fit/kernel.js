(function (AP) {
  const MIN_NOISE = 0.02; // floor for the GP noise term: keeps the kernel matrix well conditioned
  const RBF_RIDGE = 0.12; // ridge the page uses for its Gaussian-bumps model: stops narrow bumps from producing huge weights
  const bump = (a, b, ell) => Math.exp(-((a - b) ** 2) / (2 * ell * ell));

  // Gaussian bumps at fixed centres; weights by ridge least squares (linear in the weights, nonlinear in the width).
  function rbf(xs, ys, centers, ell, ridge) {
    const Phi = xs.map((x) => centers.map((c) => bump(x, c, ell)));
    const sol = AP.linalg.lstsq(Phi, ys, ridge === undefined ? 1e-8 : ridge);
    const f = (x) => { let s = 0; for (let j = 0; j < centers.length; j++) s += sol.w[j] * bump(x, centers[j], ell); return s; };
    return { f, w: sol.w, unstable: sol.unstable };
  }

  // Gaussian-process regression, zero prior mean, unit prior variance. sd is the latent function's sd (no noise term).
  function gp(xs, ys, ell, noise) {
    const K0 = xs.map((a) => xs.map((b) => bump(a, b, ell)));
    let nz = noise, c, ok = false;
    for (let t = 0; t < 8; t++) {
      c = AP.linalg.cholesky(K0.map((row, i) => row.map((v, j) => v + (i === j ? nz * nz : 0))));
      // a pivot that is positive only by rounding noise is not a usable factor: require it to be relatively large
      ok = c.ok && c.minPiv > 1e-13 * c.maxDiag;
      if (ok) break;
      if (t < 7) nz *= 2;
    }
    const alpha = AP.linalg.backward(c.L, AP.linalg.forward(c.L, ys));
    const kvec = (x) => xs.map((a) => bump(x, a, ell));
    const mean = (x) => { const k = kvec(x); let s = 0; for (let i = 0; i < k.length; i++) s += k[i] * alpha[i]; return s; };
    const sd = (x) => {
      const v = AP.linalg.forward(c.L, kvec(x)); let q = 0;
      for (let i = 0; i < v.length; i++) q += v[i] * v[i];
      return Math.sqrt(Math.max(0, 1 - q));
    };
    return { mean, sd, ok, noiseUsed: nz };
  }

  AP.kernel = { MIN_NOISE, RBF_RIDGE, rbf, gp };
})(globalThis.AP = globalThis.AP || {});
