const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();

const close = (a, b, tol) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < tol, `${v} vs ${b[i]}`));

test('rng is deterministic and in [0,1)', () => {
  const a = AP.rng(5), b = AP.rng(5);
  for (let i = 0; i < 50; i++) { const v = a(); assert.equal(v, b()); assert.ok(v >= 0 && v < 1); }
});

test('gauss has mean ~0 and variance ~1', () => {
  const r = AP.rng(1); let s = 0, q = 0; const n = 20000;
  for (let i = 0; i < n; i++) { const g = AP.gauss(r); s += g; q += g * g; }
  assert.ok(Math.abs(s / n) < 0.03);
  assert.ok(Math.abs(q / n - 1) < 0.05);
});

test('lstsq recovers an exact quadratic', () => {
  const xs = AP.metrics.linspace(-1, 1, 20);
  const r = AP.linalg.lstsq(xs.map((x) => [1, x, x * x]), xs.map((x) => 2 - 3 * x + 0.5 * x * x));
  close(r.w, [2, -3, 0.5], 1e-8);
  assert.equal(r.unstable, false);
});

test('lstsq flags an ill-conditioned monomial fit of degree 20', () => {
  const xs = AP.metrics.linspace(-1, 1, 30);
  const Phi = xs.map((x) => Array.from({ length: 21 }, (_, k) => Math.pow(x, k)));
  const r = AP.linalg.lstsq(Phi, xs.map(Math.sin));
  assert.equal(r.unstable, true);
});

test('metrics', () => {
  assert.deepEqual(AP.metrics.linspace(0, 1, 3), [0, 0.5, 1]);
  assert.equal(AP.metrics.maxErr((x) => x, () => 0, [0, 1, 2]), 2);
  assert.equal(AP.metrics.rmse(() => 1, () => 0, [0, 1]), 1);
  assert.equal(AP.metrics.rmsePts((x) => x, [0, 2], [0, 0]), Math.sqrt(2));
});

test('cholesky, forward and backward solve a 2x2 system', () => {
  const c = AP.linalg.cholesky([[4, 2], [2, 3]]);
  assert.equal(c.ok, true);
  close(c.L[0], [2, 0], 1e-12);
  close(c.L[1], [1, Math.SQRT2], 1e-12);
  close(AP.linalg.backward(c.L, AP.linalg.forward(c.L, [2, 5])), [-0.5, 2], 1e-12);
  assert.equal(AP.linalg.cholesky([[1, 2], [2, 1]]).ok, false);
});
