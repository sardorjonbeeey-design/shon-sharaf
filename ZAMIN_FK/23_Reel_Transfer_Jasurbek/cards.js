const {chromium}=require("playwright"),path=require("path");
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1100,height:960}});
await p.goto("file://"+path.resolve(__dirname,"cards.html"));await p.waitForTimeout(800);
for(let i=1;i<=2;i++)await p.locator("#c"+i).screenshot({path:`assets/pcard_${i}.png`,omitBackground:true});
await b.close()})();
