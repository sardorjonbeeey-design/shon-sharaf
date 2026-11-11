import http from 'node:http';
import {config} from './config.js';
import {requireDb,inTransaction} from './db.js';
import {authenticate,telegramLogin} from './auth.js';
import {json,readJson,HttpError,safeString,colour,uuid} from './http.js';
import {simulateMatch} from './simulation.js';
import {saveCrest,readCrest} from './uploads.js';

const db=()=>requireDb();
const formationPattern=/^(4-3-3|4-4-2|4-2-3-1|3-5-2|4-1-4-1)$/;
const rateBuckets=new Map();
function rateLimit(key,limit=60,windowMs=60000){
 const now=Date.now(),entry=rateBuckets.get(key);
 if(!entry||now-entry.start>windowMs){rateBuckets.set(key,{start:now,count:1});return true;}
 entry.count++;return entry.count<=limit;
}
function cors(req,res){
 const origin=req.headers.origin;
 if(origin&&config.webOrigin&&origin===config.webOrigin){res.setHeader('access-control-allow-origin',origin);res.setHeader('vary','Origin');res.setHeader('access-control-allow-headers','authorization,content-type,x-dev-user-id');res.setHeader('access-control-allow-methods','GET,POST,OPTIONS');}
 res.setHeader('x-frame-options','DENY');res.setHeader('referrer-policy','no-referrer');res.setHeader('permissions-policy','camera=(),microphone=(),geolocation=()');
}
async function ownedClub(clientOrDb,clubId,userId,lock=false){
 const result=await clientOrDb.query('SELECT * FROM clubs WHERE id=$1 AND owner_user_id=$2'+(lock?' FOR UPDATE':''),[clubId,userId]);
 if(!result.rowCount)throw new HttpError(404,'Club not found');
 return result.rows[0];
}
async function makeClub(userId,input){
 const name=safeString(input.name,28,'Club name');
 const shortName=safeString(input.shortName,5,'Short name').toUpperCase();
 if(!/^[A-Z0-9]{2,5}$/.test(shortName))throw new HttpError(400,'Short name must contain 2–5 letters or numbers');
 const primary=colour(input.primaryColour||'#167A55','Primary colour');
 const secondary=colour(input.secondaryColour||'#F0C75E','Secondary colour');
 const crest=input.crestUrl||null;
 if(crest&&(!((/^https:\/\//i.test(crest)&&crest.length<=500)||/^\/uploads\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(crest))))throw new HttpError(400,'Crest URL must be HTTPS or an uploaded game crest');
 return inTransaction(async client=>{
  const c=await client.query('INSERT INTO clubs(owner_user_id,name,short_name,primary_colour,secondary_colour,crest_url,budget_uzs) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[userId,name,shortName,primary,secondary,crest,config.startingBudgetUzs.toString()]);
  const club=c.rows[0];
  const pool=await client.query('SELECT * FROM players WHERE club_id IS NULL ORDER BY overall DESC,full_name ASC LIMIT 200 FOR UPDATE SKIP LOCKED');
  const counts={GK:1,CB:2,LB:1,RB:1,DM:1,CM:2,LW:1,RW:1,ST:1};
  const selected=[];
  for(const [pos,count] of Object.entries(counts)){
   for(let i=0;i<count;i++){const idx=pool.rows.findIndex(p=>p.position===pos);if(idx>=0)selected.push(pool.rows.splice(idx,1)[0]);}
  }
  for(const p of pool.rows){if(selected.length>=config.startingSquadSize)break;selected.push(p);}
  if(selected.length<11)throw new HttpError(503,'Not enough free-agent players are available to create a squad');
  const ids=selected.slice(0,config.startingSquadSize).map(p=>p.id);
  await client.query('UPDATE players SET club_id=$1 WHERE id=ANY($2::uuid[])',[club.id,ids]);
  const actualStarters=selected.slice(0,11).map(p=>p.id);
  const substitutes=selected.slice(11).map(p=>p.id);
  await client.query('INSERT INTO lineups(club_id,formation,starters,substitutes) VALUES($1,$2,$3,$4)',[club.id,'4-3-3',actualStarters,substitutes]);
  await client.query('INSERT INTO money_ledger(club_id,amount_uzs,balance_after_uzs,reason) VALUES($1,$2,$2,$3)',[club.id,config.startingBudgetUzs.toString(),'club_created']);
  await client.query('INSERT INTO club_missions(club_id,mission_id) SELECT $1,id FROM missions WHERE active=true ON CONFLICT DO NOTHING',[club.id]);
  await ensureLeague(client);
  return {club,players:selected};
 });
}
async function ensureLeague(client){
 await client.query('SELECT pg_advisory_xact_lock(8111001)');
 const existing=await client.query("SELECT id FROM leagues WHERE status='active' LIMIT 1");
 if(existing.rowCount)return existing.rows[0].id;
 const clubs=await client.query('SELECT id FROM clubs ORDER BY created_at ASC,id ASC LIMIT 10');
 const total=await client.query('SELECT COUNT(*)::int AS count FROM clubs');
 if(Number(total.rows[0].count)<10)return null;
 const league=(await client.query("INSERT INTO leagues(name,season_number,status) VALUES('ZAMIN FK League',1,'active') RETURNING id")).rows[0];
 const ids=clubs.rows.map(r=>r.id);
 for(const id of ids)await client.query('INSERT INTO league_members(league_id,club_id) VALUES($1,$2)',[league.id,id]);
 const rotation=ids.slice();
 const rounds=rotation.length-1;
 for(let round=0;round<rounds;round++){
  for(let i=0;i<rotation.length/2;i++){
   const a=rotation[i],b=rotation[rotation.length-1-i];
   const home=(round+i)%2===0?a:b,away=home===a?b:a;
   await client.query('INSERT INTO fixtures(league_id,round_number,home_club_id,away_club_id) VALUES($1,$2,$3,$4)',[league.id,round+1,home,away]);
  }
  rotation.splice(1,0,rotation.pop());
 }
 return league.id;
}
async function clubSquad(clubId){
 const r=await db().query('SELECT p.*,l.formation,l.starters,l.substitutes FROM players p LEFT JOIN lineups l ON l.club_id=p.club_id WHERE p.club_id=$1 ORDER BY p.position,p.overall DESC',[clubId]);
 return r.rows;
}
async function progressMission(client,clubId,metric,amount){
 const rows=await client.query('SELECT cm.mission_id,cm.progress,cm.completed_at,cm.claimed_at,m.target,m.reward_dp FROM club_missions cm JOIN missions m ON m.id=cm.mission_id WHERE cm.club_id=$1 AND m.metric=$2 FOR UPDATE',[clubId,metric]);
 for(const row of rows.rows){
  if(row.completed_at)continue;
  const next=Math.min(Number(row.target),Number(row.progress)+amount);
  const done=next>=Number(row.target);
  await client.query('UPDATE club_missions SET progress=$3,completed_at=CASE WHEN $4 THEN NOW() ELSE NULL END,claimed_at=CASE WHEN $4 THEN NOW() ELSE NULL END WHERE club_id=$1 AND mission_id=$2',[clubId,row.mission_id,next,done]);
  if(done)await client.query('UPDATE clubs SET development_points=development_points+$2 WHERE id=$1',[clubId,row.reward_dp]);
 }
}
async function playFixture(fixtureId,userId){
 return inTransaction(async client=>{
  const f=(await client.query('SELECT * FROM fixtures WHERE id=$1 FOR UPDATE',[fixtureId])).rows[0];
  if(!f)throw new HttpError(404,'Fixture not found');
  if(f.status==='played')return {alreadyPlayed:true,fixture:f};
  const clubs=await client.query('SELECT * FROM clubs WHERE id=ANY($1::uuid[])',[[f.home_club_id,f.away_club_id]]);
  const home=clubs.rows.find(c=>c.id===f.home_club_id),away=clubs.rows.find(c=>c.id===f.away_club_id);
  if(!home||!away)throw new HttpError(404,'Fixture club not found');
  if(home.owner_user_id!==userId&&away.owner_user_id!==userId)throw new HttpError(403,'You do not manage either club in this fixture');
  const [hl,al]=await Promise.all([
   client.query('SELECT p.* FROM lineups l CROSS JOIN LATERAL unnest(l.starters) WITH ORDINALITY s(id,ord) JOIN players p ON p.id=s.id WHERE l.club_id=$1 ORDER BY s.ord',[home.id]),
   client.query('SELECT p.* FROM lineups l CROSS JOIN LATERAL unnest(l.starters) WITH ORDINALITY s(id,ord) JOIN players p ON p.id=s.id WHERE l.club_id=$1 ORDER BY s.ord',[away.id])
  ]);
  const result=simulateMatch(hl.rows,al.rows);
  const played=await client.query("UPDATE fixtures SET status='played',home_goals=$2,away_goals=$3,events=$4::jsonb,played_at=NOW() WHERE id=$1 AND status='scheduled' RETURNING *",[fixtureId,result.homeGoals,result.awayGoals,JSON.stringify(result.events)]);
  if(!played.rowCount)throw new HttpError(409,'Fixture was already settled');
  for(const [clubId,gf,ga] of [[home.id,result.homeGoals,result.awayGoals],[away.id,result.awayGoals,result.homeGoals]]){
   const win=gf>ga,draw=gf===ga,loss=gf<ga;
   await client.query('UPDATE league_members SET played=played+1,wins=wins+$3,draws=draws+$4,losses=losses+$5,goals_for=goals_for+$6,goals_against=goals_against+$7,points=points+$8 WHERE league_id=$1 AND club_id=$2',
    [f.league_id,clubId,win?1:0,draw?1:0,loss?1:0,gf,ga,win?3:draw?1:0]);
   await progressMission(client,clubId,'matches_played',1);
   await progressMission(client,clubId,'wins',win?1:0);
   await progressMission(client,clubId,'goals_scored',gf);
   await progressMission(client,clubId,'clean_sheets',ga===0?1:0);
  }
  return {fixture:played.rows[0],simulation:result};
 });
}
async function handle(req,res){
 cors(req,res);
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 const url=new URL(req.url,'http://localhost'),path=url.pathname;
 if(req.method==='GET'&&path==='/health')return json(res,200,{ok:true,service:'zamin-fk-game-server'});
 if(req.method==='GET'&&path.startsWith('/uploads/')){const file=await readCrest(path.slice('/uploads/'.length));res.writeHead(200,{'content-type':file.type,'cache-control':'public,max-age=31536000,immutable','x-content-type-options':'nosniff'});return res.end(file.bytes);}
 if(req.method==='POST'&&path==='/api/auth/telegram'){
  if(!rateLimit(req.socket.remoteAddress||'unknown',12))throw new HttpError(429,'Too many login attempts');
  const body=await readJson(req);return json(res,200,await telegramLogin(body.initData));
 }
 const user=await authenticate(req);
 if(req.method==='POST'&&path==='/api/uploads/crest'){const body=await readJson(req,3_100_000);const crestUrl=await saveCrest(body.dataUrl);return json(res,201,{crestUrl});}
 if(req.method==='GET'&&path==='/api/market'){
  const r=await db().query('SELECT id,full_name,nationality,age,position,quality,overall,potential,market_value_uzs,attributes FROM players WHERE club_id IS NULL ORDER BY overall DESC LIMIT 100');
  return json(res,200,{players:r.rows});
 }
 if(req.method==='GET'&&path==='/api/clubs'){
  const r=await db().query('SELECT * FROM clubs WHERE owner_user_id=$1 ORDER BY created_at',[user.id]);return json(res,200,{clubs:r.rows});
 }
 if(req.method==='POST'&&path==='/api/clubs'){
  const body=await readJson(req);const result=await makeClub(user.id,body);
  return json(res,201,{club:result.club,squad:result.players});
 }
 const parts=path.split('/').filter(Boolean);
 if(parts[0]==='api'&&parts[1]==='clubs'&&parts[2]){
  const clubId=uuid(parts[2],'Club ID');
  const club=await ownedClub(db(),clubId,user.id);
  if(req.method==='GET'&&parts.length===3)return json(res,200,{club});
  if(req.method==='GET'&&parts[3]==='squad')return json(res,200,{players:await clubSquad(clubId)});
  if(req.method==='GET'&&parts[3]==='lineup'){const r=await db().query('SELECT * FROM lineups WHERE club_id=$1',[clubId]);return json(res,200,{lineup:r.rows[0]||null});}
  if(req.method==='GET'&&parts[3]==='league'){const r=await db().query('SELECT lm.*,c.name,c.short_name,c.primary_colour FROM league_members lm JOIN clubs c ON c.id=lm.club_id WHERE lm.league_id=(SELECT league_id FROM league_members WHERE club_id=$1 ORDER BY league_id DESC LIMIT 1) ORDER BY lm.points DESC,(lm.goals_for-lm.goals_against) DESC,lm.goals_for DESC',[clubId]);return json(res,200,{table:r.rows});}
  if(req.method==='GET'&&parts[3]==='missions'){
   const r=await db().query('SELECT m.*,cm.progress,cm.completed_at,cm.claimed_at FROM club_missions cm JOIN missions m ON m.id=cm.mission_id WHERE cm.club_id=$1 ORDER BY m.id',[clubId]);
   return json(res,200,{missions:r.rows});
  }
  if(req.method==='POST'&&parts[3]==='lineup'){
   const body=await readJson(req),formation=safeString(body.formation,8,'Formation');
   if(!formationPattern.test(formation))throw new HttpError(400,'Unsupported formation');
   if(!Array.isArray(body.starters)||body.starters.length!==11||new Set(body.starters).size!==11)throw new HttpError(400,'Select exactly 11 unique starters');
   if(!Array.isArray(body.substitutes)||body.substitutes.length>7||new Set(body.substitutes).size!==body.substitutes.length)throw new HttpError(400,'Invalid substitutes');
   const subs=body.substitutes===undefined?[]:body.substitutes;
   if(!Array.isArray(subs))throw new HttpError(400,'Invalid substitutes');
   const all=body.starters.concat(subs).map(id=>uuid(id,'Player ID'));
   const owned=await db().query('SELECT id FROM players WHERE club_id=$1 AND id=ANY($2::uuid[])',[clubId,all]);
   if(owned.rowCount!==all.length)throw new HttpError(400,'Lineup contains a player outside this club');
   await db().query('INSERT INTO lineups(club_id,formation,starters,substitutes,updated_at) VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(club_id) DO UPDATE SET formation=EXCLUDED.formation,starters=EXCLUDED.starters,substitutes=EXCLUDED.substitutes,updated_at=NOW()',[clubId,formation,body.starters,body.substitutes]);
   return json(res,200,{ok:true});
  }
  if(req.method==='POST'&&parts[3]==='players'&&parts[4]==='sign'){
   const body=await readJson(req),playerId=uuid(body.playerId,'Player ID');
   const result=await inTransaction(async client=>{
    const c=await ownedClub(client,clubId,user.id,true);
    const p=(await client.query('SELECT * FROM players WHERE id=$1 AND club_id IS NULL FOR UPDATE',[playerId])).rows[0];
    if(!p)throw new HttpError(404,'Free agent not found');
    const fee=BigInt(p.market_value_uzs);
    if(BigInt(c.budget_uzs)<fee)throw new HttpError(400,'Insufficient club budget');
    await client.query('UPDATE clubs SET budget_uzs=budget_uzs-$2 WHERE id=$1',[clubId,fee.toString()]);
    await client.query('UPDATE players SET club_id=$2 WHERE id=$1',[playerId,clubId]);
    const bal=(BigInt(c.budget_uzs)-fee).toString();
    await client.query('INSERT INTO money_ledger(club_id,amount_uzs,balance_after_uzs,reason,reference_id) VALUES($1,$2,$3,$4,$5)',[clubId,(-fee).toString(),bal,'player_signing',playerId]);
    return {player:p,budgetUzs:bal};
   });
   return json(res,200,result);
  }
  if(req.method==='POST'&&parts[3]==='players'&&parts[4]==='sell'){
   const body=await readJson(req),playerId=uuid(body.playerId,'Player ID');
   const result=await inTransaction(async client=>{
    const c=await ownedClub(client,clubId,user.id,true);
    const p=(await client.query('SELECT * FROM players WHERE id=$1 AND club_id=$2 FOR UPDATE',[playerId,clubId])).rows[0];
    if(!p)throw new HttpError(404,'Player not found');
    const count=await client.query('SELECT COUNT(*)::int AS count FROM players WHERE club_id=$1',[clubId]);
    if(Number(count.rows[0].count)<=11)throw new HttpError(400,'A club must keep at least 11 players');
    const fee=(BigInt(p.market_value_uzs)*80n/100n),bal=(BigInt(c.budget_uzs)+fee).toString();
    await client.query('UPDATE players SET club_id=NULL WHERE id=$1',[playerId]);
    await client.query('UPDATE clubs SET budget_uzs=budget_uzs+$2 WHERE id=$1',[clubId,fee.toString()]);
    await client.query('UPDATE lineups SET starters=array_remove(starters,$2::uuid),substitutes=array_remove(substitutes,$2::uuid) WHERE club_id=$1',[clubId,playerId]);
    await client.query('INSERT INTO money_ledger(club_id,amount_uzs,balance_after_uzs,reason,reference_id) VALUES($1,$2,$3,$4,$5)',[clubId,fee.toString(),bal,'player_sale',playerId]);
    return {player:p,budgetUzs:bal};
   });
   return json(res,200,result);
  }
  if(req.method==='POST'&&parts[3]==='players'&&parts[4]==='upgrade'){
   const body=await readJson(req),playerId=uuid(body.playerId,'Player ID'),attribute=safeString(body.attribute,20,'Attribute');
   const levels=Math.max(1,Math.min(5,Number(body.levels||1)));
   if(!['pace','shooting','passing','dribbling','defending','physical'].includes(attribute)||!Number.isInteger(levels))throw new HttpError(400,'Invalid upgrade');
   const result=await inTransaction(async client=>{
    const c=await ownedClub(client,clubId,user.id,true);
    const p=(await client.query('SELECT * FROM players WHERE id=$1 AND club_id=$2 FOR UPDATE',[playerId,clubId])).rows[0];
    if(!p)throw new HttpError(404,'Player not found');
    const attrs={...p.attributes},start=Number(attrs[attribute]||1),end=Math.min(Number(p.potential),start+levels);
    const actual=end-start;if(actual<1)throw new HttpError(400,'Player has reached the upgrade cap for this attribute');
    let cost=0;for(let n=start;n<end;n++)cost+=2+Math.floor(n/10);
    if(Number(c.development_points)<cost)throw new HttpError(400,'Not enough development points');
    attrs[attribute]=end;
    const avg=Object.values(attrs).reduce((a,b)=>a+Number(b),0)/6;
    const overall=Math.min(Number(p.potential),Math.max(Number(p.overall),Math.round(avg)));
    await client.query('UPDATE players SET attributes=$2::jsonb,overall=$3 WHERE id=$1',[playerId,JSON.stringify(attrs),overall]);
    await client.query('UPDATE clubs SET development_points=development_points-$2 WHERE id=$1',[clubId,cost]);
    return {player:{...p,attributes:attrs,overall},spentDp:cost,remainingDp:Number(c.development_points)-cost};
   });
   return json(res,200,result);
  }
  if(req.method==='POST'&&parts[3]==='leagues'&&parts[4]==='ensure'){
   const id=await inTransaction(client=>ensureLeague(client));
   return json(res,200,{leagueId:id,created:Boolean(id)});
  }
  if(req.method==='GET'&&parts[3]==='fixtures'){
   const r=await db().query('SELECT f.*,h.name AS home_name,a.name AS away_name FROM fixtures f JOIN clubs h ON h.id=f.home_club_id JOIN clubs a ON a.id=f.away_club_id WHERE f.home_club_id=$1 OR f.away_club_id=$1 ORDER BY f.round_number',[clubId]);
   return json(res,200,{fixtures:r.rows});
  }
 }
 if(req.method==='POST'&&parts[0]==='api'&&parts[1]==='fixtures'&&parts[3]==='play'){
  const fixtureId=uuid(parts[2],'Fixture ID');return json(res,200,await playFixture(fixtureId,user.id));
 }
 throw new HttpError(404,'Route not found');
}
const server=http.createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'&&!rateLimit(req.socket.remoteAddress||'unknown',120))throw new HttpError(429,'Too many requests');
  await handle(req,res);
 }catch(error){
  const status=Number(error.status)||500;
  if(status>=500)console.error(error);
  if(!res.headersSent)json(res,status,{error:status>=500?'Internal server error':error.message});
  else res.destroy();
 }
});
server.listen(config.port,'0.0.0.0',()=>console.log('ZAMIN FK isolated game server listening on '+config.port));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
