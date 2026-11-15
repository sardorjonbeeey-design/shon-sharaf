-- Read-only checks run BEFORE residential_lots.mjs (no writes; safe to run in any SQL client).
-- Expected at the time of writing (public /api/state): 103 homes, 102 with a lot, 1 without.

-- 1. Owned homes, including rows without a lot.
select count(*) as homes, count(lot) as with_lot, count(*) filter (where lot is null) as without_lot
from homes;

-- 2. Lot ID buckets (old fallback-grid IDs: 0..863 overlap the new map, 864..3731 are not in the map,
--    above 3731 are the three unresolved records).
select
  count(*) filter (where lot between 0 and 863)       as lot_0_863,
  count(*) filter (where lot between 864 and 3731)    as lot_864_3731,
  count(*) filter (where lot > 3731)                  as lot_above_3731,
  count(*) filter (where lot < 0)                     as negative_lots,
  count(distinct lot)                                 as distinct_lots,
  max(lot)                                            as max_lot
from homes;

-- 3. Unresolved records to preserve untouched (IDs 4007, 4063, 4094).
select tg_id, lot, level, created_at, updated_at from homes where lot in (4007, 4063, 4094) order by lot;

-- 4. The level-7 home without a lot (preserved, left unplaced).
select tg_id, level, style, color, car, created_at, upgraded_at from homes where lot is null order by tg_id;

-- 5. Integrity: the unique index must already hold (duplicate lots would make the migration fail).
select lot, count(*) from homes where lot is not null group by lot having count(*) > 1;   -- expect 0 rows
