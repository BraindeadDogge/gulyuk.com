const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();
const BV = AP.biasvar, M = AP.metrics;
const f = AP.targets.F.smooth, grid = M.linspace(-1, 1, 201);

test('sample is deterministic, sorted, noisy', () => {
  const a = BV.sample(f, 30, 5, 0.15), b = BV.sample(f, 30, 5, 0.15);
  assert.deepEqual(a, b);
  a.xs.forEach((x, i) => { assert.ok(x >= -1 && x <= 1); if (i) assert.ok(x >= a.xs[i - 1]); });
  assert.ok(a.xs.some((x, i) => a.ys[i] !== f(x)));
  const clean = BV.sample(f, 30, 5, 0);
  assert.ok(clean.xs.every((x, i) => clean.ys[i] === f(x)));
});

test('training error never rises with degree; test error has an interior minimum', () => {
  const c = BV.curves(f, BV.sample(f, 30, BV.SEED, BV.SD), BV.DMAX, grid);
  assert.equal(c.train.length, BV.DMAX + 1);
  for (let d = 1; d <= BV.DMAX; d++) assert.ok(c.train[d] <= c.train[d - 1] + 1e-3, 'train rose at ' + d);
  const best = c.test.indexOf(Math.min(...c.test));
  assert.ok(best >= 2 && best <= 14, 'best degree ' + best);
  assert.ok(c.test[BV.DMAX] > 1.3 * c.test[best], `deg 20 ${c.test[BV.DMAX]} vs best ${c.test[best]}`);
  assert.ok(c.train[BV.DMAX] < c.test[BV.DMAX]);
});

test('bias^2 falls and variance rises with degree', () => {
  const lo = BV.decompose(f, 1, 30, 40, 100, BV.SD, grid);
  const mid = BV.decompose(f, 6, 30, 40, 100, BV.SD, grid);
  const hi = BV.decompose(f, 15, 30, 40, 100, BV.SD, grid);
  assert.ok(lo.bias2 > mid.bias2 * 5, 'bias ' + lo.bias2 + ' vs ' + mid.bias2);
  assert.ok(hi.variance > 2 * mid.variance, 'variance ' + hi.variance + ' vs ' + mid.variance);
  [lo, mid, hi].forEach((r) => assert.ok(r.bias2 >= 0 && r.variance >= 0 && isFinite(r.bias2 + r.variance)));
});

test('degree 0 and degree 20 do not throw or produce NaN', () => {
  const s = BV.sample(f, 30, 1, BV.SD);
  const c = BV.curves(f, s, 20, grid);
  c.train.concat(c.test).forEach((v) => assert.ok(isFinite(v)));
});

test('degree 20 stays finite and sane on the default sample', () => {
  const c = BV.curves(f, BV.sample(f, 30, BV.SEED, BV.SD), BV.DMAX, grid);
  assert.ok(Number.isFinite(c.test[BV.DMAX]) && c.test[BV.DMAX] < 1, 'deg 20 test ' + c.test[BV.DMAX]);
});
