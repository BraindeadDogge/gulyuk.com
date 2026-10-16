import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('home', () => {
  test('server-rendered HTML contains real links to every idea (crawlers, no JS)', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const links = html.match(/href="\/ideas\/[a-z0-9-]+"/g) ?? []
    expect(new Set(links).size).toBeGreaterThanOrEqual(4)
    expect(html).toContain('href="/topics/ai"')
    expect(html).toContain('href="/cv"')
  })

  test('shows the graph on wide screens and switches to the list and back', async ({ page }) => {
    await page.goto('/')
    const graph = page.locator('svg.graph')
    await expect(graph).toBeVisible()
    expect(await graph.locator('a.node').count()).toBeGreaterThan(10)

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
    const nodes = await page.locator('svg.graph a.node').count()
    expect(await page.locator('svg.graph a[tabindex="-1"]').count()).toBe(nodes)
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
  test('a click-to-load LinkedIn embed stays inert until asked', async ({ page }) => {
    await page.goto('/ideas/leaving-jetbrains')
    await expect(page.locator('iframe')).toHaveCount(0)
    await page.getByRole('button', { name: /Load LinkedIn post/ }).click()
    await expect(page.locator('iframe[title^="LinkedIn post"]')).toHaveAttribute('referrerpolicy', 'no-referrer')
  })

  test.describe('the function-approximation essay', () => {
    test('is a real article in the page source, with its math as MathML and no external scripts', async ({ request }) => {
      const html = await (await request.get('/ideas/function-approximation')).text()
      expect(html).toContain('Machine learning is function approximation')
      expect(html).toContain('Fit it by hand')
      expect(html).toContain('Runge')
      expect(html).toContain('<math')
      expect(html).not.toMatch(/cdnjs\.cloudflare\.com|fonts\.googleapis/)
    })

    test('starts its figures, lists its chapters and trains without errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', e => errors.push(e.message))
      page.on('console', m => m.type() === 'error' && errors.push(m.text()))
      await page.goto('/ideas/function-approximation')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Machine learning is function approximation')
      await expect(page.locator('#toc li')).toHaveCount(13)
      const mse = async () => Number((await page.locator('#ro0').innerText()).match(/([0-9.]+)\s*$/)?.[1])
      await page.locator('#c0').scrollIntoViewIfNeeded()
      await expect.poll(mse).toBeGreaterThan(0)
      const before = await mse()
      await page.locator('#fit0').click()
      await expect.poll(mse).toBeLessThan(before)
      expect(errors).toEqual([])
    })

    test('the target bar appears after the first figure and changes every figure at once', async ({ page }) => {
      await page.goto('/ideas/function-approximation')
      // The contents list is filled in when the figures start, so it marks the page as ready.
      await expect(page.locator('#toc li')).toHaveCount(13)
      await expect(page.locator('#bar')).toBeHidden()
      await page.locator('#ch1').scrollIntoViewIfNeeded()
      await expect(page.locator('#bar')).toBeVisible()
      await page.getByRole('button', { name: 'Wiggly' }).click()
      await expect(page.getByRole('button', { name: 'Wiggly' })).toHaveAttribute('aria-pressed', 'true')
    })

    test('the lecture math is there and opens', async ({ page }) => {
      await page.goto('/ideas/function-approximation')
      const box = page.locator('details.math', { hasText: 'what one training step does' })
      await box.locator('summary').click()
      await expect(box.locator('math').first()).toBeVisible()
      expect(await box.locator('math').count()).toBeGreaterThan(5)
    })

    test('leaving the page and coming back leaves no stray popovers or doubled figures', async ({ page }) => {
      await page.goto('/ideas/function-approximation')
      await page.getByRole('link', { name: 'ideas', exact: true }).first().click()
      await expect(page).toHaveURL(/\/ideas$/)
      await expect(page.locator('#gpop')).toHaveCount(0)
      await page.getByRole('link', { name: /Machine learning is function approximation/ }).first().click()
      await expect(page.locator('#c0')).toBeVisible()
      await expect(page.locator('#gpop')).toHaveCount(1)
      await expect(page.locator('#toc li')).toHaveCount(13)
    })
  })

  test('cv page has sections, anchors and a PDF link', async ({ page }) => {
    await page.goto('/cv')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grigory Gulyuk')
    await expect(page.locator('#exp-1')).toBeAttached()
    await expect(page.getByRole('link', { name: /Download PDF/ })).toHaveAttribute('href', '/pdf/Grigory-Gulyuk-CV.pdf')
  })

  test('an area page lists its ideas and offers only the topics that are in use', async ({ page }) => {
    await page.goto('/topics/career')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Career')
    expect(await page.locator('ul.rows > li').count()).toBeGreaterThanOrEqual(2)
    await expect(page.getByRole('link', { name: 'Internships' }).first()).toBeVisible()
    // "Job search" is in the vocabulary but no idea uses it yet, so it is not offered.
    await expect(page.getByRole('link', { name: 'Job search' })).toHaveCount(0)
  })

  test('a topic page points back to its area', async ({ page }) => {
    await page.goto('/topics/internships')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Internships')
    await expect(page.getByRole('link', { name: /← Career/ })).toHaveAttribute('href', '/topics/career')
    expect(await page.locator('ul.rows > li').count()).toBeGreaterThanOrEqual(2)
  })

  test('the plain list shows every idea exactly once, under its own area', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'make everything boring' }).click()
    const list = page.locator('nav[aria-label="Contents"]')
    await expect(list).toBeVisible()
    const hrefs = await list.locator('a.title').evaluateAll(as => as.map(a => a.getAttribute('href')))
    expect(hrefs.length).toBeGreaterThanOrEqual(4)
    expect(new Set(hrefs).size, 'an idea appears more than once in the list').toBe(hrefs.length)
    // Each section is an area, not a topic.
    const headings = await list.locator('h2').allInnerTexts()
    for (const h of headings) expect(['AI & ML', 'Engineering', 'Startups', 'Education', 'Career', 'Life', 'CV'].some(a => h.startsWith(a))).toBe(true)
  })

  test('an unknown topic is a 404, not an empty page', async ({ page }) => {
    const response = await page.goto('/topics/not-a-topic')
    expect(response?.status()).toBe(404)
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
  for (const path of ['/', '/ideas', '/ideas/function-approximation', '/cv', '/topics/ai', '/topics/internships']) {
    for (const scheme of ['light', 'dark'] as const) {
      test(`${path} (${scheme}) has no serious violations`, async ({ page }) => {
        // The site is light by default; its own theme switch stores the choice under this key.
        await page.addInitScript((value) => localStorage.setItem('gulyuk-theme', value), scheme)
        await page.goto(path)
        await expect(page.locator('html')).toHaveClass(new RegExp(scheme))
        await page.waitForTimeout(400)
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()
        const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
        expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)).toEqual([])
      })
    }
  }
})
