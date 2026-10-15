// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@nuxt/content', '@nuxtjs/seo', '@nuxtjs/color-mode'],

  site: {
    url: 'https://gulyuk.com',
    name: 'Grigory Gulyuk',
    description: 'Notes, research and experiments by Grigory Gulyuk.',
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
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'gulyuk-theme',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#F4F1EA', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#141311', media: '(prefers-color-scheme: dark)' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // Applies the visitor's saved home view (graph or list) before first paint, on every page,
      // so it also works when they arrive on another page and click through to the home page.
      script: [
        {
          tagPosition: 'head',
          innerHTML:
            "try{var v=localStorage.getItem('gulyuk-view');if(v==='graph'||v==='list')document.documentElement.dataset.view=v}catch(e){}",
        },
      ],
    },
  },

  content: {
    build: {
      markdown: {
        highlight: { theme: { default: 'min-light', dark: 'min-dark' } },
        remarkPlugins: { 'remark-math': {} },
        rehypePlugins: { 'rehype-katex': { options: { output: 'mathml' } } },
      },
    },
  },

  // Content is queried only while prerendering; results travel in the page payload,
  // so browsers never download the content database.
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/ideas', '/cv', '/rss.xml', '/404.html'],
    },
  },

  experimental: {
    viewTransition: true,
    payloadExtraction: true,
  },

  sitemap: { zeroRuntime: true, sources: ['/api/__sitemap__/urls'] },
  robots: { allow: ['/'] },
  ogImage: { enabled: false },
  linkChecker: { enabled: false },
  schemaOrg: { identity: { type: 'Person', name: 'Grigory Gulyuk', url: 'https://gulyuk.com' } },

  typescript: { strict: true },
})
