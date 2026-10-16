const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, 'dist', f), 'utf8');
const build = () => execFileSync('node', ['build.mjs'], { cwd: root });

test('build writes the post body and the figure script', () => {
  build();
  const html = read('chapters.html');
  assert.match(html, /<div class="essay">/);
  assert.match(html, /id="toc"/);
  assert.doesNotMatch(html, /<!--CHAPTERS-->/);
  assert.doesNotMatch(html, /\{\{\w+\}\}/);
  const js = read('essay.js');
  assert.match(js, /AP\.boot = /);
  assert.match(js, /AP\.teardown = /);
});

test('the output carries no standalone-page leftovers: no CDN, no own theme button, no document shell', () => {
  build();
  const html = read('chapters.html');
  assert.doesNotMatch(html, /cdnjs|googleapis|katex\.min/);
  assert.doesNotMatch(html, /id="theme-btn"|id="toc-btn"/);
  assert.doesNotMatch(html, /<html|<head|<body|<script/);
});

test('math is rendered when the page is built: no raw delimiters remain, MathML is present', () => {
  build();
  const html = read('chapters.html');
  assert.doesNotMatch(html, /\$\$/);
  assert.doesNotMatch(html, /\\\(|\\\)/);
  assert.ok((html.match(/<math/g) || []).length >= 15, 'expected the formulas to be rendered as MathML');
});

test('figure numbers are assigned in order, with no gaps or duplicates', () => {
  build();
  const html = read('chapters.html');
  const figs = [...html.matchAll(/<figcaption>Fig\. (\d+)\./g)].map((m) => Number(m[1]));
  assert.ok(figs.length >= 9);
  figs.forEach((n, i) => assert.equal(n, i + 1));
});

test('the lecture math is in: loss and metrics, the network formula, and a training step', () => {
  build();
  const html = read('chapters.html');
  for (const title of ['the setup in symbols', 'the network as a formula', 'what one training step does']) {
    assert.ok(html.includes(title), 'missing math box: ' + title);
  }
});
