// node render_reveal.js [frames t1,t2 | video out.mp4]
const {chromium}=require("playwright"),{spawn}=require("child_process"),fs=require("fs");
const HERE=__dirname;
(async()=>{
  const mode=process.argv[2]||"video";
  const arg=process.argv[3]||HERE+"/muxlislar_a_v2.mp4";
  const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--allow-file-access-from-files"]});
  const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  p.on("pageerror",e=>console.log("[pageerror]",String(e).slice(0,400)));
  p.on("console",m=>{if(/error/i.test(m.type()))console.log("[page]",m.text().slice(0,300));});
  await p.goto("file://"+HERE+"/reveal.html");
  await p.evaluate(()=>window.ready());
  const END=await p.evaluate(()=>window.END);
  console.log(`Total duration: ${END}s`);
  if(mode==="frames"){
    fs.mkdirSync(HERE+"/build/frames",{recursive:true});
    for(const t of arg.split(",").map(Number)){
      await p.evaluate(t=>window.renderAt(t),t);
      await p.screenshot({path:`${HERE}/build/frames/f_${t.toFixed(2)}.jpg`,type:"jpeg",quality:88});
      console.log(`frame t=${t}`);
    }
  } else {
    const fps=30,n=Math.round(END*fps);
    const ff=spawn("ffmpeg",["-loglevel","error","-y","-f","image2pipe","-framerate",String(fps),"-c:v","mjpeg","-i","-","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",arg],{stdio:["pipe","inherit","inherit"]});
    for(let f=0;f<n;f++){
      await p.evaluate(t=>window.renderAt(t),f/fps);
      const buf=await p.screenshot({type:"jpeg",quality:93});
      if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once("drain",r));
      if(f%60===0)console.error(`frame ${f}/${n} (${(f/fps).toFixed(1)}s)`);
    }
    ff.stdin.end();
    await new Promise(r=>ff.on("close",r));
    console.log("Done:",arg);
  }
  await b.close();
})();
