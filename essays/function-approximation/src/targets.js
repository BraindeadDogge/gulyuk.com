(function (AP) {
  const F = {
    smooth: (x) => 0.7 * Math.sin(2.5 * x) + 0.25 * x,
    wiggly0: (x) => 0.55 * Math.sin(5 * x) + 0.25 * Math.sin(11 * x + 1) + 0.1 * x,
    wiggly1: (x) => 0.5 * Math.sin(7 * x + 0.5) * Math.exp(-0.6 * x * x) + 0.3 * Math.cos(3 * x) - 0.1,
    jump: (x) => (x < 0.2 ? -0.5 + 0.4 * x : 0.6 - 0.3 * x),
    runge: (x) => 1 / (1 + 25 * x * x),
  };
  const JUMP = { x: 0.2, left: -0.5 + 0.4 * 0.2, right: 0.6 - 0.3 * 0.2 };
  AP.targets = { F, JUMP, domain: [-1, 1] };

  AP.makeData = function (state) {
    let f, noise = 0;
    if (state.target === 'wiggly') f = F['wiggly' + (state.variant % 2)];
    else if (state.target === 'noisy') { f = F.smooth; noise = 0.15; }
    else f = F[state.target];
    const rand = AP.rng(state.seed * 7919 + state.target.length * 31 + state.variant);
    const xs = Array.from({ length: 30 }, () => -1 + 2 * rand()).sort((a, b) => a - b);
    const ys = xs.map((x) => f(x) + (noise ? noise * AP.gauss(rand) : 0));
    // Held-out points are drawn after the training sample so existing samples keep their values.
    const xv = Array.from({ length: 15 }, () => -1 + 2 * rand()).sort((a, b) => a - b);
    const yv = xv.map((x) => f(x) + (noise ? noise * AP.gauss(rand) : 0));
    return {
      f, xs, ys, xv, yv, noise,
      xt: AP.metrics.linspace(-1, 1, 401),
      key: state.target + '|' + state.seed + '|' + state.variant,
    };
  };
})(globalThis.AP = globalThis.AP || {});
