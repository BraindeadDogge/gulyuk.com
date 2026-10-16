# CLAUDE.md

Context for working on this repository with Claude Code (or any assistant) from any machine. It replaces the local,
git-ignored planning notes (`docs/superpowers/`, `.claude/`): everything that still matters from them is here, in
[docs/design.md](docs/design.md) and in [docs/analytics.md](docs/analytics.md).

## What this is

gulyuk.com: a personal site (CV, "ideas" notes, an interactive essay on function approximation, a graph home page).
Nuxt 4 + Nuxt Content 3, generated to static files, served by Caddy in a container on Railway behind Cloudflare.
The owner is Grigory Gulyuk. Pushing to `main` redeploys the site.

## Commands

| Command | Use |
|---|---|
| `pnpm install` | Install (Node 22.22+ or 24.15+, pnpm 10) |
| `pnpm dev` | Dev server on port 3000 (builds the essay bundle first) |
| `pnpm generate` | Static build into `.output/public` |
| `pnpm generate:test` | Same, with a stub analytics collector address baked in. **The e2e suite needs this build.** |
| `pnpm test` | Vitest unit tests |
| `pnpm test:essay` | The essay's `node:test` suite |
| `pnpm test:e2e` | Playwright + axe against the static build (installed Chrome, one worker, starts its own servers) |
| `pnpm taxonomy` | Regenerate the vocabulary tables in `NEW-IDEA-CHECKLIST.md` (tests fail if it is stale) |
| `pnpm cv:pdf` | Rebuild the committed CV PDF (needs Chrome) |

`pnpm typecheck` is currently broken by a `vue-tsc` / TypeScript 7 incompatibility (not investigated); rely on the tests.

## Where things are

- `app/` pages, components, composables, plugins. `app/components/OgImage/Idea.takumi.vue` is the share-card template.
- `content/ideas/*.md` the notes; `content/taxonomy.yml` the fixed vocabulary; `content/cv.yml` the CV;
  `content.config.ts` the schemas (a bad field fails the build).
- `essays/function-approximation/` the essay: `src/` chapters and figure scripts, `build.mjs` produces `dist/` (HTML with
  MathML, a script, and a plain-text copy). `pnpm dev/build/generate` run it first.
- `shared/` pure, unit-tested logic: `graph/`, `analytics/` (privacy gate, sanitising, reading progress), `og/` (tagline).
- `brand/` logo kit; `public/` icons, manifest, `og-image.png`, fonts for share images, the CV PDF.
- `tests/unit/`, `tests/e2e/` (`stub-umami.mjs` is the fake analytics collector).
- `Dockerfile`, `Caddyfile` (headers, CSP, caching), `DEPLOY.md` (hosting).

## Rules of the house

- **Design:** warm paper, ink and **one** vermilion accent. No gradients, shadows, glass, glow or emoji icons. Tokens are
  in `docs/design.md`. Only `transform` and `opacity` animate. The home graph's plain list is the accessible version.
- **Every published idea needs** `summary` and a `tagline` of 80 characters or fewer (a content test enforces it), plus
  one `area` and 0 to 3 `topics` from `content/taxonomy.yml`. Add a topic only when none fits, then run `pnpm taxonomy`.
- **Privacy:** no cookies. If you add or remove a browser-stored key or an analytics event, update `app/pages/privacy.vue`
  and `docs/analytics.md`; a test checks that the privacy page names every stored key
  (`gulyuk-theme`, `gulyuk-view`, `ap-target`, `gulyuk-optout`).
- **Rebuild the CV PDF when the CV changes.** `public/pdf/Grigory-Gulyuk-CV.pdf` is committed and never updates itself. After
  any change to `content/cv.yml`, `content/taxonomy.yml`, `app/pages/cv.vue`, the print CSS, or the site's fonts or colours,
  run `pnpm generate && pnpm cv:pdf && pnpm generate` (plain `generate`, not `generate:test`; needs local Chrome) and commit the
  PDF with the change. `tests/unit/cv-pdf.test.ts` fails if it links to a local address. Details in the README's "Edit the CV".
