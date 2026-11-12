const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSquadProposal, validateSquadSnapshot, assignSquadNumbers, mergeLineupWithRoster } = require("./club");

const QUOTAS = { GK: 2, DEF: 8, MID: 6, FWD: 6 };

function players(counts = QUOTAS, xpStart = 1000) {
  const rows = [];
  let n = 1;
  for (const group of ["GK", "DEF", "MID", "FWD"]) {
    for (let i = 0; i < (counts[group] || 0); i++) {
      rows.push({
        tg_id: String(n),
        name: "Player " + n,
        applied_position: group,
        xp: xpStart - n,
        created_at: "2026-01-01T00:00:00.000Z",
      });
      n++;
    }
  }
  return rows;
}

test("22 eligible players produce 11 starters and 11 substitutes", () => {
  const result = buildSquadProposal(players());
  assert.equal(result.eligible_count, 22);
  assert.equal(result.active_count, 22);
  assert.equal(result.reserve_count, 0);
  assert.equal(result.shortfall, 0);
  assert.equal(result.active.filter(p => p.squad_role === "starter").length, 11);
  assert.equal(result.active.filter(p => p.squad_role === "substitute").length, 11);
  assert.deepEqual(
    result.active.filter(p => p.squad_role === "starter").map(p => p.stadium_position),
    ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"]
  );
  const centreBacks = result.active.filter(p => p.squad_role === "starter" && p.stadium_position === "CB");
  assert.deepEqual(centreBacks.map(p => p.position_rank), [2, 3]);
  assert.deepEqual(
    Object.fromEntries(["GK", "DEF", "MID", "FWD"].map(g => [
      g, result.active.filter(p => p.assigned_group === g).length
    ])),
    QUOTAS
  );
});

test("24 eligible players produce 22 active players and 2 reserves", () => {
  const rows = players();
  rows.push(
    { tg_id: "23", name: "Reserve 1", applied_position: "DEF", xp: 2 },
    { tg_id: "24", name: "Reserve 2", applied_position: "DEF", xp: 1 }
  );
  const result = buildSquadProposal(rows);
  assert.equal(result.active_count, 22);
  assert.equal(result.reserve_count, 2);
  assert.deepEqual(result.reserves.map(p => p.tg_id), ["23", "24"]);
});

test("more than 24 eligible players never exceed the active and reserve limits", () => {
  const rows = players();
  for (let i = 23; i <= 30; i++) {
    rows.push({ tg_id: String(i), name: "Extra " + i, applied_position: "DEF", xp: 100 - i });
  }
  const result = buildSquadProposal(rows);
  assert.equal(result.eligible_count, 30);
  assert.equal(result.active_count, 22);
  assert.equal(result.reserve_count, 2);
  assert.equal(result.active.length + result.reserves.length, 24);
});

test("shortage is reported instead of inventing players", () => {
  const result = buildSquadProposal(players({ GK: 2, DEF: 8, MID: 6, FWD: 2 }));
  assert.equal(result.eligible_count, 18);
  assert.equal(result.active_count, 18);
  assert.equal(result.shortfall, 4);
  assert.equal(result.active.length, 18);
});

test("duplicate Telegram IDs are collapsed and the newest application is retained", () => {
  const rows = players();
  const id = rows[0].tg_id;
  rows.push({
    tg_id: id,
    name: "Newest application",
    applied_position: "GK",
    xp: 9999,
    created_at: "2026-02-01T00:00:00.000Z",
  });
  const result = buildSquadProposal(rows);
  assert.equal(result.eligible_count, 22);
  assert.equal(result.active.filter(p => p.tg_id === id).length, 1);
  assert.equal(result.active.find(p => p.tg_id === id).name, "Newest application");
});

test("invalid applied positions are excluded", () => {
  const rows = players();
  rows.push({ tg_id: "invalid", name: "Invalid", applied_position: "STRIKER", xp: 99999 });
  const result = buildSquadProposal(rows);
  assert.equal(result.eligible_count, 22);
  assert.equal(result.active.some(p => p.tg_id === "invalid"), false);
});

