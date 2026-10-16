import { buildGraph } from '~~/shared/graph/build-graph'
import { layoutGraph } from '~~/shared/graph/layout'
import type { IdeaInput } from '~~/shared/graph/types'

/** Idea rows as the lists and the graph use them. `area` and `topics` are ids from content/taxonomy.yml. */
export interface IdeaListItem extends IdeaInput {
  path: string
  kind: string
  maturity: string
}

export interface TaxonomyTopic { id: string, label: string, about: string }
export interface TaxonomyArea { id: string, label: string, about: string, topics: TaxonomyTopic[] }
export interface Taxonomy { areas: TaxonomyArea[] }

/** One section of the plain list: an area and the ideas that belong to it. Each idea is in exactly one. */
export interface AreaGroup {
  area: string
  label: string
  about: string
  ideas: IdeaListItem[]
}

// In production the content lives in prerendered payloads. A client-side query would download
// the whole content database, so it is only allowed in dev, where there is a live server.
export const canQueryContent = import.meta.server || import.meta.dev

async function fetchIdeas() {
  if (!canQueryContent) return []
  const rows = await queryCollection('ideas')
    .where('draft', '=', false)
    .select('path', 'title', 'summary', 'date', 'area', 'topics', 'kind', 'maturity')
    .order('date', 'DESC')
    .all()
  return rows.map<IdeaListItem>(r => ({
    path: r.path,
    slug: r.path.split('/').pop()!,
    title: r.title,
    summary: r.summary,
    date: String(r.date).slice(0, 10),
    area: r.area,
    topics: r.topics,
    kind: r.kind,
    maturity: r.maturity,
  }))
}

const fetchCv = async () => (canQueryContent ? await queryCollection('cv').first() : null)
const fetchTaxonomy = async () => (canQueryContent ? ((await queryCollection('taxonomy').first()) as Taxonomy | null) : null)

/** Content is queried while prerendering; the result is carried in the page payload. */
export function useIdeasIndex() {
  return useAsyncData('ideas-index', fetchIdeas)
}

export function useCv() {
  return useAsyncData('cv', fetchCv)
}

export function useTaxonomy() {
  return useAsyncData('taxonomy', fetchTaxonomy)
}

/** Lookups built from the vocabulary: display labels for areas and topics, and each topic's home area. */
export function vocabulary(tax: Taxonomy | null | undefined) {
  const areas = tax?.areas ?? []
  const labels: Record<string, string> = {}
  const parentOf: Record<string, string> = {}
  for (const a of areas) {
    labels[a.id] = a.label
    for (const t of a.topics) {
      labels[t.id] = t.label
      parentOf[t.id] = a.id
    }
  }
  return { areas, labels, parentOf }
}

export async function useVocabulary() {
  const { data } = await useTaxonomy()
  return computed(() => vocabulary(data.value))
}

/** Groups ideas by their single area, in the order the vocabulary lists the areas. Empty areas are left out. */
export function groupByArea(ideas: IdeaListItem[], areas: TaxonomyArea[]): AreaGroup[] {
  return areas
    .map(a => ({ area: a.id, label: a.label, about: a.about, ideas: ideas.filter(i => i.area === a.id) }))
    .filter(g => g.ideas.length > 0)
}

/** Everything the home page needs: the settled graph layout, the list, and the newest ideas. */
export async function useHomeData() {
  // One useAsyncData, so Nuxt never loses its context across an await. The layout is computed
  // once (on the server, at build time) and then travels in the page payload.
  const { data } = await useAsyncData('home', async () => {
    const [list, cv, tax] = await Promise.all([fetchIdeas(), fetchCv(), fetchTaxonomy()])
    const { areas, labels } = vocabulary(tax)
    const groups = groupByArea(list, areas)
    return {
      graph: layoutGraph(
        buildGraph(list, cv ? { experience: cv.experience, skills: cv.skills } : null, labels),
      ),
      groups,
      labels,
      newest: list.slice(0, 3).map(i => `idea:${i.slug}`),
      count: { ideas: list.length, areas: groups.length },
    }
  })
  return data as Ref<NonNullable<typeof data.value>>
}
