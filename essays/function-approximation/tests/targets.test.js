const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();

test('makeData is deterministic and well-formed', () => {
  const s = { target: 'smooth', seed: 3, variant: 0 };
  const a = AP.makeData(s), b = AP.makeData(s);
  assert.deepEqual(a.xs, b.xs);
  assert.equal(a.xs.length, 30);
  assert.equal(a.xt.length, 401);
  for (let i = 0; i < a.xs.length; i++) {
    assert.ok(a.xs[i] >= -1 && a.xs[i] <= 1);
    if (i) assert.ok(a.xs[i] >= a.xs[i - 1]);
    assert.equal(a.ys[i], a.f(a.xs[i]));
  }
});

test('noisy target adds noise to training ys only', () => {
  const d = AP.makeData({ target: 'noisy', seed: 1, variant: 0 });
  assert.ok(d.xs.some((x, i) => d.ys[i] !== d.f(x)));
  assert.equal(d.noise, 0.15);
});

test('wiggly variants differ', () => {
  const a = AP.makeData({ target: 'wiggly', seed: 1, variant: 0 });
  const b = AP.makeData({ target: 'wiggly', seed: 1, variant: 1 });
  assert.notEqual(a.f(0.3), b.f(0.3));
});

test('JUMP constants match F.jump one-sided limits', () => {
  const J = AP.targets.JUMP, f = AP.targets.F.jump;
  assert.ok(Math.abs(f(J.x - 1e-9) - J.left) < 1e-6);
  assert.ok(Math.abs(f(J.x + 1e-9) - J.right) < 1e-6);
});

test('parseTarget falls back to smooth', () => {
  assert.equal(AP.parseTarget('?target=jump'), 'jump');
  assert.equal(AP.parseTarget('?target=bogus'), 'smooth');
  assert.equal(AP.parseTarget(''), 'smooth');
  assert.equal(AP.parseTarget(undefined), 'smooth');
});

test('setState rebuilds data and notifies with previous key', () => {
  let prev = null;
  AP.onState((k) => { prev = k; });
  const before = AP.dataKey();
  AP.setState({ target: 'jump' });
  assert.equal(prev, before);
  assert.equal(AP.data.key, AP.dataKey());
  assert.notEqual(AP.dataKey(), before);
  AP.setState({ target: 'smooth' });
});

test('score uses test RMSE for noisy, RMSE for jump (max error is the jump size there), max error otherwise', () => {
  AP.setState({ target: 'noisy' });
  assert.equal(AP.score(() => 0).label, 'test RMSE');
  AP.setState({ target: 'jump' });
  const j = AP.score(() => 0);
  assert.equal(j.label, 'RMSE');
  assert.ok(Math.abs(j.value - AP.metrics.rmse(() => 0, AP.data.f, AP.data.xt)) < 1e-12);
  AP.setState({ target: 'smooth' });
  const s = AP.score(() => 0);
  assert.equal(s.label, 'max error');
  assert.ok(s.value > 0.5);
});

test('held-out points: 15 sorted points, noisy only for the noisy target, train sample unchanged', () => {
  const a = AP.makeData({ target: 'smooth', seed: 3, variant: 0 });
  assert.equal(a.xv.length, 15);
  a.xv.forEach((x, i) => { assert.ok(x >= -1 && x <= 1); if (i) assert.ok(x >= a.xv[i - 1]); assert.equal(a.yv[i], a.f(x)); });
  const n = AP.makeData({ target: 'noisy', seed: 3, variant: 0 });
  assert.ok(n.xv.some((x, i) => n.yv[i] !== n.f(x)));
  assert.equal(a.xs.length, 30);
});

test('initialTarget: explicit URL value beats stored value, bad values fall back', () => {
  assert.equal(AP.initialTarget('?target=smooth', 'jump'), 'smooth');
  assert.equal(AP.initialTarget('?target=wiggly', 'jump'), 'wiggly');
  assert.equal(AP.initialTarget('', 'jump'), 'jump');
  assert.equal(AP.initialTarget('?target=bogus', 'jump'), 'jump');
  assert.equal(AP.initialTarget('', 'bogus'), 'smooth');
  assert.equal(AP.initialTarget(undefined, null), 'smooth');
});
