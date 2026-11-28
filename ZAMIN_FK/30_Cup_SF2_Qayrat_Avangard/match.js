// Seeded match result for the cup: node match.js "<HOME>" "<AWAY>" <seed>
// Scorers are drawn from the clubs' own XI, weighted by position, so the result is reproducible from the seed.
const fs = require("fs"), path = require("path");
const T = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../26_Cup_V3_Tarkib/build/teams.json"), "utf8"));
const W = { ST: 34, LW: 16, RW: 16, CMC: 14, CML: 7, CMR: 7, LB: 2, RB: 2, CB1: 1, CB2: 1, GK: 0 };
const rng = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const club = n => { const c = T.find(t => t.club === n); if (!c) throw new Error("no club " + n); return c; };
const [H, A, SEED] = [process.argv[2], process.argv[3], +process.argv[4]];
const r = rng(SEED >>> 0);
const pick = c => { const pool = c.xi.filter(p => W[p.spot] > 0);
  const tot = pool.reduce((s, p) => s + W[p.spot], 0); let x = r() * tot;
  for (const p of pool) { x -= W[p.spot]; if (x <= 0) return p; } return pool[pool.length - 1]; };
const goals = 2 + Math.floor(r() * 4);                      // 2..5 goals in the match
const mins = Array.from({ length: goals }, () => 3 + Math.floor(r() * 87)).sort((a, b) => a - b);
let hs = 0, as = 0; const log = [];
for (const m of mins) {
  const home = r() < 0.52; const c = club(home ? H : A), p = pick(c);
  if (home) hs++; else as++;
  log.push({ min: m, club: c.club, u: p.u, num: p.n, spot: p.spot, score: [hs, as] });
}
if (hs === as) {                                            // a semifinal needs a winner: one late goal
  const home = r() < 0.5, c = club(home ? H : A), p = pick(c), m = Math.min(90, mins[mins.length - 1] + 2 + Math.floor(r() * 6));
  home ? hs++ : as++; log.push({ min: m, club: c.club, u: p.u, num: p.n, spot: p.spot, score: [hs, as] });
}
console.log(JSON.stringify({ seed: SEED, home: H, away: A, result: [hs, as], winner: hs > as ? H : A, goals: log }, null, 1));
