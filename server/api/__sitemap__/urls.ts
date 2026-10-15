import { queryCollection } from '@nuxt/content/nitro'

// Gives the sitemap a real lastmod for every idea, taken from the frontmatter.
export default defineSitemapEventHandler(async (event) => {
  const ideas = await queryCollection(event, 'ideas')
    .where('draft', '=', false)
    .select('path', 'date', 'updated')
    .all()
  return ideas.map(i => ({
    loc: i.path,
    lastmod: String(i.updated ?? i.date).slice(0, 10),
  }))
})
