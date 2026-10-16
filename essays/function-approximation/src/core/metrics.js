(function (AP) {
  const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => (n === 1 ? a : a + ((b - a) * i) / (n - 1)));
  const maxErr = (g, f, xs) => xs.reduce((m, x) => Math.max(m, Math.abs(g(x) - f(x))), 0);
  const rmse = (g, f, xs) => Math.sqrt(xs.reduce((s, x) => s + (g(x) - f(x)) ** 2, 0) / xs.length);
  const rmsePts = (g, xs, ys) => Math.sqrt(xs.reduce((s, x, i) => s + (g(x) - ys[i]) ** 2, 0) / xs.length);
  AP.metrics = { linspace, maxErr, rmse, rmsePts };
})(globalThis.AP = globalThis.AP || {});
