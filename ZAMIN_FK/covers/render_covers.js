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

// Center element: thematic icon per cover
// cy = vertical center % of frame (0-100)
function centerEl(c){
  const style=(emoji,size=220,cy=46,glow="rgba(255,210,63,.55)",cx=50)=>
    `<div style="position:absolute;top:${cy}%;left:${cx}%;
      transform:translate(-50%,-50%);font-size:${size}px;line-height:1;
      filter:drop-shadow(0 0 44px ${glow}) drop-shadow(0 12px 24px rgba(0,0,0,.85))">${emoji}</div>`;

  // CSS tactical board (green mini-pitch with player dots)
  const tacticBoard=`
<div style="position:absolute;top:44%;left:68%;transform:translate(-50%,-50%);
  width:280px;height:380px;background:rgba(14,120,52,.88);border-radius:16px;
  border:3px solid rgba(255,210,63,.6);box-shadow:0 0 48px rgba(0,0,0,.8);overflow:hidden">
  <!-- pitch lines -->
  <div style="position:absolute;top:50%;left:0;right:0;height:2px;background:rgba(255,255,255,.25)"></div>
  <div style="position:absolute;top:50%;left:50%;transform:translateX(-50%);
    width:70px;height:70px;border-radius:50%;border:2px solid rgba(255,255,255,.2)"></div>
  <!-- 4-3-3 formation dots: GK, 4 DEF, 3 MID, 3 FWD -->
  <!-- GK -->
  <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);
    width:22px;height:22px;border-radius:50%;background:#FFD23F;border:2px solid #fff"></div>
  <!-- DEF -->
  ${[18,36,52,70].map(l=>`<div style="position:absolute;bottom:80px;left:${l}%;
    transform:translateX(-50%);width:20px;height:20px;border-radius:50%;
    background:#fff;border:2px solid #FFD23F"></div>`).join("")}
  <!-- MID -->
  ${[26,50,74].map(l=>`<div style="position:absolute;bottom:168px;left:${l}%;
    transform:translateX(-50%);width:20px;height:20px;border-radius:50%;
    background:#fff;border:2px solid #FFD23F"></div>`).join("")}
  <!-- FWD -->
  ${[22,50,78].map(l=>`<div style="position:absolute;bottom:252px;left:${l}%;
    transform:translateX(-50%);width:20px;height:20px;border-radius:50%;
    background:#FFD23F;border:2px solid #fff"></div>`).join("")}
</div>`;

  // CSS scoreboard
  const score22=`
<div style="position:absolute;top:42%;left:66%;transform:translate(-50%,-50%);
  display:flex;align-items:center;gap:14px">
  <div style="font-family:MZ,sans-serif;font-size:200px;font-weight:900;color:#fff;
    text-shadow:0 8px 0 #0D2557,0 16px 40px rgba(0,0,0,.95);
    -webkit-text-stroke:8px #0D2557;paint-order:stroke fill">2</div>
  <div style="font-family:MZ,sans-serif;font-size:160px;font-weight:900;color:#F87171;
    text-shadow:0 8px 0 #0D2557,0 16px 40px rgba(0,0,0,.9)">:</div>
  <div style="font-family:MZ,sans-serif;font-size:200px;font-weight:900;color:#fff;
    text-shadow:0 8px 0 #0D2557,0 16px 40px rgba(0,0,0,.95);
    -webkit-text-stroke:8px #0D2557;paint-order:stroke fill">2</div>
</div>`;

  // mini XI formation grid (cover 19)
  const miniXI=`
<div style="position:absolute;top:40%;left:68%;transform:translate(-50%,-50%);
  width:260px;height:380px;background:rgba(14,120,52,.85);border-radius:14px;
  border:3px solid rgba(255,210,63,.5);box-shadow:0 0 48px rgba(0,0,0,.8);padding:12px 8px">
  <div style="font-family:MZ,sans-serif;font-size:18px;color:#FFD23F;font-weight:900;
    text-align:center;letter-spacing:3px;margin-bottom:8px">MUXLISLAR A</div>
  ${[["ST"],["RW","CAM","LW"],["CDM","CM"],["RB","CB","CB","LB"],["GK"]].map((row,ri)=>`
  <div style="display:flex;justify-content:center;gap:6px;margin:${ri===0?8:6}px 0">
    ${row.map(p=>`<div style="width:42px;text-align:center">
      <div style="width:28px;height:28px;border-radius:50%;background:#FFD23F;
        border:2px solid #fff;margin:0 auto 2px"></div>
      <div style="font-family:MZ,sans-serif;font-size:11px;color:rgba(255,255,255,.8);
        font-weight:700">${p}</div>
    </div>`).join("")}
  </div>`).join("")}
</div>`;

  // CSS changing room board (cover 17 coach)
  const coachBoard=`
<div style="position:absolute;top:42%;left:68%;transform:translate(-50%,-50%);
  width:300px;height:280px;background:rgba(10,20,60,.9);border-radius:14px;
  border:4px solid #FFD23F;box-shadow:0 0 48px rgba(255,210,63,.3),0 0 80px rgba(0,0,0,.8);
  padding:20px 24px">
  <div style="font-family:MZ,sans-serif;font-size:18px;color:#9fb6ff;font-weight:900;
    letter-spacing:4px;margin-bottom:10px">MURABBIY</div>
  <div style="font-family:MZ,sans-serif;font-size:28px;color:#FFD23F;font-weight:900;
    margin-bottom:16px">@hayitboyev.76</div>
  ${["HIMOYA: 4-1","O'RTA: 3","HUJUM: 3","TAKTIKA: 4-3-3"].map(l=>`
  <div style="font-family:MZ,sans-serif;font-size:20px;color:rgba(255,255,255,.75);
    font-weight:700;margin:6px 0;border-left:3px solid #FFD23F;padding-left:10px">${l}</div>`).join("")}
</div>`;

  // goat special: large, center-right, white/ethereal glow (different from other icons)
  const goatSpecial=`
<div style="position:absolute;top:44%;left:66%;transform:translate(-50%,-50%);
  font-size:300px;line-height:1;
  filter:drop-shadow(0 0 80px rgba(255,255,255,.6)) drop-shadow(0 0 160px rgba(255,210,63,.35))
         drop-shadow(0 16px 32px rgba(0,0,0,.9))">🐐</div>
<div style="position:absolute;top:66%;left:66%;transform:translate(-50%,-50%);
  font-family:MZ,sans-serif;font-size:36px;font-weight:900;color:#FFD23F;
  letter-spacing:6px;text-shadow:0 4px 0 #0D2557,0 8px 20px rgba(0,0,0,.9);
  -webkit-text-stroke:2px #0D2557;paint-order:stroke fill">ZAMIN FK MASKOTI</div>`;

  // progress bar (cover 12)
  const progress=`
<div style="position:absolute;top:44%;left:66%;transform:translate(-50%,-50%);
  width:300px">
  <div style="font-family:MZ,sans-serif;font-size:88px;font-weight:900;color:#FFD23F;
    text-align:center;text-shadow:0 6px 0 #0D2557,0 10px 30px rgba(0,0,0,.9);
    -webkit-text-stroke:5px #0D2557;paint-order:stroke fill">305</div>
  <div style="height:12px;background:rgba(255,255,255,.15);border-radius:6px;margin:8px 0">
    <div style="height:100%;width:61%;background:#FFD23F;border-radius:6px;
      box-shadow:0 0 20px rgba(255,210,63,.6)"></div>
  </div>
  <div style="font-family:MZ,sans-serif;font-size:26px;color:rgba(255,255,255,.65);
    font-weight:900;text-align:center;letter-spacing:2px">/ 500 MUXLIS</div>
</div>`;

  switch(c.n){
    case 1:  return style("🏗️",210,44,"rgba(255,180,0,.5)");
    case 2:  return style("🗳️",200,44,"rgba(255,180,0,.5)",66);
    case 3:  return style("🏆",220,44,"rgba(255,215,0,.6)",66);
    case 4:  return goatSpecial;
    case 5:  return style("🚌",200,44,"rgba(100,160,255,.5)",66);
    case 6:  return style("⚡",220,44,"rgba(168,85,247,.6)",66);
    case 7:  return style("🌟",210,44,"rgba(52,211,153,.5)",66);
    case 8:  return style("🎟️",200,44,"rgba(100,160,255,.4)",66);
    case 9:  return style("⚽",220,44,"rgba(255,255,255,.3)",66);
    case 10: return style("🏙️",200,44,"rgba(255,215,0,.4)",66);
    case 11: return score22;
    case 12: return progress;
    case 13: return style("🪑",210,44,"rgba(168,85,247,.5)",66);
    case 14: return tacticBoard;
    case 15: return style("👥",210,44,"rgba(255,107,157,.4)",66);
    case 16: return style("💡",220,44,"rgba(255,215,0,.55)",66);
    case 17: return coachBoard;
    case 18: return style("🔥",280,42,"rgba(255,69,0,.5)",66);
    case 19: return miniXI;
  }
  return "";
}

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
  const numStroke=Math.round(ns*0.05);
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

