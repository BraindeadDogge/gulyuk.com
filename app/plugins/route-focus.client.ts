// After a client-side navigation, move focus to the page heading so keyboard and
// screen-reader users land at the top of the new content instead of on a removed link.
export default defineNuxtPlugin((nuxtApp) => {
  let first = true
  nuxtApp.hook('page:finish', () => {
    if (first) {
      first = false
      return
    }
    const target = document.querySelector<HTMLElement>('#main-content h1') ?? document.getElementById('main-content')
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  })
})
