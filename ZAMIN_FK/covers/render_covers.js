// node render_covers.js  →  exports/cover_01.png … cover_19.png
const {chromium}=require("playwright"),fs=require("fs"),path=require("path");
const HERE=__dirname,EXP=HERE+"/exports";

const CREST="../../ZAMIN_FK/12_Reel_Trial_Stadium/assets/crest.png";
const BG="../../ZAMIN_FK/17_Reel_Murabbiy_Elon/build/top/top.jpg";
const FONT_B="../../ZAMIN_FK/../web/city/assets/fonts/Montserrat_900Black.ttf";
const FONT_R="../../ZAMIN_FK/../web/city/assets/fonts/Montserrat_700Bold.ttf";

const COVERS=[
  {n:1,  date:"07.11.2026", badge:"1-KUN",     hero:"NOLDAN\nBOSHLANDI",    sub:"Zamin FK — virtual klub tug'ildi",   accent:"#FFD23F", views:5383,   emoji:"🏗️"},
  {n:2,  date:"08.11.2026", badge:"2-KUN",     hero:"STADION\nTANLANDI!",   sub:"74 muxlis. 161 layk. 1 kun.",        accent:"#FFD23F", views:8780,   emoji:"🏟️"},
  {n:3,  date:"08.11.2026", badge:"3-KUN",     hero:"DOSTON\nYUTDI!",       sub:"Himoyachi rasman tanlandi",          accent:"#00C85A", views:2255,   emoji:"⚽"},
  {n:4,  date:"09.11.2026", badge:"3-KUN+",    hero:"ECHKI\nKELDI",         sub:"Klub brend yuzi aniqlandi 🐐",       accent:"#FFD23F", views:6604,   emoji:"🐐"},
  {n:5,  date:"09.11.2026", badge:"4-KUN",     hero:"HAYDOVCHI\nTOPILDI!",  sub:"Paxtakorga boramiz",                accent:"#4A9EFF", views:4756,   emoji:"🚌"},
  {n:6,  date:"11.11.2026", badge:"XP",        hero:"O'RIN\nO'ZGARADI",     sub:"Bot XP — asosiy jamoa parvozi",      accent:"#9B59B6", views:5407,   emoji:"⚡"},
  {n:7,  date:"11.11.2026", badge:"5-KUN",     hero:"YOSHLAR\nAKADEMIYASI", sub:"Ovozlarning 69% — siz tandingiz",   accent:"#00C85A", views:2222,   emoji:"🌟"},
  {n:8,  date:"12.11.2026", badge:"6-KUN",     hero:"JOYINGIZ\nBOR",        sub:"500 muxlisga yetgach yangi imkon",   accent:"#1F9EFF", views:2069,   emoji:"💙"},
  {n:9,  date:"13.11.2026", badge:"8-KUN",     hero:"MATCH\nOLDIDAN",       sub:"ZAMIN FK vs STAR BOYS",             accent:"#E63946", views:2593,   emoji:"🆚"},
  {n:10, date:"14.11.2026", badge:"9-KUN",     hero:"ZAMIN FK\nCITY",       sub:"Shahar o'sib bormoqda",             accent:"#FFD23F", views:1521,   emoji:"🏙️"},
  {n:11, date:"14.11.2026", badge:"MATCH",     hero:"2:2\nSTAR BOYS",       sub:"To'rt gol. Bir kecha.",             accent:"#E63946", views:4327,   emoji:"⚽"},
  {n:12, date:"15.11.2026", badge:"REEL 12",   hero:"STADIONNI\nTO'LDIRING", sub:"305 / 500 muxlis",                 accent:"#FFD23F", views:11229,  emoji:"🏟️"},
  {n:13, date:"15.11.2026", badge:"10-KUN",    hero:"YANGI\nMENEJER",       sub:"G'oya sizdan — shahar sizdan",       accent:"#9B59B6", views:4702,   emoji:"🪑"},
  {n:14, date:"16.11.2026", badge:"REEL 16",   hero:"POZITSIYA\nTANLANG",   sub:"Muxlislar B — izohda o'rningni eg'alla", accent:"#4A9EFF", views:8188, emoji:"📋"},
  {n:15, date:"16.11.2026", badge:"REEL 14",   hero:"DO'STING\nKIM?",       sub:"Belgilab qo'y 👇",                  accent:"#E1306C", views:2679,   emoji:"👀"},
  {n:16, date:"16.11.2026", badge:"11-KUN",    hero:"G'OYA\nSIZDAN",        sub:"Eng ko'p layk — quriladi",          accent:"#FFD23F", views:2778,   emoji:"💡"},
  {n:17, date:"17.11.2026", badge:"REEL 17",   hero:"MURABBIY\nE'LON",      sub:"@hayitboyev.76 — Muxlislar A",      accent:"#00C85A", views:5126,   emoji:"📋"},
  {n:18, date:"18.11.2026", badge:"VIRAL 🔥",  hero:"SINOV\nJAMOASI",       sub:"53 885 ko'rish · 4 537 izoh",       accent:"#FF6B00", views:53885,  emoji:"🔥"},
  {n:19, date:"19.11.2026", badge:"REEL 18",   hero:"MUXLISLAR A\nTARKIB",  sub:"11 o'rin. Tarkib tayyor!",          accent:"#FFD23F", views:556,    emoji:"✅"},
];

