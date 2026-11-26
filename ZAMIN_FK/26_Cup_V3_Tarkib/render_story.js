// node render_story.js  -> story_0X_<CLUB>.png (1080x1920, @2x)
const { chromium } = require("playwright"), fs = require("fs");
const HERE = __dirname;
const src = fs.readFileSync(HERE + "/TARKIB.md", "utf8");
const FN = { "PRIME AVANGARD": "story_01_PRIME_AVANGARD.png", "PRIME FC": "story_02_PRIME_FC.png",
             "WAKANDA TEAM": "story_03_WAKANDA_TEAM.png", "QAYRAT FC": "story_04_QAYRAT_FC.png" };
const blocks = [...src.matchAll(/## (.+?) — asoschi\/kapitan @(\S+)\n([\s\S]*?)\n  zaxira:/g)];
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  p.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 300)));
  for (const [, club, capt, body] of blocks) {
    const rows = body.trim().split("\n").map(l => l.trim().match(/^- (\S+)\s+@(\S+)\s+\d+ ❤/)).filter(Boolean).map(m => [m[1], m[2]]);
    const d = encodeURIComponent(JSON.stringify({ club, capt, rows }));
    await p.goto("file://" + HERE + "/story.html?d=" + d);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    await p.screenshot({ path: HERE + "/" + FN[club] });
    console.log(FN[club], rows.length + " rows");
  }
  await b.close();
})();
