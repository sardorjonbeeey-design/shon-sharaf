// node story.js <count> [out.png]   -> exports/ZFK_story_<count>_muxlis.png (+ .jpg for Instagram)
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
const n = +(process.argv[2] || 750), out = process.argv[3] || path.join(__dirname, "exports", `ZFK_story_${n}_muxlis.png`);
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 300)));
  await p.addInitScript(w => { window.W = JSON.parse(w); }, fs.readFileSync(__dirname + "/build/words.json", "utf8"));
  await p.goto("file://" + __dirname + "/stadium.html"); await p.evaluate(() => window.ready());
  await p.evaluate(n => window.renderStory(n), n); await p.screenshot({ path: out }); await b.close();
})();
