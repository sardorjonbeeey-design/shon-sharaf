"""Day 8 animated episode: 'Stadion tayyor — tribuna bo‘sh. STAR BOYS kutmoqda!'
Same engine as Days 1-3 (tools/anim) + world-attached items (fans glued to the stand while the camera moves).
Usage: python3 anim_ep08.py                 -> exports/ZFK_EP08_day8.mp4 (+ .srt, per-beat audio)
       python3 anim_ep08.py --frames t1,t2  -> check frames in build/frames/ (no audio)
       python3 anim_ep08.py --audio-only    -> remix audio onto the last render"""
import json, os, random, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
BG = "file://" + os.path.join(Z, "02_Episode_02", "assets", "BG_stand_renovated.png")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")
TEMPO = 1.10          # narration speed-up (keeps the video inside ~40 s)
VOICE = os.path.join(HERE, "voice")
BUILD = os.path.join(HERE, "build")
os.makedirs(BUILD, exist_ok=True)

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

# (beat, text, words to highlight) — one TTS file per line: voice/NN.mp3 (+ NN.json char timings)
LINES = [
 (1, "Stadionimiz tayyor! Lekin bitta muammo bor…", ["tayyor!", "muammo"]),
 (1, "Tribunalarimiz hali ham bo‘sh!", ["Tribunalarimiz", "bo‘sh!"]),
 (2, "Zamin FK yangi o‘yinga tayyorlanmoqda!", ["Zamin", "FK"]),
 (2, "Bizni Star Boys bilan uchrashuv kutmoqda!", ["Star", "Boys"]),
 (3, "Stadionimiz chiroyli bo‘ldi.", ["chiroyli"]),
 (3, "Lekin hali ko‘plab joylar bo‘sh!", ["joylar", "bo‘sh!"]),
 (3, "Har bir yangi obunachi — tribunamizda yana bitta virtual muxlis!", ["obunachi", "virtual", "muxlis!"]),
 (4, "Star Boys bilan o‘yinga qadar stadionimizni to‘ldiraylik!", ["Star", "Boys", "to‘ldiraylik!"]),
 (4, "Biz maydonda kurashamiz, siz esa tribunada bizni qo‘llab-quvvatlang!", ["maydonda", "tribunada"]),
 (5, "Zamin FK’ni kuzating va obuna bo‘ling!", ["kuzating", "obuna"]),
 (5, "Do‘stlaringizni ham chaqiring!", ["Do‘stlaringizni", "chaqiring!"]),
 (5, "Har bir obuna — stadionimizda yana bitta virtual muxlis!", ["obuna", "virtual", "muxlis!"]),
 (5, "Star Boysga qarshi — birgamiz!", ["Star", "Boysga", "birgamiz!"]),
]

def word_times(i, text):
    """word start times (s, raw) from ElevenLabs char timings; falls back to proportional."""
    js = json.load(open(os.path.join(VOICE, f"{i+1:02d}.json")))
    chars, starts = [], []
    for ch in js:
        chars += ch["characters"]; starts += ch["character_start_times_seconds"]
    joined = "".join(chars)
    out, pos = [], 0
    for w in text.split(" "):
        k = joined.find(w[:3], pos) if len(w) >= 3 else joined.find(w, pos)
        if k < 0 or joined.find(w[0], pos) < 0:
            return None
        out.append(starts[k]); pos = k + len(w)
    return out

# ---- timeline ----
t, TL = 0.35, []
for i, (beat, text, hl) in enumerate(LINES):
    d = dur(os.path.join(VOICE, f"{i+1:02d}.mp3")) / TEMPO
    TL.append((t, t + d))
    nxt = LINES[i + 1][0] if i + 1 < len(LINES) else 9
    t += d + (0.12 if nxt == beat else 0.28)
END_VOICE = TL[-1][1]
TOTAL = END_VOICE + 2.1
S = lambda n, off=0.0: TL[n - 1][0] + off          # n = 1-based line number
E_ = lambda n, off=0.0: TL[n - 1][1] + off
FR = lambda n, p: TL[n - 1][0] + (TL[n - 1][1] - TL[n - 1][0]) * p

