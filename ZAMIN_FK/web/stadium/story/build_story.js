#!/usr/bin/env node
// ZAMIN FK — Instagram story (1080x1920): starting XI on the pitch + bench.
// Reads the same roster the stadium page shows (/api/squad, squad_role starter / substitute).
//   node build_story.js            -> uses squad_snapshot.json next to this file
//   node build_story.js --live     -> refreshes the snapshot from the API first
//   FONT_DIR=<node_modules>        -> inline @fontsource Montserrat / Josefin Sans (offline render)
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const API = process.env.ZFK_API || "https://zaminfk-city.onrender.com";
const SNAPSHOT = path.join(HERE, "squad_snapshot.json");
const CREST = path.join(HERE, "..", "..", "..", "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png");

// x, y in % of the pitch box; attack is up. 4-3-3 with the stadium's own slots.
const SPOT = {
  LW: [17, 16], ST: [50, 12], RW: [83, 16],
  CM: [24, 41], CAM: [50, 35], CDM: [76, 41],
  LB: [14, 63], CB1: [37, 69], CB2: [63, 69], RB: [86, 63],
  GK: [50, 89],
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const label = name => esc(String(name).trim().replace(/_/g, " "));

function fontCss() {
  const dir = process.env.FONT_DIR;
  if (!dir) return "";
  const face = (family, pkg, slug, weight) => {
    const f = path.join(dir, "@fontsource", pkg, "files", `${slug}-latin-${weight}-normal.woff2`);
    return fs.existsSync(f)
      ? `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString("base64")}) format("woff2");}`
      : "";
  };
  return [700, 800, 900].map(w => face("Montserrat", "montserrat", "montserrat", w)).join("") +
    [300, 400, 600].map(w => face("Josefin Sans", "josefin-sans", "josefin-sans", w)).join("");
}

function shirt(kind) {
  const body = kind === "gk" ? "#2E9E4F" : "#1F4FB8", trim = kind === "gk" ? "#0D2557" : "#FFD23F";
  return `<svg viewBox="0 0 100 92" aria-hidden="true">
    <path d="M32 4 L8 16 L0 40 L18 47 L24 36 L24 88 L76 88 L76 36 L82 47 L100 40 L92 16 L68 4 C64 14 36 14 32 4 Z" fill="${body}" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M32 4 C36 14 64 14 68 4" fill="none" stroke="${trim}" stroke-width="5" stroke-linecap="round"/>
    <path d="M24 80 L76 80" stroke="${trim}" stroke-width="5"/>
  </svg>`;
}

function html(squad) {
  const players = squad.filter(p => p.kind === "player");
  const starters = players.filter(p => p.squad_role === "starter").sort((a, b) => a.squad_order - b.squad_order);
  const bench = players.filter(p => p.squad_role === "substitute").sort((a, b) => a.squad_order - b.squad_order);
  let cb = 0;
  const tokens = starters.map(p => {
    const slot = p.position === "CB" ? "CB" + (++cb) : p.position;
    const [x, y] = SPOT[slot] || [50, 50];
    return `<div class="pl" style="left:${x}%;top:${y}%">
      <div class="kit">${shirt(p.position === "GK" ? "gk" : "out")}<b class="c${String(p.position).length}">${esc(p.position)}</b></div>
      <div class="nm">${label(p.name)}</div></div>`;
  }).join("\n");
  const subs = bench.map(p => `<li><b>${esc(p.position)}</b><span>${label(p.name)}</span></li>`).join("\n");
  const crest = "data:image/png;base64," + fs.readFileSync(CREST).toString("base64");

  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8">
<title>Zamin FK — asosiy tarkib</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Josefin+Sans:wght@300;400;600&display=swap" rel="stylesheet">
<style>
${fontCss()}
:root { --navy:#0D2557; --blue:#1F4FB8; --yel:#FFD23F; }
* { box-sizing:border-box; }
html, body { margin:0; }
body { width:1080px; height:1920px; overflow:hidden; position:relative; color:#fff; font-family:Montserrat, sans-serif;
  background:
    radial-gradient(900px 620px at 50% 0%, rgba(31,79,184,.75), transparent 70%),
    radial-gradient(700px 500px at 50% 100%, rgba(31,79,184,.35), transparent 70%),
    linear-gradient(180deg, #0D2557 0%, #081737 100%); }
body::before { content:""; position:absolute; inset:0; opacity:.06;
  background:repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 46px); }

header { position:absolute; left:64px; right:64px; top:150px; height:230px; display:flex; align-items:center; gap:34px; }
header img { height:230px; filter:drop-shadow(0 10px 24px rgba(0,0,0,.45)); }
header .k { font-family:"Josefin Sans", sans-serif; font-weight:400; font-size:30px; letter-spacing:10px; color:var(--yel); text-transform:uppercase; }
header h1 { margin:8px 0 0; font-weight:900; font-size:104px; line-height:.92; letter-spacing:-2px; text-transform:uppercase; }
header h1 span { display:block; color:var(--yel); }
header .f { position:absolute; right:0; bottom:8px; font-weight:900; font-size:34px; letter-spacing:3px; color:var(--navy); background:var(--yel); padding:10px 20px 8px; border-radius:10px; }

.pitch { position:absolute; left:48px; right:48px; top:420px; height:920px; border-radius:30px; overflow:hidden;
  border:4px solid rgba(255,255,255,.9); box-shadow:0 26px 60px rgba(0,0,0,.45);
  background:repeating-linear-gradient(180deg, #1f8a45 0 110px, #1a7b3d 110px 220px); }
.pitch svg.lines { position:absolute; inset:0; width:100%; height:100%; }
.pl { position:absolute; width:250px; transform:translate(-50%,-50%); text-align:center; }
.kit { position:relative; width:104px; height:96px; margin:0 auto; filter:drop-shadow(0 8px 10px rgba(0,0,0,.4)); }
.kit svg { width:100%; height:100%; display:block; }
.kit b { position:absolute; left:0; right:0; top:34px; font-weight:900; font-size:27px; letter-spacing:.5px; }
.kit b.c3 { top:37px; font-size:20px; letter-spacing:0; }
.nm { display:inline-block; max-width:250px; margin-top:8px; padding:8px 14px 7px; border-radius:12px; background:rgba(8,23,55,.9);
  border-bottom:4px solid var(--yel); font-weight:800; font-size:23px; line-height:1.12; overflow-wrap:break-word; text-wrap:balance; }

.bench { position:absolute; left:48px; right:48px; top:1372px; height:360px; padding:24px 30px 0; border-radius:30px;
  background:rgba(8,23,55,.72); border:2px solid rgba(255,255,255,.22); }
.bench h2 { margin:0 0 14px; display:flex; align-items:center; gap:18px; font-weight:900; font-size:36px; letter-spacing:6px; color:var(--yel); text-transform:uppercase; }
.bench h2::after { content:""; flex:1; height:3px; background:linear-gradient(90deg, var(--yel), transparent); }
.bench h2 i { font-family:"Josefin Sans", sans-serif; font-style:normal; font-weight:400; font-size:26px; letter-spacing:4px; color:#fff; opacity:.75; }
.bench ul { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:1.22fr 1fr; grid-auto-flow:column; grid-template-rows:repeat(6, 44px); column-gap:26px; }
.bench li { display:flex; align-items:center; gap:14px; min-width:0; }
.bench li b { flex:none; width:74px; padding:5px 0 3px; text-align:center; border-radius:8px; background:var(--blue); font-weight:900; font-size:20px; letter-spacing:1px; }
.bench li span { font-weight:700; font-size:24px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
</style></head>
<body>
<header>
  <img src="${crest}" alt="Zamin FK">
  <div>
    <div class="k">Zamin FK</div>
    <h1>Asosiy <span>tarkib</span></h1>
  </div>
  <div class="f">4-3-3</div>
</header>

<section class="pitch">
  <svg class="lines" viewBox="0 0 984 920" preserveAspectRatio="none" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4">
    <path d="M0 460 H984"/><circle cx="492" cy="460" r="96"/><circle cx="492" cy="460" r="5" fill="rgba(255,255,255,.55)"/>
    <path d="M252 0 V150 H732 V0"/><path d="M382 0 V58 H602 V0"/>
    <path d="M252 920 V770 H732 V920"/><path d="M382 920 V862 H602 V920"/>
    <path d="M412 150 A96 96 0 0 0 572 150"/><path d="M412 770 A96 96 0 0 1 572 770"/>
  </svg>
${tokens}
</section>

<section class="bench">
  <h2>Zaxira <i>${bench.length} o‘yinchi</i></h2>
  <ul>
${subs}
  </ul>
</section>
</body></html>`;
}

(async () => {
  if (process.argv.includes("--live")) {
    const r = await fetch(API + "/api/squad", { cache: "no-store" });
    if (!r.ok) throw new Error("squad API " + r.status);
    const live = (await r.json()).filter(p => p.kind === "player");
    fs.writeFileSync(SNAPSHOT, JSON.stringify(live, null, 1) + "\n");
  }
  const squad = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
  const out = path.join(HERE, "squad_story.html");
  fs.writeFileSync(out, html(squad));
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto("file://" + out, { waitUntil: "load" }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(HERE, "squad_story.png") });
  await browser.close();
  console.log("squad_story.png written");
})().catch(e => { console.error(e); process.exit(1); });
