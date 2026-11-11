import { config } from './config.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const average=(xs)=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:45;
export function squadStrength(players,formation='4-3-3') {
 if (!Array.isArray(players)||players.length<11) return 35;
 const starters=players.slice(0,11);
 const base=average(starters.map(p=>Number(p.overall)||40));
 const fitness=average(starters.map(p=>Number(p.fitness??100)));
 const shape=/^\d-\d-\d$/.test(formation)?1.5:0;
 return clamp(base*(0.9+fitness/1000)+shape,25,100);
}
function poisson(lambda,rng) {
 const limit=Math.exp(-lambda);let k=0,product=1;
 do{k++;product*=rng();}while(product>limit&&k<8);
 return Math.max(0,k-1);
}
export function simulateMatch(homePlayers,awayPlayers,options={}) {
 const rng=options.random||Math.random;
 const homeStrength=squadStrength(homePlayers,options.homeFormation||'4-3-3')*(1+config.matchHomeAdvantage);
 const awayStrength=squadStrength(awayPlayers,options.awayFormation||'4-3-3');
 const share=homeStrength/(homeStrength+awayStrength);
 const homeGoals=poisson(0.55+share*1.85,rng);
 const awayGoals=poisson(0.55+(1-share)*1.85,rng);
 const events=[];
 const count=homeGoals+awayGoals;
 let hg=0,ag=0;
 for(let i=0;i<count;i++){
  const minute=4+Math.floor(rng()*87);
  const side=(hg<homeGoals&&ag<awayGoals)?(rng()<share?'home':'away'):(hg<homeGoals?'home':'away');
  if(side==='home')hg++;else ag++;
  events.push({minute,type:'goal',side,homeScore:hg,awayScore:ag,text:side==='home'?'Home team scores':'Away team scores'});
 }
 for(const item of [[12,'chance','A dangerous attack'],[28,'save','A goalkeeper makes a save'],[43,'chance','A late first-half chance'],[61,'attack','Pressure builds in the final third'],[76,'chance','A chance opens up'],[89,'attack','Last-minute pressure']]){
  if(rng()>0.42)events.push({minute:item[0],type:item[1],side:rng()<share?'home':'away',text:item[2]});
 }
 events.sort((a,b)=>a.minute-b.minute);
 return {homeGoals,awayGoals,events,homeStrength:Number(homeStrength.toFixed(1)),awayStrength:Number(awayStrength.toFixed(1))};
}
