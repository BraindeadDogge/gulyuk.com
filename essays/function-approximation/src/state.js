(function (AP) {
  AP.TARGETS = ['smooth', 'wiggly', 'jump', 'noisy'];
  AP.state = { target: 'smooth', seed: 1, variant: 0 };
  AP.parseTarget = (search) => {
    const m = /target=([a-z]+)/.exec(search || '');
    return m && AP.TARGETS.includes(m[1]) ? m[1] : 'smooth';
  };
  // An explicit valid ?target= wins over the stored choice; anything invalid falls through to the next source.
  AP.initialTarget = (search, stored) => {
    const m = /target=([a-z]+)/.exec(search || '');
    if (m && AP.TARGETS.includes(m[1])) return m[1];
    return AP.TARGETS.includes(stored) ? stored : 'smooth';
  };
  AP.dataKey = () => AP.state.target + '|' + AP.state.seed + '|' + AP.state.variant;
  const listeners = [];
  AP.onState = (fn) => listeners.push(fn);
  AP.clearStateListeners = () => { listeners.length = 0; };
  AP.setState = (patch) => {
    const prev = AP.dataKey();
    Object.assign(AP.state, patch);
    AP.data = AP.makeData(AP.state);
    listeners.forEach((fn) => fn(prev));
  };
  AP.score = (g) => {
    const d = AP.data, t = AP.state.target;
    // Max error is meaningless on a jump: any continuous fit is off by about half the jump there.
    if (t === 'noisy') return { label: 'test RMSE', value: AP.metrics.rmse(g, d.f, d.xt) };
    if (t === 'jump') return { label: 'RMSE', value: AP.metrics.rmse(g, d.f, d.xt) };
    return { label: 'max error', value: AP.metrics.maxErr(g, d.f, d.xt) };
  };
  AP.data = AP.makeData(AP.state);
})(globalThis.AP = globalThis.AP || {});
