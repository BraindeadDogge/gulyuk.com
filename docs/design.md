# Design notes

How gulyuk.com is put together, and why. For setup and day-to-day use see the [README](../README.md).

## Purpose

A personal site for Grigory Gulyuk: a CV, research notes ("ideas"), interactive explainers about machine learning,
and LinkedIn posts. The style is design-engineer craft, and it deliberately avoids generic AI-site looks: no
gradients, glass, glow, bento cards or emoji icons.

## Concept

*A lab notebook someone left running.* Warm paper and ink, one vermilion accent, and a live specimen plate (a graph of
the ideas) as the home page.

## Stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 4, `@nuxt/content` 3 (collections, MDC), `@nuxtjs/color-mode` |
| SEO and sharing | `@nuxtjs/seo`, `nuxt-og-image` with the Takumi renderer, `@nuxt/fonts` (for share images only) |
| Graph | `d3-force` (only), plain CSS custom properties |
| Hosting | `nuxt generate` to static files, served by Caddy in a container on Railway behind Cloudflare |
| Statistics | self-hosted Umami, cookieless (see [analytics.md](analytics.md)) |
| Tests | Vitest, `node:test` (the essay), Playwright with axe |

Node 22.22+ or 24.15+, pnpm.

## Content model

- `content/ideas/*.md`: one file per idea; the filename is the URL slug. Frontmatter: `title`, `summary`, `tagline`
  (required), `date`, `updated`, `area` (exactly one), `topics` (0 to 3), `kind` (`research`, `project`, `note`,
  `linkedin`), `maturity` (`seedling`, `budding`, `evergreen`), `embed` (required for `linkedin`), `math`, `minutes`,
  `draft`, `aliases`.
- `content/taxonomy.yml`: the fixed vocabulary of areas and topics. A typo or an invented tag fails the build.
- `content/cv.yml`: the CV (profile, experience, education, skills).
- Routes: `/`, `/ideas`, `/ideas/[slug]`, `/topics/[topic]`, `/cv`, `/privacy`, `/legal`, 404, `/rss.xml`,
  `/sitemap.xml`, `robots.txt`, `/llms.txt`, and a Markdown copy of every page at `<route>.md`.

## Graph

`buildGraph(ideas, cv)` is a pure, unit-tested function in `shared/graph/`.

- **Nodes:** area hubs, ideas and CV entries. Topics are tags and never become nodes, so the graph stays readable
  however many topics there are.
- **Edges:** idea to area, CV entry to area, and idea to idea by shared topics.
- **Layout:** precomputed with a seeded `d3-force` run (deterministic, coordinates rounded), so the server-rendered SVG
  already contains settled `<a>` nodes and the browser agrees with it exactly. The browser adds drag with spring release,
  cursor pull, idle drift and a pulse. All of it is pausable with a visible control and frozen under
  `prefers-reduced-motion`.
- **Encoding:** hub = solid disc, idea = hollow ring, CV entry = small square. The accent colour appears only on
  hover, focus and the current item. Dimmed items sit at 0.5 opacity, hit areas are at least 24 px, and a legend is
  always visible.
- **Accessibility:** the plain list is the accessible structure and the mobile default; the SVG is `aria-hidden` with
  `tabindex="-1"`. "Make everything boring" swaps to the list (same data), remembers the choice and announces it.
  The default view is the graph on wide pointer-fine screens and the list elsewhere, decided by CSS media queries so
  there is no flash. If the graph fails, the list is what remains.

## Visual system

| Token | Light | Dark |
|---|---|---|
| Background | `#F4F1EA` | `#141311` |
| Ink | `#1B1A17` | `#ECE8DF` |
| Muted | `#6B665C` | `#9A958A` |
| Line | `#D9D4C7` | `#2E2C28` |
| Accent | `#C2301A` | `#FF6B4A` |