test("overflow can fill a genuine vacancy and then competes by XP in the destination group", () => {
  const rows = [];
  let id = 1;
  for (let i = 0; i < 2; i++) {
    rows.push({ tg_id: String(id), name: "GK " + id, applied_position: "GK", xp: 500 - id });
    id++;
  }
  for (let i = 0; i < 8; i++) {
    rows.push({ tg_id: String(id), name: "DEF " + id, applied_position: "DEF", xp: 300 - i });
    id++;
  }
  rows.push({ tg_id: String(id), name: "DEF overflow", applied_position: "DEF", xp: 100 });
  id++;
  for (let i = 0; i < 5; i++) {
    rows.push({ tg_id: String(id), name: "MID " + id, applied_position: "MID", xp: 10 - i });
    id++;
  }
  for (let i = 0; i < 6; i++) {
    rows.push({ tg_id: String(id), name: "FWD " + id, applied_position: "FWD", xp: 50 - i });
    id++;
  }

  const result = buildSquadProposal(rows);
  const moved = result.active.find(p => p.name === "DEF overflow");
  assert.equal(result.active_count, 22);
  assert.equal(moved.assigned_group, "MID");
  assert.equal(moved.reassigned, true);
  assert.equal(moved.stadium_position, "CDM");
  assert.equal(moved.squad_role, "starter");
});


test("a correctly generated full squad snapshot is approvable", () => {
  const proposal = buildSquadProposal(players());
  assert.equal(validateSquadSnapshot(proposal), true);
});

test("a correctly generated short squad snapshot is approvable with its shortfall recorded", () => {
  const proposal = buildSquadProposal(players({ GK: 2, DEF: 8, MID: 6, FWD: 2 }));
  assert.equal(validateSquadSnapshot(proposal), true);
});

test("approval validation rejects duplicate player IDs across active and reserves", () => {
  const proposal = buildSquadProposal(players({ GK: 2, DEF: 8, MID: 6, FWD: 8 }));
  proposal.reserves[0].tg_id = proposal.active[0].tg_id;
  assert.equal(validateSquadSnapshot(proposal), false);
});

test("approval validation rejects inconsistent counts and invalid stadium positions", () => {
  const proposal = buildSquadProposal(players());
  proposal.active_count = 21;
  assert.equal(validateSquadSnapshot(proposal), false);

  const badPosition = buildSquadProposal(players());
  badPosition.active[0].stadium_position = "ST";
  assert.equal(validateSquadSnapshot(badPosition), false);
});

test("approval validation rejects duplicate position slots", () => {
  const proposal = buildSquadProposal(players());
  const defenders = proposal.active.filter(p => p.assigned_group === "DEF");
  defenders[1].position_rank = defenders[0].position_rank;
  assert.equal(validateSquadSnapshot(proposal), false);
});


test("applied group slots stay protected even when another group has much higher XP", () => {
  const rows = players();
  rows.find(p => p.applied_position === "GK").xp = 1;
  rows.find(p => p.applied_position === "DEF").xp = 999999;
  const result = buildSquadProposal(rows);
  assert.equal(result.active.find(p => p.applied_position === "GK").assigned_group, "GK");
  assert.equal(result.active.find(p => p.applied_position === "DEF").assigned_group, "DEF");
});

test("XP determines the exact slot order within an applied group", () => {
  const rows = players();
  const defenders = rows.filter(p => p.applied_position === "DEF");
  defenders.forEach((p, i) => { p.xp = i + 1; });
  const result = buildSquadProposal(rows);
  const ranked = result.active.filter(p => p.assigned_group === "DEF").sort((a, b) => a.position_rank - b.position_rank);
  assert.equal(ranked[0].xp, 8);
  assert.equal(ranked[0].stadium_position, "LB");
  assert.equal(ranked[1].xp, 7);
  assert.equal(ranked[1].stadium_position, "CB");
});

