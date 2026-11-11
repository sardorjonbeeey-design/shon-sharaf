import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateMatch,squadStrength} from '../src/simulation.js';

const team=(rating)=>Array.from({length:11},(_,i)=>({id:String(i),overall:rating,position:i===0?'GK':'CM',fitness:100}));

test('squad strength requires a complete starting eleven',()=>{
 assert.equal(squadStrength(team(70).slice(0,10)),35);
 assert.ok(squadStrength(team(70))>65);
});

test('match simulation returns bounded integer score and ordered events',()=>{
 const result=simulateMatch(team(80),team(50),{random:()=>0.5});
 assert.ok(Number.isInteger(result.homeGoals));
 assert.ok(Number.isInteger(result.awayGoals));
 assert.ok(result.homeGoals>=0&&result.homeGoals<=7);
 assert.ok(result.awayGoals>=0&&result.awayGoals<=7);
 assert.deepEqual(result.events.map(e=>e.minute),result.events.map(e=>e.minute).slice().sort((a,b)=>a-b));
 assert.equal(result.events.filter(e=>e.type==='goal').length,result.homeGoals+result.awayGoals);
 assert.ok(result.homeStrength>result.awayStrength);
});

test('simulation supports a seeded random generator',()=>{
 let seed=123456789;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const a=simulateMatch(team(64),team(62),{random});
 seed=123456789;
 const b=simulateMatch(team(64),team(62),{random});
 assert.equal(a.homeGoals,b.homeGoals);
 assert.equal(a.awayGoals,b.awayGoals);
 assert.deepEqual(a.events,b.events);
});
