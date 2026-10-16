const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();
const M = AP.metrics, T = AP.trees;
const xs = M.linspace(-1, 1, 30), ys = xs.map((x) => Math.sin(3 * x));
const mse = (g) => xs.reduce((s, x, i) => s + (g(x) - ys[i]) ** 2, 0) / xs.length;

test('k = 1 interpolates; k = n gives the mean everywhere; k is clamped', () => {
  const g1 = T.knn(xs, ys, 1);
  xs.forEach((x, i) => assert.equal(g1(x), ys[i]));
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  [-1, 0.123, 1].forEach((x) => assert.ok(Math.abs(T.knn(xs, ys, 30)(x) - mean) < 1e-12));
  assert.equal(T.knn(xs, ys, 0)(xs[3]), ys[3]);
  assert.ok(Math.abs(T.knn(xs, ys, 999)(0.2) - mean) < 1e-12);
});

test('knn and boosting are constant outside the data', () => {
  const g = T.knn(xs, ys, 3), b = T.boost(xs, ys, 20).predict(20);
  assert.equal(g(-9), g(-90));
  assert.equal(g(9), g(90));
  assert.equal(b(-9), b(-90));
  assert.equal(b(9), b(90));
});

test('one stump with learning rate 1 reproduces a step exactly', () => {
  const sx = M.linspace(-1, 1, 21), sy = sx.map((x) => (x < 0.25 ? 0 : 1));
  const b = T.boost(sx, sy, 1, 1);
  sx.forEach((x, i) => assert.ok(Math.abs(b.predict(1)(x) - sy[i]) < 1e-12));
  assert.ok(Math.abs(b.next(0).t - 0.25) < 1e-9);
  assert.equal(b.next(1), null);
});

test('training error never rises as stumps are added; 0 stumps is the mean', () => {
  const b = T.boost(xs, ys, 40, 0.5);
  let prev = Infinity;
  for (let m = 0; m <= 40; m++) { const e = mse(b.predict(m)); assert.ok(e <= prev + 1e-12, 'rose at ' + m); prev = e; }
  const mean = ys.reduce((a, c) => a + c, 0) / ys.length;
  assert.ok(Math.abs(b.predict(0)(0.3) - mean) < 1e-12);
  assert.equal(b.predict(999)(0.3), b.predict(40)(0.3));
});

test('residuals(m) equals y - predict(m) at the training points', () => {
  const b = T.boost(xs, ys, 10, 0.5);
  [0, 3, 10].forEach((m) => b.residuals(m).forEach((r, i) => assert.ok(Math.abs(r - (ys[i] - b.predict(m)(xs[i]))) < 1e-12)));
});

test('duplicate x values and all-equal x do not throw', () => {
  const b = T.boost([0, 0, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1], 1, 1);
  assert.ok(Math.abs(b.predict(1)(0) - 0) < 1e-12 && Math.abs(b.predict(1)(1) - 1) < 1e-12);
  const c = T.boost([2, 2, 2], [1, 2, 3], 3, 1);
  assert.ok(isFinite(c.predict(3)(2)));
});

test('cubeEdge', () => {
  assert.ok(Math.abs(T.cubeEdge(0.1, 1) - 0.1) < 1e-12);
  assert.ok(Math.abs(T.cubeEdge(0.1, 10) - 0.7943) < 1e-3);
});
