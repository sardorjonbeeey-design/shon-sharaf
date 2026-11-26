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
    const NUM = { GK: 1, LB: 3, RB: 2, CB: 4, CM: 6, RW: 7, CAM: 10, LW: 11, ST: 9 };
    const SECOND = { CB: 5, CM: 8 };                       // ikkinchi CB/CM uchun
    const WISH = { "islom.muhammadov7": 51, "rasuluvich_09": 8 };              // muxlis so'ragan raqam
    const used = {}, taken = new Set(Object.keys(WISH).filter(u => body.includes('@' + u)).map(u => WISH[u])), POOL = [14,15,16,17,18,19,20,21,22,23];
    const rows = body.trim().split("\n").map(l => l.trim().match(/^- (\S+)\s+@(\S+)\s+\d+ ❤/)).filter(Boolean)
      .map(m => { const p = m[1], u = m[2]; used[p] = (used[p] || 0) + 1;
        let n = WISH[u] || (used[p] > 1 && SECOND[p] ? SECOND[p] : NUM[p]);
        if (taken.has(n) && !(u in WISH)) n = POOL.find(x => !taken.has(x));
        taken.add(n); return [p, u, n]; });
    const d = encodeURIComponent(JSON.stringify({ club, capt, rows }));
    await p.goto("file://" + HERE + "/story.html?d=" + d);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    await p.screenshot({ path: HERE + "/" + FN[club] });
    console.log(FN[club], rows.length + " rows");
  }
  await b.close();
})();
