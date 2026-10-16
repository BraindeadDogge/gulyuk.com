const path = require('path');
const order = require('../src/order.json');
let loaded = false;
exports.load = () => {
  if (!loaded) {
    globalThis.AP = globalThis.AP || {};
    for (const f of order.numerics) require(path.join(__dirname, '..', 'src', f));
    loaded = true;
  }
  return globalThis.AP;
};
