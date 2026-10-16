const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AP = require('./helpers').load();

test('every break-it note is one short sentence-length line', () => {
  ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch9', 'ch10'].forEach((k) => {
    const s = AP.S.breakNote[k];
    assert.ok(typeof s === 'string' && s.length > 30 && s.length <= 170, k);
    assert.ok(!s.includes('\n'));
  });
});

test('readout templates produce the expected labels', () => {
  assert.match(AP.S.ro.ch1({ tr: 0.1, te: 0.2, params: 4, unstable: false }), /Train RMSE <b>0\.100<\/b> · Test RMSE <b>0\.200<\/b> · parameters <b>4<\/b>/);
  assert.match(AP.S.ro.ch1({ tr: 0.1, te: 0.2, params: 19, unstable: true }), /numerically unstable/);
  assert.match(AP.S.ro.score({ label: 'max error', value: 0.5 }, [['knots', 6]]), /^max error <b>0\.500<\/b> · knots <b>6<\/b>$/);
  assert.match(AP.S.ro.ch5({ tr: 1, te: 2, bias2: 0.3, variance: 0.4 }), /bias² <b>0\.300<\/b> · variance <b>0\.400<\/b>/);
  const one = AP.S.ro.ch9({ L: 1, P: 1, deepPieces: 1, W: 1, shallowPieces: 1, err: 0 });
  assert.match(one, /<b>1<\/b> parameter,/);
  assert.match(one, /<b>1<\/b> neuron,/);
  assert.ok(!/1<\/b> (parameters|neurons|pieces)/.test(one));
  assert.match(AP.S.ro.ch9({ L: 4, P: 24, deepPieces: 16, W: 3, shallowPieces: 4, err: 0 }), /<b>3<\/b> neurons, <b>4<\/b> pieces/);
});

test('every AP.S.* path used in the sources exists', () => {
  const dirs = ['chapters', 'ui'].map((d) => path.join(__dirname, '..', 'src', d));
  const files = dirs.flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith('.js')).map((f) => path.join(d, f)));
  const src = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const refs = new Set([...src.matchAll(/AP\.S\.([A-Za-z0-9_.]+)/g)].map((m) => m[1].replace(/\.$/, '')));
  refs.forEach((r) => {
    let o = AP.S;
    r.split('.').forEach((k) => { assert.ok(o && k in o, 'missing AP.S.' + r); o = o[k]; });
  });
});

test('pin line helpers render the list text', () => {
  const p = { name: 'Spline', err: { label: 'max error', value: 0.1234 }, params: 7, ms: 0.2 };
  assert.equal(AP.S.pinLine(p), 'Spline · max error 0.123 · 7 parameters · <1 ms');
  assert.equal(AP.S.pinLine(Object.assign({}, p, { paramText: '3 knots', ms: 12.4 })), 'Spline · max error 0.123 · 3 knots · 12 ms');
  assert.equal(AP.S.pinRemove('Spline'), 'Remove Spline');
});