caps, srt = [], []
for i, (beat, text, hl) in enumerate(LINES):
    a, b = TL[i]
    words = [w for w in text.split(" ") if w != "—"]
    wt = word_times(i, text)
    if wt is None or len(wt) != len(text.split(" ")):
        tot = sum(len(w) for w in words); acc = 0; wt = []
        for w in words:
            wt.append(0.85 * (b - a) * TEMPO * acc / tot); acc += len(w)
    else:
        wt = [x for x, w in zip(wt, text.split(" ")) if w != "—"]
    caps.append({"a": a, "b": b + 0.05, "words": words, "hl": [k for k, w in enumerate(words) if w in hl],
                 "wt": [a + x / TEMPO for x in wt], "bottom": 600, "size": 64})
    srt.append((a, b + 0.05, text.replace(" — ", " — ")))

# ---- helpers ----
def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False, fs=42: f'<div class="chip{" y" if y else ""}" style="font-size:{fs}px">{txt}</div>'
bubble = lambda txt, fs=44: (f'<div style="background:#fff;color:#0D2557;border:6px solid #0D2557;border-radius:30px;padding:14px 26px;'
                             f'font-weight:900;font-size:{fs}px;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.4);white-space:nowrap">{txt}</div>')
crest = lambda h=110: f'<img src="{CREST}" style="height:{h}px">'
match_card = lambda w=860: (f'<div style="width:{w}px;padding:26px 30px;box-sizing:border-box;border-radius:34px;background:rgba(13,37,87,.95);'
    f'border:6px solid #fff;color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5)">'
    f'<div style="display:flex;align-items:center;justify-content:space-between"><div style="width:250px">{crest(120)}'
    f'<div style="font-size:36px;font-weight:900;margin-top:4px">ZAMIN FK</div></div>'
    f'<div style="font-size:84px;font-weight:900;color:#FFD23F">🆚</div>'
    f'<div style="width:250px"><div style="font-size:96px;line-height:120px">⚽</div><div style="font-size:36px;font-weight:900;margin-top:4px">STAR BOYS</div></div></div></div>')

# ---- the stand: seat grid measured on BG_stand_renovated.png (941 px wide -> 1080 px) ----
K = 1080 / 941
ROWS = [  # (name, seat base y, x start, x step, count, fan height, z)
    ("A", 718, 38, 66, 14, 128, 4), ("B", 766, 14, 70, 14, 134, 5),
    ("C", 866, 25, 80, 12, 188, 6), ("D", 952, 12, 83, 11, 204, 7)]
seats = []
for name, by, x0, st, n, h, z in ROWS:
    for k in range(n):
        x = x0 + k * st
        if x < 20 or x > 925: continue
        seats.append({"row": name, "x": x * K, "y": (by + 4) * K, "h": h * K, "z": z, "step": st * K, "sec": ("L" if x < 330 else "M" if x < 620 else "R") + ("U" if name in "AB" else "D")})
# cumulative fill per section at the 4 stages (start, +after line 7, +after line 9, +end). Last stage stays visibly part-empty.
FILL = {"LD": [.40, .55, .65, .72], "LU": [.15, .22, .30, .36], "MD": [.12, .22, .32, .42], "MU": [0, .05, .09, .12],
        "RD": [.10, .15, .22, .28], "RU": [0, 0, 0, .04]}
rnd = random.Random(8)
FANS = ["fan2", "fan3", "fan4", "fan5", "fan6", "fan7", "fan8"]
ASPECT = {"fan2": .378, "fan3": .563, "fan4": .607, "fan5": .379, "fan6": .573, "fan7": .43, "fan8": .62}
fan_list = []       # {x,y,h,z,stage,src}
for sec in FILL:
    ss = [s for s in seats if s["sec"] == sec]; rnd.shuffle(ss)
    prev = 0
    for stg, f in enumerate(FILL[sec]):
        cnt = round(f * len(ss))
        for s in ss[prev:cnt]:
            fan_list.append({**s, "stage": stg}); 
        prev = cnt
occupied = {}
for f in fan_list:
    occupied[(round(f["x"]), round(f["y"]))] = f
# pick a sprite per fan; neighbours must not collide (shrink wide sprites to fit their seat pitch)
fan_list.sort(key=lambda f: (f["z"], f["x"]))
last = None
for f in fan_list:
    c = rnd.choice([s for s in FANS if s != last]); last = c
    f["src"] = c
    f["h2"] = min(f["h"] * 1.35, f["step"] * 1.3 / ASPECT[c])
STAGE_WIN = {0: None, 1: (S(7, 0.15), E_(7, -0.25)), 2: (S(8, 0.8), E_(9, -0.4)), 3: (S(11, 0.0), E_(12, 0.1))}
for i, f in enumerate(fan_list):
    f["at"] = None