test("remaining reserve places are assigned by descending XP", () => {
  const rows = players();
  rows.push(
    { tg_id: "23", name: "Reserve lower", applied_position: "DEF", xp: 5 },
    { tg_id: "24", name: "Reserve higher", applied_position: "DEF", xp: 50 }
  );
  const result = buildSquadProposal(rows);
  assert.deepEqual(result.reserves.map(p => p.name), ["Reserve higher", "Reserve lower"]);
});

// ---------- manual line-up (Mini App admin panel) ----------
const { normalizeLineup, lineupFromRoster, lineupFeed, LINEUP_SLOTS } = require("./club");
const cards = require("./cards");
const fullLineup = () => ({
  starters: LINEUP_SLOTS.map((slot, i) => ({ slot, name: "Starter " + slot, number: i + 1 })),
  bench: [{ name: "Sub One", number: 30 }, { name: "  ", number: 31 }, { name: "Sub Two", number: "" }]
});

test("manual line-up keeps eleven slots in order and drops empty bench rows", () => {
  const input = fullLineup(); input.starters.reverse();
  const out = normalizeLineup(input);
  assert.deepEqual(out.starters.map(p => p.slot), LINEUP_SLOTS);
  assert.deepEqual(out.bench, [{ name: "Sub One", number: 30 }, { name: "Sub Two", number: null }]);
});

test("manual line-up rejects duplicate or out-of-range shirt numbers and unknown slots", () => {
  const dup = fullLineup(); dup.bench[0].number = 1;
  assert.throws(() => normalizeLineup(dup), /duplicate number/);
  const range = fullLineup(); range.starters[0].number = 100;
  assert.throws(() => normalizeLineup(range), /invalid number/);
  const slot = fullLineup(); slot.starters[0].slot = "XX";
  assert.throws(() => normalizeLineup(slot), /invalid slot/);
  assert.throws(() => normalizeLineup({ starters: [] }), /invalid lineup/);
});

test("manual line-up feed places both centre-backs and marks the bench as substitutes", () => {
  const feed = lineupFeed(normalizeLineup(fullLineup()));
  const starters = feed.filter(p => p.squad_role === "starter");
  assert.equal(starters.length, 11);
  assert.deepEqual(starters.filter(p => p.position === "CB").map(p => p.position_rank), [2, 3]);
  assert.equal(starters[0].number, 1);
  assert.deepEqual(feed.filter(p => p.squad_role === "substitute").map(p => p.name), ["Sub One", "Sub Two"]);
});

test("an approved snapshot maps onto the line-up slots", () => {
  const proposal = buildSquadProposal(players());
  const lineup = lineupFromRoster(proposal.active);
  assert.equal(lineup.starters.filter(p => p.name).length, 11);
  assert.equal(lineup.bench.length, 11);
  assert.doesNotThrow(() => normalizeLineup(lineup));
});


// ---------- automatic shirt-number assignment ----------
test("shirt numbers reserve 1 and 25 for goalkeepers and 7, 9, 10, 11 for the four main forwards", () => {
  const rows = players();
  rows.push(
    { tg_id: "23", name: "Extra Defender 23", applied_position: "DEF", xp: 30 },
    { tg_id: "24", name: "Extra Defender 24", applied_position: "DEF", xp: 20 }
  );
  const proposal = buildSquadProposal(rows);
  const numbered = assignSquadNumbers(proposal, {}, () => 0);
  const all = [...numbered.active, ...numbered.reserves];
  const keepers = all.filter(p => p.applied_position === "GK").sort((a,b) => a.position_rank-b.position_rank);
  assert.equal(keepers[0].shirt_number, 1);
  assert.equal(keepers[1].shirt_number, 25);
  const forwards = all.filter(p => p.applied_position === "FWD").sort((a,b) => a.position_rank-b.position_rank);
  assert.deepEqual(forwards.slice(0,4).map(p => p.shirt_number), [7,9,10,11]);
  const assigned = all.map(p => p.shirt_number);
  assert.equal(new Set(assigned).size, assigned.length);
  assert.equal(assigned.every(n => Number.isInteger(n) && n >= 1 && n <= 25), true);
});

