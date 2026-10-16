(function (AP) {
  // The site's Vue component calls boot() once the essay's markup is in the document and
  // teardown() when the reader leaves, so the page can be opened more than once in a session.
  AP.boot = function () {
    AP.teardown();
    AP.initFigures();
    AP.initBar();
    AP.initGlossary();
    AP.initNav();
    // One figure failing must not take the rest of the page down with it.
    AP.chapters.forEach((mount) => { try { mount(); } catch (e) { console.error('essay figure failed to start', e); } });
  };
})(globalThis.AP = globalThis.AP || {});
