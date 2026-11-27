// 3D plates for episode 28 from the cup engine. node render_seq.js [name ...]
// Each plate is a 1080x1920 h264 clip in build/seq; stop.png is the freeze frame of the hook.
const path = require("path"), fs = require("fs"), { spawn } = require("child_process");
const ENG = path.resolve(__dirname, "../27_Cup_Match_Engine"), G3 = path.resolve(__dirname, "../09_Episode_09/goals3d");
const { open } = require(path.join(G3, "harness.js")), { buildShootout } = require(path.join(ENG, "cup.js"));
const B = path.join(__dirname, "build/seq"); fs.mkdirSync(B, { recursive: true });
// name: [goal index (0-based), t0, t1]   — kick 6 = index 5, kick 11 = 10, kick 12 = 11, celebration = 12
const SEG = {
  s1: [11, 0.00, 1.78],   // hook: run-up and strike, cut on the ball in the air
  s4: [5,  0.60, 4.10],   // Prime Fc go ahead
  s5: [10, 0.40, 4.40],   // 3:2
  s6: [11, 0.00, 4.40],   // the save
  s7: [12, 1.40, 6.40],   // the winners' huddle
};
(async () => {
  const want = process.argv.slice(2).filter(a => SEG[a]), names = want.length ? want : Object.keys(SEG);
  const S = buildShootout("WAKANDA TEAM", "PRIME FC", 20261126);
  const nk = S.GOALS.filter(g => !g.celebration).length; S.GOALS.forEach(g => { g.kicks = nk; });
  const { page, close } = await open({ time: process.env.ZT || "16.7", w: 1080, h: 1920 });
  await page.evaluate(C => { window.CUP = C; }, S.CUP);
  await page.addScriptTag({ content: `window.GOALS = ${JSON.stringify(S.GOALS)};` });
  await page.addScriptTag({ url: "/ep/director.js" });
  await page.evaluate(() => D.setup());
  for (const n of names) {
    const [gi, t0, t1] = SEG[n], out = `${B}/${n}.mp4`;
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "medium", out], { stdio: ["pipe", "inherit", "inherit"] });
    let i = 0;
    for (let t = t0; t <= t1 + 1e-6; t += 1 / 30, i++) {
      await page.evaluate(a => D.frame(a[0], a[1]), [gi, +t.toFixed(3)]);
      const buf = await page.screenshot({ type: "jpeg", quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      if (n === "s1" && t + 1 / 30 > t1) fs.writeFileSync(`${B}/stop.png`, buf);   // freeze frame for the hook
    }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
    console.log(`${n}: ${i} frames -> ${out}`);
  }
  await close();
})();
