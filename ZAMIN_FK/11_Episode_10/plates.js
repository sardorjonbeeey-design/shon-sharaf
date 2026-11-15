// Background plates from the real 3D stadium + town (reuses 09_Episode_09/goals3d harness/director).
//   node plates.js probe        -> build/probe_*.jpg + build/probe_sheet.jpg (candidate cameras)
//   node plates.js final        -> assets/bg_*.jpg
const path = require("path"), fs = require("fs"), { execFileSync } = require("child_process");
const G3 = path.resolve(__dirname, "../09_Episode_09/goals3d");
const { open } = require(path.join(G3, "harness.js"));
const B = path.join(__dirname, "build"), A = path.join(__dirname, "assets");
// [name, pos, look, fov, opts]
const CAMS = {
  club_wide:  [[-40, 13, 39], [8, 5, -14], 56, { score: "ZAMIN FK" }],
  club_stand: [[-12, 2.5, -2], [0, 20, -40], 68, { empty: true }],
  club_goal:  [[0, 1.7, 37], [0, 9, -40], 50, { empty: true }],
  club_high:  [[0, 70, 95], [0, 5, -20], 58, { empty: true }],
  city_a:     [[60, 14, 40], [100, 6, 0], 62, { empty: true }],
  city_b:     [[0, 55, 130], [0, 0, 220], 62, { empty: true }],
  city_c:     [[0, 40, -60], [0, 0, -190], 62, { empty: true }],
  city_d:     [[-90, 30, 20], [-170, 0, -20], 62, { empty: true }],
  city_e:     [[0, 150, 40], [0, 0, 200], 60, { empty: true }],
  city_f:     [[130, 40, 120], [0, 0, 0], 58, { empty: true }],
};
(async () => {
  const mode = process.argv[2] || "probe", names = process.argv.slice(3);
  const { page, close } = await open({ time: process.env.ZFK_TIME || "16.7", w: 1080, h: 1920 });
  await page.addScriptTag({ url: "/ep/scenarios.js" }); await page.addScriptTag({ url: "/ep/director.js" });
  await page.evaluate(() => D.setup());
  const files = [];
  for (const [n, [pos, look, fov, opt]] of Object.entries(CAMS)) {
    if (names.length && !names.includes(n)) continue;
    await page.evaluate(a => { D.still(...a); const x = __SC.scv.getContext("2d"), W = __SC.scv.width, H = __SC.scv.height; x.fillStyle = "#06122c"; x.fillRect(0, 0, W, H); x.fillStyle = "#1F4FB8"; x.fillRect(0, 0, W, H * .14); x.fillStyle = "#fff"; x.textAlign = "center";
      x.font = "900 " + (H * .095) + "px MZ, sans-serif"; x.fillText("ZAMIN FK STADIONI", W / 2, H * .105); x.font = "900 " + (H * .27) + "px MZ, sans-serif"; x.fillText("ZAMIN FK", W / 2, H * .55); x.fillStyle = "#FFD23F"; x.font = "900 " + (H * .11) + "px MZ, sans-serif"; x.fillText("SIZ QURASIZ", W / 2, H * .82); __SC.scTex.needsUpdate = true; __Z.DN.render(); }, [1, 8, pos, look, fov, opt]);
    const f = mode === "probe" ? `${B}/probe_${n}.jpg` : `${A}/bg_${n}.jpg`;
    await page.screenshot({ path: f, type: "jpeg", quality: 92 }); files.push(f);
  }
  if (mode === "probe") execFileSync("python3", ["-c", `
import sys; from PIL import Image
fs=sys.argv[2:]; c=5; r=(len(fs)+c-1)//c; W=Image.new('RGB',(432*c,768*r))
for i,f in enumerate(fs): W.paste(Image.open(f).resize((432,768)),((i%c)*432,(i//c)*768))
W.save(sys.argv[1],quality=80)`, `${B}/probe_sheet.jpg`, ...files]);
  await close();
})();
