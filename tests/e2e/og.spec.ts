import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// One generated share card per published idea (nuxt-og-image + Takumi), plain files on the static host.
const dir = join(process.cwd(), 'content/ideas')
const slugs = readdirSync(dir)
  .filter(f => f.endsWith('.md'))
  .filter(f => !/^draft:\s*true\s*$/m.test(readFileSync(join(dir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''))
  .map(f => f.replace(/\.md$/, ''))

const SITE_CARD = 'https://gulyuk.com/og-image.png'
const pngSize = (b: Buffer) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) })

test.describe('per-idea share cards', () => {
  test('there are ideas to check', () => expect(slugs.length).toBeGreaterThan(0))

  const cards = new Map<string, string>()
  for (const slug of slugs) {
    test(`/ideas/${slug} has its own 1200x630 card`, async ({ page, request }) => {
      await page.goto(`/ideas/${slug}`)
      // Read the tags once the page has hydrated: the browser must not replace what the build generated.
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      const og = await page.locator('head meta[property="og:image"]').getAttribute('content')
      const tw = await page.locator('head meta[name="twitter:image"]').getAttribute('content')
      expect(og).toMatch(/^https:\/\/gulyuk\.com\/_og\/.+\.png$/)
      expect(og).not.toBe(SITE_CARD)
      expect(tw).toBe(og)
      cards.set(slug, og!)
      const html = await (await request.get(`/ideas/${slug}`)).text()
      expect(html, 'the generated HTML and the hydrated page must agree').toContain(`<meta property="og:image" content="${og}">`)

      const res = await request.get(new URL(og!).pathname)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('image/png')
      const body = await res.body()
      expect(pngSize(body)).toEqual({ w: 1200, h: 630 })
      expect(body.length).toBeLessThan(300_000)
      await expect(page.locator('head meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
      await expect(page.locator('head meta[property="og:image:height"]')).toHaveAttribute('content', '630')
    })
  }

  test('every idea has a different card', async () => {
    expect(cards.size).toBe(slugs.length)
    expect(new Set(cards.values()).size).toBe(cards.size)
  })

  test('pages that are not ideas keep the site-wide card', async ({ page }) => {
    for (const path of ['/', '/cv', '/ideas', '/privacy', '/legal']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page.locator('head meta[property="og:image"]'), path).toHaveAttribute('content', SITE_CARD)
    }
  })
})
