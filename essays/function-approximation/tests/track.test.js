const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const order = require('../src/order.json');

test('track.js is built in, after the figure helpers and before main.js, and boot starts it', () => {
  const i = order.ui.indexOf('ui/track.js');
  assert.ok(i > order.ui.indexOf('ui/figure.js'), 'needs AP.on and AP.defer');
  assert.ok(i < order.ui.indexOf('main.js'));
  assert.match(fs.readFileSync(path.join(root, 'src/main.js'), 'utf8'), /AP\.initTrack\(\)/);
});

test('AP.emit announces an event on the document without knowing who listens', () => {
  const doc = new EventTarget();
  const got = [];
  doc.addEventListener('site:track', (e) => got.push(e.detail));
  const ctx = vm.createContext({ document: doc, CustomEvent });
  vm.runInContext(fs.readFileSync(path.join(root, 'src/ui/track.js'), 'utf8'), ctx);
  ctx.AP.emit('figure-used', { figure: 'ch1-1' });
  // The event data is made inside the vm context, so compare it by value, not by prototype.
  assert.deepEqual(JSON.parse(JSON.stringify(got)), [{ name: 'figure-used', props: { figure: 'ch1-1' } }]);
});
