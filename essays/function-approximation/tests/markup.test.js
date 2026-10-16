const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const order = require('../src/order.json');
const rd = (p) => fs.readFileSync(path.join(__dirname, '..', 'src', p), 'utf8');
const html = order.chapters.map((f) => rd('chapters/' + f)).join('\n') + rd('template.html');
const idList = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const ids = new Set(idList);
const jsFiles = ['chapters', 'ui'].flatMap((d) => fs.readdirSync(path.join(__dirname, '..', 'src', d)).filter((f) => f.endsWith('.js')).map((f) => d + '/' + f));
const js = jsFiles.map(rd).join('\n');

test('element ids are unique', () => {
  const dup = idList.filter((id, i) => idList.indexOf(id) !== i);
  assert.deepEqual(dup, []);
});

test('every id the scripts look up exists in the markup', () => {
  const refs = new Set();
  for (const re of [/AP\.\$\('([\w-]+)'\)/g, /AP\.slider\('([\w-]+)'/g, /AP\.syncSlider\('([\w-]+)'\)/g, /AP\.note\('([\w-]+)'/g]) {
    for (const m of js.matchAll(re)) refs.add(m[1]);
  }
  for (const m of js.matchAll(/AP\.resetSliders\(\[([^\]]*)\]\)/g)) for (const s of m[1].matchAll(/'([\w-]+)'/g)) refs.add(s[1]);
  refs.forEach((r) => assert.ok(ids.has(r), 'script uses #' + r + ' but no element has that id'));
});

test('every range input has its output element', () => {
  for (const m of html.matchAll(/<input id="([^"]+)" type="range"/g)) assert.ok(ids.has(m[1] + 'o'), 'no <output id="' + m[1] + 'o">');
});