for stg in (1, 2, 3):
    fs = [f for f in fan_list if f["stage"] == stg]; rnd.shuffle(fs)
    a, b = STAGE_WIN[stg]
    for j, f in enumerate(fs):
        f["at"] = a + (b - a) * (j / max(1, len(fs) - 1)) * 0.95
CHIP_FANS = []      # which new fans get a "+1 MUXLIS" tag (spread over sections)
for stg, n in ((1, 4), (2, 3)):
    seen = set()
    for f in sorted([f for f in fan_list if f["stage"] == stg], key=lambda f: f["at"]):
        if f["sec"] not in seen and len([c for c in CHIP_FANS if c is not None and c["stage"] == stg]) < n:
            seen.add(f["sec"]); CHIP_FANS.append(f)

def fan_items(sc_from, sc_to):
    items = []
    for f in fan_list:
        if f["at"] is not None and f["at"] >= sc_to: continue
        present = f["at"] is None or f["at"] < sc_from
        items.append({"type": "sprite", "src": f"{SPR}/fans/{f['src']}.png", "x": f["x"], "y": f["y"], "h": f["h2"],
                      "at": sc_from - 1 if present else f["at"], "to": None, "enter": "fade" if present else "pop",
                      "enterDur": 0.01 if present else 0.4, "idle": "tiny", "z": f["z"], "world": True,
                      "filter": "drop-shadow(0 4px 4px rgba(0,0,0,.35))", "exit": "none"})
    return items
def plus1(f, at, to):
    return lab(chip("+1 MUXLIS", True, 30), min(max(f["x"], 200), 860), f["y"] - f["h2"] - 26, at, to, enter="rise", enterDur=0.9, z=22, world=True)

# camera path (continuous across cuts): (zoom, focus x, focus y)
C0 = (1.0, .5, .52)
C1 = (1.10, .5, .58)
C2 = (1.18, .6, .55)
C3 = (1.30, .66, .50)
C4 = (1.45, .30, .60)
C5 = (1.30, .50, .58)
C6 = (1.0, .5, .55)
C7 = (1.06, .5, .55)
cam = lambda a, b: {"src": BG, "zoom": [a[0], b[0]], "focus": [a[1], a[2], b[1], b[2]]}

