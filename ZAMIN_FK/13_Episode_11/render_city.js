// Real 3D city fly-through (Mega Market + Uzun bino) -> build/city/f_0000.jpg ... at 30 fps.  node render_city.js [seconds]
const path = require("path"), fs = require("fs"), G3 = path.resolve(__dirname, "../09_Episode_09/goals3d"), { open } = require(path.join(G3, "harness.js"));
const DUR = +(process.argv[2] || 5.6), FPS = 30, OUT = path.join(__dirname, "build", "city"); fs.mkdirSync(OUT, { recursive: true });
const K = [[0, [-40, 95, -230], [40, 20, -126], 62], [1.3, [-55, 24, -200], [0, 16, -130], 62], [2.85, [8, 15, -188], [0, 17, -140], 62], [4.0, [70, 24, -190], [105, 40, -135], 64], [5.58, [98, 14, -178], [110, 62, -136], 72]];
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function cam(t) { let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = sm((t - a[0]) / (b[0] - a[0])), L = (p, q) => p.map((v, j) => v + (q[j] - v) * u); return [L(a[1], b[1]), L(a[2], b[2]), a[3] + (b[3] - a[3]) * u]; }
(async () => {
  const { page, close } = await open({ time: "night", w: 1080, h: 1920 });
  const n = Math.round(DUR * FPS);
  for (let f = 0; f < n; f++) {
    const [p, l, fov] = cam(f / FPS);
    await page.evaluate(([p, l, fov]) => { const Z = window.__Z; Z.camera.fov = fov; Z.camera.updateProjectionMatrix(); Z.camera.position.set(...p); Z.camera.up.set(0, 1, 0); Z.camera.lookAt(...l); Z.renderer.render(Z.scene, Z.camera); }, [p, l, fov]);
    await page.screenshot({ path: `${OUT}/f_${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 90 });
    if (f % 30 === 0) console.log("frame", f, "/", n);
  }
  await close();
})();
