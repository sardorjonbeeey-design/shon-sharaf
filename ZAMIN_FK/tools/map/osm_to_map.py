"""Real-town map for the ZAMIN FK city.
1) fetch:  python3 osm_to_map.py fetch <out_dir> <lat> <lon> [radius_m]   (OSM API, 3x3 tiles, needs api.openstreetmap.org)
2) build:  python3 osm_to_map.py build <out_dir> <stadium_way_id> <out.json> [name]
Output: local metres, origin = real pitch centre, x along the pitch (east-ish), z = south. 1 unit = 1 m, same as the 3D stadium."""
import json, glob, math, sys, os, time, urllib.request

def fetch(out, lat, lon, r=1300):
    os.makedirs(out, exist_ok=True)
    dlat, dlon = r / 110540, r / (111320 * math.cos(math.radians(lat)))
    W, E, S, N = lon - dlon, lon + dlon, lat - dlat, lat + dlat
    k = 0
    for i in range(3):
        for j in range(3):
            k += 1
            b = f"{W+(E-W)*i/3:.5f},{S+(N-S)*j/3:.5f},{W+(E-W)*(i+1)/3:.5f},{S+(N-S)*(j+1)/3:.5f}"
            req = urllib.request.Request(f"https://api.openstreetmap.org/api/0.6/map.json?bbox={b}", headers={"User-Agent": "zaminfk-city-builder/1.0"})
            open(f"{out}/t{k}.json", "wb").write(urllib.request.urlopen(req, timeout=180).read()); time.sleep(1)

def build(src, stadium_id, outp, name="Kattaqo‘rg‘on"):
    nodes, ways = {}, {}
    for f in sorted(glob.glob(src + "/t*.json")):
        for e in json.load(open(f))["elements"]:
            if e["type"] == "node": nodes[e["id"]] = e
            elif e["type"] == "way": ways[e["id"]] = e
    pts = lambda w: [(nodes[n]["lat"], nodes[n]["lon"]) for n in w["nodes"] if n in nodes]
    st = ways[stadium_id]
    pitch = min((w for w in ways.values() if w.get("tags", {}).get("leisure") == "pitch"),
                key=lambda w: abs(sum(p[0] for p in pts(w)) / len(pts(w)) - sum(p[0] for p in pts(st)) / len(pts(st))) + abs(sum(p[1] for p in pts(w)) / len(pts(w)) - sum(p[1] for p in pts(st)) / len(pts(st))))
    pp = pts(pitch)[:-1]
    lat0, lon0 = sum(p[0] for p in pp) / len(pp), sum(p[1] for p in pp) / len(pp)
    kx, kz = 111320 * math.cos(math.radians(lat0)), 110540
    raw = lambda p: ((p[1] - lon0) * kx, -(p[0] - lat0) * kz)
    # pitch long axis (PCA) -> rotate so the real pitch lies along x like the 3D stadium
    xs = [raw(p) for p in pp]
    sxx = sum(x * x for x, z in xs); szz = sum(z * z for x, z in xs); sxz = sum(x * z for x, z in xs)
    ang = 0.5 * math.atan2(2 * sxz, sxx - szz)
    ca, sa = math.cos(-ang), math.sin(-ang)
    def loc(p):
        x, z = raw(p); return (round(x * ca - z * sa), round(x * sa + z * ca))
    flat = lambda ps: [c for p in ps for c in loc(p)]
    def area(ps):
        a = 0
        for i in range(len(ps)):
            x1, z1 = ps[i]; x2, z2 = ps[(i + 1) % len(ps)]; a += x1 * z2 - x2 * z1
        return abs(a) / 2
    ROAD = {"primary": 1, "primary_link": 1, "trunk": 1, "secondary": 2, "secondary_link": 2, "tertiary": 3, "tertiary_link": 3,
            "residential": 4, "living_street": 4, "unclassified": 4, "service": 5, "pedestrian": 6, "footway": 6, "path": 6}
    out = {"name": name, "lat": lat0, "lon": lon0, "rot": ang, "stadium": [loc(p) for p in pts(st)][:-1], "roads": [], "buildings": [], "areas": [], "water": [], "labels": []}
    for w in ways.values():
        t = w.get("tags", {}); ps = pts(w)
        if len(ps) < 2: continue
        if t.get("highway") in ROAD:
            out["roads"].append([ROAD[t["highway"]], flat(ps)])
            nm = t.get("name:uz") or t.get("name")
            if nm and ROAD[t["highway"]] <= 4: out["labels"].append([nm, *loc(ps[len(ps) // 2]), "road"])
        elif "building" in t and len(ps) >= 4:
            ring = [loc(p) for p in ps[:-1]]
            a = area(ring)
            if a < 12: continue
            b = t["building"]
            lv = t.get("building:levels")
            try: lv = max(1, min(16, int(float(lv))))
            except Exception: lv = 0
            kind = ("house" if b in ("house", "residential", "detached", "yes") and a < 450 else
                    "flat" if b == "apartments" else
                    "mosque" if t.get("amenity") == "place_of_worship" or b == "mosque" else
                    "school" if b in ("school", "kindergarten", "college", "техникум") or t.get("amenity") in ("school", "college", "kindergarten") else
                    "public")
            out["buildings"].append([kind, lv, flat(ps[:-1])])
            nm = t.get("name:uz") or t.get("name")
            if nm and kind != "house": out["labels"].append([nm, *loc(ps[0]), kind])
        elif t.get("waterway") in ("canal", "river", "stream", "ditch"):
            out["water"].append([8 if t["waterway"] in ("canal", "river") else 3, flat(ps)])
        elif t.get("natural") == "water" or t.get("landuse") in ("grass", "cemetery", "farmland", "orchard", "industrial") or t.get("leisure") in ("park", "garden", "pitch", "sports_centre"):
            k = t.get("leisure") or t.get("landuse") or "water"
            if w["id"] in (stadium_id, pitch["id"]): continue
            out["areas"].append([k, flat(ps[:-1])])
            nm = t.get("name:uz") or t.get("name")
            if nm: out["labels"].append([nm, *loc(ps[0]), k])
    # one label per name
    seen, labs = set(), []
    for l in out["labels"]:
        if l[0] not in seen: seen.add(l[0]); labs.append(l)
    out["labels"] = labs
    json.dump(out, open(outp, "w"), ensure_ascii=False, separators=(",", ":"))
    xs = [p[0] for p in out["stadium"]]; zs = [p[1] for p in out["stadium"]]
    print(outp, round(os.path.getsize(outp) / 1024), "KB", len(out["buildings"]), "buildings", len(out["roads"]), "roads",
          "stadium extent", round(max(xs) - min(xs)), "x", round(max(zs) - min(zs)), "rot", round(math.degrees(ang), 1))

if __name__ == "__main__":
    a = sys.argv
    if a[1] == "fetch": fetch(a[2], float(a[3]), float(a[4]), float(a[5]) if len(a) > 5 else 1300)
    else: build(a[2], int(a[3]), a[4], *(a[5:6]))
