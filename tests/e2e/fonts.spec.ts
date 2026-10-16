import { expect, test } from '@playwright/test'

// The site's own fonts come from @fontsource. Adding @nuxt/fonts (for the share-card font) once made it take over
// those families and drop the italic faces, so every italic was a slanted copy of the upright font.
test('every font the site uses loads, including the real italic serif', async ({ page }) => {
  await page.goto('/cv') // its headline is italic, so the italic face is requested
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family}|${f.style}`))

  expect(loaded.some(l => l.startsWith('Newsreader Variable|italic')), `loaded: ${loaded.join(', ')}`).toBe(true)
  expect(loaded.some(l => l.startsWith('Newsreader Variable|normal'))).toBe(true)
  expect(loaded.some(l => l.startsWith('Familjen Grotesk Variable|normal'))).toBe(true)
  expect(loaded.some(l => l.startsWith('Commit Mono|normal'))).toBe(true)
})
