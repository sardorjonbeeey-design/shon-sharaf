// Card images for the bot: footballers get a FIFA-style card, everyone else a VIP member card.
// SVG -> PNG with resvg (prebuilt binary, bundled Montserrat font). No browser, no paid service: 0 credits per card.
const fs = require("fs"), path = require("path");
let Resvg = null;
try { ({ Resvg } = require("@resvg/resvg-js")); } catch (e) { console.warn("cards: @resvg/resvg-js missing, cards disabled"); }
// Montserrat (SIL OFL) shipped with the app, so the cards never depend on a font package layout
const FONTS = ["600SemiBold", "700Bold", "800ExtraBold", "900Black"].map(w => path.join(__dirname, "assets", "fonts", `Montserrat_${w}.ttf`)).filter(f => fs.existsSync(f));
if (FONTS.length < 4) console.warn("cards: Montserrat fonts missing in assets/fonts");
const CREST = (() => { try { return "data:image/png;base64," + fs.readFileSync(path.join(__dirname, "assets", "crest.png")).toString("base64"); } catch { return ""; } })();
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const initial = name => esc((String(name || "?").replace(/^@/, "").trim()[0] || "?").toUpperCase());
const fit = (s, max) => { s = String(s ?? ""); return s.length > max ? s.slice(0, max - 1) + "…" : s; };

const STAGES = {
  new:      { label: "SINOV",         c1: "#9DB8FF", c2: "#5E7BD6", text: "#0d2557" },
  accepted: { label: "ASOSIY TARKIB", c1: "#7CF2A0", c2: "#1FB25A", text: "#06301a" },
};

