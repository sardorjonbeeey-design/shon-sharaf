// node top.js [diveFrames]   -> build/top/d_###.jpg (aerial dive to straight-down) + build/top/top.jpg + build/top_layout.json
// The cup bracket is drawn on the pitch itself: four quadrants = four clubs, centre circle = final.
const path = require("path"), fs = require("fs"), G3 = path.resolve(__dirname, "../09_Episode_09/goals3d"), { open } = require(path.join(G3, "harness.js"));
const OUT = path.join(__dirname, "build", "top"); fs.mkdirSync(OUT, { recursive: true });
const DIVE = +(process.argv[2] || 30);                       // 15 fps plates; film.html holds each for 2 frames
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const TOP = [[0.001, 214, 0], [0, 0, 0], 42];                // straight down over the centre spot, +x up the screen
const AIR = [[-120, 150, 95], [0, 0, 0], 46];
// world points we need in screen pixels: quadrant centres (clubs), centre spot (final), pitch corners
const PTS = { k1: [26, -17], k2: [26, 17], k3: [-26, -17], k4: [-26, 17], c: [0, 0],
              nw: [52.5, -34], ne: [52.5, 34], sw: [-52.5, -34], se: [-52.5, 34],
              mid_w: [0, -34], mid_e: [0, 34], mid_n: [52.5, 0], mid_s: [-52.5, 0] };
(async () => {
  const { page, close } = await open({ time: "night", w: 1080, h: 1920 });
  const set = ([p, l, fov]) => page.evaluate(([p, l, fov]) => {
    const Z = window.__Z, TH = Z.THREE;
    for (const o of Z.scene.children) if (o.visible && o.position.lengthSq() < 1e-6 && !o.isInstancedMesh) { const b = new TH.Box3().setFromObject(o); if (!b.isEmpty() && b.getSize(new TH.Vector3()).x < 8) o.visible = false; }
    if (window.__SC) {                                       // LED screen carries the cup title in every shot
      const x = __SC.scv.getContext("2d");
      x.fillStyle = "#06122c"; x.fillRect(0, 0, 1024, 512); x.fillStyle = "#1F4FB8"; x.fillRect(0, 0, 1024, 100);
      x.textAlign = "center"; x.fillStyle = "#fff"; x.font = "900 58px MZ, sans-serif"; x.fillText("MUXLISLAR KUBOGI", 512, 70);
      x.fillStyle = "#FFD23F"; x.font = "900 150px MZ, sans-serif"; x.fillText("4 KLUB", 512, 290);
      x.fillStyle = "#9DB8FF"; x.font = "900 54px MZ, sans-serif"; x.fillText("3 O‘YIN · 1 G‘OLIB", 512, 400);
      __SC.scTex.needsUpdate = true;
    }
    Z.camera.fov = fov; Z.camera.updateProjectionMatrix(); Z.camera.position.set(...p); Z.camera.up.set(1, 0, 0); Z.camera.lookAt(...l); Z.camera.updateMatrixWorld(); Z.renderer.render(Z.scene, Z.camera);
  }, [p, l, fov]);
  await page.evaluate(() => { const Z = window.__Z; try { (Z.SQUAD || []).forEach(s => { if (s.g) s.g.visible = false; }); if (Z.ball) Z.ball.visible = false; } catch (e) {} });
  for (let f = 0; f < DIVE; f++) {
    const u = sm(f / (DIVE - 1)), L = (p, q) => p.map((v, j) => v + (q[j] - v) * u);
    await set([L(AIR[0], TOP[0]), L(AIR[1], TOP[1]), AIR[2] + (TOP[2] - AIR[2]) * u]);
    await page.screenshot({ path: `${OUT}/d_${String(f).padStart(3, "0")}.jpg`, type: "jpeg", quality: 95 });
    if (f % 10 === 0) console.log("dive", f, "/", DIVE);
  }
  await set(TOP);
  await page.screenshot({ path: `${OUT}/top.jpg`, type: "jpeg", quality: 96 });
  const proj = await page.evaluate(P => {
    const Z = window.__Z, T = Z.THREE, out = {};
    for (const [k, [x, z]] of Object.entries(P)) { const v = new T.Vector3(x, .2, z).project(Z.camera); out[k] = [Math.round((v.x + 1) / 2 * 1080), Math.round((1 - v.y) / 2 * 1920)]; }
    return out;
  }, PTS);
  fs.writeFileSync(path.join(__dirname, "build", "top_layout.json"), JSON.stringify(proj, null, 1));
  console.log(proj);
  await close();
})();
