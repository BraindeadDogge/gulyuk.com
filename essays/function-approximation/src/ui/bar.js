(function (AP) {
  AP.initBar = function () {
    let search = '', stored = null;
    try { search = location.search; } catch (e) {}
    try { stored = localStorage.getItem('ap-target'); } catch (e) {}
    const start = AP.initialTarget(search, stored);
    const setChip = AP.choice(AP.$('chips'), start, (v) => AP.setState({ target: v }));
    // On phones the chips give way to a compact picker. Both show the same state.
    const pick = AP.$('target-select');
    if (pick) { pick.value = start; pick.addEventListener('change', () => AP.setState({ target: pick.value })); }
    if (start !== AP.state.target) AP.setState({ target: start });
    AP.onState(() => {
      setChip(AP.state.target);
      if (pick) pick.value = AP.state.target;
      try { localStorage.setItem('ap-target', AP.state.target); } catch (e) {}
      // Keep the router's own history state (so the site's back button keeps working) and any other query parameters.
      try {
        const q = new URLSearchParams(location.search); q.set('target', AP.state.target);
        history.replaceState(history.state, '', location.pathname + '?' + q + location.hash);
      } catch (e) {}
    });
    AP.$('reshuffle').addEventListener('click', () => AP.setState({ seed: AP.state.seed + 1, variant: AP.state.variant + 1 }));
  };
})(globalThis.AP = globalThis.AP || {});
