// node render_covers.js  →  exports/cover_01.png … cover_19.png
const {chromium}=require("playwright"),fs=require("fs");
const HERE=__dirname,EXP=HERE+"/exports";
const ASSETS=HERE+"/../06_Episode_06/assets";
const CREST =HERE+"/../12_Reel_Trial_Stadium/assets/crest.png";
const FONT_B=HERE+"/../web/city/assets/fonts/Montserrat_900Black.ttf";
const FONT_R=HERE+"/../web/city/assets/fonts/Montserrat_700Bold.ttf";

const K={
  1:"K1_empty", 2:"K3_stand_empty", 3:"K3_full",    4:"K4b_friends",
  5:"K5_wide",  6:"K6_seat_crowd",  7:"K3_half",    8:"K2_seat",
  9:"K7_pitch", 10:"K5_full",       11:"K7_pitch",  12:"K3_full",
 13:"K4a_father_son",14:"K7_pitch",15:"K4b_friends",16:"K1_empty",
 17:"K4a_father_son",18:"K2_dark", 19:"K3_full"
};

// bright: how visible the stadium image is (0=black, 1=full)
const COVERS=[
  {n:1,  hero:"NOLDAN\nBOSHLANDI",     sub:"Virtual klub tug'ildi",          views:5383,  bright:0.72},
  {n:2,  hero:"STADION\nTANLANDI!",    sub:"74 muxlis. 161 layk. 1 kun.",    views:8780,  bright:0.70},
  {n:3,  hero:"DOSTON\nYUTDI!",         sub:"Himoyachi rasman tanlandi",      views:2255,  bright:0.68},
  {n:4,  hero:"ECHKI\nKELDI",           sub:"Klub brend yuzi aniqlandi",      views:6604,  bright:0.72},
  {n:5,  hero:"HAYDOVCHI\nTOPILDI!",   sub:"Paxtakorga boramiz",             views:4756,  bright:0.68},
  {n:6,  hero:"O'RIN\nO'ZGARADI",       sub:"Bot XP — asosiy jamoa parvozi", views:5407,  bright:0.70},
  {n:7,  hero:"YOSHLAR\nAKADEMIYASI",  sub:"Ovozlarning 69% — siz tandingiz",views:2222,  bright:0.65},
  {n:8,  hero:"JOYINGIZ\nBOR",          sub:"500 muxlisga yetgach yangi imkon",views:2069, bright:0.78},
  {n:9,  hero:"MATCH\nOLDIDAN",         sub:"ZAMIN FK vs STAR BOYS",          views:2593,  bright:0.62},
  {n:10, hero:"ZAMIN FK\nCITY",         sub:"Shahar o'sib bormoqda",          views:1521,  bright:0.68},
  {n:11, hero:"2:2\nSTAR BOYS",         sub:"To'rt gol. Bir kecha.",          views:4327,  bright:0.60},
  {n:12, hero:"STADIONNI\nTO'LDIRING",  sub:"305 / 500 muxlis",               views:11229, bright:0.65},
  {n:13, hero:"YANGI\nMENEJER",         sub:"G'oya sizdan — shahar sizdan",   views:4702,  bright:0.72},
  {n:14, hero:"POZITSIYA\nTANLANG",     sub:"Muxlislar B — izohda o'rningni eg'alla",views:8188,bright:0.60},
  {n:15, hero:"DO'STING\nKIM?",         sub:"Belgilab qo'y",                  views:2679,  bright:0.70},
  {n:16, hero:"G'OYA\nSIZDAN",          sub:"Eng ko'p layk — quriladi",       views:2778,  bright:0.72},
  {n:17, hero:"MURABBIY\nE'LON",        sub:"@hayitboyev.76 — Muxlislar A",   views:5126,  bright:0.72},
  {n:18, hero:"SINOV\nJAMOASI",         sub:"53 885 ko'rish — 4 537 izoh",    views:53885, bright:0.52},
  {n:19, hero:"MUXLISLAR A\nTARKIB",   sub:"11 o'rin. Tarkib tayyor!",        views:556,   bright:0.65},
];

function heroFontSize(hero){
  const max=Math.max(...hero.split("\n").map(l=>l.length));
  if(max<=5)return 192;
  if(max<=7)return 168;
  if(max<=9)return 142;
  if(max<=11)return 118;
  return 100;
}

function viewsFmt(v){
  if(v>=1000)return(Math.round(v/100)/10)+"K";
  return String(v);
}