function playerSvg(d) {
  const W = 1080, H = 1350, st = STAGES[d.stage] || STAGES.new;
  const pct = Math.max(0, Math.min(1, d.goal ? d.goalHave / d.goal : 1));
  const name = fit(String(d.name || "").toUpperCase(), 18), nameSize = name.length <= 9 ? 92 : name.length <= 13 ? 74 : 60;
  const card = "M140 70 H940 L1010 140 V1010 Q1010 1080 950 1115 L560 1290 Q540 1300 520 1290 L130 1115 Q70 1080 70 1010 V140 Z";
  const stat = (x, v, k) => `<text x="${x}" y="1035" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="54" fill="#fff">${esc(v)}</text>
    <text x="${x}" y="1075" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="22" letter-spacing="3" fill="#9DB8FF">${esc(k)}</text>`;
  const photo = d.cutout
    ? `<image href="${d.cutout}" x="330" y="120" width="560" height="660" preserveAspectRatio="xMidYMax meet"/>`
    : d.photo
      ? `<circle cx="600" cy="470" r="238" fill="url(#gold)"/><circle cx="600" cy="470" r="226" fill="#0d2557"/>
         <image href="${d.photo}" x="374" y="244" width="452" height="452" preserveAspectRatio="xMidYMid slice" clip-path="url(#pc)"/>`
      : `<circle cx="600" cy="470" r="220" fill="#ffffff" fill-opacity=".08"/><text x="600" y="550" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="230" fill="#fff" fill-opacity=".85">${initial(d.name)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a3f"/><stop offset="1" stop-color="#050b1e"/></linearGradient>
    <linearGradient id="cardg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F4FB8"/><stop offset=".55" stop-color="#12307a"/><stop offset="1" stop-color="#0d2557"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9A3"/><stop offset=".5" stop-color="#FFD23F"/><stop offset="1" stop-color="#C99A12"/></linearGradient>
    <linearGradient id="stage" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${st.c1}"/><stop offset="1" stop-color="${st.c2}"/></linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".12" stop-color="#0d2557" stop-opacity="0"/><stop offset=".45" stop-color="#0d2557" stop-opacity=".95"/><stop offset="1" stop-color="#0a1d47" stop-opacity="1"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".42" r=".45"><stop offset="0" stop-color="#5E8BFF" stop-opacity=".55"/><stop offset="1" stop-color="#5E8BFF" stop-opacity="0"/></radialGradient>
    <clipPath id="cc"><path d="${card}"/></clipPath>
    <clipPath id="pc"><circle cx="600" cy="470" r="226"/></clipPath>
    <pattern id="stripes" width="38" height="38" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="19" height="38" fill="#fff" fill-opacity=".035"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <path d="${card}" fill="url(#gold)" transform="translate(-14 -14) scale(1.026)"/>
  <g clip-path="url(#cc)">
    <rect width="${W}" height="${H}" fill="url(#cardg)"/><rect width="${W}" height="${H}" fill="url(#stripes)"/>
    <ellipse cx="560" cy="520" rx="420" ry="420" fill="url(#glow)"/>
    ${d.cutout ? photo : ""}
    <rect y="560" width="${W}" height="${H - 560}" fill="url(#fade)"/>
  </g>
  ${d.cutout ? "" : photo}
  <text x="215" y="305" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="150" fill="url(#gold)">${esc(d.ovr)}</text>
  <text x="215" y="365" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="46" letter-spacing="4" fill="#fff">${esc(d.pos)}</text>
  <rect x="155" y="395" width="120" height="3" fill="#FFD23F" fill-opacity=".7"/>
  ${CREST ? `<image href="${CREST}" x="160" y="420" width="110" height="110"/>` : ""}
  ${d.ovrDelta > 0 ? `<text x="215" y="590" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="32" fill="#7CF2A0">+${esc(d.ovrDelta)}</text><text x="215" y="625" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="20" letter-spacing="2" fill="#9DB8FF">BU HAFTA</text>` : ""}
  <text x="540" y="850" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="${nameSize}" letter-spacing="2" fill="#fff">${esc(name)}</text>
  <rect x="${540 - (st.label.length * 17 + 70) / 2}" y="880" rx="30" width="${st.label.length * 17 + 70}" height="58" fill="url(#stage)"/>
  <text x="540" y="920" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="28" letter-spacing="3" fill="${st.text}">${st.label}</text>
  <rect x="150" y="975" width="780" height="2" fill="#fff" fill-opacity=".15"/>
  ${stat(250, "#" + d.rank, "O‘RIN")}${stat(445, fmt(d.weekXp), "HAFTA XP")}${stat(640, fmt(d.totalXp), "JAMI XP")}${stat(835, fmt(d.days), "FAOL KUN")}
  <text x="540" y="1140" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="25" fill="#cfe0ff">${esc(d.goalText)}</text>
  <rect x="290" y="1160" width="500" height="22" rx="11" fill="#ffffff" fill-opacity=".14"/>
  <rect x="290" y="1160" width="${Math.max(22, 500 * pct)}" height="22" rx="11" fill="url(#gold)"/>
  <text x="540" y="1330" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="22" letter-spacing="4" fill="#5E7BD6">ZAMIN FK · ${esc(d.id)}</text>
</svg>`;
}

