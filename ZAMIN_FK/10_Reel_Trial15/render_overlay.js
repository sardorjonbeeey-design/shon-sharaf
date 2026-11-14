// node render_overlay.js [t1,t2,...]   -> check frames build/ov_chk_<t>.png (on grey) | no args: full PNG sequence build/ov/%04d.png (transparent) for 0..15 s at 30 fps
const { chromium } = require("playwright"), path = require("path"), fs = require("fs");
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto("file://" + path.join(__dirname, "overlay.html")); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(w => setup(w, ["goat_bg.jpg", "end_bg.jpg"]), JSON.parse(fs.readFileSync(path.join(__dirname, "build/words.json"), "utf8")));
  await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => i.onload = r))));
  const B = path.join(__dirname, "build");
  if (process.argv[2]) { await p.addStyleTag({ content: "html{background:#556!important}" }); for (const t of process.argv[2].split(",")) { await p.evaluate(t => at(+t), t); await p.screenshot({ path: `${B}/ov_chk_${(+t).toFixed(2)}.png` }); } }
  else { fs.mkdirSync(B + "/ov", { recursive: true }); for (let i = 0; i < 450; i++) { await p.evaluate(t => at(t), i / 30); await p.screenshot({ path: `${B}/ov/${String(i).padStart(4, "0")}.png`, omitBackground: true }); } }
  await b.close();
})();
