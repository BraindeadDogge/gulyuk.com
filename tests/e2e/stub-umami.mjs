// A stand-in for the Umami server, for tests only. It serves a tiny tracker with the same public surface as
// Umami's (window.umami.track in its string, function and no-argument forms) and records everything it receives.
import http from 'node:http'

const PORT = Number(process.env.STUB_PORT ?? 4174)
let events = []
let hits = []

const SCRIPT = `(() => {
  const s = document.currentScript;
  const host = s.dataset.hostUrl || new URL(s.src).origin;
  const base = () => ({ website: s.dataset.websiteId, hostname: location.hostname, title: document.title, url: location.pathname + location.search, referrer: document.referrer });
  const send = (payload) => fetch(host + '/api/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'event', payload }), keepalive: true });
  window.umami = { track(a, b) {
    if (a === undefined) return send(base());
    if (typeof a === 'function') return send(a(base()));
    if (typeof a === 'string') return send({ ...base(), name: a, data: b });
    return send(a);
  } };
})();`

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
}

http.createServer((req, res) => {
  const path = (req.url ?? '').split('?')[0]
  if (req.method === 'OPTIONS') { res.writeHead(204, cors).end(); return }
  if (path !== '/__log' && path !== '/__reset') hits.push(`${req.method} ${path}`)
  if (path === '/script.js') { res.writeHead(200, { ...cors, 'content-type': 'text/javascript' }).end(SCRIPT); return }
  if (path === '/__log') { res.writeHead(200, { ...cors, 'content-type': 'application/json' }).end(JSON.stringify({ events, hits })); return }
  if (path === '/__reset') { events = []; hits = []; res.writeHead(204, cors).end(); return }
  if (path === '/api/send' && req.method === 'POST') {
    let body = ''
    req.on('data', c => { body += c })
    req.on('end', () => { try { events.push(JSON.parse(body)) } catch { /* ignore malformed */ } res.writeHead(200, cors).end('{}') })
    return
  }
  res.writeHead(404, cors).end()
}).listen(PORT, '127.0.0.1')
