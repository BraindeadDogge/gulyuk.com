const test = require('node:test');
const assert = require('node:assert/strict');
const nums = require('../scripts/numbers.js');

test('prose numbers exist and are sane', () => {
  for (const k of ['runge_eq10', 'runge_eq20', 'runge_cheb20', 'spline_lin_ratio', 'spline_cub_ratio', 'gibbs_pct'])
    assert.ok(k in nums && Number.isFinite(Number(nums[k])), k);
  assert.ok(Number(nums.runge_eq20) > Number(nums.runge_eq10));
  assert.ok(Number(nums.runge_cheb20) < 0.1);
  assert.ok(Number(nums.gibbs_pct) > 6 && Number(nums.gibbs_pct) < 12);
});

test('chapter 5 numbers', () => {
  for (const k of ['bv_best_deg', 'bv_best_rmse', 'bv_deg20_rmse', 'bv_deg20_train', 'bv_trials']) assert.ok(k in nums && Number.isFinite(Number(nums[k])), k);
  assert.ok(Number(nums.bv_deg20_rmse) > Number(nums.bv_best_rmse));
  assert.ok(Number(nums.bv_deg20_train) < Number(nums.bv_deg20_rmse));
});

test('chapter 6 number', () => {
  assert.ok(Math.abs(Number(nums.cube_edge10) - 0.79) < 0.005);
});

test('chapter 9 numbers', () => {
  assert.equal(Number(nums.fold_pieces8), 256);
  assert.equal(Number(nums.fold_params8), 48);
  assert.equal(Number(nums.shallow_w8), 15);
});

test('chapter 10 numbers', () => {
  for (const k of ['sb_low_plain', 'sb_high_plain', 'sb_high_ff']) assert.ok(k in nums && Number.isFinite(Number(nums[k])), k);
  assert.ok(Number(nums.sb_low_plain) > Number(nums.sb_high_plain));
  assert.ok(Number(nums.sb_high_ff) > Number(nums.sb_high_plain));
});
