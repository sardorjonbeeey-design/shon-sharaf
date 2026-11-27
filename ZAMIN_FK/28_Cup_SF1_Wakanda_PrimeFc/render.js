// node render.js frames t1,t2 | node render.js video build/silent.mp4   (needs build/words.json + build/teams.json + build/3d/*)
const { chromium } = require("playwright"), { spawn } = require("child_process"), fs = require("fs");
const HERE = __dirname, W = fs.readFileSync(HERE + "/build/words.json", "utf8");
(async () => {
  const mode = process.argv[2], arg = process.argv[3];
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 400)));
  p.on("console", m => { if (/error/i.test(m.type())) console.log("[page]", m.text().slice(0, 300)); });
  await p.addInitScript(([w]) => { window.W = JSON.parse(w); }, [W]);
  await p.goto("file://" + HERE + "/film.html");
  await p.evaluate(() => window.ready());
  const END = await p.evaluate(() => window.END);
  if (mode === "frames") {
    fs.mkdirSync(HERE + "/build/frames", { recursive: true });
    for (const t of arg.split(",").map(Number)) {
      await p.evaluate(t => window.renderAt(t), t); await p.waitForTimeout(120);
      await p.screenshot({ path: `${HERE}/build/frames/f_${t.toFixed(2)}.jpg`, type: "jpeg", quality: 88 });
    }
  } else {
    const fps = 30, n = Math.round(END * fps);
    const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", arg], { stdio: ["pipe", "inherit", "inherit"] });
    for (let f = 0; f < n; f++) {
      await p.evaluate(t => window.renderAt(t), f / fps);
      const buf = await p.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      if (f % 100 === 0) console.error(`frame ${f}/${n}`);
    }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
  }
  await b.close();
})();
