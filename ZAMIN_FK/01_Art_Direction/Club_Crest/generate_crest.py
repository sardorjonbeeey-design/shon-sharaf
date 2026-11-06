"""Generate ZAMIN FK crest SVGs (P, M1, M2, S) per ZFK_CREST_SPEC_V01.
Text is converted to outlines from Montserrat Black."""
import math, sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = sys.argv[1]
FONT_PATH = "/usr/share/fonts/opentype/montserrat/Montserrat-Black.otf"
BLUE, NAVY, WHITE = "#1F4FB8", "#0D2557", "#FFFFFF"
W, H = 500, 600
HORIZON = 392

font = TTFont(FONT_PATH)
gs = font.getGlyphSet()
cmap = font.getBestCmap()
UPM = font["head"].unitsPerEm

def text_path(txt, cx, baseline, cap_h, tracking):
    cap = font["OS/2"].sCapHeight or 700
    s = cap_h / cap
    names = [cmap[ord(c)] for c in txt]
    adv = [gs[n].width for n in names]
    total = sum(adv) * s + tracking * (len(txt) - 1)
    x = cx - total / 2
    d = []
    for n, a in zip(names, adv):
        pen = SVGPathPen(gs)
        gs[n].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
        d.append(pen.getCommands())
        x += a * s + tracking
    return " ".join(d)

def shield(i=0):
    r = max(20 - i * 0.5, 4)
    x0, x1, y0, ys, tip = i, W - i, i, 300, H - i * 1.25
    return (f"M{x0+r},{y0} L{x1-r},{y0} Q{x1},{y0} {x1},{y0+r} L{x1},{ys} "
            f"C{x1},{ys+170} {W/2+90},{tip-40} {W/2},{tip} C{W/2-90},{tip-40} {x0},{ys+170} {x0},{ys} "
            f"L{x0},{y0+r} Q{x0},{y0} {x0+r},{y0} Z")

def rays(n, r_in, r_out, half_w, fill, cx=250, cy=HORIZON):
    out = []
    for k in range(n):
        a = math.radians(180 - (180 / (n + 1)) * (k + 1))
        ux, uy = math.cos(a), -math.sin(a)
        px, py = -uy, ux
        b = (cx + ux * r_in, cy + uy * r_in)
        pts = [(b[0] + px * half_w, b[1] + py * half_w), (cx + ux * r_out, cy + uy * r_out), (b[0] - px * half_w, b[1] - py * half_w)]
        out.append(f'<polygon fill="{fill}" points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}"/>')
    return "".join(out)

def ball(cx, cy, r, base, line, panel, simple, uid):
    pent = lambda px, py, R, rot: " ".join(
        f"{px + R*math.cos(rot + math.radians(72*k)):.1f},{py + R*math.sin(rot + math.radians(72*k)):.1f}" for k in range(5))
    s = [f'<clipPath id="bc{uid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>',
         f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{base}"/>', f'<g clip-path="url(#bc{uid})">',
         f'<polygon fill="{panel}" points="{pent(cx, cy, r*0.36, math.radians(-90))}"/>']
    if not simple:
        for k in range(5):
            a = math.radians(-90 + 72 * k)
            ex, ey = cx + math.cos(a) * r * 0.36, cy + math.sin(a) * r * 0.36
            ox, oy = cx + math.cos(a) * r * 0.72, cy + math.sin(a) * r * 0.72
            s.append(f'<line x1="{ex:.1f}" y1="{ey:.1f}" x2="{ox:.1f}" y2="{oy:.1f}" stroke="{line}" stroke-width="{r*0.07:.1f}"/>')
            b = a + math.radians(36)
            pcx, pcy = cx + math.cos(b) * r * 0.95, cy + math.sin(b) * r * 0.95
            s.append(f'<polygon fill="{panel}" points="{pent(pcx, pcy, r*0.3, b + math.radians(180))}"/>')
    s.append('</g>')
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{line}" stroke-width="{r*0.09:.1f}"/>')
    return "".join(s)

def paint(c, simple, uid):
    """c: colour per role. Painting order matters (later covers earlier)."""
    g = [f'<path d="{shield()}" fill="{c["outline"]}"/>',
         f'<path d="{shield(14)}" fill="{c["inline"]}"/>',
         f'<clipPath id="in{uid}"><path d="{shield(20)}"/></clipPath>',
         f'<g clip-path="url(#in{uid})">',
         f'<rect x="-5" y="-5" width="{W+10}" height="{H+10}" fill="{c["low"]}"/>']
    if simple:
        g.append(f'<rect x="-5" y="-5" width="{W+10}" height="{HORIZON+20}" fill="{c["field"]}"/>')
    else:
        g.append(f'<rect x="-5" y="-5" width="{W+10}" height="151" fill="{c["band"]}"/>')
        g.append(f'<rect x="-5" y="152" width="{W+10}" height="{HORIZON+20-152}" fill="{c["field"]}"/>')
    n, rin, rout, hw = (5, 118, 262, 22) if simple else (7, 118, 228, 13)
    g.append(rays(n, rin, rout, hw, c["sun"]))
    g.append(f'<path d="M140,{HORIZON} A110,110 0 0 1 360,{HORIZON} Z" fill="{c["sun"]}"/>')
    g.append(f'<rect x="-5" y="{HORIZON}" width="{W+10}" height="9" fill="{c["horizon"]}"/>')
    g.append('</g>')
    g.append(ball(250, HORIZON - 72, 70, c["ballbase"], c["ballline"], c["ballpanel"], simple, uid))
    if not simple:
        g.append(f'<path fill="{c["zamin"]}" d="{text_path("ZAMIN", 250, 112, 70, 8)}"/>')
        g.append(f'<path fill="{c["fk"]}" d="{text_path("FK", 250, 512, 64, 12)}"/>')
    return "".join(g)

P = dict(outline=NAVY, inline=WHITE, band=NAVY, field=BLUE, sun=WHITE, horizon=WHITE, low=WHITE,
         ballbase=WHITE, ballline=NAVY, ballpanel=NAVY, zamin=WHITE, fk=NAVY)
S = dict(P, low=BLUE)
# mask roles for monochrome: white = ink, black = transparent
MONO = dict(outline="white", inline="black", band="white", field="black", sun="white", horizon="white",
            low="black", ballbase="black", ballline="white", ballpanel="white", zamin="black", fk="white")

def svg(body, m):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 {W+20} {H+20}" width="{W+20}" height="{H+20}">'
            f'<title>ZAMIN FK crest {m}</title>{body}</svg>\n')

os.makedirs(OUT, exist_ok=True)
files = {"P": paint(P, False, "P"), "S": paint(S, True, "S")}
for m, col in (("M1", WHITE), ("M2", NAVY)):
    files[m] = (f'<mask id="mk{m}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="{W+20}" height="{H+20}">'
                f'<rect x="-10" y="-10" width="{W+20}" height="{H+20}" fill="black"/>{paint(MONO, False, m)}</mask>'
                f'<rect x="-10" y="-10" width="{W+20}" height="{H+20}" fill="{col}" mask="url(#mk{m})"/>')
for m, body in files.items():
    open(os.path.join(OUT, f"ZFK_CREST_MASTER_V01_{m}.svg"), "w").write(svg(body, m))
print("ok")
