import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// Topics become URLs (/topics/<slug>) and graph hubs, so they are normalised and checked here.
const topicSlug = z
  .string()
  .transform(s => s.trim().toLowerCase().replace(/\s+/g, '-'))
  .pipe(z.string().regex(/^[a-z0-9-]+$/, 'topics may only contain letters, digits and hyphens'))
const topicList = (min: number) =>
  z.array(topicSlug).min(min).transform(list => [...new Set(list)])

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
        topics: topicList(1),
        kind: z.enum(['research', 'project', 'note', 'linkedin']).default('note'),
        maturity: z.enum(['seedling', 'budding', 'evergreen']).default('seedling'),
        // Required when kind is linkedin: enforced by tests/unit/content.test.ts.
        embed: z.string().url().optional(),
        math: z.boolean().default(false),
        draft: z.boolean().default(false),
        aliases: z.array(z.string()).default([]),
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
            topics: topicList(0).default([]),
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
            topics: topicList(0).default([]),
          }),
        ),
      }),
    }),
  },
})
