// Builds the essay for the site:
//   dist/chapters.html  the whole post body (chapters + chrome), numbers filled in, math pre-rendered as MathML
//   dist/essay.md       a plain-text version of the same post, for /ideas/function-approximation.md
//   dist/essay.js       the numerics and figure code, one script, started by AP.boot() from the Vue component
// Run by `pnpm essay` (and by dev/generate), so the files in dist/ are never edited by hand.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { htmlToMarkdown } from 'mdream';

const require = createRequire(import.meta.url);
const katex = require('katex');
const root = path.dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(fs.readFileSync(path.join(root, 'src/order.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(root, 'src', p), 'utf8');

// 1. Chapters: figure numbers in order, and every number quoted in the prose recomputed from the code.
const nums = require('./scripts/numbers.js');
let chapters = order.chapters.map((f) => read('chapters/' + f)).join('\n');
let figN = 0;
let essayMd = '';
chapters = chapters.replace(/\{\{(\w+)\}\}/g, (m, k) => {
  if (k === 'fig') return String(++figN);
  if (!(k in nums)) throw new Error('Unknown number token {{' + k + '}}');
  return String(nums[k]);
});

// 1b. Plain-text version for crawlers and LLMs (served as /ideas/function-approximation.md):
// the prose, headings, tables and formulas as TeX, without the interactive controls.
const unescapeHtml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const stripBalanced = (html, openRe) => {
  let out = html, m;
  while ((m = openRe.exec(out))) {
    const re = /<(\/?)div\b/g; re.lastIndex = m.index; let depth = 0, end = -1, t;
    while ((t = re.exec(out))) { depth += t[1] ? -1 : 1; if (depth === 0) { end = out.indexOf('>', t.index) + 1; break; } }
    if (end < 0) break;
    out = out.slice(0, m.index) + out.slice(end);
    openRe.lastIndex = 0;
  }
  return out;
};
{
  const tex = [];
  let h = chapters
    .replace(/\$\$([\s\S]+?)\$\$/g, (m, t) => { tex.push('\n\n```tex\n' + unescapeHtml(t).trim() + '\n```\n\n'); return '@@M' + (tex.length - 1) + '@@'; })
    .replace(/\\\(([\s\S]+?)\\\)/g, (m, t) => { tex.push('`' + unescapeHtml(t).trim() + '`'); return '@@M' + (tex.length - 1) + '@@'; });
  h = stripBalanced(h, /<div class="(?:ctrls|row|readout)"[^>]*>/);
  h = h.replace(/<canvas[\s\S]*?<\/canvas>/g, '').replace(/<(button|select|input|output|label)\b[\s\S]*?(<\/\1>|>)/g, '')
    .replace(/<ul class="pins"[\s\S]*?<\/ul>/g, '').replace(/<p class="eyebrow">[\s\S]*?<\/p>/g, '');
  essayMd = htmlToMarkdown(h).replace(/@@M(\d+)@@/g, (m, i) => tex[+i]).replace(/<\/?details>\n*/g, '').replace(/<summary>([\s\S]*?)<\/summary>/g, '**$1**').replace(/^[ \u00a0]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// 2. Math: $$...$$ (display) and \(...\) (inline) become MathML here, so the page needs no
// script or font to show formulas and crawlers can read them. A bad formula fails the build.
const mathml = (tex, displayMode) =>
  katex.renderToString(unescapeHtml(tex).trim(), { displayMode, output: 'mathml', throwOnError: true, strict: 'error' });
let formulas = 0;
chapters = chapters
  .replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => { formulas++; return mathml(tex, true); })
  .replace(/\\\(([\s\S]+?)\\\)/g, (m, tex) => { formulas++; return mathml(tex, false); });

const body = read('template.html').replace('<!--CHAPTERS-->', () => chapters);
if (/\{\{\w+\}\}/.test(body)) throw new Error('An unresolved {{token}} is left in the output');

// 3. Script: numerics first, then the figures. It runs in the browser only.
const js = [...order.numerics, ...order.ui].map((f) => `/* ${f} */\n` + read(f)).join('\n');

const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'chapters.html'), body);
fs.writeFileSync(path.join(dist, 'essay.js'), js);
// Nuxt Content caches parsed pages by the content file's own hash, and the post's text is injected from essay.md
// when it is parsed (nuxt.config.ts). So when the text changes, drop the cache and let the next run re-parse.
const mdPath = path.join(dist, 'essay.md');
const prevMd = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : null;
fs.writeFileSync(mdPath, essayMd);
if (prevMd !== essayMd) fs.rmSync(path.join(root, '../../.data/content'), { recursive: true, force: true });

const words = body.replace(/<math[\s\S]*?<\/math>/g, ' ').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
console.log(`essay built: ${words} words, ${figN} figures, ${formulas} formulas, ${js.length} bytes of script`);