function vipSvg(d) {
  const W = 1280, H = 800, R = 56, name = fit(d.name, 16), role = fit(d.role, 32);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16213f"/><stop offset=".5" stop-color="#0b1330"/><stop offset="1" stop-color="#05091a"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B8"/><stop offset=".45" stop-color="#FFD23F"/><stop offset="1" stop-color="#B8860B"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="glow" cx=".85" cy=".1" r=".7"><stop offset="0" stop-color="#1F4FB8" stop-opacity=".55"/><stop offset="1" stop-color="#1F4FB8" stop-opacity="0"/></radialGradient>
    <clipPath id="card"><rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="${R}"/></clipPath>
    <clipPath id="ph"><circle cx="230" cy="300" r="118"/></clipPath>
    <pattern id="wave" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 30 Q15 20 30 30 T60 30" fill="none" stroke="#FFD23F" stroke-opacity=".06" stroke-width="2"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#03060f"/>
  <rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="${R + 6}" fill="url(#gold)"/>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glow)"/><rect width="${W}" height="${H}" fill="url(#wave)"/>
    <rect x="-200" y="0" width="900" height="${H}" fill="url(#sheen)" transform="skewX(-25)"/>
    ${CREST ? `<image href="${CREST}" x="820" y="170" width="520" height="520" opacity=".07"/>` : ""}
  </g>
  ${CREST ? `<image href="${CREST}" x="96" y="88" width="78" height="78"/>` : ""}
  <text x="190" y="128" font-family="Montserrat" font-weight="900" font-size="34" letter-spacing="3" fill="#fff">ZAMIN FK</text>
  <text x="190" y="160" font-family="Montserrat" font-weight="700" font-size="20" letter-spacing="6" fill="#9DB8FF">MEMBER CARD</text>
  <rect x="1000" y="96" width="184" height="54" rx="27" fill="url(#gold)"/>
  <text x="1092" y="132" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="26" letter-spacing="6" fill="#0d2557">VIP</text>
  <circle cx="230" cy="300" r="128" fill="url(#gold)"/><circle cx="230" cy="300" r="120" fill="#0d2557"/>
  ${d.photo ? `<image href="${d.photo}" x="112" y="182" width="236" height="236" preserveAspectRatio="xMidYMid slice" clip-path="url(#ph)"/>`
    : `<text x="230" y="340" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="120" fill="url(#gold)">${initial(d.name)}</text>`}
  <text x="400" y="290" font-family="Montserrat" font-weight="900" font-size="${name.length > 12 ? 52 : 64}" fill="#fff">${esc(name)}</text>
  <text x="402" y="336" font-family="Montserrat" font-weight="700" font-size="26" fill="#9DB8FF">${esc(d.username || "")}</text>
  <rect x="400" y="362" width="${role.length * 15.5 + 58}" height="50" rx="25" fill="#ffffff" fill-opacity=".08" stroke="#FFD23F" stroke-opacity=".6" stroke-width="2"/>
  <text x="428" y="396" font-family="Montserrat" font-weight="800" font-size="25" letter-spacing="1" fill="#FFD23F">${esc(role)}</text>
  <rect x="96" y="470" width="1088" height="2" fill="url(#gold)" opacity=".35"/>
  <text x="96" y="532" font-family="Montserrat" font-weight="700" font-size="22" letter-spacing="5" fill="#9DB8FF">BALANS</text>
  <circle cx="122" cy="608" r="26" fill="url(#gold)"/><circle cx="122" cy="608" r="18" fill="none" stroke="#B8860B" stroke-width="3"/>
  <text x="166" y="632" font-family="Montserrat" font-weight="900" font-size="78" fill="#fff">${fmt(d.balance)}<tspan dx="18" font-weight="800" font-size="30" fill="#FFD23F">tanga</tspan></text>
  <text x="1184" y="560" text-anchor="end" font-family="Montserrat" font-weight="700" font-size="20" letter-spacing="5" fill="#9DB8FF">A’ZO RAQAMI</text>
  <text x="1184" y="604" text-anchor="end" font-family="Montserrat" font-weight="800" font-size="36" letter-spacing="4" fill="#fff">${esc(d.id)}</text>
  <text x="1184" y="650" text-anchor="end" font-family="Montserrat" font-weight="700" font-size="20" letter-spacing="3" fill="#5E7BD6">${esc(d.since)}</text>
</svg>`;
}

const render = (svg, width) => new Resvg(svg, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "Montserrat" }, fitTo: { mode: "width", value: width } }).render().asPng();
const ok = () => !!Resvg && FONTS.length === 4;
module.exports = { ok, playerPng: d => render(playerSvg(d), 1080), vipPng: d => render(vipSvg(d), 1280), playerSvg, vipSvg };
