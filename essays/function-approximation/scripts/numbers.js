// Every number quoted in the prose is computed here, from the same code the figures run.
const AP = require('../tests/helpers').load();
const M = AP.metrics;
const grid = M.linspace(-1, 1, 4001);
const R = AP.targets.F.runge;
const sp = (x) => Math.sin(Math.PI * x);

const eq = (n) => M.maxErr(AP.poly.interpolate('equi', R, n).f, R, grid);
const ch = (n) => M.maxErr(AP.poly.interpolate('cheb', R, n).f, R, grid);
const ratio = (mk) => {
  const e = (n) => { const xs = M.linspace(-1, 1, n); return M.maxErr(mk(xs, xs.map(sp)), sp, grid); };
  return e(9) / e(17);
};
const K = 40;
const gibbs = AP.fourier.overshoot(
  AP.fourier.series(AP.fourier.coeffs(AP.targets.F.jump, K), K),
  AP.targets.JUMP,
  AP.targets.F.jump
);

const nums = {
  runge_eq10: eq(10).toFixed(1),
  runge_eq20: eq(20).toFixed(0),
  runge_cheb20: ch(20).toFixed(3),
  spline_lin_ratio: ratio(AP.spline.linear).toFixed(1),
  spline_cub_ratio: ratio(AP.spline.natural).toFixed(0),
  gibbs_pct: (100 * gibbs).toFixed(1),
};

// ---- chapter 5: default sample (Smooth target, seed BV.SEED, noise BV.SD)
{
  const BV = AP.biasvar, f = AP.targets.F.smooth;
  const c = BV.curves(f, BV.sample(f, 30, BV.SEED, BV.SD), BV.DMAX, M.linspace(-1, 1, 401));
  const best = c.test.indexOf(Math.min(...c.test));
  Object.assign(nums, {
    bv_best_deg: best,
    bv_best_rmse: c.test[best].toFixed(3),
    bv_deg20_rmse: c.test[BV.DMAX].toFixed(3),
    bv_deg20_train: c.train[BV.DMAX].toFixed(3),
    bv_trials: BV.TRIALS,
  });
}

Object.assign(nums, { cube_edge10: AP.trees.cubeEdge(0.1, 10).toFixed(2) });

Object.assign(nums, {
  fold_pieces8: AP.depth.pieces(AP.depth.sawtooth(8)),
  fold_params8: AP.depth.deepParams(8),
  shallow_w8: AP.depth.shallowWidth(AP.depth.deepParams(8)),
});

{
  const SP = AP.spectral, pct = (run, k, a) => SP.pct(run.g, k, a);
  const plain = SP.make(0, 1), ff = SP.make(4, 1);
  plain.advance(SP.STEPS); ff.advance(SP.STEPS);
  Object.assign(nums, {
    sb_low_plain: pct(plain, SP.LOW, SP.AMP_LOW),
    sb_high_plain: pct(plain, SP.HIGH, SP.AMP_HIGH),
    sb_high_ff: pct(ff, SP.HIGH, SP.AMP_HIGH),
  });
}

module.exports = nums;