# beat boundaries
t1, t2, t3a, t3b, t3c, t4, t5a, t5b = 0, S(3), S(5), S(6), S(7), S(8), S(10), S(12)
GY = 1830            # feet line on the grass
scenes = [
 # BEAT 1 — HOOK: renovated stand, some fans, lots of empty seats, the goat looks around
 {"from": t1, "to": t2, "bg": cam(C0, C1), "items": fan_items(t1, t2) + [
   lab('<div class="title" style="font-size:132px;line-height:1.02;text-align:center">STADION<br>TAYYOR!</div>', 540, 330, 0.05, E_(1, 0.35), enter="stamp", idle="pulse", z=25),
   lab(chip("LEKIN MUXLISLAR QANI? 🤔", True, 50), 540, 590, FR(1, 0.62), enter="stamp", idle="pulse", z=25),
   lab(crest(110), 150, 130, 0.1, enter="drop", enterDur=0.5, z=25),
   spr("goat_side", 330, GY - 40, 400, FR(1, 0.15), S(2, 0.1), enter="up", idle="sway", z=12),
   spr("goat_side", 330, GY - 40, 400, S(2, 0.1), E_(2, 0.5), enter="fade", enterDur=0.01, idle="sway", flip=True, z=12),
 ]},
 # BEAT 2 — the club gets ready: Rustam whistles, Bekzod is sure of himself
 {"from": t2, "to": t3a, "bg": cam(C1, C2), "items": fan_items(t2, t3a) + [
   lab(chip("ZAMIN FK 🆚 STAR BOYS", True, 50), 540, 430, S(3, 0.9), enter="stamp", idle="pulse", z=25),
   lab(crest(110), 150, 130, t2 - 1, enter="fade", enterDur=0.01, z=25),
   spr("rustam_whistle", 200, GY, 560, S(3, 0.0), enter="slideL", enterDur=0.6, idle="sway", z=10),
   spr("bekzod_smug", 480, GY, 540, S(3, 0.25), enter="slideL", enterDur=0.6, idle="bob", z=11),
   spr("goat_chew", 700, GY + 6, 400, S(3, 0.45), enter="up", idle="chew", z=13),
   spr("jasur_oneglove", 880, GY, 520, S(3, 0.35), enter="slideR", enterDur=0.6, idle="sway", z=10),
   lab(bubble("TEZROQ! FIT-FIT! 📢"), 330, 1400, S(3, 1.0), S(4, 0.1), enter="pop", z=24),
   lab(bubble("MEN TAYYORMAN 😎"), 560, 1400, S(4, 0.5), E_(4, 0.4), enter="pop", z=24),
 ]},
 # BEAT 3a — "Stadionimiz chiroyli bo‘ldi": the camera shows the new stand
 {"from": t3a, "to": t3b, "bg": cam(C2, C3), "items": fan_items(t3a, t3b) + [
   lab(crest(110), 150, 130, t3a - 1, enter="fade", enterDur=0.01, z=25),
   lab(chip("YANGI STADION ✨", True, 52), 540, 330, S(5, 0.1), enter="stamp", idle="pulse", z=25),
 ]},
 # BEAT 3b — "ko‘plab joylar bo‘sh": pan over the empty seats
 {"from": t3b, "to": t3c, "bg": cam(C3, C4), "items": fan_items(t3b, t3c) + [
   lab(crest(110), 150, 130, t3b - 1, enter="fade", enterDur=0.01, z=25),
   lab('<div style="font-size:60px;font-weight:900;color:#FFD23F;text-align:center;-webkit-text-stroke:8px #0D2557;paint-order:stroke fill;line-height:1">BO‘SH JOYLAR<br><span style="font-size:90px">⬇</span></div>',
       845, 640, S(6, 0.25), enter="stamp", idle="pulse", z=24, world=True),
 ]},
 # BEAT 3c — "har bir yangi obunachi = yana bitta virtual muxlis": new fans pop in
 {"from": t3c, "to": t4, "bg": cam(C4, C5), "items": fan_items(t3c, t4) + [
   lab(crest(110), 150, 130, t3c - 1, enter="fade", enterDur=0.01, z=25),
   lab(chip("VIRTUAL MUXLISLAR 💙", False, 46), 540, 330, S(7, 0.3), enter="stamp", idle="pulse", z=25),
 ] + [plus1(f, f["at"] + 0.25, f["at"] + 1.3) for f in CHIP_FANS if f["stage"] == 1]},
 # BEAT 4 — the invitation: match card, players walk on, the goat looks at the viewers, camera pulls back
 {"from": t4, "to": t5a, "bg": cam(C5, C6), "items": fan_items(t4, t5a) + [
   lab(crest(110), 150, 130, t4 - 1, enter="fade", enterDur=0.01, z=25),
   lab(match_card(), 540, 480, S(8, 0.1), enter="stamp", idle="sway", z=25),
   spr("doston_full", 190, GY, 500, S(8, 0.3), enter="slideL", enterDur=1.0, idle="bob", z=10),
   spr("aziz_ball", 350, GY, 500, S(8, 0.55), enter="slideL", enterDur=1.0, idle="bob", z=11),
   spr("goat_chew", 560, GY + 10, 380, S(8, 0.4), enter="up", idle="chew", z=13),
   spr("sherzod_full", 740, GY, 500, S(8, 0.8), enter="slideR", enterDur=1.0, idle="bob", z=10),
   spr("rustam_whistle", 900, GY, 520, S(9, 0.0), enter="slideR", enterDur=0.9, idle="sway", z=11),
 ] + [plus1(f, f["at"] + 0.25, f["at"] + 1.2) for f in CHIP_FANS if f["stage"] == 2]},
 # BEAT 5a — follow
 {"from": t5a, "to": t5b, "bg": cam(C6, C7), "items": fan_items(t5a, t5b) + [
   lab(crest(110), 150, 130, t5a - 1, enter="fade", enterDur=0.01, z=25),
   spr("goat_chew", 540, GY + 20, 640, S(10, 0.0), enter="up", idle="chew", z=12),
   lab('<div class="follow" style="font-size:72px;padding:26px 56px">+ OBUNA BO‘LING</div>', 540, 400, S(10, 0.35), enter="stamp", idle="pulse", z=26),
   lab(chip("FOLLOW @fk_zamin 💙", True, 44), 540, 540, S(10, 1.0), enter="stamp", z=26),
   lab(chip("DO‘STLARINGIZNI CHAQIRING 👥", False, 46), 540, 700, S(11, 0.1), enter="stamp", idle="pulse", z=26),
 ]},
 # BEAT 5b — every follow is one more virtual fan; final card
 {"from": t5b, "to": TOTAL + 1, "bg": cam(C7, (1.1, .5, .55)), "items": fan_items(t5b, TOTAL + 1) + [
   lab(crest(110), 150, 130, t5b - 1, enter="fade", enterDur=0.01, z=25),
   spr("goat_chew", 540, GY + 20, 640, t5b - 1, enter="fade", enterDur=0.01, idle="chew", z=12),
   lab(chip("+1 VIRTUAL MUXLIS PER OBUNA 💙", False, 40), 540, 430, S(12, 0.4), E_(12, 0.2), enter="stamp", z=26),
   lab('<div class="follow" style="font-size:60px;padding:22px 46px">OBUNA BO‘LING! 💙</div>', 540, 1010, S(13, 0.1), enter="stamp", idle="pulse", z=26),
   lab(f'<div style="width:880px;box-sizing:border-box;padding:24px 28px;border-radius:34px;background:rgba(13,37,87,.96);border:6px solid #fff;color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5)">'
       f'<div style="font-size:52px;font-weight:900">ZAMIN FK 🆚 STAR BOYS</div>'
       f'<div style="font-size:40px;font-weight:900;color:#FFD23F;margin-top:10px;line-height:1.2">BIR STADION.<br>BIR JAMOA. BIR MAQSAD.</div></div>',
       540, 600, E_(13, 0.15), enter="stamp", idle="sway", z=27),
 ]},
]
EP = {"total": TOTAL, "scenes": scenes, "captions": caps}
json.dump(EP, open(os.path.join(BUILD, "anim.json"), "w"), ensure_ascii=False)
print("lines:", [(round(a, 2), round(b, 2)) for a, b in TL], "TOTAL", round(TOTAL, 2), "fans", len(fan_list), "of", len(seats))

