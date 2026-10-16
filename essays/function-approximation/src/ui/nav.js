(function (AP) {
  // Contents list, reading-progress line, and the sticky target bar. The theme is the site's, so there is no
  // theme button here; the site header owns it.
  AP.initNav = function () {
    const chapters = [...document.querySelectorAll('section.chapter')];
    const toc = AP.$('toc'), ol = toc.querySelector('ol'), bar = AP.$('bar');
    chapters.forEach((s) => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + s.id; a.textContent = s.dataset.title; li.append(a); ol.append(li);
    });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = document.documentElement.scrollHeight - innerHeight;
        const line = AP.$('progress');
        if (line) line.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
        const hook = AP.$('ch0');
        if (bar) bar.hidden = hook ? hook.getBoundingClientRect().bottom > 80 : false;
      });
    };
    AP.on(window, 'scroll', onScroll, { passive: true });
    AP.on(window, 'resize', onScroll);
    onScroll();

    // The address bar follows the chapter being read. The router's own history state is kept.
    // The address is only rewritten once the reader has scrolled, so arriving at /…#ch5 is not undone
    // by the first chapter that happens to be near the top before the browser has jumped to #ch5.
    let userScrolled = false;
    AP.on(window, 'scroll', () => { userScrolled = true; }, { once: true, passive: true });
    const links = [...ol.querySelectorAll('a')];
    chapters.forEach((s) => {
      const io = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) return;
        links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + s.id)));
        if (!userScrolled) return;
        try { history.replaceState(history.state, '', location.pathname + location.search + '#' + s.id); } catch (err) {}
      }, { rootMargin: '-40% 0px -55% 0px' });
      io.observe(s);
      AP.defer(() => io.disconnect());
    });

    const reset = AP.$('reset-all');
    if (reset) reset.addEventListener('click', (e) => { e.preventDefault(); location.href = location.pathname; });
  };
})(globalThis.AP = globalThis.AP || {});
