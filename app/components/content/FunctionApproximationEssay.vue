<script lang="ts">
// The essay is built from essays/function-approximation (see its build.mjs): the text and math arrive as
// ready-made HTML, so crawlers and readers without scripts get the full article. The figures are plain
// browser script, loaded only here and only in the browser, then started once the markup is in the page.
import { defineComponent, h, onBeforeUnmount, onMounted } from 'vue'
import chaptersHtml from '~~/essays/function-approximation/dist/chapters.html?raw'
import '~/assets/css/essay.css'

type EssayApi = { boot: () => void; teardown: () => void }
const api = () => (globalThis as unknown as { AP?: EssayApi }).AP

export default defineComponent({
  name: 'FunctionApproximationEssay',
  setup() {
    let alive = true

    onMounted(async () => {
      await import('~~/essays/function-approximation/dist/essay.js')
      // The reader may have left while the script was loading: then there is nothing to start.
      if (alive) api()?.boot()
    })

    // The site is a single-page app, so leaving the page must release what the figures attached to it.
    onBeforeUnmount(() => {
      alive = false
      api()?.teardown()
    })

    // A plain element with innerHTML (not a compiled template binding) lets hydration keep the
    // server-rendered article as it is, instead of replacing it all after load.
    return () => h('div', { class: 'essay-root breakout', innerHTML: chaptersHtml })
  },
})
</script>
