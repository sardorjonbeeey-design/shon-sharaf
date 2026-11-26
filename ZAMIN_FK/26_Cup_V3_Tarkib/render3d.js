// node render3d.js <seg> <durSec> [f0 f1]  -> build/3d/<seg>/f_0000.jpg   (10 fps plates)
// segs (multi-view): s1 aerial dive · s2 top-down · t1 behind goal · t2 corner aerial
//                    t3 pitch-level side · t4 high over centre · q wide pull-back · cta push to stand · end wide
const path = require("path"), fs = require("fs");
const G3 = path.resolve(__dirname, "../09_Episode_09/goals3d"), { open } = require(path.join(G3, "harness.js"));
const SEG = process.argv[2], DUR = +process.argv[3], FPS = 10, N = Math.round(DUR * FPS);
const F0 = +(process.argv[4] || 0), F1 = +(process.argv[5] || N);
const OUT = path.join(__dirname, "build", "3d", SEG); fs.mkdirSync(OUT, { recursive: true });
const K = {                                   // [pos, look, fov] start -> end
  s1:  [[[0, 86, 78], [0, 0, 0], 52], [[0, 44, 62], [0, 0, 0], 56]],
  s2:  [[[-6, 96, 10], [0, 0, 0], 48], [[6, 92, -6], [0, 0, 0], 48]],
  t1:  [[[-74, 9, 6], [0, 2, 0], 46], [[-63, 7, 2], [0, 2, 0], 50]],
  t2:  [[[58, 42, 52], [0, 0, 0], 50], [[48, 34, 44], [0, 0, 0], 52]],
  t3:  [[[-14, 4.6, 60], [0, 3, 0], 48], [[12, 4.2, 58], [0, 3, 0], 50]],
  t4:  [[[0, 62, 26], [0, 0, 0], 44], [[0, 52, 14], [0, 0, 0], 46]],
  q:   [[[0, 46, 74], [0, 2, 0], 54], [[0, 62, 92], [0, 2, 0], 56]],
  cta: [[[0, 18, 48], [0, 9, 0], 50], [[0, 14, 34], [0, 8, 0], 48]],
  end: [[[0, 30, 66], [0, 4, 0], 52], [[0, 28, 60], [0, 4, 0], 52]],
};
const LED = { s1: ["MUXLISLAR KUBOGI", "4 KLUB · 3 O‘YIN · 1 G‘OLIB"], s2: ["QUR‘A TASHLANDI", "YARIM FINAL"],
  t1: ["PRIME AVANGARD", "TARKIB TAYYOR"], t2: ["PRIME FC", "TARKIB TAYYOR"],
  t3: ["WAKANDA TEAM", "TARKIB TAYYOR"], t4: ["QAYRAT FC", "TARKIB TAYYOR"],
  q: ["G‘OLIBNI QANDAY", "ANIQLAYMIZ?"], cta: ["1 · 2 · 3", "IZOHGA YOZING"], end: ["QOIDANI SIZ TANLAYSIZ", "ZAMIN FK"] };
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function cam(u) { const [a, b] = K[SEG], e = sm(u), L = (p, q) => p.map((v, j) => v + (q[j] - v) * e); return [L(a[0], b[0]), L(a[1], b[1]), a[2] + (b[2] - a[2]) * e]; }
(async () => {
  const { page, close } = await open({ time: process.env.ZT || "night", w: 1080, h: 1920 });
  await page.waitForTimeout(2500);
  for (let f = F0; f < F1; f++) {
    const [p, l, fov] = cam(N > 1 ? f / (N - 1) : 0);
    await page.evaluate(([p, l, fov, led]) => {
      const Z = window.__Z, TH = Z.THREE;
      for (const o of Z.scene.children) if (o.visible && o.position.lengthSq() < 1e-6 && !o.isInstancedMesh) {
        const b = new TH.Box3().setFromObject(o); if (!b.isEmpty() && b.getSize(new TH.Vector3()).x < 8) o.visible = false;
      }
      if (window.__SC) {
        const x = __SC.scv.getContext("2d"), W = 1024, H = 512;
        x.fillStyle = "#06122c"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#1F4FB8"; x.fillRect(0, 0, W, 92); x.textAlign = "center";
        x.fillStyle = "#fff"; x.font = "900 54px MZ, sans-serif"; x.fillText("ZAMIN FK", W / 2, 64);
        x.font = "900 86px MZ, sans-serif"; x.fillText(led[0], W / 2, 260);
        x.fillStyle = "#FFD23F"; x.font = "900 52px MZ, sans-serif"; x.fillText(led[1], W / 2, 360);
        __SC.scTex.needsUpdate = true;
      }
      Z.camera.position.set(p[0], p[1], p[2]); Z.camera.lookAt(l[0], l[1], l[2]);
      Z.camera.fov = fov; Z.camera.updateProjectionMatrix();
      Z.renderer.render(Z.scene, Z.camera);
    }, [p, l, fov, LED[SEG]]);
    await page.screenshot({ path: `${OUT}/f_${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 90 });
    if (f % 20 === 0) console.error(`${SEG} ${f}/${N}`);
  }
  await close();
})();
