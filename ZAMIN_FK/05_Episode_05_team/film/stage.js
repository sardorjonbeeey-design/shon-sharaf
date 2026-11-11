// Serves the real stadium page (web/stadium/dist) to a headless browser with a frame-stepped clock,
// so the episode films the same 3D stadium, crowd and squad models the site shows. Nothing in web/ is changed.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const EPD = path.join(__dirname, '..'), Z = path.join(EPD, '..');
const DIST = path.join(Z, 'web', 'stadium', 'dist');
const NM = process.env.ZFK_NODE_MODULES || path.join(EPD, 'node_modules');     // needs three@0.128.0 (+ @fontsource for the brand fonts)
const T3 = path.join(NM, 'three');
const CDN = {
  'three.min.js': 'build/three.min.js', 'OrbitControls.js': 'examples/js/controls/OrbitControls.js',
  'CopyShader.js': 'examples/js/shaders/CopyShader.js', 'LuminosityHighPassShader.js': 'examples/js/shaders/LuminosityHighPassShader.js',
  'EffectComposer.js': 'examples/js/postprocessing/EffectComposer.js', 'RenderPass.js': 'examples/js/postprocessing/RenderPass.js',
  'ShaderPass.js': 'examples/js/postprocessing/ShaderPass.js', 'UnrealBloomPass.js': 'examples/js/postprocessing/UnrealBloomPass.js',
};
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
function fontCss() {
  const face = (fam, pkg, w) => { const f = path.join(NM, '@fontsource', pkg, 'files', `${pkg}-latin-${w}-normal.woff2`);
    return fs.existsSync(f) ? `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format("woff2");}` : ''; };
  return [700, 800, 900].map(w => face('Montserrat', 'montserrat', w)).join('') + [300, 400, 600].map(w => face('Josefin Sans', 'josefin-sans', w)).join('');
}
function page() {
  let h = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  h = h.replace(/<script src="https:\/\/telegram\.org[^>]*><\/script>/, '');
  h = h.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, '');
  h = h.replace(/<script src="https:\/\/[^"]*\/([A-Za-z.0-9]+\.js)"><\/script>/g, (m, f) => CDN[f] ? `<script src="/three/${CDN[f]}"></script>` : m);
  // frame-stepped clock: the page's own loop(now) is called by the film, never by requestAnimationFrame
  const n = h.split('requestAnimationFrame(loop);').length - 1;
  if (n !== 2) throw new Error('loop hook not found (' + n + ')');
  h = h.replace('requestAnimationFrame(loop);', '');
  h = h.replace('requestAnimationFrame(loop);', 'window.__film = { step: loop, ev: s => eval(s) };');
  h = h.replace('</head>', `<style>${fontCss()} body > *:not(canvas) { display:none !important; }</style></head>`);
  return h;
}
async function open({ time = 'day', width = 1080, height = 1920 } = {}) {
  const squad = '[]';                                           // the film places the roster itself (see roster.js)
  const state = fs.readFileSync(path.join(EPD, 'data', 'state_snapshot.json'));
  const srv = http.createServer((q, r) => {
    const u = new URL(q.url, 'http://x'); let p = decodeURIComponent(u.pathname);
    const send = (code, body, type) => { r.writeHead(code, { 'Content-Type': type || 'text/plain', 'Cache-Control': 'no-store' }); r.end(body); };
    if (p === '/' || p === '/index.html') return send(200, page(), 'text/html');
    if (p === '/api/squad') return send(200, squad, 'application/json');
    if (p === '/api/state') return send(200, state, 'application/json');
    if (p.startsWith('/api/')) return send(404, '{}', 'application/json');
    const f = p.startsWith('/three/') ? path.join(T3, p.slice(7)) : path.join(DIST, p);
    if (!f.startsWith(T3) && !f.startsWith(DIST)) return send(403, '');
    fs.readFile(f, (e, b) => e ? send(404, '') : send(200, b, MIME[path.extname(f)] || 'application/octet-stream'));
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  pg.on('pageerror', e => console.error('[page]', e.message));
  await pg.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await pg.goto(`http://127.0.0.1:${srv.address().port}/?view=stadium&time=${time}`, { waitUntil: 'load' });
  await pg.waitForFunction(() => window.__film, null, { timeout: 60000 });
  return { pg, browser, close: async () => { await browser.close(); srv.close(); } };
}
module.exports = { open, EPD, Z, NM };
