// node shot_board.js -> assets/board_names.png : the pitch bracket with the four club names, no captions
const {chromium}=require("playwright"),fs=require("fs"),path=require("path");
const HERE=__dirname, W=fs.readFileSync(HERE+"/build/words.json","utf8");
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
 const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 await p.addInitScript(w=>{window.W=JSON.parse(w);},W);
 await p.goto("file://"+path.resolve(HERE,"film.html"));
 await p.evaluate(()=>window.ready()); await p.evaluate(()=>window.renderAt(32.5));
 await p.evaluate(()=>{document.getElementById("ov").style.display="none";document.querySelectorAll(".sfl").forEach(e=>e.style.opacity=0);});
 await p.screenshot({path:HERE+"/assets/board_names.png"});
 await b.close();})();
