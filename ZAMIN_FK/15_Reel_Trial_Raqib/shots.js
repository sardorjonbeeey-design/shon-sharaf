// Real stadium page (dist) top view plates + dive frames -> build/top/*.jpg and build/layout.json (screen px of the 11+11 slots).
//   node shots.js [diveFrames]   env: THREE_DIR, ZFK_DIST
const path = require("path"), fs = require("fs"), G3 = path.resolve(__dirname, "../09_Episode_09/goals3d"), { open } = require(path.join(G3, "harness.js"));
const OUT = path.join(__dirname, "build", "top"); fs.mkdirSync(OUT, { recursive: true });
const FPS = 30, DIVE = +(process.argv[2] || 36);
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// 4-3-3 on our half (x: -52.5 goal line .. 0 halfway; z: left(-)/right(+) as seen attacking +x). B team = point reflection.
const FORM = { GK: [-49, 0], LB: [-37, -28], CB1: [-40, -11], CB2: [-40, 11], RB: [-37, 28], CDM: [-25, 17], CM: [-25, -17], CAM: [-19, 0], LW: [-8, -26], ST: [-6, 0], RW: [-8, 26] };
(async () => {
  const { page, close } = await open({ time: "night", w: 1080, h: 1920 });
  const set = ([p, l, fov]) => page.evaluate(([p, l, fov]) => { const Z = window.__Z; Z.camera.fov = fov; Z.camera.updateProjectionMatrix(); Z.camera.position.set(...p); Z.camera.up.set(1, 0, 0); Z.camera.lookAt(...l); Z.camera.updateMatrixWorld(); Z.renderer.render(Z.scene, Z.camera); }, [p, l, fov]);
  await page.evaluate(() => { const Z = window.__Z; try { (Z.SQUAD || []).forEach(s => { if (s.g) s.g.visible = false; }); if (Z.ball) Z.ball.visible = false; } catch (e) {} });
  const TOP = [[0.001, 214, 0], [0, 0, 0], 42];            // hover over the centre spot, +x up the screen
  await set(TOP);
  await page.screenshot({ path: `${OUT}/top.jpg`, type: "jpeg", quality: 92 });
  const proj = await page.evaluate(F => { const Z = window.__Z, T = Z.THREE, out = {}; for (const [k, [x, z]] of Object.entries(F)) for (const s of [1, -1]) { const v = new T.Vector3(s * x, .2, s * z).project(Z.camera); out[(s > 0 ? "A_" : "B_") + k] = [(v.x + 1) / 2 * 1080, (1 - v.y) / 2 * 1920]; } return out; }, FORM);
  fs.writeFileSync(path.join(__dirname, "build", "layout.json"), JSON.stringify(proj, null, 1));
  // dive: aerial 3/4 view -> top-down
  const A = [[-95, 120, 120], [0, 0, 0], 48];
  for (let f = 0; f < DIVE; f++) { const u = sm(f / (DIVE - 1)), L = (p, q) => p.map((v, j) => v + (q[j] - v) * u);
    const up = u; await page.evaluate(() => 0);
    await set([L(A[0], TOP[0]), L(A[1], TOP[1]), A[2] + (TOP[2] - A[2]) * u]); await page.screenshot({ path: `${OUT}/d_${String(f).padStart(3, "0")}.jpg`, type: "jpeg", quality: 90 }); }
  await close();
})();
