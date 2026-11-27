// Muxlislar kubogi — turn two fan squads into Day 9 director data.
// node: build_shootout(home, away, seed) -> { CUP, GOALS } ; the page gets CUP before director.js runs.
const fs = require("fs"), path = require("path");
const TEAMS = path.resolve(__dirname, "../26_Cup_V3_Tarkib/build/teams.json");
const KIT = { "PRIME AVANGARD": "red", "PRIME FC": "amber", "WAKANDA TEAM": "green", "QAYRAT FC": "purple" };
// spot = [depth from own goal line (m), z across]; the shirt shows the number, the card shows the handle
const SPOTDEF = { GK: [4, 0], LB: [30, -24], CB1: [26, -8], CB2: [26, 8], RB: [30, 24],
                  CML: [46, -12], CMC: [54, 0], CMR: [46, 12], LW: [68, -22], ST: [74, 0], RW: [68, 22] };
const POS = { GK: "GK", LB: "LB", CB1: "CB", CB2: "CB", RB: "RB", CML: "CM", CMC: "CAM", CMR: "CM", LW: "LW", ST: "ST", RW: "RW" };
const squads = () => JSON.parse(fs.readFileSync(TEAMS, "utf8"));
const find = name => { const t = squads().find(t => t.club === name); if (!t) throw new Error("no squad: " + name); return t; };
// rig name = the handle in caps without punctuation (the shirt printer keeps it short), number = shirt number
const rigName = u => u.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 12);
function lineup(t) {
  return t.xi.map(p => [rigName(p.u), String(p.n), POS[p.spot], ...SPOTDEF[p.spot]]);
}
function club(name) { const t = find(name); return { name, kit: KIT[name] || "slate", capt: t.capt, xi: t.xi, lineup: lineup(t) }; }
// deterministic RNG, seed published with the video
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const ovr = p => 60 + Math.min(25, Math.round((p.likes || 0) * 1.5)) + 0;
// --- penalty shootout -------------------------------------------------------
// one kick = one "goal" scenario: run-up, strike, keeper dive, reaction. Goal line x = +52.5, spot x = 41.5.
function kick({ shooter, keeper, team, other, idx, scored, corner, diveDir, score }) {
  const Zp = n => ["Z", n], Sp = n => ["S", n];
  const me = team === "Z" ? Zp : Sp, them = team === "Z" ? Sp : Zp;
  const z = corner * 3.1, h = 0.95 + 0.5 * Math.abs(corner);
  const T_KICK = 1.35, T_HIT = 1.78, DUR = 4.4;
  const ballEnd = scored ? [54.0, 0.9, z] : (diveDir === corner ? [51.4, 1.0, z * 0.8] : [56.5, 1.2, z * 1.9]);
  const paths = {};
  paths[`${team}:${shooter.rig}#${shooter.num}`] = [[0, 36.5, z * 0.5], [T_KICK - .25, 40.6, z * 0.12], [T_KICK, 41.2, 0], [2.4, 43.5, 0], [DUR, 45, 0]];
  paths[`${other}:${keeper.rig}#${keeper.num}`] = [[0, 51.9, 0], [T_KICK, 51.9, 0], [DUR, 51.9, 0]];
  const acts = [
    { type: "kick", p: me(shooter.rig), t: T_KICK },
    { type: "dive", p: them(keeper.rig), t: T_KICK + .06, dur: .52, dir: diveDir, roll: diveDir, dist: 2.4, h: 1.0 },
  ];
  if (!scored) acts.push({ type: "slump", p: me(shooter.rig), t0: T_HIT + .3 });   // no celebration per kick:
                                                                                   // only the winners celebrate, at the end
  return {
    minute: 90 + idx, kicks: 0, team, scorer: shooter.rig, num: shooter.num, before: score.before, after: score.after,
    dirZ: 1, dirS: -1, dur: DUR, tGoal: T_HIT, pen: true, handle: shooter.u, scored,
    paths,
    ball: [
      { type: "pass", t0: 0, t1: T_KICK, from: [41.5, .22, 0], to: [41.5, .22, 0] },
      { type: "pass", t0: T_KICK, t1: T_HIT, from: [41.5, .22, 0], to: [52.6, h, z], ease: 2.1 },
      { type: "pass", t0: T_HIT, t1: DUR, from: [52.6, h, z], to: ballEnd, ease: 1.6, bounce: 1, bh: .3 },
    ],
    acts,
    cam: [
      { t0: 0, t1: T_KICK, pos: [27.5, 3.4, 12.0], pos1: [32.0, 2.8, 9.0], look: "ball", fov: 44, fov1: 38, smooth: .2 },
      { t0: T_KICK, t1: T_HIT + .5, pos: [60.5, 3.4, 0.5], pos1: [58.0, 3.1, 0.5], look: "ball", fov: 42, fov1: 38, smooth: .3 },
      { t0: T_HIT + .5, look: scored ? `${team}:${shooter.rig}` : `${other}:${keeper.rig}`, rel: [-3.0, 1.8, 7.5], rel1: [-1.6, 1.7, 6.0], fov: 35, smooth: .25 },
    ],
  };
}

