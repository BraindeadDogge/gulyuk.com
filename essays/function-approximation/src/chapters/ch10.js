AP.chapters.push(function () {
  const cv = AP.$('c10'); if (!cv) return;
  const SP = AP.spectral;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let run = SP.make(SP.SIGMAS[0], 1), playing = false, raf = 0, started = false, quiet = false;

  const S = AP.slider('s10', (v) => (SP.SIGMAS[v] ? 'σ = ' + SP.SIGMAS[v] : 'plain'), () => { if (!quiet) restart(true); });

  function setPlaying(on) {
    playing = on; cancelAnimationFrame(raf);
    AP.$('play10').textContent = on ? 'Pause' : 'Train';
    AP.$('ro10').setAttribute('aria-live', on ? 'off' : 'polite');
    if (on) raf = requestAnimationFrame(tick);
    sync();
  }
  function sync() {
    const done = run.steps >= SP.STEPS;
    AP.$('play10').disabled = done || reduce;
    AP.$('step10').disabled = done;
    AP.$('play10').hidden = reduce;
  }
  function tick() {
    if (!playing) return;
    if (!fig.visible) return; // resumed by the visibility observer below
    run.advance(4); fig.invalidate();
    if (run.steps >= SP.STEPS) { setPlaying(false); return; }
    raf = requestAnimationFrame(tick);
  }
  function restart(play) {
    run = SP.make(SP.SIGMAS[+S.value], 1);
    setPlaying(false); fig.invalidate();
    if (play && !reduce) setPlaying(true);
  }

  const fig = AP.figure(cv, () => {
    const g = run.g, tr = SP.train;
    AP.plot(cv, { x0: -1, x1: 1, xs: 0.5, y0: -1.8, y1: 1.8, ys: 0.6,
      curves: [{ f: SP.target, color: '--ink', width: 2 }, { f: g, color: '--curve', width: 3 }],
      points: [{ pts: tr.xs.map((x, i) => [x, tr.ys[i]]), filled: true }] });
    AP.$('ro10').innerHTML = AP.S.ro.ch10({
      steps: run.steps, loss: run.loss,
      low: SP.pct(g, SP.LOW, SP.AMP_LOW, 400),
      high: SP.pct(g, SP.HIGH, SP.AMP_HIGH, 400),
    });
  });

  const io10 = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return;
    if (!started) { started = true; if (!reduce) setPlaying(true); }
    else if (playing) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  });
  io10.observe(cv);
  // Leaving the page stops the training loop.
  AP.defer(() => { io10.disconnect(); playing = false; cancelAnimationFrame(raf); });

  AP.$('play10').addEventListener('click', () => setPlaying(!playing));
  AP.$('step10').addEventListener('click', () => { setPlaying(false); run.advance(25); fig.invalidate(); sync(); });
  AP.$('reset10').addEventListener('click', () => { quiet = true; try { AP.resetSliders(['s10']); } finally { quiet = false; } AP.note('bn10', ''); restart(false); });
  AP.$('break10').addEventListener('click', () => {
    S.value = 0; S.dispatchEvent(new Event('input')); // restarts with the plain input and trains
    AP.note('bn10', AP.S.breakNote.ch10);
  });
  sync();
});
