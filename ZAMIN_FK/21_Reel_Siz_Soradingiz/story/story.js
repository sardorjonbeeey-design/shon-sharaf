const {chromium}=require("playwright"),path=require("path");
(async()=>{const b=await chromium.launch({args:["--allow-file-access-from-files"]}),p=await b.newPage({viewport:{width:1080,height:1920}});
for(let i=1;i<=4;i++){await p.goto(`file://${path.resolve(__dirname,"story.html")}?s=${i}`);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);await p.screenshot({path:`../exports/story_${i}.png`});console.log("✓",i)}
await b.close()})();
