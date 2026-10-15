import { buildGraph, topicLabel } from '~~/shared/graph/build-graph'
import { layoutGraph } from '~~/shared/graph/layout'
import type { IdeaInput } from '~~/shared/graph/types'

export interface IdeaListItem extends IdeaInput {
  path: string
  kind: string
  maturity: string
}

export interface TopicGroup {
  topic: string
  label: string
  ideas: IdeaListItem[]
}

// In production the content lives in prerendered payloads. A client-side query would download
// the whole content database, so it is only allowed in dev, where there is a live server.
export const canQueryContent = import.meta.server || import.meta.dev

async function fetchIdeas() {
  if (!canQueryContent) return []
  const rows = await queryCollection('ideas')
    .where('draft', '=', false)
    .select('path', 'title', 'summary', 'date', 'topics', 'kind', 'maturity')
    .order('date', 'DESC')
    .all()
  return rows.map<IdeaListItem>(r => ({
    path: r.path,
    slug: r.path.split('/').pop()!,
    title: r.title,
    summary: r.summary,
    date: String(r.date).slice(0, 10),
    topics: r.topics,
    kind: r.kind,
    maturity: r.maturity,
  }))
}

const fetchCv = async () => (canQueryContent ? await queryCollection('cv').first() : null)

/** Content is queried while prerendering; the result is carried in the page payload. */
export function useIdeasIndex() {
  return useAsyncData('ideas-index', fetchIdeas)
}

export function useCv() {
  return useAsyncData('cv', fetchCv)
}

export function groupByTopic(ideas: IdeaListItem[]): TopicGroup[] {
  const map = new Map<string, IdeaListItem[]>()
  for (const idea of ideas) for (const t of idea.topics) map.set(t, [...(map.get(t) ?? []), idea])
  return [...map.entries()]
    .map(([topic, list]) => ({ topic, label: topicLabel(topic), ideas: list }))
    .sort((a, b) => b.ideas.length - a.ideas.length || a.topic.localeCompare(b.topic))
}

/** Everything the home page needs: the settled graph layout, the list, and the newest ideas. */
export async function useHomeData() {
  // One useAsyncData, so Nuxt never loses its context across an await. The layout is computed
  // once (on the server, at build time) and then travels in the page payload.
  const { data } = await useAsyncData('home', async () => {
    const [list, cv] = await Promise.all([fetchIdeas(), fetchCv()])
    return {
      graph: layoutGraph(
        buildGraph(list, cv ? { experience: cv.experience, skills: cv.skills } : null),
      ),
      groups: groupByTopic(list),
      newest: list.slice(0, 3).map(i => `idea:${i.slug}`),
      count: { ideas: list.length, topics: new Set(list.flatMap(i => i.topics)).size },
    }
  })
  return data as Ref<NonNullable<typeof data.value>>
}
