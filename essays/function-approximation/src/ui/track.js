(function (AP) {
  // Tells the page which chapters get reached and which figures get used, without knowing what the site does
  // with it: the events leave as a plain DOM event that the site's analytics plugin listens for.
  AP.emit = (name, props) => { document.dispatchEvent(new CustomEvent('site:track', { detail: { name, props } })); };

  AP.initTrack = function () {
    const reached = new Set(), used = new Set();

    // Same reading band as the contents list in nav.js, so "reached" means what the reader sees as current.
    document.querySelectorAll('section.chapter').forEach((s) => {
      const io = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting || reached.has(s.id)) return;
        reached.add(s.id);
        AP.emit('essay-chapter', { idea: 'function-approximation', chapter: s.id });
      }, { rootMargin: '-40% 0px -55% 0px' });
      io.observe(s);
      AP.defer(() => io.disconnect());
    });

    // A figure counts as used on the first press, slider move or arrow/Enter/Space key inside it.
    const KEYS = ['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    document.querySelectorAll('figure.figure').forEach((fig, n) => {
      const chapter = fig.closest('section.chapter');
      const within = chapter ? [...chapter.querySelectorAll('figure.figure')].indexOf(fig) + 1 : n + 1;
      const id = (chapter ? chapter.id : 'ch') + '-' + within;
      const use = (e) => {
        if (e.type === 'keydown' && !KEYS.includes(e.key)) return;
        if (used.has(id)) return;
        used.add(id);
        AP.emit('figure-used', { figure: id });
      };
      ['pointerdown', 'input', 'keydown'].forEach((t) => AP.on(fig, t, use));
    });
  };
})(globalThis.AP = globalThis.AP || {});
