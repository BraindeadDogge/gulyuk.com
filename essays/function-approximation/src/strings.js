(function (AP) {
  const f3 = (v) => v.toFixed(3);
  const parts = (a) => a.map(([k, v]) => ' · ' + k + ' <b>' + v + '</b>').join('');
  AP.S = {
    breakNote: {
      ch1: 'Degree 18 in powers of x: the columns of the problem are nearly parallel, so the solve loses its digits and the page flags it.',
      ch2: 'Twenty equispaced nodes: the polynomial is pinned at every node but swings wildly between them near the ends.',
      ch3: 'Three knots cannot follow the curve: a spline can only bend where it has a knot.',
      ch4: 'A jump has no smooth cosine expansion: forty waves ring on both sides, and the overshoot beside the jump does not shrink.',
      ch5: 'Degree 20 on 30 noisy dots: the curve threads the dots and swings between them, so the test error ends far above the training error.',
      ch6: 'k = 1 on noisy points: every dot becomes its own plateau, so the curve copies the noise.',
      ch7: 'Bumps much narrower than the gaps between their centres: between the centres the fit falls back to zero.',
      ch9: 'Eight folds: the deep curve has 2^8 teeth; a shallow net with the same number of parameters has only a handful of pieces.',
      ch10: 'With the plain input, 300 steps of training learn the slow wave but not the fast one. Training longer would eventually find it.',
    },
    warn: { unstable: ' · <span class="warn">numerically unstable: try the Chebyshev basis</span>' },
    notice: { pinsCleared: 'Pinned fits were cleared.', knotsSnapped: 'Knots snapped onto the new target.' },
    pinEmpty: 'Nothing pinned yet. Use "Pin to compare" in any figure that has the button.',
    pinLine: (p) => p.name + ' · ' + p.err.label + ' ' + p.err.value.toFixed(3) + ' · ' + (p.paramText || p.params + ' parameters') + ' · ' + (p.ms < 1 ? '<1' : p.ms.toFixed(0)) + ' ms',
    pinRemove: (name) => 'Remove ' + name,
    ro: {
      ch0: (mse) => 'Mean squared error: <b>' + mse.toFixed(4) + '</b>',
      ch1: (o) => 'Train RMSE <b>' + f3(o.tr) + '</b> · Test RMSE <b>' + f3(o.te) + '</b> · parameters <b>' + o.params + '</b>' + (o.unstable ? AP.S.warn.unstable : ''),
      ch2: (e, nodes) => 'Max error <b>' + (e < 100 ? e.toFixed(3) : e.toFixed(0)) + '</b> · nodes <b>' + nodes + '</b>',
      score: (s, a) => s.label + ' <b>' + f3(s.value) + '</b>' + parts(a),
      ch5: (o) => 'Train RMSE <b>' + f3(o.tr) + '</b> · Test RMSE <b>' + f3(o.te) + '</b> · bias² <b>' + f3(o.bias2) + '</b> · variance <b>' + f3(o.variance) + '</b>',
      ch9: (o) => 'layers <b>' + o.L + '</b> · deep: <b>' + o.P + '</b> ' + (o.P === 1 ? 'parameter' : 'parameters') + ', <b>' + o.deepPieces + '</b> ' + (o.deepPieces === 1 ? 'piece' : 'pieces') + ' · shallow, same budget: <b>' + o.W + '</b> ' + (o.W === 1 ? 'neuron' : 'neurons') + ', <b>' + o.shallowPieces + '</b> ' + (o.shallowPieces === 1 ? 'piece' : 'pieces') + ', max error <b>' + f3(o.err) + '</b>',
      ch10: (o) => 'steps <b>' + o.steps + '</b> · loss <b>' + f3(o.loss) + '</b> · slow wave learned <b>' + o.low + '%</b> · fast wave learned <b>' + o.high + '%</b>',
    },
    pin: {
      poly: (d, cheb) => 'Polynomial, degree ' + d + (cheb ? ' (Chebyshev basis)' : ''),
      spline: (mode, n) => (mode === 'linear' ? 'Linear spline, ' : 'Cubic spline, ') + n + ' knots',
      cosine: (k) => 'Cosine series, K = ' + k,
      net: (kind, n) => ({ step: 'Step net', sigmoid: 'Sigmoid net', relu: 'ReLU net' }[kind]) + ', N = ' + n,
      knn: (k) => 'Nearest neighbours, k = ' + k,
      boost: (m) => 'Boosted stumps, M = ' + m,
      rbf: (ell) => 'Gaussian bumps, width ' + ell.toFixed(2),
      gp: (ell) => 'Gaussian process, width ' + ell.toFixed(2),
    },
  };
})(globalThis.AP = globalThis.AP || {});