# ---- Instagram story stills: python3 anim_ep08.py --stories ----
if "--stories" in sys.argv:
    def still(stage_max, items, name, zoom=1.0, focus=(.5, .55)):
        fi = []
        for f in fan_list:
            if f["stage"] <= stage_max:
                fi.append({"type": "sprite", "src": f"{SPR}/fans/{f['src']}.png", "x": f["x"], "y": f["y"], "h": f["h2"], "at": -1, "to": None,
                           "enter": "fade", "enterDur": 0.01, "idle": None, "z": f["z"], "world": True, "filter": "drop-shadow(0 4px 4px rgba(0,0,0,.35))", "exit": "none"})
        ep = {"total": 1, "captions": [], "scenes": [{"from": 0, "to": 1, "bg": {"src": BG, "zoom": [zoom, zoom], "focus": [*focus, *focus]}, "items": fi + items}]}
        json.dump(ep, open(os.path.join(BUILD, "story.json"), "w"), ensure_ascii=False)
        js = (f"const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:1080,height:1920}}}});"
              f"await p.goto('file://{TOOLS}/engine.html');await p.evaluate(e=>{{window.EP=e}},JSON.parse(require('fs').readFileSync('{BUILD}/story.json','utf8')));"
              f"await p.evaluate(()=>window.ready());await p.evaluate(()=>window.renderAt(0.5));await p.screenshot({{path:'{HERE}/exports/{name}'}});await b.close();}})()")
        open(os.path.join(BUILD, "story.js"), "w").write(js)
        subprocess.run(["node", os.path.join(BUILD, "story.js")], check=True, cwd=TOOLS)
    T = lambda h, y, fs=118: lab(f'<div class="title" style="font-size:{fs}px;line-height:1.02;text-align:center">{h}</div>', 540, y, -1, enter="fade", enterDur=0.01, z=25)
    still(1, [T("STADION<br>TAYYOR!", 360, 130), lab(chip("LEKIN MUXLISLAR QANI? 🤔", True, 50), 540, 590, -1, enter="fade", enterDur=0.01, z=25),
              lab(crest(120), 150, 150, -1, enter="fade", enterDur=0.01, z=25),
              spr("goat_chew", 540, 1780, 600, -1, enter="fade", enterDur=0.01, idle=None, z=12)], "ZFK_EP08_story1_stadium_ready.png")
    still(2, [T("STAR BOYS<br>KUTMOQDA!", 290, 112), lab(match_card(760), 540, 545, -1, enter="fade", enterDur=0.01, z=25),
              lab(chip("TRIBUNANI BIRGA TO‘LDIRAMIZ 💙", False, 40), 540, 1050 + 330, -1, enter="fade", enterDur=0.01, z=26),
              lab('<div class="follow" style="font-size:58px;padding:22px 46px">OBUNA BO‘LING 💙</div>', 540, 1500, -1, enter="fade", enterDur=0.01, z=26),
              lab(crest(120), 150, 150, -1, enter="fade", enterDur=0.01, z=25)], "ZFK_EP08_story2_star_boys.png", 1.0)
    print("stories done"); sys.exit()

