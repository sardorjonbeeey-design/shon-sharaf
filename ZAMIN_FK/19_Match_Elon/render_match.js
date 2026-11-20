// node render_match.js  →  build/silent.mp4
const {chromium}=require("playwright"),fs=require("fs"),cp=require("child_process"),path=require("path");
const HERE=path.resolve(__dirname);
const W=JSON.parse(fs.readFileSync(HERE+"/build/words.json","utf8"));
const END=W[W.length-1].end+1.5;
const FPS=15, TOTAL=Math.ceil(END*FPS);
console.log(`Total duration: ${END.toFixed(2)}s  frames: ${TOTAL}`);

(async()=>{
  const b=await chromium.launch({args:[
    "--allow-file-access-from-files","--no-sandbox",
    "--disable-gpu","--disable-software-rasterizer"]});
  const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  p.on("pageerror",e=>console.error("[err]",e.message));

  await p.goto("file://"+HERE+"/match.html",{waitUntil:"networkidle"});
  await p.evaluate(()=>document.fonts.ready);
  // ensure ALL images loaded (bg0/bg7/bg8 are preloaded)
  await p.evaluate(()=>Promise.allSettled(
    [...document.images].map(i=>i.complete?Promise.resolve():
      new Promise((res,rej)=>{i.onload=res;i.onerror=res;}))
  ));
  await p.waitForTimeout(1000);
  await p.waitForTimeout(500);

  await p.evaluate(W=>{ window.W=W; window.RENDER_MODE=true; },W);
  await p.waitForTimeout(100);

  // single ffmpeg process
  const ff=cp.spawn("ffmpeg",["-y","-f","image2pipe","-vcodec","png",
    "-r",String(FPS),"-i","pipe:0","-vcodec","libx264","-pix_fmt","yuv420p",
    "-r","30","-crf","18","-preset","fast",HERE+"/build/silent.mp4"],
    {stdio:["pipe","inherit","inherit"]});

  for(let f=0;f<TOTAL;f++){
    const t=f/FPS;
    await p.evaluate(t=>window.frameOv(t),t);
    const png=await p.screenshot({type:"png",timeout:60000});
    ff.stdin.write(png);
    if(f%15===0)console.log(`frame ${f}/${TOTAL} (${t.toFixed(1)}s)`);
  }
  ff.stdin.end();
  await new Promise(r=>ff.on("close",r));
  await b.close();
  console.log("Done: build/silent.mp4");
})();
