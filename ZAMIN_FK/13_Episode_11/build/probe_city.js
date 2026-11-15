const path=require("path"),G3=path.resolve(__dirname,"../../09_Episode_09/goals3d"),{open}=require(path.join(G3,"harness.js"));
(async()=>{const {page,close}=await open({time:process.env.T||"16.7",w:1080,h:1920});
 const cams=[["top",[40,300,-60],[40,0,-110],55,1],["market",[-60,38,-70],[0,6,-140],60,0],["tower",[135,42,-60],[88,10,-118],62,0],["wide",[-30,70,40],[40,5,-120],62,0]];
 for(const [n,pos,look,fov,top] of cams){
  await page.evaluate(([p,l,f,t])=>{const Z=window.__Z;Z.camera.fov=f;Z.camera.updateProjectionMatrix();Z.camera.position.set(...p);Z.camera.up.set(0,t?0:1,t?-1:0);Z.camera.lookAt(...l);(Z.DN||{render(){}}).render&&0;Z.renderer.render(Z.scene,Z.camera);},[pos,look,fov,top]);
  await page.screenshot({path:__dirname+`/probe_city_${n}.jpg`,type:"jpeg",quality:80});}
 await close();})();
