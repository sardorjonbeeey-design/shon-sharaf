// node render3d.js <seg> <durSec> [f0 f1]  -> build/3d/<seg>/f_0000.jpg (30 fps). seg: sign
// Pitch-level plates of the real 3D stadium for the signing beat (the player sprite is composited in film.html).
const path = require("path"), fs = require("fs"), G3 = path.resolve(__dirname, "../09_Episode_09/goals3d"), { open } = require(path.join(G3, "harness.js"));
const SEG = process.argv[2], DUR = +process.argv[3], FPS = 30, N = Math.round(DUR * FPS), F0 = +(process.argv[4] || 0), F1 = +(process.argv[5] || N);
const OUT = path.join(__dirname, "build", "3d", SEG); fs.mkdirSync(OUT, { recursive: true });
// camera keyframes [t01, pos, look, fov]
const K = {
  sign: [[0, [7.5, 4.6, 20], [-1.0, 10.6, -14], 64], [1, [5.0, 5.3, 15.5], [-0.5, 10.2, -14], 61]],
};
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function cam(u) { const k = K[SEG], a = k[0], b = k[k.length - 1], e = sm(u), L = (p, q) => p.map((v, j) => v + (q[j] - v) * e); return [L(a[1], b[1]), L(a[2], b[2]), a[3] + (b[3] - a[3]) * e]; }
(async () => {
  const { page, close } = await open({ time: process.env.ZT || "night", w: 1080, h: 1920 });
  await page.evaluate(() => {
    const Z = window.__Z, T = Z.THREE;
    for (const o of Z.scene.children) if (o.position.lengthSq() < 1e-6 && !o.isInstancedMesh) { const b = new T.Box3().setFromObject(o); if (!b.isEmpty() && b.getSize(new T.Vector3()).x < 8) o.visible = false; }  // city cars / walkers parked at the origin
    if (window.__SC) {                                                             // club LED screen: the signing board
      const x = __SC.scv.getContext("2d");
      x.fillStyle = "#06122c"; x.fillRect(0, 0, 1024, 512);
      x.fillStyle = "#1F4FB8"; x.fillRect(0, 0, 1024, 90); x.textAlign = "center";
      x.fillStyle = "#fff"; x.font = "900 54px MZ, sans-serif"; x.fillText("YANGI O‘YINCHI", 512, 64);
      x.fillStyle = "#FFD23F"; x.font = "900 92px MZ, sans-serif"; x.fillText("JASURBEK RAHIMOV", 512, 250);
      x.fillStyle = "#fff"; x.font = "900 150px MZ, sans-serif"; x.fillText("19", 512, 430);
      __SC.scTex.needsUpdate = true;
    }
  });
  for (let f = F0; f < F1; f++) {
    const t = f / FPS, [p, l, fov] = cam(N > 1 ? f / (N - 1) : 0);
    await page.evaluate(([p, l, fov, T]) => {
      const Z = window.__Z, TH = Z.THREE;
      for (const o of Z.scene.children) if (o.visible && o.position.lengthSq() < 1e-6 && !o.isInstancedMesh) { const b = new TH.Box3().setFromObject(o); if (!b.isEmpty() && b.getSize(new TH.Vector3()).x < 8) o.visible = false; }
      Z.camera.fov = fov; Z.camera.updateProjectionMatrix(); Z.camera.position.set(...p); Z.camera.up.set(0, 1, 0); Z.camera.lookAt(...l); Z.renderer.render(Z.scene, Z.camera);
    }, [p, l, fov, t]);
    await page.screenshot({ path: `${OUT}/f_${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
    if (f % 30 === 0) console.log(SEG, "frame", f, "/", N);
  }
  await close();
})();
