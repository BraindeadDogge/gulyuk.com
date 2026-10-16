(function (AP) {
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  AP.css = css;
  AP.VIEW = { x0: -1, x1: 1, xs: 0.5, y0: -1.2, y1: 1.2, ys: 0.4 };
  const fmt = (v) => String(Math.round(v * 100) / 100);

  AP.plot = function (cv, o) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const L = 34, R = 10, T = 10, B = 26;
    const X = (x) => L + ((x - o.x0) / (o.x1 - o.x0)) * (W - L - R);
    const Y = (y) => T + ((o.y1 - y) / (o.y1 - o.y0)) * (H - T - B);
    cv._tx = {
      X, Y,
      invX: (px) => o.x0 + ((px - L) / (W - L - R)) * (o.x1 - o.x0),
      invY: (py) => o.y1 - ((py - T) / (H - T - B)) * (o.y1 - o.y0),
    };
    const clampY = (y) => Math.max(o.y0 - 5, Math.min(o.y1 + 5, y));
    const N = Math.max(300, Math.round(W));

    c.font = '11px "Commit Mono",ui-monospace,monospace'; c.lineWidth = 1;
    (o.shade || []).forEach((s) => {
      c.globalAlpha = 0.5; c.fillStyle = css('--line');
      c.fillRect(X(s.x0), T, X(s.x1) - X(s.x0), H - T - B); c.globalAlpha = 1;
    });
    c.strokeStyle = css('--line'); c.fillStyle = css('--muted');
    for (let x = Math.ceil(o.x0 / o.xs) * o.xs; x <= o.x1 + 1e-9; x += o.xs) {
      c.beginPath(); c.moveTo(X(x), T); c.lineTo(X(x), H - B); c.stroke();
      c.textAlign = 'center'; c.fillText(fmt(x), X(x), H - 8);
    }
    for (let y = Math.ceil(o.y0 / o.ys) * o.ys; y <= o.y1 + 1e-9; y += o.ys) {
      c.beginPath(); c.moveTo(L, Y(y)); c.lineTo(W - R, Y(y)); c.stroke();
      c.textAlign = 'right'; c.fillText(fmt(y), L - 6, Y(y) + 4);
    }
    c.strokeStyle = css('--muted'); c.lineWidth = 1.2;
    if (o.y0 < 0 && o.y1 > 0) { c.beginPath(); c.moveTo(L, Y(0)); c.lineTo(W - R, Y(0)); c.stroke(); }
    if (o.x0 < 0 && o.x1 > 0) { c.beginPath(); c.moveTo(X(0), T); c.lineTo(X(0), H - B); c.stroke(); }

    (o.vlines || []).forEach((v) => {
      if (v.x < o.x0 || v.x > o.x1) return;
      c.strokeStyle = css(v.color || '--param'); c.setLineDash([2, 4]); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(X(v.x), T); c.lineTo(X(v.x), H - B); c.stroke(); c.setLineDash([]);
    });

    (o.band || []).forEach(({ lo, hi }) => {
      c.globalAlpha = 0.18; c.fillStyle = css('--curve'); c.beginPath();
      for (let i = 0; i <= N; i++) { const x = o.x0 + ((o.x1 - o.x0) * i) / N, y = hi(x); if (isFinite(y)) c.lineTo(X(x), Y(clampY(y))); }
      for (let i = N; i >= 0; i--) { const x = o.x0 + ((o.x1 - o.x0) * i) / N, y = lo(x); if (isFinite(y)) c.lineTo(X(x), Y(clampY(y))); }
      c.closePath(); c.fill(); c.globalAlpha = 1;
    });

    (o.gap || []).forEach(({ f, g }) => {
      c.globalAlpha = 0.25; c.fillStyle = css('--err'); c.beginPath();
      for (let i = 0; i <= N; i++) { const x = o.x0 + ((o.x1 - o.x0) * i) / N, y = f(x); if (isFinite(y)) c.lineTo(X(x), Y(clampY(y))); }
      for (let i = N; i >= 0; i--) { const x = o.x0 + ((o.x1 - o.x0) * i) / N, y = g(x); if (isFinite(y)) c.lineTo(X(x), Y(clampY(y))); }
      c.closePath(); c.fill(); c.globalAlpha = 1;
    });

    (o.curves || []).forEach((cu) => {
      c.strokeStyle = css(cu.color); c.lineWidth = cu.width || 2.5; c.setLineDash(cu.dash || []);
      c.beginPath(); let pen = false;
      for (let i = 0; i <= N; i++) {
        const x = o.x0 + ((o.x1 - o.x0) * i) / N, y = cu.f(x);
        if (!isFinite(y)) { pen = false; continue; }
        if (pen) c.lineTo(X(x), Y(clampY(y))); else c.moveTo(X(x), Y(clampY(y)));
        pen = true;
      }
      c.stroke(); c.setLineDash([]);
    });

    (o.points || []).forEach((ps) => {
      c.strokeStyle = c.fillStyle = css(ps.color || '--ink'); c.lineWidth = 1.5;
      ps.pts.forEach(([x, y]) => {
        c.beginPath(); c.arc(X(x), Y(y), 3.5, 0, 6.2832);
        if (ps.filled) c.fill(); else c.stroke();
      });
    });

    (o.handles || []).forEach((h) => {
      c.fillStyle = css('--param'); c.strokeStyle = css('--bg'); c.lineWidth = 2;
      c.beginPath(); c.arc(X(h.x), Y(h.y), 7, 0, 6.2832); c.fill(); c.stroke();
      // The selected handle (the one whose slider has focus) carries an accent ring, so keyboard users can see it.
      if (h.active) { c.strokeStyle = css('--curve'); c.lineWidth = 2.5; c.beginPath(); c.arc(X(h.x), Y(h.y), 12, 0, 6.2832); c.stroke(); }
    });
    // Keeps the per-handle sliders (see AP.handles) in step with what was just drawn.
    if (cv._sync) cv._sync();
  };
})(globalThis.AP = globalThis.AP || {});
