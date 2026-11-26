// node render_cup.js <HOME> <AWAY> <seed> preview [n] | frames <k> t1,t2 | video out.mp4
// Renders a Muxlislar kubogi penalty shootout with the Day 9 stadium harness and the clubs' own kits.
const path = require("path"), fs = require("fs"), { spawn } = require("child_process");
const G3 = path.resolve(__dirname, "../09_Episode_09/goals3d"), { open } = require(path.join(G3, "harness.js"));
const { buildShootout } = require("./cup.js");
const [HOME, AWAY, SEED, MODE, ...A] = process.argv.slice(2);
const B = path.join(__dirname, "build"); fs.mkdirSync(B, { recursive: true });
(async () => {
  const S = buildShootout(HOME, AWAY, +SEED);
  fs.writeFileSync(B + "/shootout.json", JSON.stringify({ seed: +SEED, home: HOME, away: AWAY, result: S.result,
    kicks: S.GOALS.map(g => ({ team: g.team, handle: g.handle, num: g.num, scored: g.scored, after: g.after })) }, null, 1));
  S.GOALS.forEach(g => { g.kicks = S.GOALS.length; });
  console.log(`${HOME} ${S.result[0]}-${S.result[1]} ${AWAY}  (${S.GOALS.length} kicks, seed ${SEED})`);
  const low = MODE === "preview";
  const { page, close } = await open({ time: process.env.ZT || "16.7", w: low ? 360 : 1080, h: low ? 640 : 1920 });
  await page.evaluate(C => { window.CUP = C; }, S.CUP);
  await page.addScriptTag({ content: `window.GOALS = ${JSON.stringify(S.GOALS)};` });
  await page.addScriptTag({ url: "/ep/director.js" });
  if (low) await page.addStyleTag({ content: "#hud{zoom:.3333}" });
  await page.evaluate(() => D.setup());
  const shot = async (g, t, file) => { await page.evaluate(([g, t]) => D.frame(g, t), [g, t]); return page.screenshot({ path: file, type: "jpeg", quality: file ? 88 : 92 }); };
  if (MODE === "preview") {
    const g = +(A[0] || 1) - 1, n = +(A[1] || 16), dur = S.GOALS[g].dur, files = [];
    for (let i = 0; i < n; i++) { const f = `${B}/_p${i}.jpg`; await shot(g, Math.min(dur * i / (n - 1), dur - 1 / 30), f); files.push(f); }
    require("child_process").execFileSync("python3", ["-c", `
import sys; from PIL import Image
fs=sys.argv[2:]; c=8; r=(len(fs)+c-1)//c; W=Image.new('RGB',(360*c,640*r))
for i,f in enumerate(fs): W.paste(Image.open(f),((i%c)*360,(i//c)*640))
W.save(sys.argv[1],quality=80)`, `${B}/prev_k${g + 1}.jpg`, ...files]); files.forEach(f => fs.unlinkSync(f));
  } else if (MODE === "frames") {
    const g = +A[0] - 1; for (const t of A[1].split(",").map(Number)) await shot(g, t, `${B}/k${g + 1}_${t.toFixed(2)}.jpg`);
  } else {
    const out = A[0] || B + "/shootout.mp4";
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "medium", out], { stdio: ["pipe", "inherit", "inherit"] });
    for (let g = 0; g < S.GOALS.length; g++) {
      const n = Math.round(S.GOALS[g].dur * 30);
      for (let i = 0; i < n; i++) { const buf = await shot(g, i / 30); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r)); }
      console.log(`kick ${g + 1}/${S.GOALS.length}`);
    }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
    console.log("OK", out);
  }
  await close();
})();
