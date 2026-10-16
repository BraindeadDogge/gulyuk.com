import { queryCollection } from '@nuxt/content/nitro'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export default defineEventHandler(async (event) => {
  const site = 'https://gulyuk.com'
  const ideas = await queryCollection(event, 'ideas')
    .where('draft', '=', false)
    .select('path', 'title', 'summary', 'date', 'area', 'topics')
    .order('date', 'DESC')
    .all()

  const items = ideas
    .map((i) => {
      const url = `${site}${i.path}`
      const date = new Date(String(i.date).slice(0, 10) + 'T00:00:00Z').toUTCString()
      return [
        '<item>',
        `<title>${esc(i.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${date}</pubDate>`,
        `<description>${esc(i.summary)}</description>`,
        ...[i.area, ...i.topics].map(t => `<category>${esc(t)}</category>`),
        '</item>',
      ].join('')
    })
    .join('\n')

  const newest = ideas[0] ? new Date(String(ideas[0].date).slice(0, 10) + 'T00:00:00Z').toUTCString() : new Date(0).toUTCString()

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Grigory Gulyuk</title>
<link>${site}</link>
<description>Notes and experiments by Grigory Gulyuk, a software engineer working on AI tooling and full-stack products.</description>
<language>en</language>
<lastBuildDate>${newest}</lastBuildDate>
<atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>
`
})
