// Deterministic frame renderer: window.renderAt(t) draws the episode at time t (seconds).
// window.EP = { total, scenes:[{from,to,bg:{src,zoom:[a,b],focus:[x0,y0,x1,y1],blur}, items:[...]}], captions:[...] }
// Item: {type:'sprite'|'label', src|html, x,y (anchor px), h|w, at, to, enter, exit, idle, flip}
const E = { cache: {} };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const easeOut = p => 1 - Math.pow(1 - p, 3);
const back = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const stage = document.getElementById('stage');

function el(key, make) {
  if (!E.cache[key]) { E.cache[key] = make(); stage.appendChild(E.cache[key]); }
  return E.cache[key];
}

function enterXform(kind, p) {
  // returns {dx, dy, s, o, r}
  const q = clamp(p, 0, 1);
  switch (kind) {
    case 'pop': return { dx: 0, dy: 0, s: q < 1 ? back(q) * 1 : 1, o: Math.min(1, q * 3), r: 0 };
    case 'slideL': return { dx: lerp(-900, 0, easeOut(q)), dy: 0, s: 1, o: 1, r: 0 };
    case 'slideR': return { dx: lerp(900, 0, easeOut(q)), dy: 0, s: 1, o: 1, r: 0 };
    case 'up': return { dx: 0, dy: lerp(500, 0, easeOut(q)), s: 1, o: 1, r: 0 };
    case 'drop': { const b = q < 1 ? Math.abs(Math.cos(q * Math.PI * 1.5)) * (1 - q) : 0; return { dx: 0, dy: -lerp(700, 0, easeOut(q)) - b * 80, s: 1, o: 1, r: 0 }; }
    case 'stamp': return { dx: 0, dy: 0, s: lerp(2.2, 1, easeOut(q)), o: Math.min(1, q * 2), r: lerp(-14, -4, q) };
    case 'rise': return { dx: 0, dy: lerp(30, -70, easeOut(q)), s: 1, o: Math.min(1, q * 4), r: 0 };
    case 'peekR': return { dx: lerp(420, 0, easeOut(q)), dy: 0, s: 1, o: 1, r: lerp(10, 0, q) };
    default: return { dx: 0, dy: 0, s: 1, o: Math.min(1, q * 4), r: 0 };
  }
}

function idleXform(kind, t) {
  switch (kind) {
    case 'bob': return { dy: Math.sin(t * 5.5) * 6, s: 1 + Math.sin(t * 5.5) * 0.008, r: 0 };
    case 'chew': return { dy: Math.abs(Math.sin(t * 9)) * -4, s: 1, r: Math.sin(t * 2) * 1.5 };
    case 'hop': return { dy: -Math.abs(Math.sin(t * 7)) * 34, s: 1, r: Math.sin(t * 7) * 3 };
    case 'shake': return { dy: 0, s: 1, r: Math.sin(t * 22) * 2.5 };
    case 'pulse': return { dy: 0, s: 1 + Math.sin(t * 7) * 0.04, r: 0 };
    case 'tiny': return { dy: Math.sin(t * 4.2) * 2, s: 1, r: Math.sin(t * 3) * 0.8 };
    case 'sway': return { dy: Math.sin(t * 3) * 4, s: 1, r: Math.sin(t * 3) * 2 };
    default: return { dy: 0, s: 1, r: 0 };
  }
}

function camOf(sc, t) {
  const p = clamp((t - sc.from) / (sc.to - sc.from), 0, 1);
  const [z0, z1] = sc.bg.zoom || [1, 1.06];
  const [fx0, fy0, fx1, fy1] = sc.bg.focus || [0.5, 0.5, 0.5, 0.5];
  const z = lerp(z0, z1, p), fx = lerp(fx0, fx1, p), fy = lerp(fy0, fy1, p);
  return { z, tx: clamp(540 - fx * 1080 * z, 1080 - 1080 * z, 0), ty: clamp(960 - fy * 1920 * z, 1920 - 1920 * z, 0) };
}
function drawItem(it, key, t, sceneOn, sc) {
  const on = sceneOn && t >= it.at && t < (it.to ?? 1e9);
  const node = el(key, () => {
    const d = document.createElement(it.type === 'sprite' ? 'img' : 'div');
    d.className = it.type === 'sprite' ? 'spr' : 'lab';
    if (it.filter) d.style.filter = it.filter;
    if (it.type === 'sprite') { d.src = it.src; if (it.h) d.style.height = it.h + 'px'; if (it.w) d.style.width = it.w + 'px'; }
    else d.innerHTML = it.html;
    return d;
  });
  if (!on) { node.style.display = 'none'; return; }
  node.style.display = 'block';
  const ed = it.enterDur ?? 0.45;
  const en = enterXform(it.enter || 'fade', (t - it.at) / ed);
  let o = en.o;
  if (it.to != null && it.exit !== 'none') { const left = it.to - t; if (left < 0.2) o *= left / 0.2; }
  const id = idleXform(it.idle, t - it.at);
  let txt = it.counter ? counterText(it, t) : null;
  if (txt != null) { const b = node.querySelector('b'); if (b) b.textContent = txt; }
  const w = node.offsetWidth, h = node.offsetHeight;
  // anchor: sprites bottom-centre at (x,y); labels centre at (x,y)
  // it.world: position/scale follow the scene camera (attached to the background)
  let wx = it.x, wy = it.y, wz = 1;
  if (it.world && sc) { const c = camOf(sc, t); wx = it.x * c.z + c.tx; wy = it.y * c.z + c.ty; wz = c.z; }
  const ax = wx - w / 2, ay = it.type === 'sprite' ? wy - h : wy - h / 2;
  const flip = it.flip ? -1 : 1;
  node.style.left = ax + 'px'; node.style.top = ay + 'px';
  node.style.opacity = o;
  node.style.transform = `translate(${en.dx}px, ${en.dy + id.dy}px) rotate(${en.r + id.r}deg) scale(${en.s * id.s * flip * wz}, ${en.s * id.s * wz})`;
  node.style.zIndex = it.z ?? (it.type === 'sprite' ? 10 : 20);
}

