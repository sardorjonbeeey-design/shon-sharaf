// One-time migration: move existing home owners from the old fallback-grid lot IDs
// to the new residential property IDs (114 m squares, six 38 x 57 m properties each).
//
// CHANGE LOG (old -> new): homes.lot pointed at fallback-grid cell IDs (0..3731, and
// some older IDs above that), which the new map does not contain. The mapping
// old lot -> new property id is computed beforehand (lot_mapping.json) with
// minimum-distance one-to-one matching, restricted to the properties nearest the
// stadium. WHY: keep every owner's home and attributes while moving the lot ID.
//
// Only homes.lot changes. tg_id, nick, level, upgraded_at, style, color, car and
// created_at/updated_at are never written. Rows whose lot is not in the mapping
// (IDs 4007, 4063, 4094 and the lot-less home) are left exactly as they are.
//
// Usage (DATABASE_URL must be set; nothing is written unless --apply is given):
//   node residential_lots.mjs --mapping lot_mapping.json --backup-dir ./backups            # dry run (default)
//   node residential_lots.mjs --mapping lot_mapping.json --backup-dir ./backups --apply    # run once
//   node residential_lots.mjs --rollback ./backups/homes_<stamp>.json                      # restore lots

import fs from "node:fs";
import path from "node:path";

// Two-phase update: the partial unique index homes_lot_key forbids two rows with the same lot,
// so a direct swap can collide. Phase 1 parks each migrating lot at -(old)-1 (unique and
// never used), phase 2 moves it to its target. Both phases run in one transaction.
export async function setLots(db, pairs) {          // pairs: [{ tg, from, to }]
  for (const p of pairs) await db.query("update homes set lot = $2 where tg_id = $1 and lot = $3", [p.tg, -p.from - 1, p.from]);
  for (const p of pairs) {
    const r = await db.query("update homes set lot = $2 where tg_id = $1 and lot = $3", [p.tg, p.to, -p.from - 1]);
    if (r.affectedRows !== 1) throw new Error(`phase 2 did not place tg ${p.tg}`);
  }
}

// Fingerprint of everything except lot, so we can prove no other attribute changed.
export function fingerprint(row) {
  const { lot, ...rest } = row;
  return JSON.stringify(Object.keys(rest).sort().map(k => [k, rest[k] instanceof Date ? rest[k].toISOString() : rest[k]]));
}

export async function snapshot(db) {
  const r = await db.query("select * from homes order by tg_id");
  return r.rows.map(row => ({ ...row, tg_id: String(row.tg_id) }));
}

// Validate the plan before any write. Returns { pairs, problems }.
export function buildPlan(rows, mapping) {
  const problems = [], byTg = new Map(rows.map(r => [String(r.tg_id), r])), byLot = new Map();
  for (const r of rows) if (r.lot != null) byLot.set(Number(r.lot), r);
  const pairs = [], targets = new Set();
  for (const m of mapping.mapping) {
    const row = byLot.get(Number(m.old_lot));
    if (!row) { problems.push(`old lot ${m.old_lot} not found in homes`); continue; }
    if (String(row.tg_id) !== String(m.owner_id)) problems.push(`lot ${m.old_lot} owner mismatch`);
    if (targets.has(m.new_id)) problems.push(`duplicate target property ${m.new_id}`);
    targets.add(m.new_id);
    const holder = byLot.get(Number(m.new_id));
    if (holder && !mapping.mapping.some(x => x.old_lot === Number(holder.lot))) problems.push(`target ${m.new_id} already held by an unmapped home`);
    pairs.push({ tg: String(row.tg_id), from: Number(m.old_lot), to: Number(m.new_id) });
  }
  if ([...byTg.values()].some(r => r.lot != null && Number(r.lot) < 0)) problems.push("negative lot values exist; refusing to run");
  return { pairs, problems };
}

export async function applyPlan(db, rows, plan) {
  await db.query("begin");
  try {
    await setLots(db, plan.pairs);
    const after = await snapshot(db);
    const before = new Map(rows.map(r => [String(r.tg_id), r]));
    for (const a of after) {
      const b = before.get(a.tg_id);
      if (fingerprint(a) !== fingerprint(b)) throw new Error(`non-lot attribute changed for ${a.tg_id}`);
    }
    const expected = new Map(plan.pairs.map(p => [p.tg, p.to]));
    for (const a of after) if (expected.has(a.tg_id) && Number(a.lot) !== expected.get(a.tg_id)) throw new Error(`wrong lot for ${a.tg_id}`);
    if (after.length !== rows.length) throw new Error("row count changed");
    await db.query("commit");
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

export async function rollbackFrom(db, backupRows) {
  const current = await snapshot(db);
  const cur = new Map(current.map(r => [r.tg_id, r]));
  const pairs = backupRows.filter(b => b.lot != null && String(cur.get(b.tg_id)?.lot) !== String(b.lot))
    .map(b => ({ tg: b.tg_id, from: Number(cur.get(b.tg_id).lot), to: Number(b.lot) }));
  await db.query("begin");
  try {
    await setLots(db, pairs);
    const after = await snapshot(db);
    for (const b of backupRows) {
      const a = after.find(x => x.tg_id === b.tg_id);
      if (!a || String(a.lot ?? null) !== String(b.lot ?? null)) throw new Error(`rollback mismatch for ${b.tg_id}`);
      if (fingerprint(a) !== fingerprint(b)) throw new Error(`non-lot attribute changed for ${b.tg_id}`);
    }
    await db.query("commit");
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
  return pairs.length;
}

// CLI (only when run directly, not when imported by tests)
async function main() {
  const args = process.argv.slice(2), flag = n => args.includes(n), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
  await client.connect();
  const db = { query: async (sql, p) => { const r = await client.query(sql, p); return { rows: r.rows, affectedRows: r.rowCount }; } };
  try {
    if (opt("--rollback")) {
      const backup = JSON.parse(fs.readFileSync(opt("--rollback"), "utf8"));
      const n = await rollbackFrom(db, backup.rows);
      console.log(`rolled back ${n} lots from ${opt("--rollback")}`);
      return;
    }
    const mapping = JSON.parse(fs.readFileSync(opt("--mapping"), "utf8"));
    const rows = await snapshot(db);
    const plan = buildPlan(rows, mapping);
    console.log(`homes: ${rows.length}, with lot: ${rows.filter(r => r.lot != null).length}, to migrate: ${plan.pairs.length}, unresolved: ${mapping.unresolved_old_lots.join(", ") || "none"}`);
    if (plan.problems.length) { console.error("PLAN REJECTED:\n" + plan.problems.join("\n")); process.exitCode = 1; return; }
    if (!flag("--apply")) { console.log("dry run: no changes written"); return; }
    const dir = opt("--backup-dir") || "./backups";
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `homes_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(file, JSON.stringify({ taken_at: new Date().toISOString(), rows }, null, 1));   // backup before any write
    await applyPlan(db, rows, plan);
    console.log(`migrated ${plan.pairs.length} homes. backup: ${file}`);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith("residential_lots.mjs")) main().catch(e => { console.error(e.message); process.exit(1); });
