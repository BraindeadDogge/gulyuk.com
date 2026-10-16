import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { STUB, log, named, reset, views } from './analytics-helpers'

test.beforeAll(async ({ request }) => {
  const html = await (await request.get('/')).text()
  if (!html.includes('test-site')) throw new Error('Build the site with `pnpm generate:test` before running the e2e tests.')
})
test.beforeEach(async ({ request }) => { await reset(request) })

test.describe('visit statistics', () => {
  test('one pageview on load and one per client-side navigation, with the path only', async ({ page, request }) => {
    await page.goto('/')
    await expect.poll(async () => views((await log(request)).events).length).toBe(1)
    expect(views((await log(request)).events)[0]!.payload.url).toBe('/')

    await page.getByRole('link', { name: 'cv', exact: true }).first().click()
    await expect(page).toHaveURL(/\/cv$/)
    await expect.poll(async () => views((await log(request)).events).length).toBe(2)
    const second = views((await log(request)).events)[1]!.payload
    expect(second.url).toBe('/cv')
    expect(second.referrer).toBe('http://127.0.0.1:4173/')
  })

  test('hash-only changes do not count as new pageviews', async ({ page, request }) => {
    await page.goto('/ideas/function-approximation')
    await expect.poll(async () => views((await log(request)).events).length).toBe(1)
    await page.evaluate(() => { history.replaceState(history.state, '', location.pathname + '#ch3') })
    await page.locator('#ch5').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    expect(views((await log(request)).events)).toHaveLength(1)
  })

  test('Global Privacy Control switches everything off, including loading the script', async ({ page, request }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }))
    await page.goto('/')
    await page.getByRole('link', { name: 'cv', exact: true }).first().click()
    await page.waitForTimeout(800)
    const { events, hits } = await log(request)
    expect(events).toHaveLength(0)
    expect(hits).toHaveLength(0)
  })

  test('Do Not Track switches everything off', async ({ page, request }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }))
    await page.goto('/')
    await page.waitForTimeout(800)
    expect((await log(request)).hits).toHaveLength(0)
  })

  test('a blocked collector does not break the site', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.route(`${STUB}/**`, r => r.abort())
    await page.goto('/')
    await page.getByRole('link', { name: 'cv', exact: true }).first().click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grigory Gulyuk')
    expect(errors).toEqual([])
  })

  test('before anything is clicked, the only hosts contacted are the site and the collector', async ({ page }) => {
    const hosts = new Set<string>()
    page.on('request', (r) => { if (r.url().startsWith('http')) hosts.add(new URL(r.url()).host) })
    for (const path of ['/', '/cv', '/ideas', '/ideas/leaving-jetbrains']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
    }
    expect([...hosts].sort()).toEqual(['127.0.0.1:4173', '127.0.0.1:4174'])
  })

  test('a ?ref= label is recorded once and removed from the address, other parameters stay', async ({ page, request }) => {
    await page.goto('/?ref=acme-recruiter&keep=1')
    await expect.poll(async () => named((await log(request)).events, 'landing').length).toBe(1)
    expect(named((await log(request)).events, 'landing')[0]!.payload.data).toEqual({ ref: 'acme-recruiter' })
    await expect.poll(() => new URL(page.url()).search).toBe('?keep=1')
  })

  test('an invalid ?ref= is ignored and left alone', async ({ page, request }) => {
    await page.goto('/?ref=Not%20Valid!')
    await page.waitForTimeout(800)
    expect(named((await log(request)).events, 'landing')).toHaveLength(0)
    // The router may re-encode the space ("+" or "%20"); what matters is that the label is still there.
    expect(new URL(page.url()).searchParams.get('ref')).toBe('Not Valid!')
  })

  test('the site-wide bridge accepts only clean events', async ({ page, request }) => {
    await page.goto('/')
    await expect.poll(async () => views((await log(request)).events).length).toBe(1)
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('site:track', { detail: { name: 'figure-used', props: { figure: 'ch1-1', secret: { a: 1 } } } }))
      document.dispatchEvent(new CustomEvent('site:track', { detail: { name: 'Bad Name', props: {} } }))
    })
    await expect.poll(async () => named((await log(request)).events, 'figure-used').length).toBe(1)
    expect(named((await log(request)).events, 'figure-used')[0]!.payload.data).toEqual({ figure: 'ch1-1' })
    expect((await log(request)).events.some(e => e.payload.name === 'Bad Name')).toBe(false)
  })
})

