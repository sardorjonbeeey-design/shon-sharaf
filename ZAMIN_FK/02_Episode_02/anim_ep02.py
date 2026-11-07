"""Day 2 animated episode: 'Siz tanladingiz — STADION!' Uses the shared engine in tools/anim.
Usage: python3 anim_ep02.py [--frames t1,t2,...]"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
A1 = "file://" + os.path.join(Z, "02_Episode_01", "assets")
A2 = "file://" + os.path.join(HERE, "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

# narration lines: (file, phrases for captions, highlighted words per phrase)
LINES = [
 ("01_hook", [("Siz tanladingiz — STADION!", [2]), ("Lekin bitta muammo bor...", [2])]),
 ("02_payoff", [("Ikki kunda 74 ta muxlis va 161 ta layk!", [2, 6]), ("Klub fondida endi 17 million 415 ming so‘m.", [3, 4, 5, 6, 7])]),
 ("03_turning_point", [("Stadionni to‘liq ta’mirlash uchun esa...", [1]), ("bu pul yetmaydi.", [1, 2])]),
 ("04_consequence", [("Shuning uchun o‘zimiz boshlaymiz!", [1]), ("«Stadion» deb yozgan har bir muxlisning ismi", [0]), ("tribunadagi bannerga yoziladi.", [1]), ("100 ta muxlis bo‘lsa — yangi o‘rindiqlar!", [0, 4, 5])]),
 ("05_question", [("Birinchi ta’mir nimadan boshlansin:", [1]), ("o‘rindiqlarmi, tablomi yoki chiroqlarmi?", [0, 1, 3]), ("Izohga yozing!", [0, 1]), ("Va ertaga... echki bilan nima bo‘lganini ko‘rasiz.", [2])]),
]
t, L, audio, caps = 0.25, [], [], []
for name, phrases in LINES:
    f = os.path.join(HERE, "voice", name + ".mp3")
    d = dur(f)
    audio.append((f, t))
    # captions: split the line's time by character share
    total_chars = sum(len(p) for p, _ in phrases)
    a = t + 0.05
    span = d - 0.25
    for text, hl in phrases:
        b = a + span * len(text) / total_chars
        words = [w for w in text.split(" ") if w != "—"]
        tot = sum(len(w) for w in words); acc = 0; wt = []
        for w in words:
            wt.append(a + (b - a) * 0.85 * acc / tot); acc += len(w)
        caps.append({"a": a, "b": b, "words": words, "hl": hl, "wt": wt})
        a = b
    L.append((t, t + d))
    t += d + 0.25
TOTAL = L[-1][1] + 2.2
s = lambda i, off=0.0: L[i - 1][0] + off
e = lambda i, off=0.0: L[i - 1][1] + off
frac = lambda i, p: L[i - 1][0] + (L[i - 1][1] - L[i - 1][0]) * p     # point at fraction p of line i

def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False: f'<div class="chip{" y" if y else ""}">{txt}</div>'
roll = lambda t0, v0, v1, n=16, dt=0.06: [[t0 + i * dt, round(v0 + (v1 - v0) * (i / (n - 1)) ** 0.7)] for i in range(n)]
shot = lambda i, rot: f'<img src="{A2}/comment{i}.jpg" style="width:900px;border-radius:26px;border:6px solid #0D2557;box-shadow:0 14px 30px rgba(0,0,0,.45);transform:rotate({rot}deg)">'

FANS, LIKES, FUND0, FUND1 = 74, 161, 15_000_000, 15_000_000 + 161 * 15_000
names = ["@kewl.imjay45", "@bek_.071", "@legends00000001", "@rozakoldasovna"]

scenes = [
 # HOOK: real comments slam in, then the vote result stamp
 {"from": 0, "to": s(2), "bg": {"src": f"{A1}/BG_stand_empty.png", "zoom": [1.15, 1.0]}, "items": [
   lab(shot(1, -3), 540, 420, 0.05, enter="slideL", enterDur=0.25),
   lab(shot(2, 2), 540, 600, 0.3, enter="slideR", enterDur=0.25),
   lab(shot(3, -2), 540, 780, 0.55, enter="slideL", enterDur=0.25),
   lab(shot(4, 3), 540, 960, 0.8, enter="slideR", enterDur=0.25),
   lab('<div class="title" style="font-size:170px">STADION!</div>', 540, 1120, frac(1, 0.33), enter="stamp", idle="pulse", z=25),
   lab(chip("SIZ TANLADINGIZ", True), 540, 1245, frac(1, 0.2), enter="stamp", z=25),
   spr("goat_chew", 900, 1880, 520, frac(1, 0.6), enter="peekR", idle="chew", z=24),
 ]},
 # RESULTS: numbers roll up
 {"from": s(2), "to": s(3), "bg": {"src": f"{A1}/S05_stadium_wide.png", "zoom": [1.0, 1.08], "blur": 10}, "items": [
   lab('<div class="badge"><small>MUXLISLAR</small><b>0</b><i>VIRTUAL</i></div>', 300, 500, s(2, 0.1), counter=roll(s(2, 0.2), 0, FANS)),
   lab('<div class="badge"><small>LAYKLAR</small><b>0</b><i>2 KUNDA</i></div>', 780, 500, frac(2, 0.25), counter=roll(frac(2, 0.3), 0, LIKES)),
   lab('<div class="card"><small>VIRTUAL KLUB FONDI</small><b>0</b><span>so‘m</span></div>', 540, 900, frac(2, 0.5), enter="up",
       counter=roll(frac(2, 0.55), FUND0, FUND1, 20)),
   lab(chip(f"+{LIKES} × 15 000 so‘m", True), 540, 1080, frac(2, 0.75), enter="stamp"),
 ]},
 # PROBLEM: not enough money
 {"from": s(3), "to": s(4), "bg": {"src": f"{A1}/BG_stand_empty.png", "zoom": [1.0, 1.25], "focus": [0.5, 0.45, 0.35, 0.5]}, "items": [
   spr("rustam_whistle", 300, 1650, 980, s(3, 0.2), enter="slideL", idle="shake"),
   spr("goat_side", 820, 1300, 340, frac(3, 0.3), enter="peekR", idle="chew"),
   lab('<div class="title" style="font-size:110px">PUL YETMAYDI</div>', 540, 420, frac(3, 0.55), enter="stamp", idle="shake"),
 ]},
 # SOLUTION: commenters' names on banners, milestone bar
 {"from": s(4), "to": s(5), "bg": {"src": f"{A1}/BG_stand_empty.png", "zoom": [1.0, 1.05]}, "items": [
   lab(chip("O‘ZIMIZ BOSHLAYMIZ!", True), 540, 260, s(4, 0.1), enter="stamp"),
 ] + [lab(f'<div class="chip" style="font-size:40px;padding:14px 26px;background:#1F4FB8">{n}</div>', x, y, frac(4, 0.3 + k * 0.08), enter="drop", enterDur=0.6, idle="sway")
      for k, (n, x, y) in enumerate(zip(names, [300, 760, 330, 760], [700, 760, 880, 940]))] + [
   lab('<div class="card"><small>KEYINGI MAQSAD</small><span>100 MUXLIS = YANGI O‘RINDIQLAR</span>'
       f'<div style="margin-top:14px;height:30px;border-radius:15px;background:rgba(255,255,255,.2);overflow:hidden"><div style="width:{FANS}%;height:100%;background:#FFD23F"></div></div>'
       f'<span style="font-size:36px;margin-top:8px">{FANS} / 100</span></div>', 540, 1180, frac(4, 0.72), enter="up"),
 ]},
 # QUESTION + OUTRO HOOK
 {"from": s(5), "to": frac(5, 0.7), "bg": {"src": f"{A1}/S05_stadium_wide.png", "zoom": [1.0, 1.06], "blur": 10}, "items": [
   lab(f'<img src="{CREST}" style="height:260px">', 540, 280, s(5), enter="stamp"),
 ] + [lab(f'<div class="choice"><div class="n">{n}</div>{txt}</div>', 540, y, frac(5, at), enter="slideR")
      for n, txt, y, at in [(1, "O‘RINDIQLAR", 640, 0.2), (2, "TABLO", 810, 0.3), (3, "CHIROQLAR", 980, 0.4)]]},
 {"from": frac(5, 0.7), "to": TOTAL + 1, "bg": {"src": f"{A1}/BG_stand_empty.png", "zoom": [1.1, 1.3], "focus": [0.5, 0.5, 0.5, 0.42]}, "items": [
   lab('<div style="position:absolute;left:-600px;top:-1000px;width:1200px;height:2000px;background:radial-gradient(circle at 50% 60%,transparent 30%,rgba(0,0,0,.75) 70%)"></div>', 540, 960, frac(5, 0.7), enter="fade", z=5),
   spr("goat_chew", 540, 1650, 1050, frac(5, 0.72), enter="up", idle="chew", z=12),
   lab('<div class="title" style="font-size:96px">ERTAGA...</div>', 540, 330, frac(5, 0.78), enter="stamp", z=25),
   lab(chip("ECHKIGA NIMA BO‘LDI? 🐐", True), 540, 460, frac(5, 0.86), enter="stamp", z=25),
   lab('<div class="follow">+ OBUNA BO‘LING</div>', 540, 1760, e(5, 0.2), idle="pulse", z=25),
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
for k, (f, off) in enumerate(audio, start=1):
    inputs += ["-i", f]; ms = int(off * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5[aout]")
out = os.path.join(HERE, "exports", "ZFK_EP02_day2.mp4")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)
print("OK", out, round(TOTAL, 2))
