const path=require("path"),G3=path.resolve(__dirname,"../09_Episode_09/goals3d"),{open}=require(path.join(G3,"harness.js"));
(async()=>{const {page,close}=await open({time:"day",w:1400,h:1400});
for(const [n,p,l,fov] of [["top",[0,420,-60],[0,0,-60],50],["top2",[0,300,-100],[0,0,-100],55]]){
await page.evaluate(([p,l,fov])=>{const Z=window.__Z;Z.camera.fov=fov;Z.camera.aspect=1;Z.camera.updateProjectionMatrix();Z.camera.position.set(...p);Z.camera.up.set(0,0,-1);Z.camera.lookAt(...l);Z.renderer.render(Z.scene,Z.camera)},[p,l,fov]);
await page.screenshot({path:`build/ov_${n}.png`});}
await close()})();
