// node render3d.js <seg> <durSec> [f0 f1]  -> build/3d/<seg>/f_0000.jpg (30 fps). seg: hook | ff | gar | ac | wide
const path = require("path"), fs = require("fs"), G3 = path.resolve(__dirname, "../09_Episode_09/goals3d"), { open } = require(path.join(G3, "harness.js"));
const SEG = process.argv[2], DUR = +process.argv[3], FPS = 30, N = Math.round(DUR * FPS), F0 = +(process.argv[4] || 0), F1 = +(process.argv[5] || N);
const OUT = path.join(__dirname, "build", "3d", SEG); fs.mkdirSync(OUT, { recursive: true });
// camera keyframes [t01, pos, look, fov] over the segment (0..1)
const K = {
  hook: [[0, [0, 78, -34], [0, 0, -92], 72], [1, [0, 56, -52], [0, 0, -90], 70]],
  ff:   [[0, [-82, 20, -120], [-34, 5, -92], 66], [1, [-68, 9, -74], [-33, 5, -92], 70]],
  gar:  [[0, [146, 19, -112], [98, 6, -90], 66], [1, [146, 15, -62], [98, 6, -88], 70]],
  ac:   [[0, [-140, 17, -112], [-104, 5, -88], 66], [1, [-136, 13, -64], [-106, 5, -84], 72]],
  wide: [[0, [0, 118, -158], [0, 0, -88], 76], [1, [0, 88, -128], [0, 0, -86], 76]],
};
// which builds are visible at the segment, and which one grows in (index 0 ff, 1 gar, 2 ac)
const VIS = { hook: [0, 0, 0], ff: [1, 0, 0], gar: [1, 1, 0], ac: [1, 1, 1], wide: [1, 1, 1] }, GROW = { ff: 0, gar: 1, ac: 2 };
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const back = x => { const c = 1.70158, t = Math.max(0, Math.min(1, x)) - 1; return 1 + (c + 1) * t * t * t + c * t * t; };
function cam(u) { const k = K[SEG], a = k[0], b = k[k.length - 1], e = sm(u), L = (p, q) => p.map((v, j) => v + (q[j] - v) * e); return [L(a[1], b[1]), L(a[2], b[2]), a[3] + (b[3] - a[3]) * e]; }
(async () => {
  const { page, close } = await open({ time: process.env.ZT || "17.3", w: 1080, h: 1920 });
  for (let f = F0; f < F1; f++) {
    const t = f / FPS, [p, l, fov] = cam(f / (N - 1));
    const g = SEG in GROW ? Math.max(.001, back((t - .35) / 1.25)) : 1;
    await page.evaluate(([p, l, fov, vis, grow, gi]) => { const Z = window.__Z; let i = 0; const gs = []; Z.scene.children.forEach(o => { if (o.name === "zfkreq") gs.push(o); });
      gs.forEach((o, k) => { o.visible = !!vis[k]; o.scale.set(1, k === gi ? grow : 1, 1); });
      Z.camera.fov = fov; Z.camera.updateProjectionMatrix(); Z.camera.position.set(...p); Z.camera.up.set(0, 1, 0); Z.camera.lookAt(...l); Z.renderer.render(Z.scene, Z.camera); }, [p, l, fov, VIS[SEG], g, GROW[SEG] ?? -1]);
    await page.screenshot({ path: `${OUT}/f_${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
    if (f % 30 === 0) console.log(SEG, "frame", f, "/", N);
  }
  await close();
})();
