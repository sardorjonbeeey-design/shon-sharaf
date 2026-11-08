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
 ("01_hook", [("SIZ TANLADINGIZ: DOSTON!", [1, 2])]),
 ("02_result", [("Sherzod emas — DOSTON. Rahmat, har bir ovoz uchun.", [2, 3])]),
 ("03_update", [("Klub fondi: 21 690 000 so‘m. Biz Sherzodni ham jalb qildik!", [3, 4])]),
 ("04_cta", [("Men — echki. Endi klubning brend yuzi! Sizga aytaman: Paxtakor bilan o‘rtoqlik o‘yini!", [5, 6])]),
 ("05_question", [("Toshkentga avtobus haydovchisi kerak. Izohga “MEN HAYDOVCHIMAN” deb yozing. Eng ko‘p layk olgan izoh 24 soatdan keyin e’lon qilinadi.", [3, 4])]),
 ("06_outro", [("Echkiga nima bo‘ldi? U endi klubning brend yuzi!", [4, 5, 6])]),
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

scenes = [
 # HOOK: Doston pops in, title stamps
 {"from": 0, "to": s(2), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.15, 1.0], "blur": 6}, "items": [
   spr("doston", 540, 1800, 1150, frac(1, 0.2), enter="up", idle="bob", z=12),
   lab('<div class="title" style="font-size:150px">DOSTON!</div>', 540, 430, frac(1, 0.35), enter="stamp", idle="pulse", z=25),
   lab(chip("SIZ TANLADINGIZ", True), 540, 600, frac(1, 0.15), enter="stamp", z=25),
   lab(crest, 540, 120, s(1, 0.1), enter="drop", enterDur=0.5, z=25),
 ]},
 # RESULT: the defender vote story + 78% stamp + winner card
 {"from": s(2), "to": s(3), "bg": {"src": f"{A1}/BG_stand_empty.png", "zoom": [1.0, 1.1], "blur": 12}, "items": [
   spr("doston", 540, 1820, 1100, s(2, 0.05), enter="up", idle="bob", z=12),
   lab(chip("78% OVOZ", True), 800, 300, frac(2, 0.25), enter="stamp", z=25),
   lab(card_g('<small style="font-size:30px;letter-spacing:4px;color:#9DB8FF">G‘OLIB IZOH</small><div style="font-size:84px;font-weight:900;line-height:1.1">DOSTON</div><div style="font-size:34px">Mudofaa · 22 yosh · OVR 67</div>'),
       540, 700, frac(2, 0.3), enter="up", idle="sway", z=25),
 ]},
 # UPDATE: fund counter rolls up, follower badge, +178 chip
 {"from": s(3), "to": s(4), "bg": {"src": f"{A1}/S05_stadium_wide.png", "zoom": [1.0, 1.08], "blur": 10}, "items": [
   lab('<div class="badge"><small>MUXLISLAR</small><b>0</b><i>VIRTUAL</i></div>', 290, 430, s(3, 0.1), counter=roll(s(3, 0.2), 0, FOLLOW)),
   lab('<div class="card"><small>VIRTUAL KLUB FONDI</small><b>0</b><span>so‘m</span></div>', 540, 860, frac(3, 0.25), enter="up",
       counter=roll(frac(3, 0.3), FUND_OLD, FUND_NEW, 20)),
   lab(chip("+107 × 15 000 = 1 605 000 so‘m", True), 540, 1080, frac(3, 0.7), enter="stamp", idle="pulse"),
   spr("bekzod_celebrate", 800, 1750, 680, frac(3, 0.1), enter="up", idle="hop", z=9),
   spr("sherzod", 260, 1780, 760, frac(3, 0.6), enter="slideL", idle="sway", z=10),
   lab(chip("SHERZOD — JAMOAGA QO‘SHILDI ✅", True), 540, 1260, frac(3, 0.62), enter="stamp", z=26),
 ]},
 # GOAT: brand face + Paxtakor friendly
 {"from": s(4), "to": s(5), "bg": {"src": f"{A1}/S05_stadium_wide.png", "zoom": [1.35, 1.15], "focus": [0.82, 0.62, 0.78, 0.6], "blur": 3}, "items": [
   spr("doston", 790, 1150, 200, s(4, 0.0), enter="pop", idle="hop", z=3),
   spr("sherzod", 880, 1150, 200, s(4, 0.1), enter="pop", idle="hop", z=3),
   lab('<div class="chip" style="font-size:24px">⚽ MASHG‘ULOT</div>', 820, 1070, s(4, 0.15), enter="pop", z=4),
   spr("goat_chew", 540, 1800, 1000, s(4, 0.05), enter="up", idle="talk", z=12),
   lab(chip("MEN — BREND YUZI! 🐐", True), 540, 380, s(4, 0.2), enter="stamp", z=25),
   lab(card_g('<small style="font-size:30px;letter-spacing:4px;color:#9DB8FF">O‘RTOQLIK O‘YINI</small><div style="font-size:90px;font-weight:900;line-height:1.05">PAXTAKOR</div><div style="font-size:36px">🔥 Muxlislar tanladi</div>'),
       540, 620, frac(4, 0.35), enter="drop", enterDur=0.5, idle="sway", z=25),
 ]},
 # BUS CALL-OUT: comment wins the driver seat
 {"from": s(5), "to": e(5), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.05], "blur": 10}, "items": [
   lab(card_g('<small style="font-size:30px;letter-spacing:4px;color:#9DB8FF">TOSHKENTGA BORAMIZ</small><div style="font-size:80px;font-weight:900;line-height:1.1">AVTOBUS<br>HAYDOVCHISI 🚌</div>'),
       540, 560, s(5, 0.05), enter="stamp", z=25),
   lab(chip("IZOHGA: MEN HAYDOVCHIMAN", True), 540, 820, frac(5, 0.35), enter="drop", enterDur=0.5, idle="pulse", z=25),
   lab(chip("ENG KO‘P LAYK = HAYDOVCHI"), 540, 950, frac(5, 0.6), enter="stamp", z=25),
 ]},
 # OUTRO: goat finishes the promise
 {"from": e(5), "to": TOTAL + 1, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.1, 1.3], "focus": [0.5, 0.5, 0.5, 0.42]}, "items": [
   lab('<div style="position:absolute;left:-600px;top:-1000px;width:1200px;height:2000px;background:radial-gradient(circle at 50% 60%,transparent 30%,rgba(0,0,0,.75) 70%)"></div>', 540, 960, e(5), enter="fade", z=5),
   spr("goat_chew", 540, 1650, 1000, s(6, 0.2), enter="up", idle="chew", z=12),
   lab('<div class="title" style="font-size:96px">BREND YUZI 🐐</div>', 540, 330, s(6, 0.1), enter="stamp", z=25),
   lab(chip("ECHKI ENDI KLUBDA!", True), 540, 470, s(6, 0.8), enter="stamp", z=25),
   lab('<div class="follow">+ OBUNA BO‘LING</div>', 540, 1760, e(6, -0.5), idle="pulse", z=25),
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