test("existing player shirt numbers remain stable on the next automatic refresh", () => {
  const proposal = buildSquadProposal(players());
  const first = assignSquadNumbers(proposal, {}, () => 0.42);
  const previous = Object.fromEntries([...first.active, ...first.reserves].map(p => [p.tg_id, p.shirt_number]));
  const second = assignSquadNumbers(proposal, previous, () => 0.99);
  assert.deepEqual(
    [...second.active, ...second.reserves].map(p => [p.tg_id, p.shirt_number]),
    [...first.active, ...first.reserves].map(p => [p.tg_id, p.shirt_number])
  );
});

test("automatic lineup reconciliation preserves valid manual selections and fills departed slots", () => {
  const proposal = assignSquadNumbers(buildSquadProposal(players()), {}, () => 0.2);
  const original = {
    starters: LINEUP_SLOTS.map((slot, i) => ({
      slot,
      name: proposal.active[i].name,
      number: proposal.active[i].shirt_number,
      tg_id: proposal.active[i].tg_id
    })),
    bench: proposal.active.slice(11).map(p => ({ name: p.name, number: p.shirt_number, tg_id: p.tg_id }))
  };
  const keep = original.starters[0].name;
  const removedId = original.starters[1].tg_id;
  const changed = {
    ...proposal,
    active: proposal.active.filter(p => p.tg_id !== removedId)
  };
  const merged = mergeLineupWithRoster(original, changed);
  assert.equal(merged.starters[0].name, keep);
  assert.equal(merged.starters[1].name === original.starters[1].name, false);
  assert.equal(merged.starters.filter(p => p.name).length, 11);
  assert.equal(new Set(merged.starters.filter(p => p.tg_id).map(p => p.tg_id)).size, 11);
});


test("the admin lineup loader preserves automatic shirt numbers and player IDs", () => {
  const numbered = assignSquadNumbers(buildSquadProposal(players()), {}, () => 0.25);
  const lineup = lineupFromRoster(numbered.active);
  const keeper = lineup.starters.find(p => p.slot === "GK");
  assert.equal(keeper.number, 1);
  assert.equal(keeper.tg_id, numbered.active.find(p => p.applied_position === "GK").tg_id);
});

// CHANGE LOG:
 // OLD: this test used "Poster Test Forward" (19 characters), then expected the full
 //      value in the SVG even though the pitch label intentionally shortens names to 18.
 // NEW: use names that fit the actual pitch-label limit, so the test verifies live name
 //      insertion rather than failing on the renderer's intentional display truncation.
 // WHY: long names are still safely shortened by fit(); this test should cover data wiring,
 //      not reject the visual layout's existing text-fit rule.
test("Today's Squad SVG template inserts live player names and shirt numbers", () => {
  const svg = cards.squadSvg({
    active: [
      { name: "Poster Forward", shirt_number: 9, squad_role: "starter", stadium_position: "ST" },
      { name: "Poster Keeper", shirt_number: 1, squad_role: "starter", stadium_position: "GK" }
    ],
    reserves: [{ name: "Poster Reserve", shirt_number: 25, applied_position: "GK" }]
  });
  assert.match(svg, /ASOSIY TARKIB/);
  assert.match(svg, /4-3-3/);
  assert.match(svg, /STARTING XI/);
  assert.match(svg, /Poster Forward/);
  assert.match(svg, /Poster Keeper/);
  assert.match(svg, /Poster Reserve/);
  assert.match(svg, />9</);
  assert.match(svg, />25</);
});