- **Type:** Newsreader for text (19 px / 1.65, 65ch), Familjen Grotesk for headings and interface, Commit Mono for
  metadata, labels and code.
- **Motion:** only `transform` and `opacity` animate. Easings are `cubic-bezier(.22, 1, .36, 1)` out and
  `cubic-bezier(.65, 0, .35, 1)` in-out; durations 120, 220, 420 and 700 ms. Corners are square or 2 px.
- **Theme:** bright by default whatever the system says; the toggle switches to dark, and the browser-bar colour follows
  the site's own theme.
- **Logo:** a flat line that bends up (the ReLU activation function) and one point that misses it. Rules, files and
  colours are in [`brand/`](../brand/README.md).

## Pages

- **Idea:** a 65ch column, monospace metadata, a maturity badge, topic links, maths as MathML, demos that may break out
  of the column, related ideas and reading time.
- **CV:** a typeset column with a print stylesheet and a committed PDF, which must be rebuilt when the CV, the print
  styles or the fonts change (see "Edit the CV" in the [README](../README.md)).
- **Topic:** the hub title and the list of its ideas.
- **404:** an orphan node and a plain link home.

## Interactive essays and embeds

- **The essay** ("Machine learning is function approximation") is built from `essays/function-approximation/`. A build
  step turns the chapters into HTML with MathML (KaTeX) and a plain-text copy for the Markdown and `llms.txt` output;
  the figures are plain browser script, started only on that page.
- **LinkedIn posts** are click-to-load: nothing from LinkedIn runs until the visitor presses the button, and a plain
  link is the fallback.

## SEO and sharing

- Canonical URLs, Open Graph and Twitter tags, and `Person`, `WebSite`, `BlogPosting` and `BreadcrumbList` JSON-LD.
  Sitemap with `lastmod`, RSS, `robots.txt` and `llms.txt`. The home page HTML contains real links to every idea, tested
  with JavaScript off.
- **Share cards:** every idea gets its own 1200x630 PNG, drawn at build time by `nuxt-og-image` (Takumi renderer) from
  `app/components/OgImage/Idea.takumi.vue`: the mark, title, tagline, and kind and reading time. Other pages share one
  static card, `public/og-image.png`. Card files are named after a hash of their content, so a changed title or tagline
  gets a new address. Chat apps cache previews; Telegram's @WebpageBot refreshes a link.
- **Icons:** `favicon.ico` (16, 32, 48 px), a `favicon.svg` that follows the system light or dark setting, an
  `apple-touch-icon`, manifest icons and a web manifest, all in `public/`.
- **A trap worth knowing:** `seo.metaDataFiles` is switched off. Otherwise `nuxt-seo-utils` registers any
  `public/og-image.png` by its file name as a relative default, which the browser then applies on top of an idea's own
  card after the page hydrates.
- **Fonts for share images** are two local Commit Mono files in `public/fonts/`, loaded through `@nuxt/fonts`, so nothing
  is fetched from Google at build time. The site's own families (Newsreader, Familjen Grotesk) are excluded from
  `@nuxt/fonts` on purpose: left to it, it dropped the italic Newsreader faces.

## Privacy

No cookies. Visit statistics come from a self-hosted Umami and are off when the browser sends Global Privacy Control
or Do Not Track, when the visitor uses the footer opt-out, or when no collector is configured. The browser stores only
the visitor's own settings (theme, home view, essay example, opt-out). `/privacy` and `/legal` describe all of it.

## Out of scope

Comments, a newsletter, a CMS, translations, WebGL, and client-side search.

## Testing

- **Vitest:** graph building and layout, the content schema, the taxonomy, the analytics logic and the tagline helper.
- **`node:test`:** the essay's numerics and its build.
- **Playwright and axe, against the static build:** smoke tests (home, the graph toggle, an idea, the CV, links with
  JavaScript off), icons and share cards, and the analytics events against a stub collector. The build fails on invalid
  frontmatter.
