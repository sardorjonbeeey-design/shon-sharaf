// node render_covers.js  →  exports/cover_01.png … cover_19.png
// ZFK cinematic cover system — matches EP06/R12 visual language
const {chromium}=require("playwright"),fs=require("fs"),path=require("path");
const HERE=__dirname,EXP=HERE+"/exports";

const ASSETS=HERE+"/../06_Episode_06/assets";
const CREST =HERE+"/../12_Reel_Trial_Stadium/assets/crest.png";
const FONT_B=HERE+"/../web/city/assets/fonts/Montserrat_900Black.ttf";
const FONT_R=HERE+"/../web/city/assets/fonts/Montserrat_700Bold.ttf";

// K-image assignment per cover
const K={
  1:"K1_empty", 2:"K3_stand_empty", 3:"K3_full",   4:"K4b_friends",
  5:"K5_wide",  6:"K6_seat_crowd",  7:"K3_half",   8:"K2_seat",
  9:"K7_pitch",10:"K5_full",        11:"K7_pitch",  12:"K3_full",
 13:"K4a_father_son",14:"K7_pitch",15:"K4b_friends",16:"K1_empty",
 17:"K4a_father_son",18:"K2_dark", 19:"K3_full"
};

const COVERS=[
  {n:1,  ep:"01",   hero:"NOLDAN\nBOSHLANDI",      sub:"Zamin FK — virtual klub tug'ildi",       views:5383,  bright:0.42},
  {n:2,  ep:"02",   hero:"STADION\nTANLANDI!",     sub:"74 muxlis. 161 layk. 1 kun.",            views:8780,  bright:0.45},
  {n:3,  ep:"03",   hero:"DOSTON\nYUTDI!",          sub:"Himoyachi rasman tanlandi",              views:2255,  bright:0.38},
  {n:4,  ep:"03+",  hero:"ECHKI\nKELDI",            sub:"Klub brend yuzi aniqlandi",              views:6604,  bright:0.46},
  {n:5,  ep:"04",   hero:"HAYDOVCHI\nTOPILDI!",    sub:"Paxtakorga boramiz",                     views:4756,  bright:0.40},
  {n:6,  ep:"XP",   hero:"O'RIN\nO'ZGARADI",       sub:"Bot XP — asosiy jamoa parvozi",          views:5407,  bright:0.44},
  {n:7,  ep:"05",   hero:"YOSHLAR\nAKADEMIYASI",   sub:"Ovozlarning 69% — siz tandingiz",        views:2222,  bright:0.38},
  {n:8,  ep:"06",   hero:"JOYINGIZ\nBOR",           sub:"500 muxlisga yetgach yangi imkon",       views:2069,  bright:0.50},
  {n:9,  ep:"08",   hero:"MATCH\nOLDIDAN",          sub:"ZAMIN FK vs STAR BOYS",                  views:2593,  bright:0.36},
  {n:10, ep:"09",   hero:"ZAMIN FK\nCITY",          sub:"Shahar o'sib bormoqda",                  views:1521,  bright:0.40},
  {n:11, ep:"10",   hero:"2:2\nSTAR BOYS",          sub:"To'rt gol. Bir kecha.",                  views:4327,  bright:0.35},
  {n:12, ep:"R12",  hero:"STADIONNI\nTO'LDIRING",   sub:"305 / 500 muxlis",                       views:11229, bright:0.38},
  {n:13, ep:"R13",  hero:"YANGI\nMENEJER",          sub:"G'oya sizdan — shahar sizdan",           views:4702,  bright:0.46},
  {n:14, ep:"R16",  hero:"POZITSIYA\nTANLANG",      sub:"Muxlislar B — izohda o'rningni eg'alla", views:8188,  bright:0.35},
  {n:15, ep:"R14",  hero:"DO'STING\nKIM?",          sub:"Belgilab qo'y",                          views:2679,  bright:0.44},
  {n:16, ep:"R11",  hero:"G'OYA\nSIZDAN",           sub:"Eng ko'p layk — quriladi",               views:2778,  bright:0.42},
  {n:17, ep:"R17",  hero:"MURABBIY\nE'LON",         sub:"@hayitboyev.76 — Muxlislar A",           views:5126,  bright:0.44},
  {n:18, ep:"VIRAL",hero:"SINOV\nJAMOASI",          sub:"53 885 ko'rish — 4 537 izoh",            views:53885, bright:0.30},
  {n:19, ep:"R18",  hero:"MUXLISLAR A\nTARKIB",    sub:"11 o'rin. Tarkib tayyor!",               views:556,   bright:0.40},
];

function heroFontSize(hero){
  const max=Math.max(...hero.split("\n").map(l=>l.length));
  if(max<=5)return 160;
  if(max<=7)return 140;
  if(max<=9)return 118;
  if(max<=11)return 98;
  return 84;
}