function counterText(it, t) {
  // it.counter = [[time, value], ...]  step changes with a little pop handled by label idle
  let v = it.counter[0][1];
  for (const [ct, cv] of it.counter) if (t >= ct) v = cv;
  if (typeof v === 'number') return v.toLocaleString('fr-FR').replace(/ /g, ' ');
  return v;
}

function drawBg(sc, i, t) {
  const on = t >= sc.from && t < sc.to;
  const img = el('bg' + i, () => { const d = document.createElement('img'); d.className = 'bg'; d.src = sc.bg.src; d.style.zIndex = 1; return d; });
  if (!on) { img.style.display = 'none'; return; }
  img.style.display = 'block';
  const p = clamp((t - sc.from) / (sc.to - sc.from), 0, 1);
  const [z0, z1] = sc.bg.zoom || [1, 1.06];
  const [fx0, fy0, fx1, fy1] = sc.bg.focus || [0.5, 0.5, 0.5, 0.5];
  const z = lerp(z0, z1, p), fx = lerp(fx0, fx1, p), fy = lerp(fy0, fy1, p);
  const tx = clamp(540 - fx * 1080 * z, 1080 - 1080 * z, 0), ty = clamp(960 - fy * 1920 * z, 1920 - 1920 * z, 0);
  img.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
  img.style.filter = sc.bg.blur ? `blur(${sc.bg.blur}px) brightness(.85)` : '';
}

function drawCaption(t) {
  const node = el('cap', () => { const d = document.createElement('div'); d.className = 'cap'; d.style.zIndex = 30; return d; });
  const c = (EP.captions || []).find(c => t >= c.a && t < c.b);
  if (!c) { node.style.display = 'none'; return; }
  node.style.display = 'block';
  node.style.bottom = (c.bottom ?? 430) + 'px';
  node.style.fontSize = (c.size ?? 70) + 'px';
  const key = c.a.toFixed(3);
  if (node.dataset.k !== key) {
    node.dataset.k = key;
    node.innerHTML = c.words.map((w, i) => `<span class="${c.hl.includes(i) ? 'hl' : ''}">${w}</span>`).join(' ');
  }
  const spans = node.querySelectorAll('span');
  c.words.forEach((w, i) => {
    const wt = c.wt[i];
    const p = clamp((t - wt) / 0.18, 0, 1);
    spans[i].style.opacity = p > 0 ? 1 : 0;
    spans[i].style.transform = `translateY(${(1 - easeOut(p)) * 26}px) scale(${lerp(1.25, 1, easeOut(p))})`;
  });
}

function drawRain(t) {
  if (!EP.rain) return;
  const n = 36;
  for (let i = 0; i < n; i++) {
    const d = el('r' + i, () => { const x = document.createElement('div'); x.className = 'drop'; x.style.zIndex = 15; return x; });
    const seed = (i * 9301 + 49297) % 233280 / 233280;
    const speed = 1500 + seed * 700;
    const x0 = (seed * 1300) % 1080;
    const y = ((t * speed + seed * 4000) % 2100) - 100;
    d.style.left = (x0 - y * 0.12) + 'px'; d.style.top = y + 'px';
    d.style.transform = 'rotate(7deg)';
  }
}

window.renderAt = function (t) {
  EP.scenes.forEach((sc, i) => {
    drawBg(sc, i, t);
    (sc.items || []).forEach((it, j) => drawItem(it, `s${i}i${j}`, t, t >= sc.from && t < sc.to, sc));
  });
  (EP.globals || []).forEach((it, j) => drawItem(it, `g${j}`, t, true));
  drawCaption(t);
  drawRain(t);
};
window.ready = async function () {
  await document.fonts.ready;
  const imgs = [];
  EP.scenes.forEach((sc, i) => { renderAt(sc.from + 0.01); });
  await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
};
