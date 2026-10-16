const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();
const M = AP.metrics;
const g = (a, b, ell) => Math.exp(-((a - b) ** 2) / (2 * ell * ell));

test('rbf recovers a function that is exactly a sum of its bumps', () => {
  const centers = M.linspace(-1, 1, 5), w = [1, -2, 0.5, 1.5, -1], ell = 0.4;
  const f = (x) => centers.reduce((s, c, j) => s + w[j] * g(x, c, ell), 0);
  const xs = M.linspace(-1, 1, 40);
  const r = AP.kernel.rbf(xs, xs.map(f), centers, ell);
  assert.ok(M.maxErr(r.f, f, M.linspace(-1, 1, 501)) < 1e-4);
});

test('rbf with bumps far narrower than the centre spacing falls back to ~0 between centres', () => {
  const centers = M.linspace(-1, 1, 12), xs = M.linspace(-1, 1, 24);
  const r = AP.kernel.rbf(xs, xs.map(() => 1), centers, 0.01);
  const mid = (centers[3] + centers[4]) / 2;
  assert.ok(Math.abs(r.f(mid)) < 1e-3);
  assert.ok(isFinite(r.f(0.123)));
});

test('rbf stays finite at extreme widths', () => {
  const centers = M.linspace(-1, 1, 12), xs = M.linspace(-1, 1, 30);
  for (const ell of [0.005, 0.02, 1, 5, 50]) {
    const r = AP.kernel.rbf(xs, xs.map(Math.sin), centers, ell);
    M.linspace(-2, 2, 41).forEach((x) => assert.ok(isFinite(r.f(x)), 'ell ' + ell));
  }
});

test('gp matches the closed form on two points', () => {
  const xs = [0, 1], ys = [1, 2], ell = 1, s = 0.1, x = 0.5;
  const a = 1 + s * s, b = g(0, 1, ell), det = a * a - b * b;
  const inv = [[a / det, -b / det], [-b / det, a / det]];
  const k = [g(x, 0, ell), g(x, 1, ell)];
  const Ky = [inv[0][0] * ys[0] + inv[0][1] * ys[1], inv[1][0] * ys[0] + inv[1][1] * ys[1]];
  const mean = k[0] * Ky[0] + k[1] * Ky[1];
  const Kk = [inv[0][0] * k[0] + inv[0][1] * k[1], inv[1][0] * k[0] + inv[1][1] * k[1]];
  const variance = 1 - (k[0] * Kk[0] + k[1] * Kk[1]);
  const m = AP.kernel.gp(xs, ys, ell, s);
  assert.ok(Math.abs(m.mean(x) - mean) < 1e-9);
  assert.ok(Math.abs(m.sd(x) - Math.sqrt(variance)) < 1e-9);
  assert.equal(m.ok, true);
});

test('gp: tiny noise interpolates, uncertainty is ~0 at data and ~prior far away, mean fades to 0', () => {
  const xs = M.linspace(-1, 1, 10), ys = xs.map(Math.sin);
  const m = AP.kernel.gp(xs, ys, 0.4, 1e-3);
  xs.forEach((x, i) => { assert.ok(Math.abs(m.mean(x) - ys[i]) < 1e-2); assert.ok(m.sd(x) < 0.05); });
  assert.ok(Math.abs(m.sd(50) - 1) < 1e-6);
  assert.ok(Math.abs(m.mean(50)) < 1e-6);
  assert.ok(m.sd(0.05) > m.sd(xs[5]));
});

test('gp survives duplicate x values and extreme widths by inflating the noise term', () => {
  const m = AP.kernel.gp([0, 0, 0], [1, 2, 3], 1, 1e-9);
  assert.ok(isFinite(m.mean(0)) && isFinite(m.sd(0)));
  assert.ok(Math.abs(m.mean(0) - 2) < 0.01);
  assert.ok(m.noiseUsed > 1e-9);
  const xs = M.linspace(-1, 1, 30), ys = xs.map(Math.sin);
  for (const ell of [0.01, 0.3, 1, 5]) {
    const r = AP.kernel.gp(xs, ys, ell, AP.kernel.MIN_NOISE);
    M.linspace(-2, 2, 41).forEach((x) => assert.ok(isFinite(r.mean(x)) && isFinite(r.sd(x)), 'ell ' + ell));
  }
  assert.equal(AP.kernel.gp(xs, ys, 1, AP.kernel.MIN_NOISE).ok, true);
});

test('rbf with the page ridge does not blow up on the noisy target at narrow widths', () => {
  const d = AP.makeData({ target: 'noisy', seed: 1, variant: 0 }), centers = M.linspace(-1, 1, 12);
  for (const ell of [0.03, 0.1, 0.25, 0.8]) {
    const r = AP.kernel.rbf(d.xs, d.ys, centers, ell, AP.kernel.RBF_RIDGE);
    const mx = Math.max(...M.linspace(-1, 1, 401).map((x) => Math.abs(r.f(x))));
    assert.ok(mx < 2.5, 'ell ' + ell + ' max ' + mx);
  }
});

test('gp on duplicate points reports the noise of the factor it used', () => {
  const xs = [0.1, 0.1, 0.5, 0.5], ys = [1, 1, -1, -1];
  const r = AP.kernel.gp(xs, ys, 0.3, 1e-9);
  assert.ok(Number.isFinite(r.mean(0.3)));
  assert.ok(r.noiseUsed >= 1e-9 && r.noiseUsed <= 1e-9 * 2 ** 7);
});