// --- the winners' celebration: one scene at the end, the whole XI piling in on the hero ---
function teamCelebration({ win, lose, winXI, loseGK, hero, score, kicks }) {
  const GX = 36, GZ = 0, DUR = 6.4, paths = {}, acts = [];
  const H = hero || winXI[0], rest = winXI.filter(p => p !== H);
  // the hero waits at the gather point, arms wide, bouncing
  paths[`${win}:${H.rig}#${H.num}`] = [[0, GX - 3.0, GZ], [DUR * .35, GX - .6, GZ], [DUR, GX, GZ]];
  acts.push({ type: "wide2", p: [win, H.rig], t0: .1 },
             { type: "hop", p: [win, H.rig], t0: 1.5, h: .30 },
             { type: "face", p: [win, H.rig], t0: 0, t1: DUR, yaw: Math.atan2(1, .62) });   // towards the camera
  rest.forEach((p, i) => {
    const ang = (i / rest.length) * Math.PI * 2 + .6, r0 = 11 + (i % 3) * 3.5, r1 = 1.15 + (i % 4) * .33;
    const ar = 1.9 + i * .22;                                     // they arrive one after another, not as a wall
    paths[`${win}:${p.rig}#${p.num}`] = [
      [0,  GX + Math.sin(ang) * r0,        GZ + Math.cos(ang) * r0],
      [ar, GX + Math.sin(ang) * (r1 + .9), GZ + Math.cos(ang) * (r1 + .9)],
      [DUR, GX + Math.sin(ang) * r1,       GZ + Math.cos(ang) * r1]];
    acts.push({ type: "face", p: [win, p.rig], t0: ar - .35, t1: DUR, at: [GX, GZ] },   // everyone turns inwards
               { type: "wide2", p: [win, p.rig], t0: Math.max(.2, ar - .5) },
               { type: "hop", p: [win, p.rig], t0: ar + .15, h: .26 });
  });
  if (loseGK) acts.push({ type: "slump", p: [lose, loseGK.rig], t0: .2 });
  return {
    minute: 90 + kicks, kicks, team: win, scorer: "", num: "", handle: "",
    before: score, after: score, dirZ: 1, dirS: -1, dur: DUR, tGoal: 999, pen: true, scored: false, celebration: true,
    paths,
    ball: [{ type: "pass", t0: 0, t1: DUR, from: [52.0, .22, 7.5], to: [52.0, .22, 7.5] }],
    acts,
    cam: [
      { t0: 0, t1: DUR * .45, pos: [GX + 13.5, 3.4, 12.0], pos1: [GX + 11.5, 2.9, 10.2], look: [GX, 1.35, GZ], fov: 40, fov1: 38, smooth: .18 },
      { t0: DUR * .45, pos: [GX + 10.5, 2.6, 9.2], pos1: [GX + 8.6, 2.15, 7.6], look: [GX, 1.3, GZ], fov: 38, fov1: 36, smooth: .2 },
    ],
  };
}

function buildShootout(homeName, awayName, seed) {
  const H = club(homeName), A = club(awayName);
  const pick = t => t.xi.map(p => ({ rig: rigName(p.u), num: String(p.n), u: p.u, pos: p.spot }));
  const hx = pick(H), ax = pick(A);
  const takers = t => t.filter(p => p.pos !== "GK").slice(0, 5);
  const gk = t => t.find(p => p.pos === "GK");
  const r = rng(seed); let goals = [];
  let hScore = 0, aScore = 0;
  const order = [];
  for (let i = 0; i < 5; i++) { order.push(["Z", takers(hx)[i], gk(ax)]); order.push(["S", takers(ax)[i], gk(hx)]); }
  const outfield = t => t.filter(p => p.pos !== "GK");
  for (let i = 0; i < 6; i++) {                        // sudden death, trimmed later once a side is clear
    order.push(["Z", outfield(hx)[(5 + i) % outfield(hx).length], gk(ax)]);
    order.push(["S", outfield(ax)[(5 + i) % outfield(ax).length], gk(hx)]);
  }
  order.forEach(([team, shooter, keeper], i) => {
    const corner = [-1, 1, -1, 1, 0][Math.floor(r() * 5) % 5] || (r() < .5 ? -1 : 1);
    const diveDir = r() < .5 ? -1 : 1;
    const scored = r() < 0.74 && !(diveDir === corner && r() < 0.55);
    const before = [hScore, aScore];
    if (scored) { if (team === "Z") hScore++; else aScore++; }
    goals.push(kick({ shooter, keeper, team, other: team === "Z" ? "S" : "Z", idx: i + 1, scored, corner, diveDir,
                      score: { before, after: [hScore, aScore] } }));
  });
  // cut the shootout as soon as it is decided: after five each, or on the first miss in sudden death
  let hh = 0, aa = 0, end = goals.length;
  for (let i = 0; i < goals.length; i++) {
    const g = goals[i]; if (g.team === "Z") hh = g.after[0]; else aa = g.after[1];
    const pairs = Math.floor((i + 1) / 2), bothDone = (i + 1) % 2 === 0;
    const left = (side) => Math.max(0, 5 - (side === "Z" ? Math.ceil((i + 1) / 2) : Math.floor((i + 1) / 2)));
    if (pairs < 5) { if (hh - aa > left("S") || aa - hh > left("Z")) { end = i + 1; break; } }      // already out of reach
    else if (bothDone && hh !== aa) { end = i + 1; break; }
  }
  goals = goals.slice(0, end);
  const last = goals[goals.length - 1], score = [last.after[0], last.after[1]];
  const win = score[0] > score[1] ? "Z" : "S";
  const winXI = win === "Z" ? hx : ax;
  const hero = winXI.find(p => p.rig === last.scorer && last.team === win) || winXI.find(p => p.pos === "GK") || winXI[0];
  goals.push(teamCelebration({ win, lose: win === "Z" ? "S" : "Z", winXI, hero,
                               loseGK: gk(win === "Z" ? ax : hx), score, kicks: goals.length }));
  return { CUP: { home: H, away: A, seed }, GOALS: goals, result: score };
}
module.exports = { buildShootout, club, KIT, rigName };
