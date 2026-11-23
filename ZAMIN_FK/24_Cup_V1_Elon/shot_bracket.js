// node shot_bracket.js            -> build/bracket_full.png (static, for stories / end card)
// node shot_bracket.js 0.45       -> build/bracket_p45.png  (animation probe)
const {chromium}=require("playwright"),fs=require("fs"),path=require("path");
const HERE=__dirname; fs.mkdirSync(HERE+"/build",{recursive:true});
const p=process.argv[2]?Number(process.argv[2]):1;
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]});
 const pg=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 await pg.goto("file://"+path.resolve(HERE,"bracket.html"));
 await pg.evaluate(()=>window.ready()); await pg.evaluate(v=>window.at(v),p);
 await pg.screenshot({path:`${HERE}/build/bracket_${p===1?"full":"p"+Math.round(p*100)}.png`,omitBackground:true});
 await b.close();})();
