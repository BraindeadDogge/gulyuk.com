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

```md
---
title: What the note is called
summary: One or two sentences. Required; it feeds the list, RSS and search snippets.
date: 2026-10-20
topics: [ml, math]          # lowercase; each topic becomes a hub in the graph
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
