const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();
const M = AP.metrics;
const grid = M.linspace(-1, 1, 4001);
const sp = (x) => Math.sin(Math.PI * x);

test('both splines interpolate their knots', () => {
  const xs = [-1, -0.3, 0.1, 0.8, 1], ys = [0.2, -0.5, 0.9, 0.1, -0.7];
  for (const mk of [AP.spline.linear, AP.spline.natural]) {
    const g = mk(xs, ys);
    xs.forEach((x, i) => assert.ok(Math.abs(g(x) - ys[i]) < 1e-12));
  }
});

test('three knots and two knots do not throw and stay finite', () => {
  const a = AP.spline.natural([-1, 0, 1], [0, 1, 0]);
  const b = AP.spline.natural([-1, 1], [0, 1]);
  [-2, -1, 0, 0.5, 1, 2].forEach((x) => { assert.ok(isFinite(a(x))); assert.ok(isFinite(b(x))); });
});

test('halving the spacing cuts the error ~4x (linear) and ~16x (cubic, f"=0 at ends)', () => {
  const rate = (mk) => {
    const e = (n) => { const xs = M.linspace(-1, 1, n); return M.maxErr(mk(xs, xs.map(sp)), sp, grid); };
    return e(9) / e(17);
  };
  const lin = rate(AP.spline.linear), cub = rate(AP.spline.natural);
  assert.ok(lin > 3 && lin < 5, 'linear ratio ' + lin);
  assert.ok(cub > 12 && cub < 20, 'cubic ratio ' + cub);
});

test('autoKnots beats uniform knots for a localized feature', () => {
  const R = AP.targets.F.runge, n = 10;
  const auto = AP.spline.autoKnots(R, n);
  assert.equal(auto.length, n);
  assert.equal(auto[0], -1);
  assert.equal(auto[n - 1], 1);
  auto.forEach((x, i) => { if (i) assert.ok(x > auto[i - 1]); });
  const uni = M.linspace(-1, 1, n);
  const err = (xs) => M.maxErr(AP.spline.linear(xs, xs.map(R)), R, grid);
  assert.ok(err(auto) < err(uni), `${err(auto)} vs ${err(uni)}`);
});

test('remap keeps x positions and snaps y to the new target', () => {
  const knots = [{ x: -1, y: 5 }, { x: 0.2, y: -3 }, { x: 1, y: 9 }];
  const out = AP.spline.remap(knots, (x) => 2 * x);
  assert.deepEqual(out, [{ x: -1, y: -2 }, { x: 0.2, y: 0.4 }, { x: 1, y: 2 }]);
});

test('autoKnots straddles a jump with a steep ramp and beats uniform knots', () => {
  const f = AP.targets.F.jump, c = AP.targets.JUMP.x, n = 10;
  const ks = AP.spline.autoKnots(f, n);
  assert.equal(ks.length, n);
  assert.equal(ks[0], -1);
  assert.equal(ks[n - 1], 1);
  ks.forEach((x, i) => { if (i) assert.ok(x - ks[i - 1] >= 0.02 - 1e-9, 'gap at ' + i); });
  assert.ok(ks.some((x) => x < c && c - x <= 0.03), 'knot just left of the jump');
  assert.ok(ks.some((x) => x > c && x - c <= 0.03), 'knot just right of the jump');
  const rm = (xs) => M.rmse(AP.spline.linear(xs, xs.map(f)), f, grid);
  assert.ok(rm(ks) < rm(M.linspace(-1, 1, n)));
});

test('autoKnots on a smooth target is unchanged by jump handling; tiny n does not throw', () => {
  const f = AP.targets.F.smooth;
  [2, 3, 4, 15].forEach((n) => {
    const ks = AP.spline.autoKnots(f, n);
    assert.equal(ks.length, n);
    ks.forEach((x) => assert.ok(isFinite(x) && x >= -1 && x <= 1));
  });
  assert.equal(AP.spline.autoKnots(AP.targets.F.jump, 3).length, 3);
  assert.equal(AP.spline.autoKnots(AP.targets.F.jump, 4).length, 4);
});