# ---- frames-only check ----
if len(sys.argv) > 2 and sys.argv[1] == "--frames":
    ts = [float(x) for x in sys.argv[2].split(",")]
    fd = os.path.join(BUILD, "frames"); os.makedirs(fd, exist_ok=True)
    js = (f"const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:1080,height:1920}}}});"
          f"await p.goto('file://{TOOLS}/engine.html');await p.evaluate(e=>{{window.EP=e}},require('fs').readJSON?0:JSON.parse(require('fs').readFileSync('{BUILD}/anim.json','utf8')));"
          f"await p.evaluate(()=>window.ready());for(const t of {json.dumps(ts)}){{await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({{path:'{fd}/f_'+t.toFixed(2)+'.png'}});}}await b.close();}})()")
    open(os.path.join(BUILD, "frames.js"), "w").write(js)
    subprocess.run(["node", os.path.join(BUILD, "frames.js")], check=True, cwd=TOOLS)
    print("frames in", fd); sys.exit()

silent = os.path.join(BUILD, "anim_video.mp4")
if "--audio-only" not in sys.argv:
    subprocess.run(["node", os.path.join(TOOLS, "render.js"), os.path.join(BUILD, "anim.json"), silent], check=True)

# ---- audio: narration per line (tempo-adjusted) + per-beat files + quiet crowd bed, -14 LUFS ----
os.makedirs(os.path.join(VOICE, "beats"), exist_ok=True)
BEATNAMES = {1: "hook", 2: "club", 3: "stands", 4: "invitation", 5: "outro"}
for b in range(1, 6):
    idx = [i for i, l in enumerate(LINES) if l[0] == b]
    ins, fc, parts = [], [], []
    for k, i in enumerate(idx):
        ins += ["-i", os.path.join(VOICE, f"{i+1:02d}.mp3")]
        pre = TL[i][0] - TL[idx[0]][0]; ms = int(pre * 1000)
        fc.append(f"[{k}:a]atempo={TEMPO},aresample=48000,adelay={ms}|{ms}[a{k}]"); parts.append(f"[a{k}]")
    fc.append("".join(parts) + f"amix=inputs={len(idx)}:normalize=0[o]")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "[o]", "-ac", "1", "-b:a", "128k",
                    os.path.join(VOICE, "beats", f"beat{b}_{BEATNAMES[b]}.mp3")], check=True)
inputs, fc, mix = ["-i", silent], [], []
k = 0
for i in range(len(LINES)):
    k += 1; inputs += ["-i", os.path.join(VOICE, f"{i+1:02d}.mp3")]; ms = int(TL[i][0] * 1000)
    fc.append(f"[{k}:a]atempo={TEMPO},aresample=48000,adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
crowd = os.path.join(Z, "03_Episode_03", "sfx", "crowd_bed.wav")
k += 1; inputs += ["-stream_loop", "-1", "-i", crowd]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{TOTAL:.2f},volume='0.05+0.10*min(1,t/{TOTAL:.2f})':eval=frame,afade=t=in:d=1.5,afade=t=out:st={TOTAL-1.5:.2f}:d=1.5[crowd]")
fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0[vo]")
fc.append(f"[vo][crowd]amix=inputs=2:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5[aout]")
out = os.path.join(HERE, "exports", "ZFK_EP08_day8.mp4")
os.makedirs(os.path.dirname(out), exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)

def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
with open(os.path.join(HERE, "exports", "ZFK_EP08_day8.srt"), "w", encoding="utf-8") as f:
    for n, (a, b, text) in enumerate(srt, 1):
        f.write(f"{n}\n{ts(a)} --> {ts(min(b, srt[n][0] - 0.02) if n < len(srt) else b)}\n{text}\n\n")
print("OK", out, round(TOTAL, 2))
