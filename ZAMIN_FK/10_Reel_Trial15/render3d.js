// 3D shots of the 15 s Reel, rendered from the real stadium (reuses 09_Episode_09/goals3d harness + director).
//   node render3d.js prev <shot>            low-res contact sheet  -> build/prev_<shot>.jpg
//   node render3d.js frames <shot> t1,t2    full-res check frames  -> build/chk_<shot>_<t>.jpg
//   node render3d.js video <shot>           1080x1920 30 fps       -> build/<shot>.mp4
//   node render3d.js plate <name>           still plate            -> assets/<name>.jpg
// shots: s1 (reveal), s2 (new player enters), s3 old (ZFK_DIST=old stadium) / s3 new (current stadium; same camera, wiped in render.py)
const path = require("path"), fs = require("fs"), { spawn, execFileSync } = require("child_process");
if (process.env.ZFK_OLD) process.env.ZFK_DIST = path.join(__dirname, "build/old/web/stadium/dist");
const G3 = path.resolve(__dirname, "../09_Episode_09/goals3d");
const { open } = require(path.join(G3, "harness.js"));
const B = path.join(__dirname, "build"), TIME = process.env.ZFK_TIME || "16.7";
const OLD = path.join(B, "old/web/stadium/dist");

// camera waypoints: [t, x,y,z, lookX,lookY,lookZ, fov], Catmull-Rom through them
const SH = {
  s1: { dur: 3.0, w0: 0, kf: [[0, -34, 1.2, -12, -22, 13, -40, 68], [1.1, -24, 4, -6, -8, 13, -40, 62], [2.0, -8, 14, 6, 2, 10, -40, 58], [3.0, 10, 26, 26, 4, 8, -40, 54]] },
  s2: { dur: 3.0, w0: 3.0 },
  s3: { dur: 3.0, w0: 6.0, kf: [[0, -40, 3, -4, -26, 23, -40, 72], [1.0, -26, 5, -2, -12, 23, -40, 70], [2.0, -10, 8, 2, 0, 22, -40, 66], [3.0, 8, 12, 8, 10, 21, -40, 62]] },
};
const cr = (p0, p1, p2, p3, u) => p1.map((_, i) => .5 * (2 * p1[i] + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u * u + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u * u * u));
function camKF(kf, t) {
  const n = kf.length; let i = 0; while (i < n - 2 && kf[i + 1][0] <= t) i++;
  const u = Math.max(0, Math.min(1, (t - kf[i][0]) / (kf[i + 1][0] - kf[i][0]))), v = j => kf[Math.max(0, Math.min(n - 1, j))].slice(1);
  return cr(v(i - 1), v(i), v(i + 1), v(i + 2), u);
}
const sm = u => u * u * (3 - 2 * u), cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