- **Tests first** for behaviour changes; watch the test fail, then make it pass. Run unit, essay and e2e before saying done.
- **Match the surrounding code:** short comments that say why, no decoration.

## Traps we already fell into

- **Nuxt Content caches parsed files by hash** in `.data/content/contents.sqlite`. `essays/.../build.mjs` clears it when
  the essay text changes; delete `.data/content` by hand if a Markdown copy looks stale.
- **The essay's Markdown/`llms.txt` text** is injected at parse time by the `content:file:beforeParse` hook in
  `nuxt.config.ts` (from `essays/.../dist/essay.md`). The page itself drops that copy again (`ideas/[slug].vue`).
- **`seo.metaDataFiles` is `false` on purpose.** Otherwise `nuxt-seo-utils` registers `public/og-image.png` by file name as
  a *relative* default that the browser applies over an idea's own share card after hydration. Read tags after hydration
  in tests (the e2e specs wait for network idle) and compare them with the generated HTML.
- **`@nuxt/fonts` must not touch the site's own fonts.** It was added only for the share-card font, but left alone it took over
  `Newsreader Variable` and `Familjen Grotesk Variable` and dropped the italic Newsreader faces, so every italic was a slanted
  upright font (and the CV PDF was printed that way). `fonts.families` in `nuxt.config.ts` marks both as `provider: 'none'`;
  `tests/e2e/fonts.spec.ts` checks the real italic loads. If you add another font family, check it still does.
- **Share cards:** `nuxt-og-image` with Takumi and `zeroRuntime: true`; the site-wide card is registered in `app/app.vue`
  for every page *except* idea pages. Card fonts are local Commit Mono files via `@nuxt/fonts` (nothing from Google).
- **Prerendered pages hydrate with the bare path** and the router restores the query later, so `?ref=` is read from the
  browser's navigation entry in `app/plugins/analytics.client.ts`, then removed through the router.
- **Analytics build variables** (`NUXT_PUBLIC_UMAMI_*`) are baked in at build time; the `Dockerfile` passes them as build
  arguments. Unset means no analytics code at all. The Caddy CSP allows `https://stats.gulyuk.com`.
- **Caddy** serves the static output with no SPA fallback (unknown URLs are real 404s). Hashed files (`/_nuxt/`, `/_og/`)
  are cached for a year; HTML is always revalidated.
- **Cloudflare:** use the `cf` CLI. After a deploy, purge changed URLs (`cf zones list` for the zone id, then
  `cf cache purge -z <zone> --body '{"files":[...]}'`, dry-run first). iOS browsers and Telegram cache icons and previews
  on their own; Telegram's @WebpageBot refreshes a link.

## How the owner likes to work

- **Ask before committing, and ask again before pushing.** A push redeploys the live site. Commit in small logical groups.
- Never commit `docs/superpowers/` or `.claude/` (both are in `.gitignore`).
- Never sign in or type credentials on the owner's behalf; hand those steps over.
- Prefer a short design in chat before building anything non-trivial, and say plainly what was and was not verified.

## Open items (as of 2026-10-17)

- **Visit statistics are built but not switched on.** Umami still has to be deployed on Railway and the three
  `NUXT_PUBLIC_UMAMI_*` variables set (steps in `docs/analytics.md`). Until then `/privacy` describes counting that is not
  happening yet.
- Before relying on `/privacy`: accept the data-processing terms with Railway and Cloudflare and confirm their transfer
  safeguards; check how often Umami's visit-identifier secret changes and that it stores no IP addresses; set up the
  13-month retention job; have a lawyer or the Cyprus data-protection commissioner read `/privacy` and `/legal`.
- `/legal` has no postal address on purpose (a personal, non-commercial site; the owner does not want a home address
  public). Revisit if the site starts selling anything.
- The owner is based in Cyprus (GDPR and the Cyprus ePrivacy law apply). The contact address shown on the site is
  `grigory.gulyuk@gmail.com`.
- Not done: a licence file for the public repository.
