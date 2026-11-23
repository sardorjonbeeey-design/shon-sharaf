const {chromium}=require("playwright"),path=require("path");
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1180,height:600}});
await p.goto("file://"+path.resolve(__dirname,"comments.html"));await p.waitForTimeout(600);
for(let i=0;i<2;i++)await p.locator("#c"+i).screenshot({path:`assets/comment_${i+1}.png`});
await b.close()})();
