// landscape 2.2:1 stills for stories: node stills2.js -> story/assets/{ff,pk,ac}.jpg
const path=require("path"),G3=path.resolve(__dirname,"../09_Episode_09/goals3d"),{open}=require(path.join(G3,"harness.js"));
const S={ff:[[-52,12,-96],[-98,5,-122],46],pk:[[50,14,-124],[100,6,-90],46],ac:[[-52,13,-72],[-98,4,-90],46]};
(async()=>{const {page,close}=await open({time:"17.3",w:1960,h:880});
for(const n in S){const [p,l,fov]=S[n];
 await page.evaluate(([p,l,fov])=>{const Z=window.__Z;Z.renderer.setSize(1960,880);Z.camera.aspect=1960/880;Z.camera.fov=fov;Z.camera.updateProjectionMatrix();Z.camera.position.set(...p);Z.camera.up.set(0,1,0);Z.camera.lookAt(...l);
  const bu=[];Z.scene.traverse(o=>{if(o.name==="zfk_burger")o.rotation.y=.6});Z.renderer.render(Z.scene,Z.camera)},[p,l,fov]);
 await page.waitForTimeout(300);await page.evaluate(()=>{const Z=window.__Z;Z.renderer.render(Z.scene,Z.camera)});
 await page.screenshot({path:`story/assets/${n}.jpg`,type:"jpeg",quality:92});console.log("ok",n)}
await close()})();
