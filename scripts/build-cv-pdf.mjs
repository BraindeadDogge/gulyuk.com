// Prints the built /cv page to public/pdf/Grigory-Gulyuk-CV.pdf using the Chrome already
// installed on this machine (nothing is downloaded). Run after `pnpm generate`:
//   pnpm generate && pnpm cv:pdf && pnpm generate
// The second generate copies the fresh PDF into .output/public.
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../.output/public', import.meta.url))
const out = fileURLToPath(new URL('../public/pdf/Grigory-Gulyuk-CV.pdf', import.meta.url))
if (!existsSync(root)) throw new Error('Run `pnpm generate` first: .output/public does not exist.')

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' }

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
  const candidates = [join(root, path), join(root, path, 'index.html')]
  for (const file of candidates) {
    try {
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
      return res.end(body)
    } catch { /* try the next candidate */ }
  }
  res.writeHead(404).end('not found')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const { port } = server.address()

const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage()
  await page.emulateMedia({ media: 'print', colorScheme: 'light' })
  await page.goto(`http://127.0.0.1:${port}/cv`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '16mm', right: '16mm' }, preferCSSPageSize: false })
  await mkdir(join(out, '..'), { recursive: true })
  await writeFile(out, pdf)
  console.log(`wrote ${out} (${(pdf.length / 1024).toFixed(1)} KB)`)
} finally {
  await browser.close()
  server.close()
}
