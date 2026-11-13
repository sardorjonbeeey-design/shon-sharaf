// Match director for the real 3D stadium: 22 rigged players (the project's player.glb), ball, cameras, HUD.
// Everything is a pure function of time; D.frame(goalIndex, t) poses the world for one video frame.
(() => {
const Z = window.__Z, T = Z.THREE, FPS = 30, DT = 1 / FPS;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); }, lerp = (a, b, t) => a + (b - a) * t;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- lineups (source: club lineup poster of 13 Nov for ZAMIN FK; the owner's STAR BOYS list) ----------
// spot = [depth from own goal line (m), z across the pitch (attacking view: + = right wing)]
const ZAMIN = [
  ["YULDOSHEV", "1", "GK", 4, 0], ["DUSCHANOV", "4", "LB", 30, -24], ["TEMIRMALIK", "12", "CB", 26, -8], ["URUNOV", "21", "CB", 26, 8], ["MUHAMMADYASIN", "24", "RB", 30, 24],
  ["RIZAYEV", "5", "CDM", 42, 9], ["MAXMUDOV", "19", "CM", 46, -12], ["ABDULLAYEV", "6", "CAM", 56, 0],
  ["JOVOHIR", "7", "LW", 68, -22], ["YORQULOV", "9", "ST", 74, 0], ["IXTIYORBEK", "10", "RW", 68, 22]];
const STAR = [
  ["VARTA", "1", "GK", 4, 0], ["USMON", "2", "LB", 30, -24], ["MAHMUD", "10", "CB", 26, -8], ["KAMRON", "", "CB", 26, 8], ["ULUG‘BEK", "4", "RB", 30, 24],
  ["ALPOMOSH", "5", "CDM", 40, 0], ["AMIRHON", "3", "CM", 50, -9], ["BEKZOD", "10", "CM", 50, 9],
  ["AZAMAT", "12", "LM", 60, -24], ["MIRJALOL", "13", "RM", 60, 24], ["SHERZOD", "3", "CAM", 66, 0]];

// ---------- kits: recolour the baked scan texture (royal blue cloth -> other colours) ----------
function kitMaterial(fn) {
  const base = Z.RIG.mesh.material; if (!fn) return base;
  const m = base.clone(), im = base.map.image, c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
  const x = c.getContext("2d"); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const r = a[i], g = a[i + 1], b = a[i + 2]; if (b > 70 && b > r * 1.45 && b > g * 1.2) { const o = fn(r, g, b); a[i] = o[0]; a[i + 1] = o[1]; a[i + 2] = o[2]; } }
  x.putImageData(d, 0, 0);
  const tx = base.map.clone(); tx.image = c; tx.needsUpdate = true; m.map = tx; if (base.emissiveMap) m.emissiveMap = tx;
  return m;
}
const P = [], byName = {};
let KIT;
function addTeam(list, team, kit, gkKit) {
  list.forEach(([name, num, pos, dep, z], i) => {
    const r = Z.makeRig(name, num); let mesh = null; r.root.traverse(o => { if (o.isSkinnedMesh && o.material === Z.RIG.mesh.material) mesh = o; o.frustumCulled = false; });
    if (mesh) mesh.material = pos === "GK" ? gkKit : kit;
    const g = new T.Group(); g.add(r.root); Z.scene.add(g);
    const bones = {}; r.root.traverse(o => { if (o.isBone) bones[o.name] = o; });
    const p = { name, num, pos, team, dep, z0: z, g, r, bones, id: P.length, key: team + ":" + name + (num ? "#" + num : "") };
    r.mx.setTime(0); P.push(p); byName[team + ":" + name] = p;
  });
}
const pl = (team, name) => byName[team + ":" + name];

// ---------- goals: nets on the existing frames ----------
function nets() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d"); x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 3; x.strokeRect(0, 0, 64, 64);
  const tex = s => { const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(...s); return t; };
  const mat = s => new T.MeshBasicMaterial({ map: tex(s), transparent: true, opacity: .55, side: T.DoubleSide, depthWrite: false });
  for (const sx of [-1, 1]) {
    const g = new T.Group(), D = 2.0;
    const back = new T.Mesh(new T.PlaneGeometry(7.32, 2.44), mat([36, 12])); back.rotation.y = Math.PI / 2; back.position.set(sx * D, 1.22, 0);
    const top = new T.Mesh(new T.PlaneGeometry(D, 7.32), mat([10, 36])); top.rotation.x = -Math.PI / 2; top.position.set(sx * D / 2, 2.44, 0);
    const s1 = new T.Mesh(new T.PlaneGeometry(D, 2.44), mat([10, 12])); s1.position.set(sx * D / 2, 1.22, 3.66);
    const s2 = s1.clone(); s2.position.z = -3.66;
    g.add(back, top, s1, s2); g.position.x = sx * 52.5; Z.scene.add(g);
  }
}

