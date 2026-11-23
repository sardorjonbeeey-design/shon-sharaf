// node render3d.js <seg> <durSec> [f0 f1]  ->  build/3d/<seg>/f_0000.jpg  (15 fps plates, film.html holds each for 2 video frames)
// seg: s1 = LED shows four empty crest slots, camera pulls back over the pitch
//      s2 = LED shows the founder card, camera pushes in on the screen
const path = require("path"), fs = require("fs"), G3 = path.resolve(__dirname, "../09_Episode_09/goals3d"), { open } = require(path.join(G3, "harness.js"));
const SEG = process.argv[2], DUR = +process.argv[3], FPS = 15, N = Math.round(DUR * FPS), F0 = +(process.argv[4] || 0), F1 = +(process.argv[5] || N);
const OUT = path.join(__dirname, "build", "3d", SEG); fs.mkdirSync(OUT, { recursive: true });
const K = {                                                   // [t01, pos, look, fov]
  s1: [[0, [1.5, 6.0, 9.0], [-0.5, 10.5, -14], 50], [1, [6.0, 6.5, 22.0], [-0.5, 10.0, -14], 62]],
  s2: [[0, [4.0, 5.6, 14.0], [-0.5, 10.3, -14], 52], [1, [1.6, 6.2, 7.5], [-0.5, 10.5, -14], 48]],
};
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function cam(u) { const k = K[SEG], a = k[0], b = k[k.length - 1], e = sm(u), L = (p, q) => p.map((v, j) => v + (q[j] - v) * e); return [L(a[1], b[1]), L(a[2], b[2]), a[3] + (b[3] - a[3]) * e]; }
(async () => {
  const { page, close } = await open({ time: process.env.ZT || "night", w: 1080, h: 1920 });
  for (let f = F0; f < F1; f++) {
    const t = f / FPS, [p, l, fov] = cam(N > 1 ? f / (N - 1) : 0);
    await page.evaluate(([p, l, fov, T, seg]) => {
      const Z = window.__Z, TH = Z.THREE;
      // city cars / walkers parked at the origin while the town loop is off (their models can load late)
      for (const o of Z.scene.children) if (o.visible && o.position.lengthSq() < 1e-6 && !o.isInstancedMesh) { const b = new TH.Box3().setFromObject(o); if (!b.isEmpty() && b.getSize(new TH.Vector3()).x < 8) o.visible = false; }
      if (window.__SC) {
        const x = __SC.scv.getContext("2d"), W = 1024, H = 512;
        x.fillStyle = "#06122c"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#1F4FB8"; x.fillRect(0, 0, W, 86); x.textAlign = "center";
        x.fillStyle = "#fff"; x.font = "900 50px MZ, sans-serif";
        if (seg === "s1") {
          x.fillText("MUXLISLAR KUBOGI", W / 2, 60);
          for (let i = 0; i < 4; i++) {                       // four empty crest slots, pulsing one after another
            const cx = 160 + i * 235, cy = 300, ph = Math.max(0, Math.sin((T - i * .45) * 2.2)), r = 76;
            x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
            x.fillStyle = `rgba(31,79,184,${.18 + .35 * ph})`; x.fill();
            x.lineWidth = 7; x.strokeStyle = `rgba(255,210,63,${.35 + .6 * ph})`; x.stroke();
            x.fillStyle = `rgba(255,255,255,${.45 + .5 * ph})`; x.font = "900 72px MZ, sans-serif"; x.fillText("?", cx, cy + 26);
          }
          x.fillStyle = "#9DB8FF"; x.font = "900 40px MZ, sans-serif"; x.fillText("4 KLUB · 3 O‘YIN · 1 G‘OLIB", W / 2, 452);
        } else {
          x.fillText("YANGI KLUB ASOSCHISI", W / 2, 60);
          x.fillStyle = "#FFD23F"; x.font = "900 96px MZ, sans-serif"; x.fillText("@username", W / 2, 250);
          x.fillStyle = "#fff"; x.font = "900 46px MZ, sans-serif"; x.fillText("KLUB NOMINI U YOZDI", W / 2, 350);
          x.fillStyle = "rgba(255,255,255,.45)"; x.font = "900 34px MZ, sans-serif"; x.fillText("NAMUNA", W / 2, 440);
        }
        __SC.scTex.needsUpdate = true;
      }
      Z.camera.fov = fov; Z.camera.updateProjectionMatrix(); Z.camera.position.set(...p); Z.camera.up.set(0, 1, 0); Z.camera.lookAt(...l); Z.renderer.render(Z.scene, Z.camera);
    }, [p, l, fov, t, SEG]);
    await page.screenshot({ path: `${OUT}/f_${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 96 });
    if (f % 15 === 0) console.log(SEG, "frame", f, "/", N);
  }
  await close();
})();
