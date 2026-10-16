(function (AP) {
  const tent = (u) => 1 - Math.abs(2 * u - 1);

  // L folds of the tent map, on x in [-1, 1] (u = (x + 1) / 2). Exactly representable by a width-2 ReLU net of depth L.
  const sawtooth = (L) => (x) => { let y = (x + 1) / 2; for (let i = 0; i < L; i++) y = tent(y); return y; };

  const deepParams = (L) => 6 * L;
  const shallowWidth = (P) => Math.max(1, Math.floor((P - 1) / 3));

  // Linear pieces of g on [-1, 1]: group the 2^16 cell slopes into maximal runs of equal slope and count runs of >= 2 cells;
  // a 1-cell run is a transitional cell straddling an off-grid kink, not a piece.
  function pieces(g) {
    const n = 1 << 16;
    let prev = NaN, run = 0, count = 0, y0 = g(-1);
    for (let i = 1; i <= n; i++) {
      const y1 = g(-1 + (2 * i) / n), s = (y1 - y0) * n;
      y0 = y1;
      if (Math.abs(s - prev) <= 1e-6 * (1 + Math.abs(s))) { run++; continue; }
      if (run >= 2) count++;
      prev = s; run = 1;
    }
    if (run >= 2) count++;
    return count;
  }

  AP.depth = { tent, sawtooth, deepParams, shallowWidth, pieces };
})(globalThis.AP = globalThis.AP || {});