(async () => {
  const [mode, shot, arg] = process.argv.slice(2);
  if (process.env.ZFK_OLD) process.env.ZFK_DIST = OLD;
  const low = mode === "prev";
  const { page, close } = await open({ time: TIME, w: low ? 360 : 1080, h: low ? 640 : 1920 });
  await page.addScriptTag({ url: "/ep/scenarios.js" }); await page.addScriptTag({ url: "/ep/director.js" });
  if (low) await page.addStyleTag({ content: "#hud{zoom:.3333}" });
  await page.evaluate(() => D.setup());
  await page.evaluate(() => { document.getElementById("hud").style.display = "none"; window.RE = { sim: null, sh: null }; window.LED = () => { const x = __SC.scv.getContext("2d"), W = __SC.scv.width, H = __SC.scv.height; x.fillStyle = "#06122c"; x.fillRect(0, 0, W, H); x.fillStyle = "#1F4FB8"; x.fillRect(0, 0, W, H * .14); x.fillStyle = "#fff"; x.textAlign = "center";
        x.font = "900 " + (H * .095) + "px MZ, sans-serif"; x.fillText("ZAMIN FK STADIONI", W / 2, H * .105); x.font = "900 " + (H * .27) + "px MZ, sans-serif"; x.fillText("ZAMIN FK", W / 2, H * .55); x.fillStyle = "#FFD23F"; x.font = "900 " + (H * .11) + "px MZ, sans-serif"; x.fillText("SIZ BOSHQARASIZ", W / 2, H * .82); __SC.scTex.needsUpdate = true; }; });
  // pose the world for reel time t of shot `name`
  async function pose(name, t) {
    const S = SH[name];
    await page.evaluate(([name, t, S, cam]) => {
      const T = __Z.THREE, w = S.w0 + t, DT = 1 / 30;
      D.frame(0, w);                                         // the match as the living background
      document.getElementById("hud").style.display = "none";
      { const x = __SC.scv.getContext("2d"), W = __SC.scv.width, H = __SC.scv.height; x.fillStyle = "#06122c"; x.fillRect(0, 0, W, H); x.fillStyle = "#1F4FB8"; x.fillRect(0, 0, W, H * .14); x.fillStyle = "#fff"; x.textAlign = "center";
        x.font = "900 " + (H * .095) + "px MZ, sans-serif"; x.fillText("ZAMIN FK STADIONI", W / 2, H * .105); x.font = "900 " + (H * .27) + "px MZ, sans-serif"; x.fillText("ZAMIN FK", W / 2, H * .55); x.fillStyle = "#FFD23F"; x.font = "900 " + (H * .11) + "px MZ, sans-serif"; x.fillText("SIZ BOSHQARASIZ", W / 2, H * .82); __SC.scTex.needsUpdate = true; }
      let pos, look, fov;
      if (name === "s2") {
        if (!RE.sim) { RE.sim = D.extra("SIZ", "?"); RE.sim.t = -1; }
        const e = RE.sim, A = [-3, 37], Bp = [-0.5, 25.6];  // touchline -> onto the pitch
        const tw = 2.5, u = Math.min(1, t / tw), k = u * u * (3 - 2 * u) * .35 + u * .65;
        e.g.position.set(A[0] + (Bp[0] - A[0]) * k, 0, A[1] + (Bp[1] - A[1]) * k);
        const sp = t >= tw ? 0 : 3.4 * (1 - .35 * Math.abs(2 * u - 1) * 0);
        const face = Math.PI;   // walks towards -z; the camera swings round to the front
        e.g.rotation.y = face;
        const w = Math.max(0, Math.min(1, (sp - 2) / 2.2));
        e.r.run.setEffectiveWeight(w); e.r.walk.setEffectiveWeight(1 - w); e.r.run.timeScale = .95; e.r.walk.timeScale = sp > 0 ? 1.2 : .22;
        while (e.t < t - 1e-6) { e.r.mx.update(DT); e.t = e.t < 0 ? 0 : e.t + DT; if (e.t > t) break; }
        const tx = e.g.position.x, tz = e.g.position.z, ang = (t < 2.0 ? .25 : .25 + (Math.PI - .15) * sm_(Math.min(1, (t - 2.0) / 1.0))), rad = t < 2.0 ? 5.2 - t * .2 : 4.6 - (t - 2.0) * 1.7;
        pos = [tx + Math.sin(ang) * rad, 1.15 + (t < 2 ? t * .22 : .6), tz + Math.cos(ang) * rad]; look = [tx, 1.35, tz]; fov = t < 2.0 ? 40 : 40 - (t - 2) * 8;
      } else { [pos, look, fov] = [cam.slice(0, 3), cam.slice(3, 6), cam[6]]; }
      __Z.camera.fov = fov; __Z.camera.updateProjectionMatrix(); __Z.camera.position.set(...pos); __Z.camera.lookAt(...look); __Z.sky.position.copy(__Z.camera.position);
      if (name !== "s2" && RE.sim) RE.sim.g.visible = false;
      __Z.DN.render();
      function sm_(u) { return u * u * (3 - 2 * u); }
    }, [name, t, S, S.kf ? camKF(S.kf, t) : null]);
  }
  const grab = async (name, t, file) => { await pose(name, t); return page.screenshot({ path: file, type: "jpeg", quality: file ? 90 : 93 }); };
  if (mode === "prev") {
    const n = 12, files = [];
    for (let i = 0; i < n; i++) { const t = Math.min(SH[shot].dur - 1 / 30, SH[shot].dur * i / (n - 1)), f = `${B}/_p${i}.jpg`; await grab(shot, Math.round(t * 30) / 30, f); files.push(f); }
    execFileSync("python3", ["-c", `
import sys; from PIL import Image
fs=sys.argv[2:]; c=6; r=(len(fs)+c-1)//c; W=Image.new('RGB',(360*c,640*r))
for i,f in enumerate(fs): W.paste(Image.open(f),((i%c)*360,(i//c)*640))
W.save(sys.argv[1],quality=82)`, `${B}/prev_${shot}${process.env.ZFK_DIST ? "_old" : ""}.jpg`, ...files]); files.forEach(f => fs.unlinkSync(f));
  } else if (mode === "frames") {
    for (const t of arg.split(",").map(Number)) await grab(shot, t, `${B}/chk_${shot}_${t.toFixed(2)}.jpg`);
  } else if (mode === "video") {
    const tag = process.env.ZFK_DIST ? "_old" : "", out = `${B}/${shot}${tag}.mp4`;
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "medium", out], { stdio: ["pipe", "inherit", "inherit"] });
    const n = Math.round(SH[shot].dur * 30), t0 = Date.now();
    for (let i = 0; i < n; i++) { const buf = await grab(shot, i / 30); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r)); if (i % 30 === 0) console.log(`${shot}${tag}: ${i}/${n} ${((Date.now() - t0) / 1000) | 0}s`); }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
  } else if (mode === "plate") {     // free-camera stills, no players: [name, pos, look, fov]
    const P = { goat_bg: [[-12, 2.5, -2], [0, 20, -40], 68], end_bg: [[-34, 16, 42], [4, 8, -30], 58] }[shot];
    await page.evaluate(([p]) => { D.still(1, 8, p[0], p[1], p[2], { empty: true }); LED(); __Z.DN.render(); }, [P]);
    await page.screenshot({ path: path.join(__dirname, "assets", shot + ".jpg"), type: "jpeg", quality: 93 });
  }
  await close();
})();
