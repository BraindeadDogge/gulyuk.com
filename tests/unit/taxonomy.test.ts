import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
// @ts-expect-error plain ESM script without types
import { DOC_URL, loadTaxonomy, renderDocument } from '../../scripts/taxonomy-doc.mjs'

interface Tax { areas: { id: string, label: string, about: string, topics: { id: string, label: string, about: string }[] }[] }
const tax = loadTaxonomy() as Tax
const root = join(__dirname, '../..')

const areaIds = tax.areas.map(a => a.id)
const topics = tax.areas.flatMap(a => a.topics)
const topicIds = topics.map(t => t.id)
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/

describe('the vocabulary', () => {
  it('keeps areas few: they are the hubs of the home graph', () => {
    expect(tax.areas.length).toBeGreaterThanOrEqual(3)
    expect(tax.areas.length).toBeLessThanOrEqual(8)
  })

  it('has unique, well-formed ids across areas and topics together', () => {
    const all = [...areaIds, ...topicIds]
    expect(new Set(all).size, 'ids must be unique across areas and topics').toBe(all.length)
    for (const id of all) expect(id, id).toMatch(kebab)
  })

  it('describes everything: a label and a one-line about for every area and topic', () => {
    for (const x of [...tax.areas, ...topics]) {
      expect(x.label?.trim(), x.id).toBeTruthy()
      expect(x.about?.trim(), x.id).toBeTruthy()
      expect(x.about.length, `${x.id}: keep "about" to one line`).toBeLessThanOrEqual(110)
    }
  })

  it('gives every area enough topics to be worth having, and not an unmanageable number', () => {
    for (const a of tax.areas) {
      expect(a.topics.length, a.id).toBeGreaterThanOrEqual(3)
      expect(a.topics.length, a.id).toBeLessThanOrEqual(14)
    }
  })

  it('has no near-duplicate labels (the thing the vocabulary exists to prevent)', () => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    const labels = [...tax.areas, ...topics].map(x => norm(x.label))
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe('content uses only the vocabulary', () => {
  const dir = join(root, 'content/ideas')
  for (const file of readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const block = readFileSync(join(dir, file), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
    const fm = parse(block) as { area?: string, topics?: string[] }

    it(`${file}: has one real area`, () => {
      expect(fm.area, 'every idea needs an area').toBeTruthy()
      expect(areaIds, `unknown area "${fm.area}"`).toContain(fm.area)
    })

    it(`${file}: has at most three topics, all real, none repeated, none equal to the area`, () => {
      const list = fm.topics ?? []
      expect(list.length).toBeLessThanOrEqual(3)
      expect(new Set(list).size).toBe(list.length)
      for (const t of list) {
        expect(topicIds, `unknown topic "${t}": pick from NEW-IDEA-CHECKLIST.md, or add it there first`).toContain(t)
        expect(t).not.toBe(fm.area)
      }
    })
  }

  it('cv.yml links its entries only to real areas', () => {
    const cv = parse(readFileSync(join(root, 'content/cv.yml'), 'utf8')) as {
      experience: { id: string, areas?: string[] }[]
      skills: { id: string, areas?: string[] }[]
    }
    for (const item of [...cv.experience, ...cv.skills]) {
      for (const a of item.areas ?? []) expect(areaIds, `${item.id}: unknown area "${a}"`).toContain(a)
    }
  })
})

describe('the checklist', () => {
  it('is up to date: run `pnpm taxonomy` after changing content/taxonomy.yml', () => {
    const current = readFileSync(DOC_URL, 'utf8')
    expect(current).toBe(renderDocument(current, tax))
  })
})