<!-- left vignette for text legibility -->
<div style="position:absolute;inset:0;background:linear-gradient(100deg,
  rgba(2,4,12,.80) 0%,rgba(2,4,12,.30) 32%,rgba(2,4,12,.0) 55%)"></div>

<!-- bottom fade -->
<div style="position:absolute;bottom:0;left:0;right:0;height:360px;
  background:linear-gradient(0deg,rgba(2,4,12,.55) 0%,transparent 100%)"></div>

<canvas id="gr" width="1080" height="1920" style="position:absolute;inset:0;opacity:0.045;pointer-events:none"></canvas>

<!-- blue accent bars -->
<div style="position:absolute;top:0;left:0;right:0;height:7px;
  background:linear-gradient(90deg,#0D2557,#1F4FB8,#0D2557);
  box-shadow:0 2px 32px rgba(31,79,184,.75)"></div>
<div style="position:absolute;bottom:0;left:0;right:0;height:7px;
  background:linear-gradient(90deg,#0D2557,#1F4FB8,#0D2557);
  box-shadow:0 -2px 32px rgba(31,79,184,.75)"></div>

<!-- TOP-LEFT: series slug -->
<div style="position:absolute;top:52px;left:60px;
  font-size:22px;font-weight:900;color:rgba(255,255,255,.45);letter-spacing:7px;
  text-shadow:0 2px 8px rgba(0,0,0,.8)">ZAMIN FK</div>

<!-- label -->
${c.label?`<div style="position:absolute;top:88px;left:62px;
  font-size:40px;font-weight:900;color:#fff;letter-spacing:3px;
  text-shadow:0 3px 12px rgba(0,0,0,.9)">${c.label}</div>`:""}

<!-- BIG NUMBER -->
<div style="position:absolute;top:${numTop}px;left:52px;
  font-size:${ns}px;font-weight:900;line-height:0.88;
  color:${c.accent};
  text-shadow:0 ${Math.round(ns*0.05)}px 0 #0D2557,0 ${Math.round(ns*0.1)}px 36px rgba(0,0,0,.95);
  -webkit-text-stroke:${numStroke}px #0D2557;paint-order:stroke fill">${c.num}</div>

<!-- TITLE -->
<div style="position:absolute;top:${titleTop}px;left:60px;
  font-size:${ts}px;font-weight:900;line-height:1.05;color:#fff;
  text-shadow:0 4px 0 #0D2557,0 8px 28px rgba(0,0,0,.9);
  -webkit-text-stroke:${Math.round(ts*0.04)}px #0D2557;paint-order:stroke fill">${c.title.replace(/\n/g,"<br>")}</div>

<!-- CENTER ELEMENT -->
${centerEl(c)}

<!-- TOP-RIGHT: crest -->
<img src="${CREST}" style="position:absolute;top:44px;right:52px;
  height:100px;opacity:0.85;
  filter:drop-shadow(0 0 16px rgba(31,79,184,.5)) drop-shadow(0 4px 10px rgba(0,0,0,.8))">

<!-- BOTTOM: handle -->
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
