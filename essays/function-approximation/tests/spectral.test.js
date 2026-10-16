const test = require('node:test');
const assert = require('node:assert/strict');
const AP = require('./helpers').load();
const SP = AP.spectral;

test('amp reads off the amplitude of each sine component', () => {
  assert.ok(Math.abs(SP.amp(SP.target, SP.LOW) - SP.AMP_LOW) < 1e-3);
  assert.ok(Math.abs(SP.amp(SP.target, SP.HIGH) - SP.AMP_HIGH) < 1e-3);
  assert.ok(Math.abs(SP.amp(SP.target, 3)) < 1e-3);
});

test('a run is deterministic and never goes past the step cap', () => {
  const a = SP.make(0, 1), b = SP.make(0, 1);
  a.advance(120); b.advance(120);
  assert.equal(a.g(0.3), b.g(0.3));
  a.advance(1000);
  assert.equal(a.steps, SP.STEPS);
  assert.ok(isFinite(a.loss));
});

test('spectral bias: after 300 steps a plain net has the slow wave but not the fast one; Fourier features fix it', () => {
  const frac = (run) => ({ low: SP.amp(run.g, SP.LOW) / SP.AMP_LOW, high: SP.amp(run.g, SP.HIGH) / SP.AMP_HIGH });
  const plain = SP.make(0, 1); plain.advance(SP.STEPS);
  const ff = SP.make(4, 1); ff.advance(SP.STEPS);
  const p = frac(plain), f = frac(ff);
  assert.ok(p.low > 0.8, 'plain low ' + p.low);
  assert.ok(p.low > p.high + 0.2, `plain low ${p.low} high ${p.high}`);
  assert.ok(f.high > p.high + 0.2, `ff high ${f.high} vs plain high ${p.high}`);
});

test('every frequency scale gives a finite run', () => {
  SP.SIGMAS.forEach((s) => { const r = SP.make(s, 1); r.advance(30); assert.ok(isFinite(r.g(0.1)) && isFinite(r.loss), 'sigma ' + s); });
});

test('advance ignores non-finite step counts', () => {
  const r = SP.make(0, 1); r.advance(10); r.advance(NaN); r.advance(undefined);
  assert.equal(r.steps, 10); assert.ok(Number.isFinite(r.steps) && isFinite(r.loss));
});

test('pct floors the learned percentage', () => {
  assert.equal(SP.pct(SP.target, SP.LOW, SP.AMP_LOW), 100);
  assert.equal(SP.pct(SP.target, SP.HIGH, SP.AMP_HIGH), 100);
  // 99.6% must floor to 99, not round to 100
  assert.equal(SP.pct((x) => 0.996 * SP.target(x), SP.HIGH, SP.AMP_HIGH), 99);
  assert.equal(SP.pct(() => 0, SP.LOW, SP.AMP_LOW), 0);
  // a fit anti-correlated with the wave is shown as 0%, never negative
  assert.equal(SP.pct((x) => -SP.target(x), SP.LOW, SP.AMP_LOW), 0);
});
