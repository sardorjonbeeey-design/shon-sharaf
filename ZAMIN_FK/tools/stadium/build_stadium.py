"""ZAMIN FK virtual stand: every follower = one fan sprite on a seat, picked by username.

Usage: python3 build_stadium.py fans.json out.png [--new N] [--bg plate.png]
fans.json: [{"username": "ali_01", "consent": true}, ...] in follow order.
Only fans with consent=true get a visible username tag; everyone else is shown as an anonymous fan.
The same username always gets the same look and (for a given crowd size) the same seat.
"""
import hashlib, json, math, os, sys
from PIL import Image, ImageDraw, ImageFont

Z = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPR = os.path.join(Z, "01_Art_Direction", "Sprites", "fans")
FONT = "/usr/share/fonts/opentype/montserrat/Montserrat-Black.otf"
W, H = 1080, 1920
ROWS = [700, 780, 870, 975, 1115]      # y of each tier's seating edge on BG_stand_empty (back -> front)
BASE_H, BASE_PER_ROW = 190, 11

args = sys.argv[1:]
fans_path, out = args[0], args[1]
new_n = int(args[args.index("--new") + 1]) if "--new" in args else 0
bg_path = args[args.index("--bg") + 1] if "--bg" in args else os.path.join(Z, "02_Episode_01", "assets", "BG_stand_empty.png")

fans = json.load(open(fans_path))
names = sorted(f for f in os.listdir(SPR) if f.endswith(".png"))
cache = {nm: Image.open(os.path.join(SPR, nm)).convert("RGBA") for nm in names}
h = lambda s: int(hashlib.sha256(s.lower().encode()).hexdigest(), 16)

n = len(fans)
cap0 = BASE_PER_ROW * len(ROWS)
scale = 1.0 if n <= cap0 else max(0.45, math.sqrt(cap0 / n))
per_row = int(BASE_PER_ROW / scale)
fan_h = int(BASE_H * scale)
seats = [(r, c) for r in range(len(ROWS)) for c in range(per_row)]
shown = fans[:len(seats)]
overflow = n - len(shown)

taken, placed = set(), []
for i, f in enumerate(shown):
    k = h(f["username"])
    s = k % len(seats)
    while s in taken:
        s = (s + 1) % len(seats)
    taken.add(s)
    placed.append((seats[s], k, f, i >= n - new_n))

bg = Image.open(bg_path).convert("RGBA").resize((W, H), Image.LANCZOS)
font = ImageFont.truetype(FONT, max(18, int(26 * scale)))
tags = []
for (r, c), k, f, is_new in sorted(placed, key=lambda p: p[0][0]):
    if not f.get("look") or f["look"] not in cache:
        f["look"] = names[(k >> 8) % len(names)]          # assigned once, then saved with the fan
    sp = cache[f["look"]]
    if (k >> 16) & 1:
        sp = sp.transpose(Image.FLIP_LEFT_RIGHT)
    hh = int(fan_h * (0.92 + ((k >> 20) % 17) / 100))
    ww = int(sp.width * hh / sp.height)
    sp = sp.resize((ww, hh), Image.LANCZOS)
    slot = W / per_row
    x = int(slot * (c + 0.5) - ww / 2 + ((k >> 28) % 21 - 10) * scale)
    y = ROWS[r] - hh + int(hh * 0.08)
    shadow = Image.new("RGBA", sp.size, (0, 0, 0, 0))
    shadow.putalpha(sp.getchannel("A").point(lambda v: v * 0.35))
    bg.alpha_composite(shadow, (x + 6, y + 8))
    bg.alpha_composite(sp, (x, y))
    if f.get("consent") and is_new:
        tags.append((x + ww // 2, y - 6, "@" + f["username"], is_new))

d = ImageDraw.Draw(bg)
boxes = []
for cx, y, txt, is_new in sorted(tags, key=lambda t: t[1]):
    tw = d.textlength(txt, font=font)
    pad = 10 * scale + 4
    bw, bh = tw + 2 * pad, font.size + pad * 1.2
    x0 = min(max(cx - bw / 2, 12), W - 170 - bw)          # keep clear of the right-hand app buttons
    y1 = y
    while any(not (x0 + bw < b[0] or x0 > b[2] or y1 < b[1] or y1 - bh > b[3]) for b in boxes):
        y1 -= bh + 6                                       # stack upward instead of overlapping
    box = [x0, y1 - bh, x0 + bw, y1]
    boxes.append(box)
    d.line([(cx, y), (cx, y1)], fill=(13, 37, 87), width=3)
    cx = x0 + bw / 2
    d.rounded_rectangle(box, radius=10, fill=(255, 210, 63) if is_new else (13, 37, 87), outline=(13, 37, 87) if is_new else (255, 255, 255), width=3)
    d.text((cx - tw / 2, box[1] + pad * 0.5), txt, font=font, fill=(13, 37, 87) if is_new else (255, 255, 255))

# counter
big = ImageFont.truetype(FONT, 110); small = ImageFont.truetype(FONT, 30)
d.rounded_rectangle([60, 150, 400, 400], radius=28, fill=(13, 37, 87), outline=(255, 255, 255), width=5)
d.text((230, 190), "MUXLISLAR", font=small, fill=(255, 255, 255), anchor="mm")
d.text((230, 290), f"{n:,}".replace(",", " "), font=big, fill=(255, 255, 255), anchor="mm")
d.text((230, 370), "VIRTUAL", font=small, fill=(157, 184, 255), anchor="mm")
if overflow > 0:
    d.rounded_rectangle([700, 1180, 1020, 1260], radius=18, fill=(255, 210, 63), outline=(13, 37, 87), width=4)
    d.text((860, 1220), f"+{overflow} muxlis", font=ImageFont.truetype(FONT, 40), fill=(13, 37, 87), anchor="mm")
bg.convert("RGB").save(out)
json.dump(fans, open(fans_path, "w"), ensure_ascii=False, indent=1)   # persist looks
print(out, f"fans={n} shown={len(shown)} scale={scale:.2f} tags={len(tags)}")
