const { chromium } = require("playwright"), path = require("path");
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.join(__dirname, "story.html"));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(__dirname, "exports", "story_position.jpg"), type: "jpeg", quality: 92 });
  await b.close(); console.log("OK");
})();
