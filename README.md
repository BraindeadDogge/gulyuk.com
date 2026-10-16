# gulyuk.com

Personal site: CV, research notes ("ideas"), interactive ML demos, and a graph that connects them.
Nuxt 4 + Nuxt Content 3, generated to static files, served by Caddy on Railway.
Design notes: [docs/superpowers/specs/2026-10-16-gulyuk-com-design.md](docs/superpowers/specs/2026-10-16-gulyuk-com-design.md).

## Run it

Needs Node 22.22+ (or 24.15+) and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm test           # unit tests (graph building and layout)
pnpm generate       # static build into .output/public
pnpm test:e2e       # Playwright + axe against the static build (uses your installed Chrome)
```

## Add an idea

Create `content/ideas/some-slug.md`. The filename becomes the URL (`/ideas/some-slug`) and never changes.
The area and topics must come from the fixed vocabulary in `content/taxonomy.yml`: read
[NEW-IDEA-CHECKLIST.md](NEW-IDEA-CHECKLIST.md) first, and only add a topic when nothing in the list fits.

```md
---
title: What the note is called
summary: One or two sentences. Required; it feeds the list, RSS and search snippets.
date: 2026-10-20
area: ai                    # exactly one area; it is the idea's hub on the graph
topics: [ml-fundamentals, math]   # 0 to 3 topics; tags only, never graph nodes
kind: research              # research | project | note | linkedin
maturity: seedling          # seedling | budding | evergreen
math: true                  # only if the note has equations
draft: true                 # hide it everywhere until you remove this line
---

Write markdown. Inline math is $x^2$, display math is $$ ... $$.

::function-approximation
::
```

The graph, the list view, topic pages, RSS, the sitemap and `llms.txt` all update on the next build.
A bad frontmatter field fails the build with a message instead of publishing a broken page.

### Embed a demo

A demo is a Vue component in `app/components/content/`. A file named `MyDemo.vue` is used in markdown as
`::my-demo` followed by `::` on its own line. Give the root element `class="breakout"` to let it run
wider than the text column. See `FunctionApproximation.vue`.

### Add a LinkedIn post

On LinkedIn open the post menu, choose "Embed this post", and copy the `src` address from the code it gives you.
Create an idea with `kind: linkedin` and `embed: <that address>`, and put it in the body with:

```md
::linkedin-embed{url="https://www.linkedin.com/embed/feed/update/urn:li:share:123" postUrl="https://www.linkedin.com/posts/..." label="26 Sep 2026"}
::
```

Nothing from LinkedIn loads until the visitor presses the button.

## Edit the CV

Everything is in `content/cv.yml`, taken from LinkedIn. Each `id` becomes an anchor on `/cv` and a node in
the graph. Topics in an entry connect it to the matching hub.

To refresh the downloadable PDF after changing the CV:

```bash
pnpm generate && pnpm cv:pdf && pnpm generate
```

`cv:pdf` prints the built `/cv` page with the Chrome installed on the machine and writes
`public/pdf/Grigory-Gulyuk-CV.pdf`. The file is committed, so deploys never need a browser.

## Deploy

Railway builds the `Dockerfile` (a Node stage generates the static site, a Caddy stage serves it) on every push
to `main`. Domain, Cloudflare and the `www` redirect are covered step by step in [DEPLOY.md](DEPLOY.md).

## How the graph works

`shared/graph/build-graph.ts` turns content into nodes (topic hubs, ideas, CV entries) and edges. `layout.ts`
runs a seeded force simulation at build time and rounds the result, so the server-rendered SVG and the browser
agree exactly. In the browser, `GraphView.vue` continues from those positions (drag with spring release, cursor
pull, slow drift, a pulse) and pauses when the tab is hidden, the graph is off-screen, or the visitor presses
"pause motion". The plain list is always in the page too: it is the accessible version, the mobile default,
and what crawlers read.

## Visit statistics

Visits are counted with a self-hosted Umami (setup in `DEPLOY.md`), without cookies. Tracking is off when the
`NUXT_PUBLIC_UMAMI_*` variables are unset, the browser sends Global Privacy Control or Do Not Track, or the visitor
used the footer opt-out. The logic that decides this is in `shared/analytics/`; the browser side is
`app/plugins/analytics.client.ts`.

| Event | Properties | When |
|---|---|---|
| (pageview) | url, referrer | every page and route change (path only) |
| `read-25`, `read-50`, `read-75`, `read-100`, `read-end` | `idea` | article milestone reached, once per view |
| `read-time` | `idea`, `seconds` | on leaving an idea page, if it was open 8 s or more |
| `essay-chapter` | `idea`, `chapter` | first view of each essay chapter |
| `figure-used` | `figure` | first interaction with a figure |
| `cv-download` | | CV PDF download click |
| `profile-click` | `site` | LinkedIn, GitHub or other profile link on the CV |
| `outbound` | `host` | any link to another site (hostname only) |
| `landing` | `ref` | first load with a valid `?ref=label` |

To add an event: call `useTrack()('my-event', { prop: 'value' })` in a component, or put `data-track="my-event"`
(and optionally `data-site="value"`) on a link, or, from non-Vue script, dispatch
`document.dispatchEvent(new CustomEvent('site:track', { detail: { name, props } }))`. Names are lower-case letters,
digits and hyphens (40 characters at most); strings are cut at 80 characters and URLs lose their query string.
Never put anything about a person in a property. If you add or remove stored browser settings or events, update
`app/pages/privacy.vue` too.
