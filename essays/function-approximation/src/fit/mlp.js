(function (AP) {
  // Fully connected tanh network with a linear scalar output. W[l][o * nin + i] connects input i to unit o of layer l.
  function create(sizes, seed) {
    const rand = AP.rng(seed), L = sizes.length - 1, W = [], b = [];
    for (let l = 0; l < L; l++) {
      const s = Math.sqrt(1 / sizes[l]);
      W.push(Float64Array.from({ length: sizes[l] * sizes[l + 1] }, () => s * AP.gauss(rand)));
      b.push(new Float64Array(sizes[l + 1]));
    }
    const zeros = (a) => a.map((v) => new Float64Array(v.length));
    return { sizes, W, b, mW: zeros(W), vW: zeros(W), mb: zeros(b), vb: zeros(b), t: 0 };
  }

  function forward(net, x) {
    const L = net.sizes.length - 1, acts = [Float64Array.from(x)];
    for (let l = 0; l < L; l++) {
      const nin = net.sizes[l], nout = net.sizes[l + 1], a = acts[l], out = new Float64Array(nout), W = net.W[l], b = net.b[l];
      for (let o = 0; o < nout; o++) {
        let s = b[o];
        const off = o * nin;
        for (let i = 0; i < nin; i++) s += W[off + i] * a[i];
        out[o] = l < L - 1 ? Math.tanh(s) : s;
      }
      acts.push(out);
    }
    return acts;
  }

  const predict = (net, x) => forward(net, x)[net.sizes.length - 1][0];

  function loss(net, X, Y) {
    let s = 0;
    for (let i = 0; i < X.length; i++) s += (predict(net, X[i]) - Y[i]) ** 2;
    return s / X.length;
  }

  // Full-batch mean-squared-error gradients by backpropagation.
  function grads(net, X, Y) {
    const L = net.sizes.length - 1, n = X.length;
    const gW = net.W.map((w) => new Float64Array(w.length)), gb = net.b.map((b) => new Float64Array(b.length));
    let total = 0;
    for (let s = 0; s < n; s++) {
      const acts = forward(net, X[s]), err = acts[L][0] - Y[s];
      total += err * err;
      let delta = Float64Array.of((2 * err) / n);
      for (let l = L - 1; l >= 0; l--) {
        const nin = net.sizes[l], nout = net.sizes[l + 1], a = acts[l];
        const prev = l > 0 ? new Float64Array(nin) : null;
        for (let o = 0; o < nout; o++) {
          const d = delta[o], off = o * nin;
          gb[l][o] += d;
          for (let i = 0; i < nin; i++) {
            gW[l][off + i] += d * a[i];
            if (prev) prev[i] += d * net.W[l][off + i];
          }
        }
        if (prev) { for (let i = 0; i < nin; i++) prev[i] *= 1 - a[i] * a[i]; delta = prev; } // tanh'
      }
    }
    return { gW, gb, loss: total / n };
  }

  function step(net, X, Y, lr) {
    const { gW, gb, loss: before } = grads(net, X, Y);
    net.t++;
    const b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, net.t), c2 = 1 - Math.pow(b2, net.t);
    const upd = (p, g, m, v) => {
      for (let i = 0; i < p.length; i++) {
        m[i] = b1 * m[i] + (1 - b1) * g[i];
        v[i] = b2 * v[i] + (1 - b2) * g[i] * g[i];
        p[i] -= (lr * (m[i] / c1)) / (Math.sqrt(v[i] / c2) + 1e-8);
      }
    };
    for (let l = 0; l < net.W.length; l++) { upd(net.W[l], gW[l], net.mW[l], net.vW[l]); upd(net.b[l], gb[l], net.mb[l], net.vb[l]); }
    return before;
  }

  // sigma = 0: the raw input. Otherwise m random frequencies b ~ N(0, sigma^2) and features sin/cos(2*pi*b*x).
  function features(sigma, m, seed) {
    if (!(sigma > 0)) return { dim: 1, map: (x) => [x] };
    const rand = AP.rng(seed), B = Array.from({ length: m }, () => sigma * AP.gauss(rand));
    return { dim: 2 * m, map: (x) => B.map((b) => Math.sin(2 * Math.PI * b * x)).concat(B.map((b) => Math.cos(2 * Math.PI * b * x))) };
  }

  AP.mlp = { create, predict, loss, grads, step, features };
})(globalThis.AP = globalThis.AP || {});
