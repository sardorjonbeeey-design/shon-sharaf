"""Day 3 animated episode: 'Doston yutdi — klub nomini yozing!' Same animated engine as Day 2 (tools/anim).
Usage: python3 anim_ep03.py            -> exports/ZFK_EP03_day3.mp4 (with narration, whistle, crowd bed)
       python3 anim_ep03.py --frames t  -> single-frame check at time t (see build/)"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
A1 = "file://" + os.path.join(Z, "02_Episode_01", "assets")
A2 = "file://" + os.path.join(Z, "02_Episode_02", "assets")
E2 = "file://" + os.path.join(Z, "02_Episode_02", "exports")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

# narration lines: (file, [(caption text, highlighted word indexes)])
LINES = [
 ("v3_01_hook", [("Uchinchi kun. Klubda katta yangiliklar bor!", [0, 4, 5])]),
 ("v3_02_friendly", [("Siz tanladingiz — Paxtakor bilan o‘rtoqlik o‘yini!", [3, 5, 6])]),
 ("v3_03_team", [("Jamoamizga Sherzod ham qo‘shildi. Echki esa — endi klubning brend yuzi!", [2, 3, 6, 7, 8])]),
 ("v2_04_fund", [("Klub fondi: 21 690 000 so‘m. Muxlislar: 142.", [2, 3, 5])]),
 ("v2_05_bus", [("Lekin muammo bor: Toshkentga boradigan avtobusni haydaydigan odam yo‘q!", [3, 4, 9, 10])]),
 ("v2_06_outro", [("Izohga “MEN HAYDOVCHIMAN” deb yozing. Eng ko‘p layk olgan izoh — 24 soatdan keyin e’lon qilinadi!", [1, 2, 5, 6])]),
]
t, L, audio, caps = 0.25, [], [], []
for name, phrases in LINES:
    f = os.path.join(HERE, "voice", name + ".mp3")
    d = dur(f); audio.append((f, t))
    a, b = t + 0.05, t + d - 0.1
    for text, hl in phrases:
        words = text.split(" "); tot = sum(len(w) for w in words); acc = 0; wt = []
        for w in words:
            wt.append(a + (b - a) * 0.85 * acc / tot); acc += len(w)
        caps.append({"a": a, "b": b, "words": words, "hl": hl, "wt": wt})
    L.append((t, t + d)); t += d + 0.25
TOTAL = L[-1][1] + 2.0
s = lambda i, off=0.0: L[i - 1][0] + off
e = lambda i, off=0.0: L[i - 1][1] + off
frac = lambda i, p: L[i - 1][0] + (L[i - 1][1] - L[i - 1][0]) * p

def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False: f'<div class="chip{" y" if y else ""}">{txt}</div>'
roll = lambda t0, v0, v1, n=16, dt=0.06: [[t0 + i * dt, round(v0 + (v1 - v0) * (i / (n - 1)) ** 0.7)] for i in range(n)]
story = lambda rot=0: f'<img src="{E2}/ZFK_EP02_story_defender_vote.png" style="width:860px;border-radius:30px;border:6px solid #FFD23F;box-shadow:0 14px 30px rgba(0,0,0,.5);transform:rotate({rot}deg)">'
crest = f'<img src="{CREST}" style="height:110px">'

FUND_OLD, FUND_NEW, FOLLOW = 20_085_000, 21_690_000, 142
card_g = lambda body, w=900: (f'<div style="width:{w}px;padding:30px 34px;box-sizing:border-box;border-radius:34px;background:rgba(13,37,87,.94);'
                             f'border:6px solid #fff;color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5)">{body}</div>')

def tag(n, name, joke, new=False):
    acc = "#FFD23F" if new else "#fff"
    return (f'<div style="background:#0D2557;border:5px solid {acc};border-radius:22px;padding:12px 18px;text-align:center;color:#fff;'
            f'box-shadow:0 8px 20px rgba(0,0,0,.5);min-width:210px"><div style="font-size:44px;font-weight:900;color:{acc}">#{n} {name}</div>'
            f'<div style="font-size:26px;font-weight:700;color:#cfdcff">{joke}</div></div>')
bubble = lambda t: f'<div style="background:#fff;color:#0D2557;border:6px solid #0D2557;border-radius:30px;padding:18px 26px;font-weight:900;font-size:46px;max-width:620px;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.4)">{t}</div>'
comment = lambda t, likes: (f'<div style="width:860px;background:#fff;color:#0D2557;border-radius:30px;border:6px solid #0D2557;padding:22px 28px;box-shadow:0 12px 30px rgba(0,0,0,.5);display:flex;align-items:center;gap:22px">'
                            f'<div style="width:96px;height:96px;border-radius:50%;background:#1F4FB8;color:#fff;font-size:56px;display:flex;align-items:center;justify-content:center">👤</div>'
                            f'<div style="flex:1"><div style="font-size:26px;opacity:.6;font-weight:700">sizning izohingiz</div><div style="font-size:58px;font-weight:900">{t}</div></div>'
                            f'<div style="font-size:44px;font-weight:900;color:#e63950">❤ {likes}</div></div>')

cm = lambda t: (f'<div style="width:780px;background:#fff;color:#0D2557;border-radius:26px;border:6px solid #0D2557;padding:18px 26px;box-shadow:0 12px 26px rgba(0,0,0,.5);display:flex;align-items:center;gap:20px">'
                f'<div style="width:80px;height:80px;border-radius:50%;background:#1F4FB8;color:#fff;font-size:46px;display:flex;align-items:center;justify-content:center">👤</div>'
                f'<div style="font-size:60px;font-weight:900;flex:1">{t}</div><div style="font-size:40px;font-weight:900;color:#e63950">❤ 1</div></div>')
poster = (f'<div style="width:420px;background:#fff;border:10px solid #0D2557;border-radius:20px;padding:14px;text-align:center;box-shadow:0 14px 30px rgba(0,0,0,.55)">'
          f'<img src="{SPR}/goat_chew.png" style="height:420px"><div style="background:#1F4FB8;color:#fff;font-weight:900;font-size:44px;border-radius:12px;padding:6px;margin-top:6px">BREND YUZI</div></div>')
BUS = "file://" + os.path.join(HERE, "assets", "bus_front.png")

scenes = [
 # HOOK (Day-1 style establishing shot): empty stand, title, the goat just sits there with its scarf
 {"from": 0, "to": s(2), "bg": {"src": f"{A1}/BG_stand_empty.png", "zoom": [1.15, 1.0]}, "items": [
   lab('<div class="title" style="font-size:170px">3-KUN</div>', 540, 330, s(1, 0.05), enter="stamp", idle="pulse", z=25),
   lab(chip("KLUBDA YANGILIKLAR!", True), 540, 520, frac(1, 0.3), enter="stamp", z=25),
   spr("goat_chew", 540, 1330, 520, frac(1, 0.15), enter="up", idle="chew", z=12),
   lab(crest, 150, 130, s(1, 0.1), enter="drop", enterDur=0.5, z=25),
 ]},
 # SOCIAL PROOF (Day-1 style): your comments slam in, then the match
 {"from": s(2), "to": s(3), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.08], "blur": 8}, "items": [
   lab(cm("Paxtakor 🔥"), 540, 330, s(2, 0.05), enter="slideL", enterDur=0.25, z=20),
   lab(cm("Paxtakor"), 540, 490, s(2, 0.3), enter="slideR", enterDur=0.25, z=20),
   lab(cm("Paxtakor"), 540, 650, s(2, 0.55), enter="slideL", enterDur=0.25, z=20),
   lab(cm("Paxtakor"), 540, 810, s(2, 0.8), enter="slideR", enterDur=0.25, z=20),
   lab(card_g('<div style="display:flex;align-items:center;justify-content:space-between"><div><img src="'+CREST+'" style="height:110px"><div style="font-size:34px;font-weight:900">ZAMIN FK</div></div>'
              '<div style="font-size:90px;font-weight:900;color:#FFD23F">VS</div><div><div style="font-size:80px">⚽</div><div style="font-size:34px;font-weight:900">PAXTAKOR</div></div></div>', 860),
       540, 1090, frac(2, 0.45), enter="stamp", idle="sway", z=24),
 ]},
 # TEAM + BRAND FACE: Sherzod arrives, the goat gets a poster instead of a voice
 {"from": s(3), "to": s(4), "bg": {"src": f"{A1}/S05_stadium_wide.png", "zoom": [1.0, 1.1], "blur": 8}, "items": [
   lab(chip("YANGI O‘YINCHI ✅", True), 760, 330, frac(3, 0.1), enter="stamp", z=26),
   spr("sherzod", 770, 1330, 780, s(3, 0.1), enter="drop", enterDur=0.6, idle="sway", z=10),
   lab(poster, 290, 740, frac(3, 0.55), enter="slideL", enterDur=0.5, idle="sway", z=20),
 ]},
 # FUND + FOLLOWERS (same punch as Day 1/2)
 {"from": s(4), "to": s(5), "bg": {"src": f"{A1}/S05_stadium_wide.png", "zoom": [1.05, 1.0], "blur": 10}, "items": [
   lab('<div class="badge"><small>MUXLISLAR</small><b>0</b><i>VIRTUAL</i></div>', 290, 430, s(4, 0.1), counter=roll(s(4, 0.2), 127, FOLLOW, 14)),
   lab('<div class="card"><small>VIRTUAL KLUB FONDI</small><b>0</b><span>so‘m</span></div>', 540, 860, frac(4, 0.2), enter="up",
       counter=roll(frac(4, 0.25), FUND_OLD, FUND_NEW, 20)),
   lab(chip("+107 × 15 000 = 1 605 000 so‘m", True), 540, 1080, frac(4, 0.6), enter="stamp", idle="pulse"),
 ]},
 # PROBLEM: the club bus, front view, empty driver seat
 {"from": s(5), "to": s(6), "bg": {"src": BUS, "zoom": [1.0, 1.12], "focus": [0.5, 0.55, 0.5, 0.5]}, "items": [
   lab(chip("TOSHKENT!", True), 540, 280, s(5, 0.15), enter="stamp", z=25),
   lab(card_g('<div style="font-size:70px;font-weight:900;line-height:1.1">HAYDOVCHI<br>YO‘Q! 😬</div>', 760), 540, 640, frac(5, 0.4), enter="drop", enterDur=0.5, idle="sway", z=25),
 ]},
 # ASK (outro hook): a comment wins the seat
 {"from": s(6), "to": TOTAL + 1, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.1, 1.25], "focus": [0.5, 0.5, 0.5, 0.42], "blur": 6}, "items": [
   lab(chip("HAYDOVCHI BO‘LING! 🚌", True), 540, 280, s(6, 0.05), enter="stamp", z=25),
   lab(cm("MEN HAYDOVCHIMAN"), 540, 560, s(6, 0.25), enter="slideL", enterDur=0.5, idle="sway", z=22),
   lab(chip("ENG KO‘P LAYK = HAYDOVCHI"), 540, 740, frac(6, 0.55), enter="stamp", z=25),
   lab(chip("⏳ 24 SOATDAN KEYIN E’LON"), 540, 860, frac(6, 0.7), enter="stamp", idle="pulse", z=25),
   spr("goat_chew", 880, 1860, 640, s(6, 0.4), enter="up", idle="chew", z=12),
   lab('<div class="follow">+ OBUNA BO‘LING</div>', 540, 1800, e(6, -0.6), idle="pulse", z=25),
 ]},
]
EP = {"total": TOTAL, "scenes": scenes, "captions": caps}
build = os.path.join(HERE, "build"); os.makedirs(build, exist_ok=True)
json.dump(EP, open(os.path.join(build, "anim.json"), "w"), ensure_ascii=False)
env = dict(os.environ)
if len(sys.argv) > 2 and sys.argv[1] == "--frames":
    env["ONLY"] = sys.argv[2]
silent = os.path.join(build, "anim_video.mp4")
subprocess.run(["node", os.path.join(TOOLS, "render.js"), os.path.join(build, "anim.json"), silent], check=True, env=env)
if "ONLY" in env:
    print("frames:", silent, "total", round(TOTAL, 2)); sys.exit()
inputs, fc, mix = ["-i", silent], [], []
k = 0
for f, off in audio:
    k += 1; inputs += ["-i", f]; ms = int(off * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
for f, at, vol in []:                      # same as Day 1 and Day 2: narration only
    k += 1; inputs += ["-i", os.path.join(HERE, f)]; ms = int(at * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms},volume={vol}[a{k}]"); mix.append(f"[a{k}]")
fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5[aout]")
out = os.path.join(HERE, "exports", "ZFK_EP03_day3.mp4")
os.makedirs(os.path.dirname(out), exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-ac", "1", "-ar", "96000", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)
print("OK", out, round(TOTAL, 2))
