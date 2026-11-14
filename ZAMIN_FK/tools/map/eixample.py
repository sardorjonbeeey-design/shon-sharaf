"""Generate a Barcelona-Eixample style town for the ZAMIN FK city (same JSON format as osm_to_map.py).

Square blocks (114 m private squares, 22 m streets, 136 m pitch) with chamfered corners on a regular grid, one diagonal avenue and a central boulevard.
Each normal block = building lots around the edge + a courtyard garden inside.
Some blocks are whole parks. Blocks near the stadium are empty fan lots ("house", level 1, shown with "+");
outer blocks are already built (apartment rows), so the town looks alive at night.
Usage: python3 eixample.py out.json
"""
import json, math, sys

# CHANGE LOG (old -> new): block side was 92 m with 22 m streets (pitch 114 m), which
# holds 12 small lots of 16 m. Residential squares are now 114 m private land with
# 22 m streets around them (pitch 136 m). Each residential square holds exactly six
# equal 38 x 57 m properties (3 columns x 2 rows). WHY: one private property per
# owner with its own driveway from the perimeter street; no street inside a square.
B, S, C = 114, 22, 14         # block side (private square), street width, corner chamfer (metres)
P = B + S                     # grid pitch (136)
PROP_W, PROP_D = 38, 57       # property size: 38 x 57 m = 2,166 m2 (six per square)
# Exclusion zones measured from the live city grid: stadium + club district box and the choyxona plaza.
CLEAR_X, CLEAR_Z = 182, 154
PLAZA_C, PLAZA_R = (0, -212), 62
N = 10                        # blocks from the centre in each direction
DEPTH = 24                    # lot depth from the street
STADIUM = (150, 130)          # half sizes kept clear for the stadium + club district

def octagon(cx, cz, h, c):
    return [(cx - h + c, cz - h), (cx + h - c, cz - h), (cx + h, cz - h + c), (cx + h, cz + h - c),
            (cx + h - c, cz + h), (cx - h + c, cz + h), (cx - h, cz + h - c), (cx - h, cz - h + c)]

flat = lambda pts: [round(v) for p in pts for v in p]
roads, buildings, areas, labels = [], [], [], []

def prop_blocked(x0, x1, z0, z1):
    # property rectangle overlaps the stadium/club box or the plaza circle
    if x1 > -CLEAR_X and x0 < CLEAR_X and z1 > -CLEAR_Z and z0 < CLEAR_Z: return True
    nx = min(max(PLAZA_C[0], x0), x1); nz = min(max(PLAZA_C[1], z0), z1)
    return math.hypot(nx - PLAZA_C[0], nz - PLAZA_C[1]) < PLAZA_R

ext = N * P + P / 2

# streets: every grid line; the centre lines are boulevards (class 2), the rest class 3
for k in range(-N, N + 1):
    s = k * P + P / 2
    for vertical in (0, 1):
        cls = 2 if k in (-1, 0) else 3
        a, b = (s, -ext), (s, ext)
        roads.append([cls, flat([a, b] if vertical else [(a[1], a[0]), (b[1], b[0])])])
# CHANGE LOG (old -> new): two diagonal avenues (class 1) crossed 12 residential properties each.
# WHY: residential squares must have no internal roads; they were removed (the grid streets stay).
labels += [["Zamin ko‘chasi", P / 2, -ext * .6, "road"],
           ["Muxlislar ko‘chasi", -ext * .6, P / 2, "road"]]

def park_block(i, j):
    if (i, j) in BIG_PARK: return True
    return (i * 7 + j * 3) % 11 == 0 and max(abs(i), abs(j)) > 2

BIG_PARK = {(i, j) for i in (3, 4) for j in (-4, -5)}           # 2x2 central park north-east of the stadium
PARK_NAMES = ["Markaziy park", "Bog‘ishamol", "Muxlislar bog‘i", "Chinor bog‘i", "Gulzor", "Yoshlar bog‘i"]
pn = 0
for i in range(-N, N + 1):
    for j in range(-N, N + 1):
        cx, cz = i * P, j * P
        if abs(cx) - B / 2 < STADIUM[0] and abs(cz) - B / 2 < STADIUM[1]: continue   # stadium + club district
        h = B / 2
        if park_block(i, j):
            if (i, j) in BIG_PARK:
                if (i, j) != (3, -5): continue
                x0, x1, z0, z1 = 3 * P - h, 4 * P + h, -5 * P - h, -4 * P + h   # one big park over 2x2 blocks (street inside removed visually by grass)
                areas.append(["park", flat([(x0 + C, z0), (x1 - C, z0), (x1, z0 + C), (x1, z1 - C), (x1 - C, z1), (x0 + C, z1), (x0, z1 - C), (x0, z0 + C)])])
                labels.append(["Markaziy park", (x0 + x1) / 2, (z0 + z1) / 2, "park"])
                roads.append([6, flat([(x0 + 10, (z0 + z1) / 2), (x1 - 10, (z0 + z1) / 2)])])
                roads.append([6, flat([((x0 + x1) / 2, z0 + 10), ((x0 + x1) / 2, z1 - 10)])])
                continue
            areas.append(["park", flat(octagon(cx, cz, h, C))])
            roads.append([6, flat([(cx - h + 8, cz - h + 8), (cx + h - 8, cz + h - 8)])])     # diagonal footpaths
            roads.append([6, flat([(cx - h + 8, cz + h - 8), (cx + h - 8, cz - h + 8)])])
            labels.append([PARK_NAMES[pn % len(PARK_NAMES)], cx, cz, "park"]); pn += 1
            continue
        # whole block is green; square, equal fan lots around the edge (grass between them), courtyard garden inside
        areas.append(["garden", flat(octagon(cx, cz, h, C))])
        if max(abs(i), abs(j)) > 6: continue                      # outer blocks stay green (future growth)
        # six equal properties: 3 columns (38 m) x 2 rows (57 m), filling the 114 m square.
        # Rows face the north and south perimeter streets; no street inside the square.
        for ox in (-PROP_W, 0, PROP_W):
            for oz in (-PROP_D / 2, PROP_D / 2):
                px, pz = cx + ox, cz + oz
                x0, x1, z0, z1 = px - PROP_W / 2, px + PROP_W / 2, pz - PROP_D / 2, pz + PROP_D / 2
                if prop_blocked(x0, x1, z0, z1): continue
                rect = [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]
                buildings.append(["house", 1, flat(rect)])

stadium = [[-STADIUM[0], -STADIUM[1]], [STADIUM[0], -STADIUM[1]], [STADIUM[0], STADIUM[1]], [-STADIUM[0], STADIUM[1]]]
out = {"name": "Zamin shahri", "lat": 39.9, "lon": 66.26, "rot": 0, "stadium": stadium,
       "roads": roads, "buildings": buildings, "areas": areas, "water": [], "labels": [[n, round(x), round(z), k] for n, x, z, k in labels]}
json.dump(out, open(sys.argv[1], "w"), ensure_ascii=False, separators=(",", ":"))
print(sys.argv[1], len(roads), "roads", len(buildings), "buildings", len(areas), "areas",
      sum(1 for b in buildings if b[0] == "house"), "fan lots")
