// Offer stories in ZAMIN FK style (Montserrat, navy/blue glow, crest). Run: node render.js
const {chromium}=require('playwright');const path=require('path');
const A=path.resolve(__dirname,'..');
const S=[
 {h:'DO‘STLAR,<br>SHU KABI<br><em>LOYIHANI</em><br>0 DAN',q:'Birga quramiz. Jamoa bilan, haqiqiy natija bilan.<br>Nima deysiz?',label:'LOYIHA: <b>BIRGA</b>',poll:true},
 {h:'BU <em>KURS</em><br>EMAS.',q:'10 kishi. Har kim o‘z loyihasini quradi.<br>Men yetaklayman, jamoa bo‘lib ishlaymiz.',label:'JAMOA: <b>10 KISHI</b>'},
 {h:'MAQSAD<br>BITTA:',big:'<em>5000+</em>',q:'Kamida 5000 ko‘rish. Yetmasa, <b>pulingizni qaytaraman.</b><br>0 dan boshlaymiz, yoningizda bo‘laman.',label:'NATIJA: <b>5000+</b>'},
 {h:'FAQAT<br><em>10 TA</em><br>JOY.',q:'Jamoaga qo‘shilmoqchimisiz?<br>DM ga <b>“LOYIHA”</b> deb yozing 👇',label:'QOLDI: <b>10 JOY</b>'},
];
const css=`@font-face{font-family:M;font-weight:600;src:url(file://${A}/web/city/assets/fonts/Montserrat_600SemiBold.ttf)}
@font-face{font-family:M;font-weight:700;src:url(file://${A}/web/city/assets/fonts/Montserrat_700Bold.ttf)}
@font-face{font-family:M;font-weight:900;src:url(file://${A}/web/city/assets/fonts/Montserrat_900Black.ttf)}
html,body{margin:0;background:#000}
#s{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:M,sans-serif;color:#fff;background:radial-gradient(ellipse 90% 55% at 50% 75%,#0b2a6b 0%,#04122e 55%,#020611 100%)}
#crest{position:absolute;left:70px;top:268px;height:104px;filter:drop-shadow(0 4px 14px rgba(0,0,0,.7))}
#label{position:absolute;right:70px;top:296px;font-weight:700;font-size:26px;letter-spacing:7px;color:#9fc2ff;border:2px solid rgba(127,178,255,.6);padding:12px 18px 11px 24px;border-radius:6px;background:rgba(8,22,60,.55)}
#label b{color:#fff;font-weight:900}
#h{position:absolute;left:70px;right:70px;top:420px;font-weight:900;font-size:118px;line-height:1.02;letter-spacing:-1px;text-shadow:0 0 46px rgba(46,110,255,.55),0 6px 26px rgba(0,0,0,.8)}
#h em,#big em{font-style:normal;color:#7fb2ff}
#big{position:absolute;left:70px;top:700px;font-weight:900;font-size:230px;letter-spacing:-4px;text-shadow:0 0 60px rgba(46,110,255,.7)}
#bar{position:absolute;left:74px;width:120px;height:8px;background:#3f7bff;box-shadow:0 0 22px #3f7bff}
#q{position:absolute;left:70px;right:70px;font-weight:600;font-size:44px;line-height:1.3;text-shadow:0 3px 14px rgba(0,0,0,.9)}
#q b{color:#7fb2ff;font-weight:900}
#poll{position:absolute;right:70px;top:1330px;width:620px;background:#fff;border-radius:36px;padding:40px;text-align:center;font-size:40px;font-weight:600;color:#111}
#poll div{margin-top:28px;background:#ddd;border-radius:20px;padding:26px;font-size:30px;color:#777;font-weight:400}
#tiny{position:absolute;left:0;right:0;top:1700px;text-align:center;font-weight:600;font-size:24px;letter-spacing:4px;color:#a9c4f5;opacity:.85}`;
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const pg=await b.newPage({viewport:{width:1080,height:1920}});
for(let i=0;i<S.length;i++){const s=S[i];
 const lines=(s.h.match(/<br>/g)||[]).length+1; const hEnd=420+lines*120; const barTop=s.big?1010:hEnd+30;
 const html=`<style>${css}</style><div id=s><img id=crest src="file://${A}/03_Approved_Assets/ZFK_CREST_MASTER_V01_P_2048.png"><div id=label>${s.label}</div><div id=h>${s.h}</div>${s.big?`<div id=big>${s.big}</div>`:''}<div id=bar style="top:${barTop}px"></div><div id=q style="top:${barTop+36}px">${s.q}</div>${s.poll?'<div id=poll>Fikringiz muhim!<div>Type something...</div></div>':''}<div id=tiny>FK ZAMIN · BIRGA QURAMIZ</div></div>`;
 const f=path.join(__dirname,`_tmp${i}.html`);require('fs').writeFileSync(f,'<meta charset=utf-8>'+html);await pg.goto('file://'+f);await pg.waitForTimeout(400);
 await pg.screenshot({path:path.join(__dirname,`story_0${i+1}.png`)});}
await b.close();require('fs').readdirSync(__dirname).filter(x=>x.startsWith('_tmp')).forEach(x=>require('fs').unlinkSync(path.join(__dirname,x)));})();