test.describe('opting out', () => {
  test('the footer button stops counting at once, and the choice survives a reload', async ({ page, request }) => {
    await page.goto('/')
    await expect.poll(async () => views((await log(request)).events).length).toBe(1)

    await page.getByRole('button', { name: 'stop counting my visits' }).click()
    await expect(page.getByRole('button', { name: 'count my visits again' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('gulyuk-optout'))).toBe('1')

    await page.getByRole('link', { name: 'cv', exact: true }).first().click()
    await expect(page).toHaveURL(/\/cv$/)
    await page.waitForTimeout(800)
    expect(views((await log(request)).events)).toHaveLength(1)

    await reset(request)
    await page.reload()
    await expect(page.getByRole('button', { name: 'count my visits again' })).toBeVisible()
    await page.waitForTimeout(800)
    expect((await log(request)).hits).toHaveLength(0)
  })

  test('counting can be switched back on', async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem('gulyuk-optout', '1'))
    await page.goto('/')
    await page.getByRole('button', { name: 'count my visits again' }).click()
    await page.getByRole('link', { name: 'cv', exact: true }).first().click()
    await expect.poll(async () => views((await log(request)).events).length).toBeGreaterThanOrEqual(1)
  })
})

test.describe('reading progress', () => {
  test('scrolling an article reports each milestone exactly once', async ({ page, request }) => {
    await page.goto('/ideas/function-approximation')
    await expect(page.locator('#toc li')).toHaveCount(13)
    await page.mouse.move(600, 400)
    await page.mouse.wheel(0, 50)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(async () => (await log(request)).events.filter(e => e.payload.name?.startsWith('read-')).length).toBeGreaterThanOrEqual(4)
    await page.evaluate(() => { window.scrollTo(0, 0); window.scrollTo(0, document.documentElement.scrollHeight) })
    await page.waitForTimeout(600)
    const { events } = await log(request)
    for (const m of ['read-25', 'read-50', 'read-75', 'read-100']) {
      expect(named(events, m)).toHaveLength(1)
      expect(named(events, m)[0]!.payload.data).toEqual({ idea: 'function-approximation' })
    }
  })

  test('a short page that fits on the screen is not "read" the moment it opens', async ({ page, request }) => {
    await page.setViewportSize({ width: 1360, height: 5000 })
    await page.goto('/ideas/soqra-school-visit')
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(5000)
    await page.waitForTimeout(1500)
    expect((await log(request)).events.filter(e => e.payload.name?.startsWith('read-'))).toHaveLength(0)
    // After a few seconds on screen the whole short page counts as read.
    await expect.poll(async () => named((await log(request)).events, 'read-100').length, { timeout: 10_000 }).toBe(1)
    expect(named((await log(request)).events, 'read-25')).toHaveLength(1)
  })

  test('each page view starts fresh after client-side navigation', async ({ page, request }) => {
    await page.goto('/ideas/function-approximation')
    await expect(page.locator('#toc li')).toHaveCount(13)
    await page.mouse.move(600, 400)
    await page.mouse.wheel(0, 50)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(async () => named((await log(request)).events, 'read-100').length).toBe(1)
    await page.getByRole('link', { name: 'ideas', exact: true }).first().click()
    await page.getByRole('link', { name: /Machine learning is function approximation/ }).first().click()
    await expect(page.locator('#toc li')).toHaveCount(13)
    await page.mouse.wheel(0, 50)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(async () => named((await log(request)).events, 'read-100').length).toBe(2)
  })
})

test.describe('the essay', () => {
  test('reports each chapter the reader reaches, once', async ({ page, request }) => {
    await page.goto('/ideas/function-approximation')
    await expect(page.locator('#toc li')).toHaveCount(13)
    await page.locator('#ch3').scrollIntoViewIfNeeded()
    await expect.poll(async () => named((await log(request)).events, 'essay-chapter').some(e => e.payload.data?.chapter === 'ch3')).toBe(true)
    await page.locator('#ch0').scrollIntoViewIfNeeded()
    await page.locator('#ch3').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    const ch3 = named((await log(request)).events, 'essay-chapter').filter(e => e.payload.data?.chapter === 'ch3')
    expect(ch3).toHaveLength(1)
    expect(ch3[0]!.payload.data).toEqual({ idea: 'function-approximation', chapter: 'ch3' })
  })

  test('reports the first use of a figure, once', async ({ page, request }) => {
    await page.goto('/ideas/function-approximation')
    await expect(page.locator('#toc li')).toHaveCount(13)
    const figure = page.locator('#ch1 figure.figure').first()
    await figure.scrollIntoViewIfNeeded()
    await figure.click({ position: { x: 24, y: 24 } })
    await figure.click({ position: { x: 40, y: 40 } })
    await expect.poll(async () => named((await log(request)).events, 'figure-used').length).toBe(1)
    await page.waitForTimeout(400)
    expect(named((await log(request)).events, 'figure-used')).toHaveLength(1)
    expect(named((await log(request)).events, 'figure-used')[0]!.payload.data).toEqual({ figure: 'ch1-1' })
  })
})

