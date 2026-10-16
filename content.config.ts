import { readFileSync } from 'node:fs'
import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import { parse } from 'yaml'

// The vocabulary lives in content/taxonomy.yml. Every idea picks ONE area and up to THREE topics from it,
// so a typo or an invented tag fails the build with the list of valid choices, instead of quietly
// creating a new tag.
interface Taxonomy { areas: { id: string, label: string, about: string, topics: { id: string, label: string, about: string }[] }[] }
const taxonomy = parse(readFileSync(new URL('./content/taxonomy.yml', import.meta.url), 'utf8')) as Taxonomy
const areaIds = taxonomy.areas.map(a => a.id) as [string, ...string[]]
const topicIds = taxonomy.areas.flatMap(a => a.topics.map(t => t.id)) as [string, ...string[]]

const area = z.enum(areaIds, { message: `area must be one of: ${areaIds.join(', ')} (see content/taxonomy.yml)` })
const topic = z.enum(topicIds, { message: `topic must be one of the topics in content/taxonomy.yml; add a new one there only if none fits` })

const httpsUrl = z.string().url().refine(u => /^https?:\/\//.test(u), 'links must be http(s)')

export default defineContentConfig({
  collections: {
    ideas: defineCollection({
      type: 'page',
      // Flat on purpose: the filename is the URL slug, so nested folders could collide.
      source: 'ideas/*.md',
      schema: z.object({
        title: z.string().min(1),
        summary: z.string().min(1),
        date: z.date(),
        updated: z.date().optional(),
        area,
        topics: z.array(topic).max(3, 'use at most three topics; pick the most useful ones').default([]).transform(list => [...new Set(list)]),
        kind: z.enum(['research', 'project', 'note', 'linkedin']).default('note'),
        maturity: z.enum(['seedling', 'budding', 'evergreen']).default('seedling'),
        // Required when kind is linkedin: enforced by tests/unit/content.test.ts.
        embed: z.string().url().optional(),
        math: z.boolean().default(false),
        // Reading time in minutes, for pages whose text lives in a component (interactive essays).
        minutes: z.number().int().positive().optional(),
        draft: z.boolean().default(false),
        aliases: z.array(z.string()).default([]),
      }),
    }),

    taxonomy: defineCollection({
      type: 'data',
      source: 'taxonomy.yml',
      schema: z.object({
        areas: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            about: z.string(),
            topics: z.array(z.object({ id: z.string(), label: z.string(), about: z.string() })),
          }),
        ),
      }),
    }),

    cv: defineCollection({
      type: 'data',
      source: 'cv.yml',
      schema: z.object({
        profile: z.object({
          name: z.string(),
          headline: z.string(),
          location: z.string(),
          summary: z.string(),
          email: z.string().optional(),
          links: z.array(z.object({ label: z.string(), url: httpsUrl })),
        }),
        experience: z.array(
          z.object({
            id: z.string(),
            role: z.string(),
            org: z.string(),
            location: z.string().optional(),
            start: z.string(),
            end: z.string().optional(),
            bullets: z.array(z.string()),
            // The areas this entry belongs to: they link it to the matching hubs on the home graph.
            areas: z.array(area).default([]),
          }),
        ),
        education: z.array(
          z.object({
            id: z.string(),
            degree: z.string(),
            school: z.string(),
            start: z.string(),
            end: z.string().optional(),
            note: z.string().optional(),
          }),
        ),
        skills: z.array(
          z.object({
            id: z.string(),
            group: z.string(),
            items: z.array(z.string()),
            areas: z.array(area).default([]),
          }),
        ),
      }),
    }),
  },
})