function fontSize(hero){
  const max=Math.max(...hero.split("\n").map(l=>l.replace(/\s/g,"").length));
  if(max<=5)return 168;
  if(max<=7)return 150;
  if(max<=9)return 128;
  if(max<=11)return 108;
  return 90;
}

function subTop(hero,fs){
  const lines=hero.split("\n").length;
  return 460+lines*fs*0.94+72;
}

function makeHtml(c){
  const fs_h=fontSize(c.hero),st=subTop(c.hero,fs_h);
  const heroHtml=c.hero.replace(/\n/g,"<br>");
  const viewsStr=c.views>=1000?Math.round(c.views/100)/10+"K ko'rish":c.views+" ko'rish";
  return`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:MZ;font-weight:900;src:url(${FONT_B})}
@font-face{font-family:MZ;font-weight:700;src:url(${FONT_R})}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:#020810;font-family:MZ,sans-serif}
</style></head><body>
<img src="${BG}" style="position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover;filter:blur(5px) brightness(0.25) saturate(0.7);transform:scale(1.1)">
<div style="position:absolute;inset:0;background:linear-gradient(160deg,${c.accent}18 0%,rgba(2,8,16,0.4) 45%,rgba(2,8,16,0.92) 100%)"></div>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 75% 60% at 50% 48%,rgba(2,8,16,0) 0%,rgba(2,8,16,0.55) 70%,rgba(2,8,16,0.97) 100%)"></div>
<div style="position:absolute;top:0;left:0;right:0;height:12px;background:${c.accent};box-shadow:0 0 40px ${c.accent}99"></div>
<img src="${CREST}" style="position:absolute;top:70px;left:50%;transform:translateX(-50%);height:165px;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.6))">
<div style="position:absolute;top:265px;left:50%;transform:translateX(-50%);font-size:28px;color:rgba(255,255,255,0.35);letter-spacing:7px;white-space:nowrap;font-weight:900">${c.date}</div>
<div style="position:absolute;top:316px;left:50%;transform:translateX(-50%);background:${c.accent};color:#0D2557;font-size:33px;font-weight:900;padding:12px 38px;border-radius:50px;letter-spacing:5px;white-space:nowrap;box-shadow:0 6px 24px ${c.accent}66">${c.badge}</div>
<div style="position:absolute;top:460px;left:60px;right:60px;text-align:center;font-size:${fs_h}px;font-weight:900;line-height:0.93;color:#fff;-webkit-text-stroke:5px ${c.accent};paint-order:stroke fill;text-shadow:0 14px 50px rgba(0,0,0,0.9)">${heroHtml}</div>
<div style="position:absolute;top:${st}px;left:90px;right:90px;text-align:center;font-size:44px;color:rgba(255,255,255,0.6);letter-spacing:1px;line-height:1.35;font-weight:700">${c.sub}</div>
<div style="position:absolute;bottom:260px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.07);border:2px solid ${c.accent}55;border-radius:50px;padding:14px 48px;font-size:38px;color:${c.accent};font-weight:900;white-space:nowrap;letter-spacing:1px">${viewsStr}</div>
<div style="position:absolute;bottom:120px;left:50%;transform:translateX(-50%);font-size:50px;color:rgba(255,255,255,0.75);font-weight:700;letter-spacing:3px;white-space:nowrap">@<span style="color:${c.accent}">fk_zamin</span></div>
<div style="position:absolute;bottom:0;left:0;right:0;height:12px;background:${c.accent};box-shadow:0 0 40px ${c.accent}99"></div>
</body></html>`;
}

(async()=>{
  fs.mkdirSync(EXP,{recursive:true});
  const b=await chromium.launch({args:["--allow-file-access-from-files","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
  const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  p.on("pageerror",e=>console.error("[err]",String(e).slice(0,200)));
  for(const c of COVERS){
    const html=makeHtml(c);
    const tmp=HERE+"/current.html";
    fs.writeFileSync(tmp,html,"utf8");
    await p.goto("file://"+tmp);
    await p.evaluate(()=>document.fonts.ready);
    await p.waitForTimeout(300);
    const out=`${EXP}/cover_${String(c.n).padStart(2,"0")}.png`;
    await p.screenshot({path:out,type:"png"});
    console.log(`✓ cover ${c.n}/${COVERS.length}: ${c.hero.replace(/\n/," / ")}`);
  }
  fs.unlinkSync(HERE+"/current.html");
  await b.close();
  console.log("Done →",EXP);
})();