// ---------- ball ----------
function ballSkin() {
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 64; const x = cv.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 128, 64); x.fillStyle = "#16223f";
  for (let i = 0; i < 12; i++) { x.beginPath(); x.arc(8 + (i % 6) * 22 + (i > 5 ? 11 : 0), i > 5 ? 46 : 18, 6.5, 0, 7); x.fill(); }
  Z.ball.material = new T.MeshLambertMaterial({ map: new T.CanvasTexture(cv), emissive: 0x555555 });
  const sh = new T.Mesh(new T.CircleGeometry(.3, 16), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: .32, depthWrite: false })); sh.rotation.x = -Math.PI / 2; Z.scene.add(sh); D.ballShadow = sh;
}
function shadows() { for (const p of P) { const sh = new T.Mesh(new T.CircleGeometry(.42, 16), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: .3, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .03; p.g.add(sh); p.sh = sh; } }

// ---------- scenarios ----------
// dirZ / dirS: attacking direction along x for ZAMIN / STAR BOYS in that half.
// paths: key -> [[t, x, z], ...] world metres. ball: ordered events. acts: procedural body moves.
const GOALS = window.GOALS;

function catmull(k, t) {
  if (t <= k[0][0]) return [k[0][1], k[0][2]]; const n = k.length; if (t >= k[n - 1][0]) return [k[n - 1][1], k[n - 1][2]];
  let i = 0; while (k[i + 1][0] < t) i++;
  const p0 = k[Math.max(0, i - 1)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(n - 1, i + 2)], u = (t - p1[0]) / (p2[0] - p1[0]);
  const f = j => { const m1 = (p2[j] - p0[j]) / Math.max(.01, p2[0] - p0[0]) * (p2[0] - p1[0]), m2 = (p3[j] - p1[j]) / Math.max(.01, p3[0] - p1[0]) * (p2[0] - p1[0]), u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p1[j] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[j] + (u3 - u2) * m2; };
  return [f(1), f(2)];
}
function ref(G, v) { if (typeof v[0] !== 'string') return v; const p = pl(v[0], v[1]), q = posOf(G, p, v[2]), w = velOf(G, p, v[2]), s = Math.hypot(w[0], w[1]) || 1, f = v[4] == null ? .6 : v[4]; return [q[0] + w[0] / s * f, v[3] == null ? .22 : v[3], q[1] + w[1] / s * f]; }
function ballAt(G, t) {             // -> [x, y, z, owner|null]
  let out = null;
  for (const e of G.ball) {
    if (t < e.t0) break;
    if (e.type === "drib") { const p = pl(...e.p), q = posOf(G, p, Math.min(t, e.t1)), v = velOf(G, p, Math.min(t, e.t1)), s = Math.hypot(v[0], v[1]) || 1, w = .75 + .25 * Math.sin(t * 9);
      out = [q[0] + v[0] / s * w + (e.side || 0) * v[1] / s * .25, .22, q[1] + v[1] / s * w - (e.side || 0) * v[0] / s * .25, p]; }
    else { const u = cl((t - e.t0) / (e.t1 - e.t0)), k = e.ease ? 1 - Math.pow(1 - u, e.ease) : u, a = ref(G, e.from), b = ref(G, e.to);
      let y = lerp(a[1], b[1], k) + (e.h || 0) * 4 * u * (1 - u);
      if (e.bounce && u < 1) y = Math.max(y, .22 + Math.abs(Math.sin(u * Math.PI * e.bounce)) * e.bh * (1 - u));
      out = [lerp(a[0], b[0], k), y, lerp(a[2], b[2], k), null]; }
  }
  return out || [0, .22, 0, null];
}
function basePos(G, p, t) {         // players without a path: hold formation, shift with the ball
  const dir = p.team === "Z" ? G.dirZ : G.dirS, b = ballAt(G, Math.max(0, t - .35));
  if (p.pos === "GK") return [-dir * 52.5 + dir * (p.dep - 2.2), cl(b[2] * .12, -2, 2)];
  const adv = cl((dir * b[0] + 52.5) / 105), x = -dir * 52.5 + dir * (p.dep * (0.62 + adv * .62) + 2), n = p.id * 3.1;
  return [cl(x, -50, 50) + Math.sin(t * .7 + n) * 1.1, cl(p.z0 * dir, -31, 31) * .86 + b[2] * .2 + Math.cos(t * .55 + n) * .9];
}
function posOf(G, p, t) { const k = G.paths[p.key] || G.paths[p.team + ":" + p.name]; return k ? catmull(k, t) : basePos(G, p, t); }
function velOf(G, p, t) { const a = posOf(G, p, t - .05), b = posOf(G, p, t + .05); return [(b[0] - a[0]) / .1, (b[1] - a[1]) / .1]; }

const E = new T.Euler(), Q = new T.Quaternion();
function rot(p, bone, x, y, z) { const b = p.bones[bone]; if (!b) return; Q.setFromEuler(E.set(x, y, z)); b.quaternion.multiply(Q); }
const bell = (t, c, w) => { const u = (t - c) / w; return Math.abs(u) >= 1 ? 0 : Math.pow(Math.cos(u * Math.PI / 2), 2); };
function applyActs(G, p, t) {
  let y = 0, roll = 0, pitch = 0;
  for (const a of G.acts) {
    if (pl(...a.p) !== p) continue;
    if (a.type === "kick") { const s = bell(t, a.t - .16, .22), f = bell(t, a.t + .1, .2), L = a.leg === "L" ? "Left" : "Right";
      rot(p, L + "UpLeg", s * .9 - f * 1.25, 0, 0); rot(p, L + "Leg", s * 1.3, 0, 0); rot(p, "Spine", f * -.18 + s * .1, 0, 0); }
    if (a.type === "jump") { const u = (t - a.t + a.up) / (a.up * 2); if (u > 0 && u < 1) { y += a.h * 4 * u * (1 - u); const k = Math.sin(u * Math.PI);
      rot(p, "LeftUpLeg", -.25 * k, 0, 0); rot(p, "RightUpLeg", .2 * k, 0, 0); rot(p, "LeftLeg", .8 * k, 0, 0); rot(p, "RightLeg", .5 * k, 0, 0);
      const hd = bell(t, a.t, .16); rot(p, "Spine", -.3 * k + hd * .75, 0, 0); rot(p, "neck", hd * .5, 0, 0); } }
    if (a.type === "dive") { const u = cl((t - a.t) / a.dur); if (t > a.t) { const k = sm(0, 1, u); roll += (a.roll || a.dir) * k * 1.35; y += Math.sin(Math.min(1, u * 1.15) * Math.PI) * a.h + k * .12; p._dz = a.dir * a.dist * k * (a.sx || 1);
      armsUp(p, k); } }
    if (a.type === "arms") { const k = sm(a.t0, a.t0 + .35, t) * (a.t1 ? 1 - sm(a.t1 - .3, a.t1, t) : 1); if (k > 0) armsUp(p, k * (a.k || 1), a.wide); }
    if (a.type === "slump") { const k = sm(a.t0, a.t0 + .5, t); rot(p, "Spine", .45 * k, 0, 0); rot(p, "neck", .5 * k, 0, 0); rot(p, "Head", .2 * k, 0, 0); }
    if (a.type === "hop") { if (t > a.t0) y += Math.abs(Math.sin((t - a.t0) * 7.5)) * (a.h || .35); }
    if (a.type === "slide") { const k = sm(a.t0, a.t0 + .4, t); pitch -= k * .5; y -= k * .05; rot(p, 'LeftLeg', k * 1.5, 0, 0); rot(p, 'RightLeg', k * 1.5, 0, 0); }
  }
  p.g.position.y = y; p.r.root.rotation.set(pitch, 0, roll);
}
let ARM = { i: 2, sg: 1, fi: 2, fsg: 1 };       // set by pose calibration
function armsUp(p, k, wide) { const a = k * (wide ? 1.9 : 2.5); for (const [s, sg] of [["Left", 1], ["Right", -1]]) { const e = [0, 0, 0]; e[ARM.i] = a * sg * ARM.sg; rot(p, s + "Arm", ...e); const f = [0, 0, 0]; f[ARM.fi] = k * .5 * sg * ARM.fsg; rot(p, s + "ForeArm", ...f); } }

// ---------- world step ----------
const S = { goal: -1, t: -1, face: new Map(), cam: null };
function reset(gi) { S.goal = gi; S.t = -1; S.face.clear(); S.cam = null; for (const p of P) { p.r.mx.setTime(hash(p.id) * 2); p._dz = 0; } }
function step(G, t) {
  const b = ballAt(G, t);
  for (const p of P) {
    const q = posOf(G, p, t), v = velOf(G, p, t), sp = Math.hypot(v[0], v[1]); p._dz = 0;
    let want = sp > .9 ? Math.atan2(v[0], v[1]) : Math.atan2(b[0] - q[0], b[2] - q[1]);
    for (const a of G.acts) if (a.type === "face" && pl(...a.p) === p && t >= a.t0 && t <= (a.t1 || 99)) want = a.at ? Math.atan2(a.at[0] - q[0], a.at[1] - q[1]) : a.yaw;
    let cur = S.face.has(p) ? S.face.get(p) : want, d = Math.atan2(Math.sin(want - cur), Math.cos(want - cur)); cur += d * Math.min(1, DT * 9); S.face.set(p, cur);
    const w = cl((sp - 2) / 2.2); p.r.run.setEffectiveWeight(w); p.r.walk.setEffectiveWeight(1 - w);
    p.r.run.timeScale = cl(sp / 6.2, .6, 1.2); p.r.walk.timeScale = cl(sp / 2.6, .22, 1.4);
    p.r.mx.update(DT);
    applyActs(G, p, t);
    p.g.position.x = q[0]; p.g.position.z = q[1] + (p._dz || 0); p.g.rotation.y = cur;
    p.sh.position.y = .03 - p.g.position.y; p.cur = [q[0], q[1], sp];
  }
  Z.ball.position.set(b[0], b[1], b[2]); Z.ball.rotation.x += .35; Z.ball.rotation.z += .2;
  D.ballShadow.position.set(b[0], .035, b[2]); D.ballShadow.scale.setScalar(1 + b[1] * .12); D.ballShadow.material.opacity = .32 / (1 + b[1] * .25);
  // camera
  let c = G.cam[0]; for (const k of G.cam) if (t >= k.t0) c = k;
  const u = cl((t - c.t0) / ((c.t1 || G.dur) - c.t0)), e = sm(0, 1, u), mix = (a, b2) => a.map((v, i) => lerp(v, (b2 || a)[i], e));
  const tp = c.look === "ball" ? [b[0], Math.max(1, b[1] * .6 + .8), b[2]] : typeof c.look === "string" ? (() => { const p = pl(...c.look.split(":")); return [p.g.position.x, 1.3, p.g.position.z]; })() : mix(c.look, c.look1);
  if (!S.cam || S.cam.k !== c) S.cam = { k: c, tx: tp.slice() };
  const sK = c.smooth == null ? .12 : c.smooth; for (let i = 0; i < 3; i++) S.cam.tx[i] += (tp[i] - S.cam.tx[i]) * sK;
  const tx = S.cam.tx, pos = c.rel ? [tx[0] + lerp(c.rel[0], (c.rel1 || c.rel)[0], e), lerp(c.rel[1], (c.rel1 || c.rel)[1], e), tx[2] + lerp(c.rel[2], (c.rel1 || c.rel)[2], e)] : mix(c.pos, c.pos1);
  Z.camera.fov = lerp(c.fov || 36, c.fov1 || c.fov || 36, e); Z.camera.updateProjectionMatrix();
  Z.camera.position.set(...pos); Z.camera.lookAt(tx[0] + (c.off ? c.off[0] : 0), tx[1] + (c.off ? c.off[1] : 0), tx[2] + (c.off ? c.off[2] : 0)); Z.sky.position.copy(Z.camera.position);
}

// ---------- HUD + stadium screen ----------
function hud() {
  const st = document.createElement("style"); st.textContent = `
  @font-face{font-family:MZ;font-weight:900;src:url(/fonts/Montserrat_900Black.ttf)} @font-face{font-family:MZ;font-weight:700;src:url(/fonts/Montserrat_700Bold.ttf)}
  #hud{position:fixed;inset:0;z-index:99;font-family:MZ,sans-serif;font-weight:900;color:#fff;pointer-events:none;overflow:hidden}
  #mh_bug{position:absolute;left:50%;top:210px;transform:translateX(-50%);display:flex;align-items:stretch;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.45);font-size:38px;white-space:nowrap}
  #mh_bug div{padding:16px 22px;display:flex;align-items:center} #mh_bug .z{background:#1F4FB8} #mh_bug .s{background:#B8131F} #mh_bug .sc{background:#fff;color:#0D2557;font-size:46px;padding:10px 24px} #mh_bug .tm{background:#0D2557;color:#FFD23F;font-size:34px;min-width:118px;justify-content:center}
  #mh_live{position:absolute;left:50%;top:300px;transform:translateX(-50%);font-size:24px;letter-spacing:3px;background:rgba(13,37,87,.82);padding:6px 18px;border-radius:0 0 12px 12px;color:#9DB8FF}
  #mh_gol{position:absolute;left:0;right:0;top:420px;text-align:center;font-size:230px;line-height:1;letter-spacing:6px;color:#FFD23F;-webkit-text-stroke:10px #0D2557;paint-order:stroke fill;text-shadow:0 14px 0 rgba(13,37,87,.55)}
  #mh_card{position:absolute;left:60px;right:60px;bottom:330px;border-radius:26px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.5);display:flex;align-items:stretch;background:#0D2557}
  #mh_card .no{font-size:150px;line-height:1;padding:26px 34px;min-width:230px;text-align:center;display:flex;align-items:center;justify-content:center}
  #mh_card .tx{padding:26px 30px;display:flex;flex-direction:column;justify-content:center;gap:8px} #mh_card .nm{font-size:74px;line-height:1.02} #mh_card .sub{font-size:34px;font-weight:700;color:#FFD23F}`;
  document.head.appendChild(st);
  const h = document.createElement("div"); h.id = "hud";
  h.innerHTML = `<div id="mh_bug"><div class="z">ZAMIN FK</div><div class="sc" id="mh_sc"></div><div class="s">STAR BOYS</div><div class="tm" id="mh_tm"></div></div><div id="mh_live">QORATEPA · ZAMIN FK STADIONI</div><div id="mh_gol">GOOOL!</div><div id="mh_card"><div class="no" id="mh_cno"></div><div class="tx"><div class="nm" id="mh_cnm"></div><div class="sub" id="mh_csub"></div></div></div>`;
  document.body.appendChild(h);
}
function drawHud(G, t) {
  const scored = t >= G.tGoal, sc = scored ? G.after : G.before, $ = id => document.getElementById(id);
  $("mh_sc").textContent = sc[0] + " : " + sc[1];
  const secs = Math.max(0, Math.round((G.minute - 1) * 60 + 60 - (G.tGoal - Math.min(t, G.tGoal)) - 3)), mm = Math.floor(secs / 60), ss = secs % 60; $("mh_tm").textContent = mm + ":" + String(ss).padStart(2, "0");
  const g = $("mh_gol"), a = t - G.tGoal - .15; g.style.opacity = a > 0 && a < 1.7 ? Math.min(1, a * 8) * (1 - sm(1.35, 1.7, a)) : 0; g.style.transform = `scale(${a > 0 ? 1 + .35 * Math.exp(-a * 7) * Math.cos(a * 16) + Math.max(0, .5 - a * 5) : 1})`;
  const c = $("mh_card"), b = t - G.tGoal - 1.5; c.style.opacity = b > 0 ? Math.min(1, b * 6) : 0; c.style.transform = `translateY(${b > 0 ? 60 * Math.exp(-b * 9) : 60}px)`;
  const col = G.team === "Z" ? "#1F4FB8" : "#B8131F"; $("mh_cno").style.background = col; $("mh_cno").textContent = G.num; $("mh_cnm").textContent = G.scorer; $("mh_csub").textContent = `⚽ ${G.minute}’ · ${G.team === "Z" ? "ZAMIN FK" : "STAR BOYS"} · ${G.after[0]}–${G.after[1]}`;
  const key = sc.join("-") + G.minute; if (S.scr !== key && window.__SC) { S.scr = key; const x = __SC.scv.getContext("2d");
    x.fillStyle = "#06122c"; x.fillRect(0, 0, 1024, 512); x.fillStyle = "#1F4FB8"; x.fillRect(0, 0, 1024, 80); x.fillStyle = "#fff"; x.textAlign = "center"; x.font = "900 50px MZ, sans-serif"; x.fillText("ZAMIN FK STADIONI", 512, 58);
    x.font = "900 64px MZ, sans-serif"; x.fillStyle = "#9DB8FF"; x.fillText("ZAMIN FK", 256, 190); x.fillStyle = "#ff8f8f"; x.fillText("STAR BOYS", 768, 190);
    x.fillStyle = "#fff"; x.font = "900 230px MZ, sans-serif"; x.fillText(sc[0] + " : " + sc[1], 512, 410); x.fillStyle = "#FFD23F"; x.font = "900 54px MZ, sans-serif"; x.fillText(G.minute + "’", 512, 490); __SC.scTex.needsUpdate = true; }
}

const D = window.D = {
  P, pl, ARM: v => { ARM = v; },
  async setup() {
    Z.loadRig(); await new Promise(ok => { const w = () => Z.RIG.base ? ok() : setTimeout(w, 50); w(); });
    Z.heroObjs.forEach(o => { o.visible = false; }); Z.SQUAD.forEach(s => Z.scene.remove(s.g)); Z.controls.enabled = false;
    Z.scene.traverse(o => { const g = o.isMesh && o.geometry && o.geometry.parameters; if (!g || o.geometry.type !== "PlaneGeometry") return;   // big flat planes fight for depth in software GL: tessellate pitch and track, drop the town ground a little
      if (g.width === Z.PW + 4 && g.height === Z.PH + 4) { o.geometry = new T.PlaneGeometry(g.width, g.height, 44, 30); o.position.y = .03; }
      else if (g.width === Z.PW + 18 && g.height === Z.PH + 18) { o.geometry = new T.PlaneGeometry(g.width, g.height, 50, 36); o.position.y = -.05; }
      else if (g.width === 6000) o.position.y = -1.0; });
    Z.RIG.mesh.material.emissive.setScalar(.6);
    for (const o of Z.scene.children) if (o.isGroup && o.position.lengthSq() < 1e-6) { const b = new T.Box3().setFromObject(o); if (!b.isEmpty() && b.getSize(new T.Vector3()).x < 8) o.visible = false; }   // city cars / walkers parked at the origin while the town is not simulated
    const red = kitMaterial((r, g, b) => [Math.min(255, b * 1.0), r * .55, r * .6]), gkZ = kitMaterial((r, g, b) => [r, Math.min(255, b * .86), g * .55]), gkS = kitMaterial((r, g, b) => [Math.min(255, b * 1.25), Math.min(255, b * 1.08), r]);
    addTeam(ZAMIN, "Z", kitMaterial((r, g, b) => [Math.min(255, r * 1.25 + 14), Math.min(255, g * 1.5 + 34), Math.min(255, b * 1.55 + 60)]), gkZ); addTeam(STAR, "S", red, gkS); nets(); ballSkin(); shadows(); hud(); await document.fonts.load("900 40px MZ"); await document.fonts.load("700 40px MZ");
  },
  frame(gi, t) {                    // sequential playback is O(1); seeking re-simulates from 0
    const G = GOALS[gi]; if (S.goal !== gi || t < S.t - 1e-6) reset(gi);
    let k = S.t < 0 ? 0 : Math.round(S.t * FPS) + 1; const kEnd = Math.round(t * FPS);
    for (; k <= kEnd; k++) step(G, k / FPS); S.t = t;
    drawHud(G, t); Z.DN.tick(1e7 + t * 1000); Z.DN.render();
  },
  matInfo() { const m = Z.RIG.mesh.material; return [m.type, m.color.getHexString(), m.emissive.getHexString(), !!m.emissiveMap, m.emissiveIntensity, m.map && m.map.encoding, Z.renderer.outputEncoding, Z.hemi.intensity, Z.sun.intensity].join(','); },
  still(gi, t, pos, look, fov, opt = {}) {   // background plates for the 2D story scenes: same stadium, free camera, no HUD
    D.frame(gi, t); document.getElementById("hud").style.display = "none";
    for (const p of P) p.g.visible = !opt.empty; Z.ball.visible = D.ballShadow.visible = !opt.empty;
    if (opt.score && window.__SC) { S.scr = null; const x = __SC.scv.getContext("2d"); x.fillStyle = "#FFD23F"; x.fillRect(312, 440, 400, 64); x.fillStyle = "#06122c"; x.textAlign = "center"; x.font = "900 50px MZ, sans-serif"; x.fillText(opt.score, 512, 490); __SC.scTex.needsUpdate = true; }
    Z.camera.fov = fov; Z.camera.updateProjectionMatrix(); Z.camera.position.set(...pos); Z.camera.lookAt(...look); Z.sky.position.copy(Z.camera.position); Z.DN.render();
  },
  pose(fn) { fn(P, rot); Z.DN.render(); },
};
})();