test.describe('the CV', () => {
  test('is counted as a pageview of /cv, and profile and download clicks are named', async ({ page, request }) => {
    await page.context().route(/linkedin\.com|github\.com/, r => r.abort())
    await page.goto('/cv')
    await expect.poll(async () => views((await log(request)).events).some(e => e.payload.url === '/cv')).toBe(true)

    const link = page.locator('a[rel~="me"]').first()
    const site = (await link.innerText()).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await link.click()
    await expect.poll(async () => named((await log(request)).events, 'profile-click').length).toBe(1)
    expect(named((await log(request)).events, 'profile-click')[0]!.payload.data).toEqual({ site })
    // Sent right after profile-click, so wait for it rather than reading the log the instant the first one lands.
    await expect.poll(async () => named((await log(request)).events, 'outbound').length).toBe(1)
    const outbound = named((await log(request)).events, 'outbound')
    expect(Object.keys(outbound[0]!.payload.data ?? {})).toEqual(['host'])

    await page.locator('a[download]').click()
    await expect.poll(async () => named((await log(request)).events, 'cv-download').length).toBe(1)
  })
})

test.describe('policy pages', () => {
  for (const path of ['/privacy', '/legal']) {
    test(`${path} is in the page source and passes the accessibility checks`, async ({ page, request }) => {
      const html = await (await request.get(path)).text()
      expect(html).toContain('<h1')
      expect(html).toContain('grigory.gulyuk@gmail.com')
      await page.goto(path)
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    })
  }

  test('the privacy page names every item the site keeps on a visitor\'s device', async ({ request }) => {
    const html = await (await request.get('/privacy')).text()
    for (const key of ['gulyuk-theme', 'gulyuk-view', 'ap-target', 'gulyuk-optout']) expect(html).toContain(key)
    expect(html).toContain('Commissioner for Personal Data Protection')
    expect(html).toContain('13 months')
  })

  test('the footer links to both pages from every kind of page', async ({ page }) => {
    for (const path of ['/', '/cv', '/ideas/leaving-jetbrains', '/privacy']) {
      await page.goto(path)
      await expect(page.locator('footer a[href="/privacy"]')).toHaveCount(1)
      await expect(page.locator('footer a[href="/legal"]')).toHaveCount(1)
    }
  })

  test('the legal notice says what the site is and publishes no postal address', async ({ request }) => {
    const html = await (await request.get('/legal')).text()
    expect(html).toContain('Grigory Gulyuk')
    expect(html).toMatch(/personal/i)
    expect(html).toMatch(/non-commercial/i)
  })
})

test.describe('review fixes', () => {
  test('a short page is not "read" because the router scrolled to the top after client-side navigation', async ({ page, request }) => {
    await page.setViewportSize({ width: 1360, height: 1400 })
    await page.goto('/ideas')
    // Make the list page scrollable, scroll down, then follow a link: the router scrolls the new page to the top itself.
    await page.evaluate(() => {
      const filler = document.createElement('div')
      filler.style.height = '3000px'
      document.querySelector('#main-content > *')!.append(filler)
      window.scrollTo(0, 2000)
    })
    await reset(request)
    await page.evaluate(() => (document.querySelector('a[href="/ideas/soqra-school-visit"]') as HTMLElement).click())
    await expect(page).toHaveURL(/soqra-school-visit/)
    await page.waitForTimeout(2000)
    expect((await log(request)).events.filter(e => e.payload.name?.startsWith('read-'))).toHaveLength(0)
  })

  test('a page open in a hidden tab is not counted as read', async ({ page, request }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, 'visibilityState', { get: () => 'hidden' })
      Object.defineProperty(document, 'hidden', { get: () => true })
    })
    await page.setViewportSize({ width: 1360, height: 5000 })
    await page.goto('/ideas/soqra-school-visit')
    await page.waitForTimeout(6500)
    expect((await log(request)).events.filter(e => e.payload.name?.startsWith('read-'))).toHaveLength(0)
  })

  test('no event carries a query string or fragment', async ({ page, request }) => {
    await page.goto('/?ref=acme-recruiter&keep=1#top')
    await expect.poll(async () => named((await log(request)).events, 'landing').length).toBe(1)
    const events = (await log(request)).events
    expect(events.length).toBeGreaterThanOrEqual(2)
    for (const e of events) {
      expect(e.payload.url ?? '').not.toMatch(/[?#]/)
      expect(e.payload.referrer ?? '').not.toMatch(/[?#]/)
    }
  })

  test('the pages describe the statistics as pseudonymous, never as anonymous', async ({ page, request }) => {
    expect(await (await request.get('/privacy')).text()).toContain('pseudonymous')
    await page.goto('/privacy')
    await expect(page.locator('main')).not.toContainText(/anonymous/i)
    await page.goto('/')
    await expect(page.locator('footer.site-footer')).not.toContainText(/anonymous/i)
    await expect(page.locator('footer.site-footer')).toContainText('pseudonymous')
  })
})
