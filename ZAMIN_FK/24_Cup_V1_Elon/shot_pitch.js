// node shot_pitch.js            -> build/pitch_bracket.png (finished still, for stories)
// node shot_pitch.js seq 3.3    -> build/br/f_0000.jpg ... (30 fps draw-on animation for the reel)
const {chromium}=require("playwright"),path=require("path"),fs=require("fs");
const HERE=__dirname; fs.mkdirSync(HERE+"/build",{recursive:true});
const mode=process.argv[2]||"still", dur=+(process.argv[3]||3.3), FPS=30;
(async()=>{
  const b=await chromium.launch({args:["--allow-file-access-from-files"]});
  const pg=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  pg.on("pageerror",e=>console.log("[err]",String(e).slice(0,200)));
  await pg.goto("file://"+path.resolve(HERE,"bracket_pitch.html"));
  await pg.evaluate(()=>window.ready());
  if(mode==="seq"){
    const OUT=HERE+"/build/br"; fs.mkdirSync(OUT,{recursive:true});
    const n=Math.round(dur*FPS);
    for(let f=0;f<n;f++){ await pg.evaluate(v=>window.at(v), Math.min(1, f/(n*0.82)));
      await pg.screenshot({path:`${OUT}/f_${String(f).padStart(4,"0")}.jpg`,type:"jpeg",quality:95}); }
    console.log("br frames", n);
  } else {
    await pg.evaluate(()=>window.at(1));
    await pg.screenshot({path:`${HERE}/build/pitch_bracket.png`});
  }
  await b.close();
})();
