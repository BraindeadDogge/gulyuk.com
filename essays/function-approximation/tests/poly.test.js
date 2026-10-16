const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();
const M = AP.metrics;
const grid = M.linspace(-1, 1, 2001);

test('degree-2 fit recovers an exact quadratic in both bases', () => {
  const q = (x) => 2 - 3 * x + 0.5 * x * x;
  const xs = M.linspace(-1, 1, 25), ys = xs.map(q);
  for (const basis of ['mono', 'cheb']) {
    const r = AP.poly.fit(xs, ys, 2, basis);
    assert.ok(M.maxErr(r.f, q, grid) < 1e-7, basis);
    assert.equal(r.unstable, false);
  }
});

test('degree 0 fits the mean and does not throw', () => {
  const r = AP.poly.fit([-1, 0, 1], [1, 2, 3], 0, 'mono');
  assert.ok(Math.abs(r.f(0.5) - 2) < 1e-9);
});

test('monomial degree 18 and 20 on 30 points are flagged unstable; Chebyshev basis is not', () => {
  const xs = M.linspace(-1, 1, 30), ys = xs.map(AP.targets.F.smooth);
  assert.equal(AP.poly.fit(xs, ys, 18, 'mono').unstable, true);
  assert.equal(AP.poly.fit(xs, ys, 20, 'mono').unstable, true);
  assert.equal(AP.poly.fit(xs, ys, 20, 'cheb').unstable, false);
});

test('interpolation reproduces its nodes (both kinds), including n = 2', () => {
  const f = AP.targets.F.smooth;
  for (const kind of ['equi', 'cheb']) for (const n of [2, 7, 20]) {
    const r = AP.poly.interpolate(kind, f, n);
    assert.equal(r.nodes.length, n + 1);
    r.nodes.forEach((x) => assert.ok(Math.abs(r.f(x) - f(x)) < 1e-12));
  }
});

test('Runge phenomenon: equispaced blows up, Chebyshev does not', () => {
  const R = AP.targets.F.runge;
  const eq = M.maxErr(AP.poly.interpolate('equi', R, 20).f, R, grid);
  const ch = M.maxErr(AP.poly.interpolate('cheb', R, 20).f, R, grid);
  assert.ok(eq > 10, 'equispaced n=20 error ' + eq);
  assert.ok(ch < 0.1, 'chebyshev n=20 error ' + ch);
});
