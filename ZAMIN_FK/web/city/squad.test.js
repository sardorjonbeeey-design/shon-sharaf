const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSquadProposal } = require("./club");

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
  for (let i = 0; i < 2; i++) rows.push({ tg_id: String(id), name: "GK " + id, applied_position: "GK", xp: 500 - id++ });
  for (let i = 0; i < 8; i++) rows.push({ tg_id: String(id), name: "DEF " + id, applied_position: "DEF", xp: 300 - i, });
  rows.push({ tg_id: String(id), name: "DEF overflow", applied_position: "DEF", xp: 100 }); id++;
  for (let i = 0; i < 5; i++) rows.push({ tg_id: String(id), name: "MID " + id, applied_position: "MID", xp: 10 - i++ });
  for (let i = 0; i < 6; i++) rows.push({ tg_id: String(id), name: "FWD " + id, applied_position: "FWD", xp: 50 - i++ });

  const result = buildSquadProposal(rows);
  const moved = result.active.find(p => p.name === "DEF overflow");
  assert.equal(result.active_count, 22);
  assert.equal(moved.assigned_group, "MID");
  assert.equal(moved.reassigned, true);
  assert.equal(moved.stadium_position, "CDM");
  assert.equal(moved.squad_role, "starter");
});
