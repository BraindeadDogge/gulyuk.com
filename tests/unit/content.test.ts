import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Rules the content schema can't express cleanly, checked against the real files so a bad
// entry fails `pnpm test` before it fails (or silently passes) a build.
const dir = join(__dirname, '../../content/ideas')
const files = readdirSync(dir).filter(f => f.endsWith('.md'))

function frontmatter(file: string) {
  const text = readFileSync(join(dir, file), 'utf8')
  const block = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  const field = (name: string) => block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim()
  const topics = (field('topics') ?? '').replace(/[[\]]/g, '').split(',').map(t => t.trim()).filter(Boolean)
  return { text, kind: field('kind'), embed: field('embed'), topics, summary: field('summary') }
}

describe('content/ideas', () => {
  it('has at least one idea', () => expect(files.length).toBeGreaterThan(0))

  for (const file of files) {
    const fm = frontmatter(file)
    describe(file, () => {
      it('has a lowercase, hyphenated filename (it becomes the URL)', () => {
        expect(file).toMatch(/^[a-z0-9-]+\.md$/)
      })
      it('has a summary (the area and topics are checked against the vocabulary in taxonomy.test.ts)', () => {
        expect(fm.summary).toBeTruthy()
      })
      it('uses clean topic slugs without duplicates', () => {
        for (const t of fm.topics) expect(t).toMatch(/^[a-z0-9-]+$/)
        expect(new Set(fm.topics).size).toBe(fm.topics.length)
      })
      it('linkedin entries carry an embed address that matches the one in the body', () => {
        if (fm.kind !== 'linkedin') return
        expect(fm.embed).toMatch(/^https:\/\/www\.linkedin\.com\/embed\//)
        expect(fm.text).toContain(`url="${fm.embed}"`)
      })
    })
  }
})
