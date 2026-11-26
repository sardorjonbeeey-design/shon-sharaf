// node render_story.js  -> story_0X_<CLUB>.png (1080x1920 @2x, 4-3-3 pitch)
const { chromium } = require("playwright"), fs = require("fs");
const HERE = __dirname, src = fs.readFileSync(HERE + "/TARKIB.md", "utf8");
const FN = { "PRIME AVANGARD": "story_01_PRIME_AVANGARD.png", "PRIME FC": "story_02_PRIME_FC.png",
             "WAKANDA TEAM": "story_03_WAKANDA_TEAM.png", "QAYRAT FC": "story_04_QAYRAT_FC.png" };
const NUM = { GK: 1, LB: 3, RB: 2, CB: 4, CM: 6, RW: 7, CAM: 10, LW: 11, ST: 9 };
const SECOND = { CB: 5, CM: 8 }, POOL = [14,15,16,17,18,19,20,21,22,23];
const WISH = { "islom.muhammadov7": 51, "rasuluvich_09": 8 };
// 4-2-3-1 yozuvdan 4-3-3 ga: CAM -> uchinchi markaz (CMC)
const SPOTS = { GK: ["GK"], LB: ["LB"], RB: ["RB"], CB: ["CB1","CB2"], CM: ["CML","CMR"], CAM: ["CMC"], LW: ["LW"], RW: ["RW"], ST: ["ST"] };
const LABEL = { CMC: "CM", CML: "CM", CMR: "CM", CB1: "CB", CB2: "CB" };
const blocks = [...src.matchAll(/## (.+?) — asoschi\/kapitan @(\S+)\n([\s\S]*?)\n  zaxira: (.*)/g)];
(async () => {
  const b = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  p.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 300)));
  for (const [, club, capt, body, zax] of blocks) {
    const rows = body.trim().split("\n").map(l => l.trim().match(/^- (\S+)\s+@(\S+)\s+\d+ ❤/)).filter(Boolean);
    const used = {}, taken = new Set(Object.keys(WISH).filter(u => body.includes("@" + u)).map(u => WISH[u])), slotUse = {};
    const xi = rows.map(m => {
      const pos = m[1], u = m[2]; used[pos] = (used[pos] || 0) + 1;
      let n = WISH[u] || (used[pos] > 1 && SECOND[pos] ? SECOND[pos] : NUM[pos]);
      if (taken.has(n) && !(u in WISH)) n = POOL.find(x => !taken.has(x));
      taken.add(n);
      slotUse[pos] = (slotUse[pos] || 0); const spot = SPOTS[pos][slotUse[pos]++];
      return { spot, pos: LABEL[spot] || pos, u, n };
    });
    const subs = zax.split(",").map(s => (s.trim().match(/^@(\S+)/) || [])[1]).filter(Boolean);
    const d = encodeURIComponent(JSON.stringify({ club, capt, xi, subs }));
    await p.goto("file://" + HERE + "/story.html?d=" + d);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    await p.screenshot({ path: HERE + "/" + FN[club] });
    console.log(FN[club], xi.length + " xi,", subs.length + " subs");
  }
  await b.close();
})();