function makeHtml(c){
  const bg=`${ASSETS}/${K[c.n]}.png`;
  const fh=heroFontSize(c.hero);
  const lines=c.hero.split("\n").length;
  // text block height (hero + divider + sub)
  const textH=lines*fh*1.03+20+56+30;
  // text block starts at y=1300 (lower third, 68% down the frame)
  const textTop=1300;
  const stroke=Math.round(fh*0.055);

  return`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:MZ;font-weight:900;src:url(${FONT_B})}
@font-face{font-family:MZ;font-weight:700;src:url(${FONT_R})}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:#02040c;font-family:MZ,sans-serif}
</style></head><body>

<!-- background: sharp cinematic K-image, stadium VISIBLE -->
<img src="${bg}" style="position:absolute;inset:0;width:1080px;height:1920px;
  object-fit:cover;filter:brightness(${c.bright}) saturate(1.3) contrast(1.05)">

<!-- bottom gradient: stadium → text area -->
<div style="position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(2,4,12,0.0)  0%,
  rgba(2,4,12,0.0)  38%,
  rgba(2,4,12,0.3)  52%,
  rgba(2,4,12,0.72) 60%,
  rgba(2,4,12,0.95) 72%,
  rgba(2,4,12,1.0)  82%)"></div>

<!-- very subtle top-edge vignette for crest area -->
<div style="position:absolute;top:0;left:0;right:0;height:280px;
  background:linear-gradient(180deg,rgba(2,4,12,.62) 0%,transparent 100%)"></div>

<!-- film grain -->
<canvas id="gr" width="1080" height="1920" style="position:absolute;inset:0;opacity:0.05;pointer-events:none"></canvas>

<!-- blue accent bar: TOP -->
<div style="position:absolute;top:0;left:0;right:0;height:7px;
  background:linear-gradient(90deg,#0D2557 0%,#1F4FB8 50%,#0D2557 100%);
  box-shadow:0 2px 32px rgba(31,79,184,.75)"></div>

<!-- crest top-center -->
<img src="${CREST}" style="position:absolute;top:52px;left:50%;transform:translateX(-50%);
  height:116px;filter:drop-shadow(0 0 20px rgba(31,79,184,.6)) drop-shadow(0 4px 14px rgba(0,0,0,.85))">

<!-- hero text: left-aligned, lower third -->
<div style="position:absolute;top:${textTop}px;left:64px;right:64px;">

  <!-- headline: .hd b style from R12 — gold + navy 3D shadow -->
  <div style="font-size:${fh}px;font-weight:900;line-height:1.03;
    color:#FFD23F;
    text-shadow:0 ${Math.round(fh*0.055)}px 0 #0D2557,0 ${Math.round(fh*0.1)}px 32px rgba(0,0,0,.95);
    -webkit-text-stroke:${stroke}px #0D2557;paint-order:stroke fill;
    letter-spacing:-1px">${c.hero.replace(/\n/g,"<br>")}</div>

  <!-- gold divider line -->
  <div style="margin:18px 0 16px;width:72px;height:5px;
    background:#FFD23F;box-shadow:0 0 16px rgba(255,210,63,.5)"></div>

  <!-- sub text -->
  <div style="font-size:38px;color:rgba(159,182,255,0.85);font-weight:700;
    letter-spacing:0.5px;line-height:1.35;
    text-shadow:0 3px 10px rgba(0,0,0,.9)">${c.sub}</div>

</div>

<!-- bottom bar: views + handle -->
<div style="position:absolute;bottom:52px;left:64px;right:64px;
  display:flex;align-items:center;justify-content:space-between">

  <div style="font-size:40px;color:#FFD23F;font-weight:900;
    text-shadow:0 3px 10px rgba(0,0,0,.9)">
    <span style="font-size:52px">${viewsFmt(c.views)}</span>
    <span style="font-size:32px;color:rgba(159,182,255,.7);font-weight:700"> ko'rish</span>
  </div>

  <div style="font-size:38px;color:rgba(255,255,255,.65);font-weight:900;
    letter-spacing:2px;text-shadow:0 3px 10px rgba(0,0,0,.9)">
    @<span style="color:#FFD23F">fk_zamin</span>
  </div>
</div>

<!-- blue accent bar: BOTTOM -->
<div style="position:absolute;bottom:0;left:0;right:0;height:7px;
  background:linear-gradient(90deg,#0D2557 0%,#1F4FB8 50%,#0D2557 100%);
  box-shadow:0 -2px 32px rgba(31,79,184,.75)"></div>

<script>
(function(){
  const cv=document.getElementById("gr"),ctx=cv.getContext("2d");
  const id=ctx.createImageData(1080,1920);const d=id.data;
  for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}
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
    process.stdout.write(`✓ ${c.n}/19 `);
  }
  if(fs.existsSync(HERE+"/current.html"))fs.unlinkSync(HERE+"/current.html");
  await b.close();
  console.log("\nDone →",EXP);
})();
