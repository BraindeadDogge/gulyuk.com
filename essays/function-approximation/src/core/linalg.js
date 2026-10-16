(function (AP) {
  // Cholesky factor L (lower triangular) of a symmetric matrix. ok is false if a pivot was not positive.
  function cholesky(M) {
    const n = M.length;
    const L = Array.from({ length: n }, () => new Array(n).fill(0));
    let ok = true, minPiv = Infinity, maxDiag = 0;
    for (let i = 0; i < n; i++) {
      maxDiag = Math.max(maxDiag, M[i][i]);
      for (let j = 0; j <= i; j++) {
        let s = M[i][j];
        for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        if (i === j) {
          minPiv = Math.min(minPiv, s);
          if (!(s > 0)) { ok = false; s = 1e-300; }
          L[i][i] = Math.sqrt(s);
        } else {
          L[i][j] = s / L[j][j];
        }
      }
    }
    return { L, ok, minPiv, maxDiag };
  }
  const forward = (L, r) => { // solve L z = r
    const n = r.length, z = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = r[i];
      for (let k = 0; k < i; k++) s -= L[i][k] * z[k];
      z[i] = s / L[i][i];
    }
    return z;
  };
  const backward = (L, z) => { // solve L^T w = z
    const n = z.length, w = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = z[i];
      for (let k = i + 1; k < n; k++) s -= L[k][i] * w[k];
      w[i] = s / L[i][i];
    }
    return w;
  };
  function cholSolve(M, r) {
    const c = cholesky(M);
    return { w: backward(c.L, forward(c.L, r)), unstable: !c.ok || !(c.minPiv / c.maxDiag >= 1e-11) };
  }

  // Least squares: minimise |Phi w - y|^2 via the normal equations.
  function lstsq(Phi, y, ridge) {
    const p = Phi[0].length, m = Phi.length;
    const A = Array.from({ length: p }, () => new Array(p).fill(0));
    const b = new Array(p).fill(0);
    for (let r = 0; r < m; r++) {
      const row = Phi[r];
      for (let i = 0; i < p; i++) {
        b[i] += row[i] * y[r];
        for (let j = 0; j <= i; j++) A[i][j] += row[i] * row[j];
      }
    }
    let tr = 0;
    for (let i = 0; i < p; i++) { for (let j = i + 1; j < p; j++) A[i][j] = A[j][i]; tr += A[i][i]; }
    const lam = (ridge === undefined ? 1e-15 : ridge) * tr / p;
    for (let i = 0; i < p; i++) A[i][i] += lam;
    return cholSolve(A, b);
  }

  AP.linalg = { lstsq, cholesky, forward, backward };
})(globalThis.AP = globalThis.AP || {});
