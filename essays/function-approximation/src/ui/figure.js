(function (AP) {
  AP.$ = (id) => document.getElementById(id);
  AP.chapters = [];

  // Anything attached outside the essay's own elements is registered here, so teardown() can
  // release it when the reader navigates away. The site is a single-page app: the script outlives the page.
  AP._off = [];
  AP.defer = (fn) => { AP._off.push(fn); };
  AP.on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    AP._off.push(() => target.removeEventListener(type, fn, opts));
  };

  AP.slider = (id, fmt, fn) => {
    const el = AP.$(id), out = AP.$(id + 'o');
    // The slider itself announces its value; the visible number must not announce it a second time on every step.
    out.setAttribute('aria-live', 'off');
    const upd = () => { out.value = fmt ? fmt(+el.value) : el.value; };
    el.addEventListener('input', () => { upd(); fn(); });
    upd();
    return el;
  };
  AP.syncSlider = (id) => { const el = AP.$(id); el.dispatchEvent(new Event('input')); };
  AP.resetSliders = (ids) => ids.forEach((id) => { const el = AP.$(id); el.value = el.defaultValue; AP.syncSlider(id); });
  AP.note = (id, text) => {
    const el = AP.$(id); if (!el) return;
    el.textContent = text || '';
    // Make the effect of "Break it" visible: the figure is above the button and may be off-screen.
    const fig = el.closest('.figure');
    if (text && fig) { fig.classList.add('flash'); setTimeout(() => fig.classList.remove('flash'), 900); const r = fig.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) fig.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  };

  AP.choice = (group, init, fn) => {
    const bs = [...group.querySelectorAll('button')];
    const set = (v) => bs.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    bs.forEach((b) => b.addEventListener('click', () => { set(b.dataset.v); fn(b.dataset.v); }));
    set(init);
    return set;
  };

  // ---- figure registry: rAF-coalesced redraw, paused while off-screen
  const figs = [];
  let raf = 0;
  const frame = () => { raf = 0; figs.forEach((f) => { if (f.dirty && f.visible) { f.dirty = false; f.draw(); } }); };
  AP.figure = (cv, draw) => {
    const fig = { cv, draw, dirty: true, visible: true };
    fig.invalidate = () => { fig.dirty = true; if (!raf) raf = requestAnimationFrame(frame); };
    const ro = new ResizeObserver(fig.invalidate); ro.observe(cv);
    const io = new IntersectionObserver((es) => { fig.visible = es[0].isIntersecting; if (fig.visible) fig.invalidate(); }); io.observe(cv);
    AP.defer(() => { ro.disconnect(); io.disconnect(); });
    figs.push(fig); fig.invalidate();
    return fig;
  };
  AP.invalidateAll = () => figs.forEach((f) => f.invalidate());

  // ---- draggable handles with keyboard support
  AP.handles = (cv, o) => {
    let sel = 0, drag = -1;
    const range = o.range || [-1.2, 1.2];
    // The canvas is a picture you can drag on. Keyboard and screen-reader users get one real slider per handle,
    // below it (hidden until one is focused), with a name and a value. The canvas stays out of the tab order.
    cv.setAttribute('aria-hidden', 'true');
    cv.style.touchAction = 'none'; // only canvases with draggable handles capture touch; the rest let the page scroll
    const clampSel = () => { sel = Math.max(0, Math.min(sel, o.get().length - 1)); };
    const pt = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const near = (px, py) => {
      const t = cv._tx; if (!t) return -1;
      let best = -1, bd = 22 * 22;
      o.get().forEach((h, i) => { const dx = t.X(h.x) - px, dy = t.Y(h.y) - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } });
      return best;
    };
    cv.addEventListener('pointerdown', (e) => {
      const [px, py] = pt(e), i = near(px, py); if (i < 0) return;
      drag = sel = i; cv.setPointerCapture(e.pointerId); cv.focus();
      if (o.select) o.select(i); e.preventDefault();
    });
    cv.addEventListener('pointermove', (e) => {
      if (drag < 0 || !cv._tx) return;
      const [px, py] = pt(e); o.move(drag, cv._tx.invX(px), cv._tx.invY(py));
    });
    const end = () => { drag = -1; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('keydown', (e) => {
      const hs = o.get(); if (!hs.length) return;
      clampSel();
      if (e.key === 'Tab') {
        const n = sel + (e.shiftKey ? -1 : 1);
        if (n >= 0 && n < hs.length) { sel = n; e.preventDefault(); if (o.select) o.select(n); }
        return;
      }
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (!d) return;
      e.preventDefault();
      const k = e.shiftKey ? 5 : 1, h = hs[Math.min(sel, hs.length - 1)];
      o.move(sel, h.x + d[0] * o.step[0] * k, h.y + d[1] * o.step[1] * k);
    });
    cv.addEventListener('focus', () => { clampSel(); if (o.select) o.select(sel); });

    // One slider per handle (and one per knot position where the handles can also move sideways).
    const group = document.createElement('div');
    group.className = 'handle-inputs';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', (cv.dataset.label || 'Handles') + '. One slider per handle.');
    cv.after(group);
    AP.defer(() => group.remove());
    const rows = [];
    const makeSlider = (i, axis, lo, hi, step) => {
      const wrap = document.createElement('label'); wrap.className = 'hi';
      const name = document.createElement('span'); name.textContent = (i + 1) + (axis === 'x' ? ' x' : ' y');
      const el = document.createElement('input'); el.type = 'range'; el.min = lo; el.max = hi; el.step = step;
      el.addEventListener('input', () => {
        const h = o.get()[i]; if (!h) return;
        o.move(i, axis === 'x' ? +el.value : h.x, axis === 'y' ? +el.value : h.y);
      });
      el.addEventListener('focus', () => { sel = i; if (o.select) o.select(i); });
      wrap.append(name, el); group.append(wrap);
      return { wrap, el };
    };
    cv._sync = () => {
      const hs = o.get();
      while (rows.length > hs.length) { const r = rows.pop(); r.y.wrap.remove(); if (r.x) r.x.wrap.remove(); }
      while (rows.length < hs.length) {
        const i = rows.length;
        rows.push({ y: makeSlider(i, 'y', range[0], range[1], o.step[1]), x: o.step[0] > 0 ? makeSlider(i, 'x', -1, 1, o.step[0]) : null });
      }
      hs.forEach((h, i) => {
        const r = rows[i];
        r.y.el.value = h.y;
        r.y.el.setAttribute('aria-label', 'Handle ' + (i + 1) + ' of ' + hs.length + ', height');
        r.y.el.setAttribute('aria-valuetext', 'height ' + h.y.toFixed(2) + ' at x = ' + h.x.toFixed(2));
        if (r.x) {
          r.x.el.value = h.x;
          r.x.el.setAttribute('aria-label', 'Handle ' + (i + 1) + ' of ' + hs.length + ', position');
          r.x.el.setAttribute('aria-valuetext', 'x = ' + h.x.toFixed(2));
        }
      });
    };
  };

  // ---- notices and pinned fits
  let noticeTimer = 0;
  AP.notice = (msg) => {
    const el = AP.$('notice'); if (!el) return;
    // Messages that arrive together are joined, so one never hides another.
    el.textContent = el.textContent ? el.textContent + ' ' + msg : msg; clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { el.textContent = ''; }, 5000);
  };
  AP.pins = [];
  const pinL = [];
  AP.onPins = (fn) => pinL.push(fn);
  const firePins = () => pinL.forEach((fn) => fn());
  AP.pin = ({ name, f, params, paramText, ms }) => {
    const rec = { name, f, params, paramText, ms: ms || 0, err: AP.score(f), key: AP.dataKey() };
    const i = AP.pins.findIndex((p) => p.name === name);
    if (i >= 0) AP.pins.splice(i, 1);
    AP.pins.push(rec);
    if (AP.pins.length > 6) AP.pins.shift();
    firePins();
    // The pins are drawn in chapter 11, far from the button: say here that the click worked.
    const btn = document.activeElement && document.activeElement.closest ? document.activeElement.closest('button') : null;
    const fig = btn && btn.closest('.figure');
    if (!fig) return;
    let el = fig.querySelector('.pinnote');
    if (!el) { el = document.createElement('p'); el.className = 'pinnote'; el.setAttribute('role', 'status'); (btn.closest('.row') || btn).after(el); }
    el.innerHTML = '';
    el.append('Pinned “' + name + '” (' + AP.pins.length + ' of 6). ');
    const a = document.createElement('a'); a.href = '#ch11'; a.textContent = 'Compare in chapter 11';
    el.append(a, '.');
  };
  AP.unpin = (i) => { AP.pins.splice(i, 1); firePins(); };
  // Called by boot(): state listeners and the theme observer live as long as this page does.
  AP.initFigures = () => {
    AP.onState(() => AP.invalidateAll());
    AP.onState((prevKey) => {
      if (prevKey !== AP.dataKey() && AP.pins.length) {
        AP.pins.length = 0; firePins();
        document.querySelectorAll('.pinnote').forEach((n) => n.remove());
        AP.notice(AP.S.notice.pinsCleared);
      }
    });
    // The site switches theme with a class on <html>; the canvases re-read their colours when it changes.
    const mo = new MutationObserver(AP.invalidateAll);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    AP.defer(() => mo.disconnect());
  };

  AP.teardown = () => {
    AP._off.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* the element may already be gone */ } });
    cancelAnimationFrame(raf); raf = 0;
    clearTimeout(noticeTimer);
    figs.length = 0; pinL.length = 0; AP.pins.length = 0;
    AP.clearStateListeners();
  };
})(globalThis.AP = globalThis.AP || {});
