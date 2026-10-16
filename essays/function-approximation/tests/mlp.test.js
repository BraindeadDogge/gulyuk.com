const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();

test('analytic gradients match finite differences', () => {
  const net = AP.mlp.create([2, 3, 3, 1], 4);
  const X = [[0.3, -0.2], [0.5, 0.1], [-0.7, 0.9]], Y = [0.4, -0.1, 0.6];
  const { gW, gb } = AP.mlp.grads(net, X, Y);
  const h = 1e-6;
  const check = (arr, idx, analytic) => {
    const old = arr[idx];
    arr[idx] = old + h; const up = AP.mlp.loss(net, X, Y);
    arr[idx] = old - h; const dn = AP.mlp.loss(net, X, Y);
    arr[idx] = old;
    const num = (up - dn) / (2 * h);
    assert.ok(Math.abs(num - analytic) < 1e-6 * (1 + Math.abs(num)), `${num} vs ${analytic}`);
  };
  for (let l = 0; l < 3; l++) {
    check(net.W[l], 0, gW[l][0]);
    check(net.W[l], net.W[l].length - 1, gW[l][net.W[l].length - 1]);
    check(net.b[l], 0, gb[l][0]);
  }
});

test('training is deterministic and lowers the loss', () => {
  const run = () => {
    const net = AP.mlp.create([1, 16, 16, 1], 2), X = [], Y = [];
    for (let i = 0; i < 20; i++) { const x = -1 + (2 * i) / 19; X.push([x]); Y.push(Math.sin(2 * x)); }
    const first = AP.mlp.loss(net, X, Y);
    for (let s = 0; s < 150; s++) AP.mlp.step(net, X, Y, 0.01);
    return { first, last: AP.mlp.loss(net, X, Y), p: AP.mlp.predict(net, [0.3]) };
  };
  const a = run(), b = run();
  assert.deepEqual(a, b);
  assert.ok(a.last < 0.2 * a.first, `${a.last} vs ${a.first}`);
});

test('features: sigma 0 is the identity input; otherwise 2m bounded features, deterministic', () => {
  const p = AP.mlp.features(0, 16, 1);
  assert.equal(p.dim, 1);
  assert.deepEqual(p.map(0.3), [0.3]);
  const a = AP.mlp.features(4, 16, 1), b = AP.mlp.features(4, 16, 1);
  assert.equal(a.dim, 32);
  assert.deepEqual(a.map(0.37), b.map(0.37));
  a.map(0.37).forEach((v) => assert.ok(Math.abs(v) <= 1));
});
