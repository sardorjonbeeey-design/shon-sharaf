// node render_cover.js -> exports/cover_27.png (1080x1920)
const { chromium } = require("playwright"), path = require("path");
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.join(__dirname, "cover.html"));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(__dirname, "exports", "cover_27.png") });
  await b.close(); console.log("OK exports/cover_27.png");
})();
