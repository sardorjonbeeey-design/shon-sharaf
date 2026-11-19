// node render_covers.js  →  exports/cover_01.png … cover_19.png
// Layout: saveo.house format — full-bleed scene, huge episode# top-left, title below
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

const COVERS=[
  {n:1,  label:"KUN",   num:"1",    title:"NOLDAN\nBOSHLANDI",   accent:"#FF6B9D", bright:0.72},
  {n:2,  label:"KUN",   num:"2",    title:"STADION\nTANLANDI!",  accent:"#FF8C42", bright:0.70},
  {n:3,  label:"KUN",   num:"3",    title:"DOSTON\nYUTDI!",       accent:"#00C85A", bright:0.68},
  {n:4,  label:"KUN",   num:"3+",   title:"ECHKI\nKELDI",         accent:"#FFD23F", bright:0.72},
  {n:5,  label:"KUN",   num:"4",    title:"HAYDOVCHI\nTOPILDI!",  accent:"#4A9EFF", bright:0.68},
  {n:6,  label:"",      num:"XP",   title:"O'RIN\nO'ZGARADI",     accent:"#A855F7", bright:0.70},
  {n:7,  label:"KUN",   num:"5",    title:"YOSHLAR\nAKADEMIYASI", accent:"#34D399", bright:0.65},
  {n:8,  label:"KUN",   num:"6",    title:"JOYINGIZ\nBOR",         accent:"#60A5FA", bright:0.78},
  {n:9,  label:"KUN",   num:"8",    title:"MATCH\nOLDIDAN",        accent:"#F87171", bright:0.62},
  {n:10, label:"KUN",   num:"9",    title:"ZAMIN FK\nCITY",        accent:"#FFD23F", bright:0.68},
  {n:11, label:"",      num:"2:2",  title:"STAR BOYS",             accent:"#F87171", bright:0.60},
  {n:12, label:"REEL",  num:"12",   title:"STADIONNI\nTO'LDIRING", accent:"#FFD23F", bright:0.65},
  {n:13, label:"REEL",  num:"13",   title:"YANGI\nMENEJER",        accent:"#A855F7", bright:0.72},
  {n:14, label:"REEL",  num:"16",   title:"POZITSIYA\nTANLANG",    accent:"#4A9EFF", bright:0.60},
  {n:15, label:"REEL",  num:"14",   title:"DO'STING\nKIM?",        accent:"#FF6B9D", bright:0.70},
  {n:16, label:"KUN",   num:"11",   title:"G'OYA\nSIZDAN",         accent:"#FFD23F", bright:0.72},
  {n:17, label:"REEL",  num:"17",   title:"MURABBIY\nE'LON",        accent:"#00C85A", bright:0.72},
  {n:18, label:"VIRAL", num:"🔥",   title:"SINOV\nJAMOASI",        accent:"#FF4500", bright:0.52},
  {n:19, label:"REEL",  num:"18",   title:"MUXLISLAR A\nTARKIB",   accent:"#FFD23F", bright:0.65},
];

function numSize(num){
  const n=num.replace(/[^a-zA-Z0-9]/g,"").length;
  if(n<=1)return 240; if(n<=2)return 195; return 155;
}
function titleSize(title){
  const max=Math.max(...title.split("\n").map(l=>l.length));
  if(max<=5)return 112; if(max<=7)return 96; if(max<=9)return 80;
  if(max<=12)return 68; return 58;
}

function makeHtml(c){
  const bg=`${ASSETS}/${K[c.n]}.png`;
  const ns=numSize(c.num), ts=titleSize(c.title);
  const numTop=c.label?118:88;
  const titleTop=numTop+Math.round(ns*0.9)+16;

  return`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:MZ;font-weight:900;src:url(${FONT_B})}
@font-face{font-family:MZ;font-weight:700;src:url(${FONT_R})}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:#02040c;font-family:MZ,sans-serif}
</style></head><body>

<img src="${bg}" style="position:absolute;inset:0;width:1080px;height:1920px;
  object-fit:cover;filter:brightness(${c.bright}) saturate(1.25) contrast(1.06)">

<div style="position:absolute;inset:0;background:linear-gradient(100deg,
  rgba(2,4,12,.80) 0%,rgba(2,4,12,.30) 32%,rgba(2,4,12,.0) 55%)"></div>

<div style="position:absolute;bottom:0;left:0;right:0;height:360px;
  background:linear-gradient(0deg,rgba(2,4,12,.55) 0%,transparent 100%)"></div>

<canvas id="gr" width="1080" height="1920" style="position:absolute;inset:0;opacity:0.045;pointer-events:none"></canvas>

<div style="position:absolute;top:0;left:0;right:0;height:7px;
  background:linear-gradient(90deg,#0D2557,#1F4FB8,#0D2557);
  box-shadow:0 2px 32px rgba(31,79,184,.75)"></div>
<div style="position:absolute;bottom:0;left:0;right:0;height:7px;
  background:linear-gradient(90deg,#0D2557,#1F4FB8,#0D2557);
  box-shadow:0 -2px 32px rgba(31,79,184,.75)"></div>

<div style="position:absolute;top:52px;left:60px;
  font-size:22px;font-weight:900;color:rgba(255,255,255,.45);letter-spacing:7px;
  text-shadow:0 2px 8px rgba(0,0,0,.8)">ZAMIN FK</div>

${c.label?`<div style="position:absolute;top:88px;left:62px;
  font-size:40px;font-weight:900;color:#fff;letter-spacing:3px;
  text-shadow:0 3px 12px rgba(0,0,0,.9)">${c.label}</div>`:""}

<div style="position:absolute;top:${numTop}px;left:52px;
  font-size:${ns}px;font-weight:900;line-height:0.88;
  color:${c.accent};
  text-shadow:0 ${Math.round(ns*0.05)}px 0 #0D2557,0 ${Math.round(ns*0.1)}px 36px rgba(0,0,0,.95);
  -webkit-text-stroke:${Math.round(ns*0.05)}px #0D2557;paint-order:stroke fill">${c.num}</div>

<div style="position:absolute;top:${titleTop}px;left:60px;
  font-size:${ts}px;font-weight:900;line-height:1.05;color:#fff;
  text-shadow:0 4px 0 #0D2557,0 8px 28px rgba(0,0,0,.9);
  -webkit-text-stroke:${Math.round(ts*0.04)}px #0D2557;paint-order:stroke fill">${c.title.replace(/\n/g,"<br>")}</div>

<img src="${CREST}" style="position:absolute;top:44px;right:52px;
  height:100px;opacity:0.85;
  filter:drop-shadow(0 0 16px rgba(31,79,184,.5)) drop-shadow(0 4px 10px rgba(0,0,0,.8))">

<div style="position:absolute;bottom:22px;left:60px;
  font-size:36px;color:rgba(255,255,255,.55);font-weight:900;letter-spacing:2px;
  text-shadow:0 2px 8px rgba(0,0,0,.8)">@<span style="color:${c.accent}">fk_zamin</span></div>

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
    fs.writeFileSync(HERE+"/current.html",makeHtml(c),"utf8");
    await p.goto("file://"+HERE+"/current.html");
    await p.evaluate(()=>document.fonts.ready);
    await p.waitForTimeout(400);
    await p.screenshot({path:`${EXP}/cover_${String(c.n).padStart(2,"0")}.png`,type:"png"});
    process.stdout.write(`✓${c.n} `);
  }
  if(fs.existsSync(HERE+"/current.html"))fs.unlinkSync(HERE+"/current.html");
  await b.close();
  console.log("\nDone →",EXP);
})();
