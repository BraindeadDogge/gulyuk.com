// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@nuxt/content', '@nuxtjs/seo', '@nuxtjs/color-mode'],

  site: {
    url: 'https://gulyuk.com',
    name: 'Grigory Gulyuk',
    description: 'Notes, experiments and a CV by Grigory Gulyuk, a software engineer working on AI tooling and full-stack products.',
    defaultLocale: 'en',
    trailingSlash: false,
  },

  css: [
    '@fontsource-variable/newsreader/index.css',
    '@fontsource-variable/newsreader/wght-italic.css',
    '@fontsource-variable/familjen-grotesk/index.css',
    '@fontsource/commit-mono/400.css',
    '@fontsource/commit-mono/700.css',
    '~/assets/css/main.css',
  ],

  colorMode: {
    // Bright by default, whatever the visitor's system says. The toggle still switches to dark.
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'gulyuk-theme',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#F4F1EA' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // Applies the visitor's saved home view (graph or list) before first paint, on every page,
      // so it also works when they arrive on another page and click through to the home page.
      script: [
        {
          tagPosition: 'head',
          innerHTML:
            "try{var v=localStorage.getItem('gulyuk-view');if(innerWidth>=760&&(v==='graph'||v==='list'))document.documentElement.dataset.view=v}catch(e){}",
        },
      ],
    },
  },

  content: {
    build: {
      markdown: {
        highlight: { theme: { default: 'min-light', dark: 'min-dark' } },
        remarkPlugins: { 'remark-math': {} },
        rehypePlugins: {
          'rehype-katex': { options: { output: 'mathml' } },
          // Links that leave the site open in a new tab.
          'rehype-external-links': { options: { target: '_blank', rel: ['noopener', 'noreferrer'] } },
        },
      },
    },
  },

  hooks: {
    // The essay is a Vue component, so its source file holds only a tag. Put the plain-text build of the post
    // (essays/function-approximation/dist/essay.md) inside that tag when the content is parsed, so /ideas/<slug>.md,
    // llms.txt and search show the real text. The page itself drops these children again (see ideas/[slug].vue).
    'content:file:beforeParse': (ctx: { file: { id: string, body: string } }) => {
      if (!ctx.file.id.endsWith('ideas/function-approximation.md')) return
      let text = ''
      try { text = readFileSync(resolve('essays/function-approximation/dist/essay.md'), 'utf8') }
      catch { return }
      ctx.file.body = ctx.file.body.replace('::function-approximation-essay\n::', () => `::function-approximation-essay\n${text}\n::`)
    },
  },

  // Content is queried only while prerendering; results travel in the page payload,
  // so browsers never download the content database.
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/ideas', '/cv', '/rss.xml', '/not-found', '/404.html'],
    },
  },

  experimental: {
    viewTransition: true,
    payloadExtraction: true,
  },

  sitemap: { zeroRuntime: true, sources: ['/api/__sitemap__/urls'], exclude: ['/not-found', '/404.html'] },
  robots: { allow: ['/'] },
  ogImage: { enabled: false },
  linkChecker: { enabled: false },
  schemaOrg: {
    identity: {
      type: 'Person',
      name: 'Grigory Gulyuk',
      url: 'https://gulyuk.com',
      sameAs: ['https://www.linkedin.com/in/gulyuk', 'https://github.com/BraindeadDogge'],
    },
  },

  typescript: { strict: true },
})
