// Serves the real 3D stadium page (web/stadium/dist) to headless Chromium, with the CDN three.js files routed to a
// local npm copy, the page's own render loop switched off and its internals exposed as window.__Z for director.js.
const http = require("http"), fs = require("fs"), path = require("path"), { chromium } = require("playwright");
const DIST = path.resolve(__dirname, "../../web/stadium/dist");
const THREE_DIR = process.env.THREE_DIR || path.resolve(__dirname, "../build/node_modules/three");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf" };
function patched() {
  let h = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  const i = h.lastIndexOf("requestAnimationFrame(loop);");
  if (i < 0) throw new Error("loop hook not found");
  h = h.slice(0, i) + "window.__Z = { scene, camera, renderer, controls, ball, RIG, makeRig, loadRig, heroObjs, SQUAD, DN, sky, hemi, sun, THREE, PW, PH };" + h.slice(i + "requestAnimationFrame(loop);".length);
  const iv = "setInterval(() => drawScreen(++k), 4000)";
  if (!h.includes(iv)) throw new Error("screen hook not found");
  h = h.replace(iv, "window.__SC = { scv, scTex }");
  h = h.replace("</head>", "<style>body > *:not(canvas):not(#hud) { display:none !important }</style></head>");
  return h;
}
async function open(opts = {}) {
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split("?")[0]);
    if (u === "/" || u === "/index.html") { r.writeHead(200, { "content-type": "text/html" }); return r.end(patched()); }
    if (u.startsWith("/fonts/")) { const f = path.resolve(__dirname, "../../web/city/assets/fonts", path.basename(u)); if (fs.existsSync(f)) { r.writeHead(200, { "content-type": "font/ttf" }); return r.end(fs.readFileSync(f)); } }
    if (u.startsWith("/ep/")) { const f = path.join(__dirname, u.slice(4)); if (fs.existsSync(f)) { r.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); return r.end(fs.readFileSync(f)); } }
    const f = path.join(DIST, u);
    if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); r.end(fs.readFileSync(f));
  });
  await new Promise(ok => srv.listen(0, "127.0.0.1", ok));
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: opts.w || 1080, height: opts.h || 1920 }, deviceScaleFactor: 1 });
  page.on("console", m => { if (/error|warn/i.test(m.type()) && !/api\/|Failed to load resource|ERR_/.test(m.text())) console.log("[page]", m.text().slice(0, 300)); });
  page.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 300)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => {
    const u = route.request().url();
    let f = null;
    if (/three\.min\.js/.test(u)) f = path.join(THREE_DIR, "build/three.min.js");
    else { const m = u.match(/three@0\.128\.0\/(examples\/js\/.+)$/); if (m) f = path.join(THREE_DIR, m[1]); }
    if (f && fs.existsSync(f)) return route.fulfill({ contentType: "text/javascript", body: fs.readFileSync(f) });
    if (/telegram-web-app/.test(u)) return route.fulfill({ contentType: "text/javascript", body: "" });
    route.abort();
  });
  await page.goto(`http://127.0.0.1:${port}/?view=stadium&time=${opts.time || "night"}`);
  await page.waitForFunction("window.__Z", null, { timeout: 60000 });
  return { page, browser, srv, close: async () => { await browser.close(); srv.close(); } };
}
module.exports = { open };