function makeHtml(c){
  const bg=`${ASSETS}/${K[c.n]}.png`;
  const fh=heroFontSize(c.hero);
  const heroHtml=c.hero.split("\n").map(l=>`<b>${l}</b>`).join("");
  const viewsStr=c.views>=1000?(Math.round(c.views/100)/10)+"K ko'rish":c.views+" ko'rish";
  const lineH=fh*1.05;
  const lines=c.hero.split("\n").length;
  const heroTop=Math.round(1920*0.30);
  const subTop=heroTop+lines*lineH+40;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:MZ;font-weight:900;src:url(${FONT_B})}
@font-face{font-family:MZ;font-weight:700;src:url(${FONT_R})}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:#02040c;font-family:MZ,sans-serif}
</style></head><body>

<!-- background: sharp cinematic K-image -->
<img src="${bg}" style="position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover;
  filter:brightness(${c.bright}) saturate(1.25) contrast(1.08)">

<!-- top vignette / sky fade -->
<div style="position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(2,4,12,.88) 0%,
  rgba(2,4,12,.18) 28%,
  rgba(2,4,12,.0)  48%,
  rgba(2,4,12,.0)  58%,
  rgba(2,4,12,.55) 80%,
  rgba(2,4,12,.96) 100%)"></div>

<!-- horizontal blue cinematic bars -->
<div style="position:absolute;top:0;left:0;right:0;height:8px;
  background:linear-gradient(90deg,#0D2557,#1F4FB8,#0D2557);
  box-shadow:0 0 36px rgba(31,79,184,.8)"></div>
<div style="position:absolute;bottom:0;left:0;right:0;height:8px;
  background:linear-gradient(90deg,#0D2557,#1F4FB8,#0D2557);
  box-shadow:0 -4px 36px rgba(31,79,184,.8)"></div>

<!-- film grain -->
<canvas id="gr" width="1080" height="1920" style="position:absolute;inset:0;opacity:0.055;pointer-events:none"></canvas>

<!-- episode badge -->
<div style="position:absolute;top:60px;left:60px;
  background:rgba(5,14,40,.92);border:4px solid #FFD23F;border-radius:18px;
  padding:10px 28px;font-size:34px;color:#FFD23F;font-weight:900;
  letter-spacing:4px;white-space:nowrap;
  box-shadow:0 0 28px rgba(255,210,63,.3)">${c.ep}</div>

<!-- crest -->
<img src="${CREST}" style="position:absolute;top:52px;left:50%;transform:translateX(-50%);
  height:144px;filter:drop-shadow(0 0 24px rgba(31,79,184,.7)) drop-shadow(0 6px 18px rgba(0,0,0,.8))">

<!-- hero headline - .hd b style from R12 -->
<div style="position:absolute;top:${heroTop}px;left:52px;right:52px;text-align:center;
  font-weight:900;line-height:1.03;font-size:${fh}px;
  color:#FFD23F;text-shadow:0 6px 0 #0D2557,0 10px 30px #000;
  -webkit-text-stroke:${Math.round(fh*0.062)}px #0D2557;paint-order:stroke fill">${heroHtml}</div>

<!-- sub text - .hd small style -->
<div style="position:absolute;top:${subTop}px;left:72px;right:72px;text-align:center;
  font-size:40px;color:rgba(159,182,255,0.9);letter-spacing:1px;
  line-height:1.4;font-weight:700;text-shadow:0 4px 14px #000">${c.sub}</div>

<!-- views pill - .pill style from R12 -->
<div style="position:absolute;bottom:200px;left:50%;transform:translateX(-50%);
  background:rgba(5,14,40,.88);border:5px solid #FFD23F;border-radius:26px;
  padding:14px 44px;white-space:nowrap;
  box-shadow:0 0 34px rgba(255,210,63,.35)">
  <span style="font-size:44px;color:#fff;font-weight:900">${viewsStr}</span>
</div>

<!-- handle -->
<div style="position:absolute;bottom:92px;left:50%;transform:translateX(-50%);
  font-size:46px;color:rgba(255,255,255,.7);font-weight:900;letter-spacing:3px;
  white-space:nowrap;text-shadow:0 4px 14px #000">@<span style="color:#FFD23F">fk_zamin</span></div>

<script>
(function(){
  const cv=document.getElementById("gr"),ctx=cv.getContext("2d");
  const id=ctx.createImageData(1080,1920);const d=id.data;
  for(let i=0;i<d.length;i+=4){
    const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;
  }
  ctx.putImageData(id,0,0);
})();
</script>
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
    await p.waitForTimeout(400);
    const out=`${EXP}/cover_${String(c.n).padStart(2,"0")}.png`;
    await p.screenshot({path:out,type:"png"});
    console.log(`✓ ${c.n}/19: ${c.hero.replace(/\n/," / ")}`);
  }
  if(fs.existsSync(HERE+"/current.html"))fs.unlinkSync(HERE+"/current.html");
  await b.close();
  console.log("Done →",EXP);
})();
