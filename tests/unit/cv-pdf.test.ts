import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The CV PDF is printed from a local copy of the site, so a careless build can leave the local address
// (http://127.0.0.1:<port>/...) behind in its links. These checks read the committed file itself.
const pdf = readFileSync(join(__dirname, '../../public/pdf/Grigory-Gulyuk-CV.pdf'))
const links = [...pdf.toString('latin1').matchAll(/\/URI\s*\(([^)]*)\)/g)].map(m => m[1]!)

describe('public/pdf/Grigory-Gulyuk-CV.pdf', () => {
  it('has links (the profiles and the topic tags)', () => {
    expect(links.length).toBeGreaterThan(0)
    expect(links.some(l => l.includes('linkedin.com/in/'))).toBe(true)
  })

  it('never points at the machine it was printed on', () => {
    const local = links.filter(l => /127\.0\.0\.1|localhost|0\.0\.0\.0|\[::1\]/.test(l))
    expect(local, `local addresses left in the PDF: ${local.join(', ')}`).toEqual([])
  })

  it('only links to secure web addresses, and same-site links go to the live site', () => {
    for (const l of links) {
      expect(l, l).toMatch(/^https:\/\//)
    }
    for (const l of links.filter(l => l.includes('/topics/'))) {
      expect(l, l).toMatch(/^https:\/\/gulyuk\.com\/topics\/[a-z0-9-]+$/)
    }
  })
})
