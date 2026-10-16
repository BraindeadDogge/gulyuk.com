const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();
const M = AP.metrics;
const f = AP.targets.F.smooth, grid = M.linspace(-1, 1, 2001);

test('N = 1 neuron of every kind is finite on the whole domain', () => {
  for (const kind of ['step', 'sigmoid', 'relu']) {
    const net = AP.nets.build(f, 1, kind);
    grid.forEach((x) => assert.ok(isFinite(net.out(x)), kind));
    assert.equal(net.params, 4);
  }
});

test('ReLU net equals the piecewise-linear interpolant at the nodes', () => {
  const N = 9, net = AP.nets.build(f, N, 'relu');
  const nodes = M.linspace(-1, 1, N + 1), lin = AP.spline.linear(nodes, nodes.map(f));
  grid.forEach((x) => assert.ok(Math.abs(net.out(x) - lin(x)) < 1e-9));
});

test('step staircase improves with N and ReLU beats steps at the same N', () => {
  const e = (kind, N) => M.maxErr(AP.nets.build(f, N, kind).out, f, grid);
  assert.ok(e('step', 32) < e('step', 4));
  assert.ok(e('relu', 8) < e('step', 8));
});

test('sigmoid with a very large slope approaches the step net', () => {
  const a = AP.nets.build(f, 8, 'step').out, b = AP.nets.build(f, 8, 'sigmoid', 1e4).out;
  assert.ok(M.maxErr(a, b, grid.filter((x) => Math.abs(((x + 1) / 0.25) % 1 - 0.5) > 0.02)) < 1e-3);
});
