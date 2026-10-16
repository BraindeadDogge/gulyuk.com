AP.chapters.push(function () {
  const cv = AP.$('c9'); if (!cv) return;
  const D = AP.depth, grid = AP.metrics.linspace(-1, 1, 1001);
  const L = AP.slider('l9', null, () => fig.invalidate());
  const fig = AP.figure(cv, () => {
    const l = +L.value, deep = D.sawtooth(l), P = D.deepParams(l), W = D.shallowWidth(P);
    const sh = AP.nets.build(deep, W, 'relu').out;
    AP.plot(cv, { x0: -1, x1: 1, xs: 0.5, y0: -0.2, y1: 1.2, ys: 0.2,
      gap: [{ f: sh, g: deep }],
      curves: [{ f: deep, color: '--ink', width: 2 }, { f: sh, color: '--curve', width: 3 }] });
    AP.$('ro9').innerHTML = AP.S.ro.ch9({ L: l, P, deepPieces: 2 ** l, W, shallowPieces: D.pieces(sh), err: AP.metrics.maxErr(sh, deep, grid) });
  });
  AP.$('break9').addEventListener('click', () => { L.value = 8; AP.syncSlider('l9'); AP.note('bn9', AP.S.breakNote.ch9); });
  AP.$('reset9').addEventListener('click', () => { AP.resetSliders(['l9']); AP.note('bn9', ''); fig.invalidate(); });
});
