// Shared stadium model — used by the browser (index.html) and the API (api/*.js).

export const FUND_PER_FOLLOWER = 10000; // UZS
export const SEAT = 4;   // seat size (SVG units)
export const GAP = 1;    // gap between seats
export const STEP = SEAT + GAP;

// Long stands (N/S) run along the pitch, short stands (E/W) behind the goals.
export const STANDS = {
  N: { label: "Shimoliy tribuna", seatsPerRow: 50 },
  S: { label: "Janubiy tribuna", seatsPerRow: 50 },
  E: { label: "Sharqiy tribuna", seatsPerRow: 30 },
  W: { label: "G'arbiy tribuna", seatsPerRow: 30 },
};
export const STAND_ORDER = ["N", "S", "E", "W"];

// Each tier opens rows per stand. Capacity is derived from the layout.
export const TIERS = [
  {
    name: "4-Divizion: Oddiy Maydon",
    desc: "Tuproq maydon, bitta kichik tribuna. Muxlislar asosan tik turibdi.",
    rows: { N: 2, S: 0, E: 0, W: 0 },
    seat: "wood",
  },
  {
    name: "4-Divizion: Yog'och Tribuna",
    desc: "Ilk mablag'lar evaziga yog'och o'rindiqlar, yo'l va avtoturargoh qurildi.",
    rows: { N: 4, S: 2, E: 0, W: 0 },
    seat: "wood",
  },
  {
    name: "3-Divizion Sari: Plastik Stadion",
    desc: "Ko'k-oq plastik o'rindiqlar, projektorlar va avtobus bekati. Mahalla rivojlanmoqda.",
    rows: { N: 6, S: 6, E: 2, W: 2 },
    seat: "plastic",
  },
  {
    name: "Professional Arena",
    desc: "To'liq yopiq tribunalar, tungi yoritish va zamonaviy shahar infratuzilmasi!",
    rows: { N: 14, S: 14, E: 10, W: 10 },
    seat: "plastic",
  },
];

export const tierCapacity = (t) =>
  STAND_ORDER.reduce((sum, s) => sum + t.rows[s] * STANDS[s].seatsPerRow, 0);

// A tier unlocks once followers reach the previous tier's capacity.
export function tierFor(followers) {
  let idx = 0;
  for (let i = 1; i < TIERS.length; i++) {
    if (followers >= tierCapacity(TIERS[i - 1])) idx = i;
  }
  const tier = TIERS[idx];
  const capacity = tierCapacity(tier);
  const from = idx === 0 ? 0 : tierCapacity(TIERS[idx - 1]);
  const progress = Math.max(0, Math.min(1, (followers - from) / (capacity - from)));
  return { idx, tier, capacity, progress, next: TIERS[idx + 1] || null };
}

// Seats of a tier in fill order: closest row to the pitch first, main stand first.
export function seatOrder(tier) {
  const out = [];
  const maxRows = Math.max(...STAND_ORDER.map((s) => tier.rows[s]));
  for (let r = 0; r < maxRows; r++) {
    for (const s of STAND_ORDER) {
      if (r >= tier.rows[s]) continue;
      for (let n = 0; n < STANDS[s].seatsPerRow; n++) out.push({ section: s, row: r, number: n });
    }
  }
  return out;
}

export const seatKey = (s) => `${s.section}-${s.row}-${s.number}`;

// Geometry of the full (max) layout so the scene never shifts between tiers.
const MAX = TIERS[TIERS.length - 1].rows;
export const PITCH = { w: STANDS.N.seatsPerRow * STEP + 10, h: STANDS.E.seatsPerRow * STEP + 10 };
export const MARGIN = 70; // space for the city around the stadium
export const BOWL = {
  x: MARGIN,
  y: MARGIN,
  w: PITCH.w + (MAX.E + MAX.W) * STEP + 16,
  h: PITCH.h + (MAX.N + MAX.S) * STEP + 16,
};
export const PITCH_POS = { x: BOWL.x + 8 + MAX.W * STEP, y: BOWL.y + 8 + MAX.N * STEP };
export const SCENE = { w: BOWL.w + MARGIN * 2, h: BOWL.h + MARGIN * 2 };

export function seatXY({ section, row, number }) {
  const p = PITCH_POS;
  const off = (len, n) => (len - n * STEP) / 2; // center the row along its stand
  switch (section) {
    case "N": return { x: p.x + off(PITCH.w, STANDS.N.seatsPerRow) + number * STEP, y: p.y - (row + 1) * STEP };
    case "S": return { x: p.x + off(PITCH.w, STANDS.S.seatsPerRow) + number * STEP, y: p.y + PITCH.h + GAP + row * STEP };
    case "W": return { x: p.x - (row + 1) * STEP, y: p.y + off(PITCH.h, STANDS.W.seatsPerRow) + number * STEP };
    case "E": return { x: p.x + PITCH.w + GAP + row * STEP, y: p.y + off(PITCH.h, STANDS.E.seatsPerRow) + number * STEP };
  }
}

export function isValidSeat(tier, s) {
  return STANDS[s.section] && s.row >= 0 && s.row < tier.rows[s.section] &&
    s.number >= 0 && s.number < STANDS[s.section].seatsPerRow;
}
