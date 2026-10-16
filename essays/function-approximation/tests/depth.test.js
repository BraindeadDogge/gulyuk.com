const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();
const D = AP.depth, M = AP.metrics;
const grid = M.linspace(-1, 1, 4001);

test('L folds give exactly 2^L linear pieces, for L = 1..10', () => {
  for (let L = 1; L <= 10; L++) assert.equal(D.pieces(D.sawtooth(L)), 2 ** L, 'L=' + L);
});

test('sawtooth stays in [0,1] and tent is the ReLU combination 2relu(u) - 4relu(u - 1/2)', () => {
  const relu = (z) => Math.max(0, z);
  for (const u of M.linspace(0, 1, 101)) assert.ok(Math.abs(D.tent(u) - (2 * relu(u) - 4 * relu(u - 0.5))) < 1e-12);
  grid.forEach((x) => { const y = D.sawtooth(6)(x); assert.ok(y >= 0 && y <= 1); });
});

test('parameter budget helpers', () => {
  assert.equal(D.deepParams(5), 30);
  assert.equal(D.shallowWidth(6), 1);
  assert.equal(D.shallowWidth(30), 9);
  assert.equal(D.shallowWidth(48), 15);
});

test('at the same parameter budget a shallow ReLU net cannot follow a deep sawtooth', () => {
  const L = 5, deep = D.sawtooth(L), W = D.shallowWidth(D.deepParams(L));
  const net = AP.nets.build(deep, W, 'relu');
  assert.ok(net.params <= D.deepParams(L));
  assert.ok(D.pieces(net.out) <= W + 1);
  assert.ok(M.maxErr(net.out, deep, grid) > 0.5);
});

test('every depth from 1 to 10 builds a finite comparison', () => {
  for (let L = 1; L <= 10; L++) {
    const deep = D.sawtooth(L), net = AP.nets.build(deep, D.shallowWidth(D.deepParams(L)), 'relu');
    grid.forEach((x) => assert.ok(isFinite(net.out(x)) && isFinite(deep(x))));
  }
});
