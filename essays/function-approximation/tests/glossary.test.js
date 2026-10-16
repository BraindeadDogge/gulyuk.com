const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AP = require('./helpers').load();
const order = require('../src/order.json');

test('glossary has at least 15 well-formed, unique terms', () => {
  assert.ok(AP.glossary.length >= 15);
  const keys = AP.glossary.map((g) => g.key);
  assert.equal(new Set(keys).size, keys.length);
  AP.glossary.forEach((g) => {
    assert.match(g.key, /^[a-z]+(-[a-z]+)*$/);
    assert.ok(g.term && g.def.length > 20 && g.def.length <= 200, g.key);
    assert.match(g.def, /\.$/, g.key);
  });
});

test('every data-g in the chapter markup names a glossary entry', () => {
  const html = order.chapters.map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', 'chapters', f), 'utf8')).join('\n');
  const used = [...html.matchAll(/data-g="([^"]+)"/g)].map((m) => m[1]);
  const keys = new Set(AP.glossary.map((g) => g.key));
  used.forEach((k) => assert.ok(keys.has(k), 'unknown glossary key ' + k));
});

test('every glossary term is marked at least once in the text', () => {
  const html = order.chapters.map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', 'chapters', f), 'utf8')).join('\n');
  AP.glossary.forEach((g) => assert.ok(html.includes('data-g="' + g.key + '"'), 'unused term ' + g.key));
});
