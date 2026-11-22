// node stills.js <time> shot1,shot2,...   -> build/still_<time>_<shot>.png   (1080x1920 unless shot is "top*")
const path=require("path"),G3=path.resolve(__dirname,"../09_Episode_09/goals3d"),{open}=require(path.join(G3,"harness.js"));
const S={
 top:[[0,300,-100],[0,0,-100],55,1400,1400,[0,0,-1]],
 ff:[[-62,10,-77],[-32,5,-92],72],
 gar:[[146,15,-62],[98,6,-88],70],
 ac:[[-136,13,-64],[-112,5,-84],72],
};
(async()=>{const time=process.argv[2]||"night",names=(process.argv[3]||"ff_hero").split(",");
const SC=+process.env.SC||1;const {page,close}=await open({time,w:1080*SC,h:1920*SC});
for(const n of names){const [p,l,fov,w,h,up]=S[n];
 if(w){await page.setViewportSize({width:w,height:h});}else await page.setViewportSize({width:Math.round(1080*SC),height:Math.round(1920*SC)});
 await page.evaluate(([p,l,fov,up,asp])=>{const Z=window.__Z;Z.renderer.setSize(innerWidth,innerHeight);Z.camera.aspect=asp;Z.camera.fov=fov;Z.camera.updateProjectionMatrix();Z.camera.position.set(...p);Z.camera.up.set(...(up||[0,1,0]));Z.camera.lookAt(...l);Z.renderer.render(Z.scene,Z.camera)},[p,l,fov,up,(w||1080)/(h||1920)]);
 await page.waitForTimeout(400);
 await page.evaluate(()=>{const Z=window.__Z;Z.renderer.render(Z.scene,Z.camera)});
 await page.screenshot({path:`build/still_${time}_${n}.png`});console.log("ok",n);}
await close()})();
