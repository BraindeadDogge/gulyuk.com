import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'

// Every page that visitors can land on, including the 404 page.
const PAGES = ['/', '/cv', '/ideas', '/ideas/function-approximation', '/privacy', '/legal', '/not-found']

// The favicon Nuxt ships in its starter template, which must never be served.
const NUXT_STARTER_ICO_MD5 = '5c1028350a39fb9e5a9bfbe280326e28'

const pngSize = (b: Buffer) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) })
const isPng = (b: Buffer) => b.subarray(1, 4).toString() === 'PNG'

test.describe('icons and share image', () => {
  for (const path of PAGES) {
    test(`${path} declares the full icon set, theme colours and share image`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500) // let the page hydrate: the tags must survive it
      const head = page.locator('head')
      await expect(head.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1)
      await expect(head.locator('link[rel="icon"][type="image/svg+xml"][href="/favicon.svg"]')).toHaveCount(1)
      await expect(head.locator('link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]')).toHaveCount(1)
      await expect(head.locator('link[rel="manifest"][href="/site.webmanifest"]')).toHaveCount(1)
      await expect(head.locator('meta[name="theme-color"]')).toHaveCount(1)
      await expect(head.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#F4F1EA')
      // Idea pages carry their own generated card (see og.spec.ts); everything else shares one image.
      const card = path.startsWith('/ideas/') ? /^https:\/\/gulyuk\.com\/_og\/.+\.png$/ : /^https:\/\/gulyuk\.com\/og-image\.png$/
      await expect(head.locator('meta[property="og:image"]')).toHaveAttribute('content', card)
      await expect(head.locator('meta[name="twitter:image"]')).toHaveAttribute('content', card)
      await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
    })
  }

  test('the browser bar colour follows the site\'s own theme, not the system\'s', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' }) // a dark phone still gets the bright site by default
    await page.goto('/')
    const bar = page.locator('head meta[name="theme-color"]')
    await expect(bar).toHaveAttribute('content', '#F4F1EA')
    await page.getByRole('button', { name: 'Toggle colour theme' }).click()
    await expect(bar).toHaveAttribute('content', '#141311')
  })

  test('the PNG icons exist with the right pixel sizes', async ({ request }) => {
    const expected: Record<string, [number, number]> = {
      '/apple-touch-icon.png': [180, 180],
      '/icon-192.png': [192, 192],
      '/icon-512.png': [512, 512],
      '/icon-maskable-512.png': [512, 512],
      '/og-image.png': [1200, 630],
    }
    for (const [url, [w, h]] of Object.entries(expected)) {
      const res = await request.get(url)
      expect(res.status(), url).toBe(200)
      expect(res.headers()['content-type'], url).toContain('image/png')
      const body = await res.body()
      expect(isPng(body), url).toBe(true)
      expect(pngSize(body), url).toEqual({ w, h })
    }
    expect((await (await request.get('/og-image.png')).body()).length).toBeLessThan(300_000)
  })

  test('/favicon.ico is the site\'s own icon (16, 32 and 48 px), not Nuxt\'s', async ({ request }) => {
    const body = await (await request.get('/favicon.ico')).body()
    expect(createHash('md5').update(body).digest('hex')).not.toBe(NUXT_STARTER_ICO_MD5)
    expect(body.readUInt16LE(0)).toBe(0) // reserved
    expect(body.readUInt16LE(2)).toBe(1) // type: icon
    const count = body.readUInt16LE(4)
    const sizes = Array.from({ length: count }, (_, i) => body[6 + i * 16]).sort((a, b) => a! - b!)
    expect(sizes).toEqual([16, 32, 48])
  })

  test('favicon.svg follows the visitor\'s light or dark setting and holds no live text', async ({ request }) => {
    const svg = await (await request.get('/favicon.svg')).text()
    expect(svg).toContain('prefers-color-scheme:dark')
    for (const colour of ['#1B1A17', '#C2301A', '#ECE8DF', '#FF6B4A']) expect(svg).toContain(colour)
    expect(svg).not.toContain('<text')
  })

  test('the web manifest names the site and points at icons that exist', async ({ request }) => {
    const res = await request.get('/site.webmanifest')
    expect(res.status()).toBe(200)
    const manifest = await res.json()
    expect(manifest.name).toBe('Grigory Gulyuk')
    expect(manifest.short_name).toBe('gulyuk.com')
    expect(manifest.start_url).toBe('/')
    expect(manifest.theme_color).toBe('#F4F1EA')
    expect(manifest.background_color).toBe('#F4F1EA')
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true)
    for (const icon of manifest.icons as { src: string, sizes: string }[]) {
      const body = await (await request.get(icon.src)).body()
      const [w, h] = icon.sizes.split('x').map(Number)
      expect(pngSize(body), icon.src).toEqual({ w, h })
    }
  })

  test('no Nuxt credits or default branding are left in what the site serves', async ({ request }) => {
    for (const file of ['/robots.txt', '/sitemap.xml']) {
      expect((await (await request.get(file)).text()).toLowerCase(), file).not.toContain('nuxt')
    }
    for (const path of PAGES) {
      const html = await (await request.get(path)).text()
      expect(html, path).not.toMatch(/<meta name="generator"/i)
      expect(html, path).toMatch(/<title>[^<]+<\/title>/)
    }
  })
})
