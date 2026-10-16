const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();

test('coefficients of a pure cosine are exact', () => {
  const f = (x) => Math.cos(Math.PI * (x + 1)); // = cos(2 * pi (x+1) / 2): harmonic k = 2
  const c = AP.fourier.coeffs(f, 6);
  c.forEach((v, k) => assert.ok(Math.abs(v - (k === 2 ? 1 : 0)) < 1e-6, `c${k}=${v}`));
});

test('K = 0 is the mean of the function', () => {
  const g = AP.fourier.series(AP.fourier.coeffs((x) => 3 + 0 * x, 0), 0);
  assert.ok(Math.abs(g(0.37) - 3) < 1e-6);
});

test('more harmonics reduce the error on the smooth target', () => {
  const f = AP.targets.F.smooth, grid = AP.metrics.linspace(-1, 1, 801);
  const c = AP.fourier.coeffs(f, 30);
  const e = (K) => AP.metrics.maxErr(AP.fourier.series(c, K), f, grid);
  assert.ok(e(30) < e(10) && e(10) < e(3));
});

test('Gibbs: overshoot is ~9% of the jump at every K, measured against f itself', () => {
  const f = AP.targets.F.jump, J = AP.targets.JUMP, c = AP.fourier.coeffs(f, 80);
  for (const K of [10, 20, 40, 60, 80]) {
    const o = AP.fourier.overshoot(AP.fourier.series(c, K), J, f);
    assert.ok(o > 0.085 && o < 0.105, `K=${K} overshoot=${o}`);
  }
});

test('a K-term series is the prefix of a longer one (so a pin may recompute fresh coefficients)', () => {
  const f = AP.targets.F.jump;
  const a = AP.fourier.coeffs(f, 6), b = AP.fourier.coeffs(f, 60);
  a.forEach((v, k) => assert.ok(Math.abs(v - b[k]) < 1e-12));
});
