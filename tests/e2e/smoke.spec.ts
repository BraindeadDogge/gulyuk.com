import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('home', () => {
  test('server-rendered HTML contains real links to every idea (crawlers, no JS)', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const links = html.match(/href="\/ideas\/[a-z0-9-]+"/g) ?? []
    expect(new Set(links).size).toBeGreaterThanOrEqual(5)
    expect(html).toContain('href="/topics/ml"')
    expect(html).toContain('href="/cv"')
  })

  test('shows the graph on wide screens and switches to the list and back', async ({ page }) => {
    await page.goto('/')
    const graph = page.locator('svg.graph')
    await expect(graph).toBeVisible()
    await expect(graph.locator('a.node')).toHaveCount(16)

    await page.getByRole('button', { name: 'make everything boring' }).click()
    await expect(page.locator('nav[aria-label="Contents"]')).toBeVisible()
    await expect(graph).toBeHidden()
    await expect(page.getByRole('status').filter({ hasText: 'ok. boring.' })).toHaveCount(1)

    await page.getByRole('button', { name: 'make it interesting again' }).click()
    await expect(graph).toBeVisible()
  })

  test('remembers the chosen view across reloads', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'make everything boring' }).click()
    // The switch animates for about half a second and saves the choice at the end.
    await expect(page.locator('svg.graph')).toBeHidden()
    await page.reload()
    await expect(page.locator('nav[aria-label="Contents"]')).toBeVisible()
    await expect(page.locator('svg.graph')).toBeHidden()
  })

  test('hovering a hub highlights it and dims unrelated nodes', async ({ page }) => {
    await page.goto('/')
    const hub = page.locator('svg.graph a.node--topic').first()
    await hub.hover({ force: true })
    await expect(hub).toHaveClass(/is-active/)
    await expect(page.locator('svg.graph a.node.is-dim').first()).toBeAttached()
  })

  test('graph nodes are not tab stops; the list is the keyboard path', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('svg.graph')).toHaveAttribute('aria-hidden', 'true')
    const focusable = await page.locator('svg.graph a[tabindex="-1"]').count()
    expect(focusable).toBe(16)
  })

  test('pause motion keeps its name and reports state with aria-pressed', async ({ page }) => {
    await page.goto('/')
    const button = page.getByRole('button', { name: 'pause motion' })
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  test('tabbing into the hidden list reveals it so focus is visible', async ({ page }) => {
    await page.goto('/')
    const first = page.locator('nav[aria-label="Contents"] a').first()
    await first.focus()
    await expect(first).toBeVisible()
    const box = await first.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(20)
  })
})

test.describe('pages', () => {
  test('an idea page renders math, a demo and a click-to-load embed stays inert', async ({ page }) => {
    await page.goto('/ideas/function-approximation')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Teaching a small network')
    await expect(page.locator('math').first()).toBeAttached()
    await expect(page.getByRole('img', { name: /Function approximation plot/ })).toBeVisible()

    await page.goto('/ideas/linkedin-sample-post')
    await expect(page.locator('iframe')).toHaveCount(0)
    await page.getByRole('button', { name: /Load LinkedIn post/ }).click()
    await expect(page.locator('iframe[title^="LinkedIn post"]')).toHaveAttribute('referrerpolicy', 'no-referrer')
  })

  test('the demo trains: loss goes down', async ({ page }) => {
    await page.goto('/ideas/function-approximation')
    const readout = page.locator('.readout')
    await readout.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)
    const text = await readout.innerText()
    const loss = Number(text.match(/loss ([0-9.]+)/)?.[1])
    expect(loss).toBeLessThan(0.2)
  })

  test('cv page has sections, anchors and a PDF link', async ({ page }) => {
    await page.goto('/cv')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grigory Gulyuk')
    await expect(page.locator('#exp-1')).toBeAttached()
    await expect(page.getByRole('link', { name: /Download PDF/ })).toHaveAttribute('href', '/pdf/Grigory-Gulyuk-CV.pdf')
  })

  test('topic page lists its ideas', async ({ page }) => {
    await page.goto('/topics/ml')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ml')
    expect(await page.locator('ul.rows > li').count()).toBeGreaterThanOrEqual(3)
  })

  test('unknown routes show the 404 page with a way home', async ({ page }) => {
    const response = await page.goto('/nope')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('link', { name: /Back to home/ })).toBeVisible()
  })

  test('the prerendered not-found page has a title and heading without JavaScript', async ({ request }) => {
    const html = await (await request.get('/not-found')).text()
    expect(html).toContain('<title>Page not found')
    expect(html).toContain('no edges lead here.')
    expect(html).toContain('Back to home')
  })

  test('feeds exist', async ({ request }) => {
    const rss = await request.get('/rss.xml')
    expect(rss.ok()).toBe(true)
    expect(await rss.text()).toContain('<item>')
    expect((await request.get('/sitemap.xml')).ok()).toBe(true)
    expect((await request.get('/llms.txt')).ok()).toBe(true)
  })
})

test.describe('accessibility (axe)', () => {
  for (const path of ['/', '/ideas', '/ideas/function-approximation', '/cv', '/topics/ml']) {
    for (const scheme of ['light', 'dark'] as const) {
      test(`${path} (${scheme}) has no serious violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path)
        await page.waitForTimeout(400)
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()
        const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
        expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)).toEqual([])
      })
    }
  }
})
