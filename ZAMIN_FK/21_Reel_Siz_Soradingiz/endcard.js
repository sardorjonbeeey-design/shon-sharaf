const {chromium}=require("playwright"),path=require("path");
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto("file://"+path.resolve(__dirname,"endcard.html"));await p.waitForTimeout(600);
await p.screenshot({path:"assets/endcard.png",omitBackground:true});await b.close()})();
