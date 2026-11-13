// node render_goals.js preview <goal> [n]   -> build/prev_g<goal>.jpg contact sheet (low res)
// node render_goals.js frames <goal> t1,t2   -> full-res check frames
// node render_goals.js video [goal ...]      -> build/goal<N>.mp4 (1080x1920, 30 fps, no audio)
const { open } = require("./harness.js"), { spawn, execFileSync } = require("child_process"), path = require("path"), fs = require("fs");
const B = path.resolve(__dirname, "../build"), TIME = process.env.ZFK_TIME || "16.7";
(async () => {
  const [mode, ...a] = process.argv.slice(2), low = mode === "preview";
  const { page, close } = await open({ time: TIME, w: low ? 360 : 1080, h: low ? 640 : 1920 });
  await page.addScriptTag({ url: "/ep/scenarios.js" }); await page.addScriptTag({ url: "/ep/director.js" });
  if (low) await page.addStyleTag({ content: "#hud{zoom:.3333}" });
  await page.evaluate(() => D.setup());
  const durs = await page.evaluate(() => GOALS.map(g => g.dur));
  const shot = async (g, t, file) => { await page.evaluate(([g, t]) => D.frame(g, t), [g, t]); return page.screenshot({ path: file, type: "jpeg", quality: file ? 88 : 92 }); };
  if (mode === "preview") {
    const g = +a[0] - 1, n = +(a[1] || 24), files = [];
    for (let i = 0; i < n; i++) { const t = Math.round(durs[g] * i / (n - 1) * 30) / 30, f = `${B}/_p${i}.jpg`; await shot(g, Math.min(t, durs[g] - 1 / 30), f); files.push(f); }
    execFileSync("python3", ["-c", `
import sys; from PIL import Image
fs=sys.argv[2:]; c=8; r=(len(fs)+c-1)//c; W=Image.new('RGB',(360*c,640*r))
for i,f in enumerate(fs): W.paste(Image.open(f),((i%c)*360,(i//c)*640))
W.save(sys.argv[1],quality=80)`, `${B}/prev_g${g + 1}.jpg`, ...files]); files.forEach(f => fs.unlinkSync(f));
  } else if (mode === "stills") {          // plates for the 2D scenes -> assets/
    const A = path.resolve(__dirname, "../assets"), TL = [0, 1.7, 37], N = [0, 9, -40];
    const L = [["bg_kickoff", 0, 0, [-40, 13, 39], [8, 5, -14], 56, { score: "O‘YIN KUNI" }], ["bg_touch_00", 0, 0, TL, N, 50, { empty: true, score: "O‘YIN KUNI" }], ["bg_touch_01", 0, 8.3, TL, N, 50, { empty: true }],
      ["bg_touch_11", 1, 7.9, TL, N, 50, { empty: true, score: "TANAFFUS" }], ["bg_touch_12", 2, 7.7, TL, N, 50, { empty: true }], ["bg_touch_22", 3, 8.9, TL, N, 50, { empty: true, score: "O‘YIN TUGADI" }]];
    for (const [n, g, t, pos, look, fov, opt] of L) { await page.evaluate(a => D.still(...a), [g, t, pos, look, fov, opt]); await page.screenshot({ path: `${A}/${n}.jpg`, type: "jpeg", quality: 92 }); }
  } else if (mode === "frames") {
    const g = +a[0] - 1; for (const t of a[1].split(",").map(Number)) await shot(g, t, `${B}/g${g + 1}_${t.toFixed(2)}.jpg`);
  } else {
    for (const g of (a.length ? a.map(v => +v - 1) : durs.map((_, i) => i))) {
      const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "15", "-preset", "medium", `${B}/goal${g + 1}.mp4`], { stdio: ["pipe", "inherit", "inherit"] });
      const n = Math.round(durs[g] * 30), t0 = Date.now();
      for (let i = 0; i < n; i++) { const buf = await shot(g, i / 30); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r)); if (i % 30 === 0) console.log(`goal ${g + 1}: ${i}/${n} ${((Date.now() - t0) / 1000) | 0}s`); }
      ff.stdin.end(); await new Promise(r => ff.on("close", r));
    }
  }
  await close();
})();
