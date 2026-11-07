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
 ("02_payoff", [("Bir kunda 74 ta muxlis va 161 ta layk!", [2, 6]), ("Klub fondida endi 17 million 415 ming so‘m.", [3, 4, 5, 6, 7])]),
 ("03_investment", [("Va katta yangilik!", [1]), ("Qoratepa sport jamg‘armasi bizga 20 million so‘m ajratdi.", [5, 6, 7]), ("Hammasini stadion ta’miriga sarfladik!", [1, 2])]),
 ("04_new_stadium", [("Mana yangi tribuna... va katta ekran!", [1, 5]), ("Endi har kuni ekranda eng yaxshi izoh", [5, 6]), ("va yangi muxlislarning ismi chiqadi.", [2])]),
 ("05_question", [("Endi bizga himoyachi kerak.", [2]), ("22 yoshli Doston yoki 25 yoshli Sherzod?", [2, 5]), ("Izohga 1 yoki 2 deb yozing!", [1, 3]), ("Va ertaga... echki bilan nima bo‘lganini ko‘rasiz.", [2])]),
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

FANS, LIKES = 74, 161
FUND1 = 15_000_000 + LIKES * 15_000            # 17 415 000
INVEST = 20_000_000
names = ["@kewl.imjay45", "@bek_.071", "@legends00000001", "@rozakoldasovna"]

def card(n, name, age, ovr, img, st, accent):
    rows = "".join(f'<div style="display:flex;justify-content:space-between;padding:4px 0"><b style="font-size:40px">{v}</b><span style="font-size:30px;opacity:.85">{k}</span></div>' for k, v in st)
    return (f'<div style="width:430px;height:720px;border-radius:38px;padding:26px;box-sizing:border-box;color:#fff;'
            f'background:linear-gradient(160deg,{accent} 0%,#0D2557 70%);border:7px solid #FFD23F;box-shadow:0 18px 40px rgba(0,0,0,.5);position:relative;overflow:hidden">'
            f'<div style="position:absolute;left:26px;top:20px;text-align:center"><div style="font-size:92px;font-weight:900;line-height:1">{ovr}</div>'
            f'<div style="font-size:32px;font-weight:900;color:#FFD23F">HIM</div>'
            f'<img src="{CREST}" style="height:70px;margin-top:8px"></div>'
            f'<img src="{img}" style="position:absolute;right:-10px;top:24px;height:330px">'
            f'<div style="position:absolute;left:0;right:0;top:350px;text-align:center;font-size:50px;font-weight:900;letter-spacing:1px">{name.upper()}</div>'
            f'<div style="position:absolute;left:0;right:0;top:410px;text-align:center;font-size:28px;font-weight:700;color:#9DB8FF">{age} YOSH • QORATEPA</div>'
            f'<div style="position:absolute;left:36px;right:36px;top:460px;display:grid;grid-template-columns:1fr 1fr;column-gap:40px;border-top:3px solid rgba(255,255,255,.3);padding-top:10px">{rows}</div>'
            f'<div style="position:absolute;right:20px;bottom:16px;width:76px;height:76px;border-radius:50%;background:#FFD23F;color:#0D2557;font-size:52px;font-weight:900;display:flex;align-items:center;justify-content:center">{n}</div></div>')

D_STATS = [("TEZ", 82), ("HIM", 66), ("PAS", 61), ("KUCH", 63), ("DRB", 64), ("ZARB", 41)]
S_STATS = [("TEZ", 61), ("HIM", 75), ("PAS", 66), ("KUCH", 78), ("DRB", 54), ("ZARB", 47)]
SCR_X, SCR_Y, SCR_W, SCR_H = 815, 483, 400, 240   # LED screen area on BG_stand_renovated
SCREEN = '<div style="width:{w}px;height:{h}px;background:#06122c;border:6px solid #222;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-weight:900;text-align:center;overflow:hidden;box-shadow:0 0 30px rgba(120,170,255,.6)">{body}</div>'

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
   lab('<div class="badge"><small>LAYKLAR</small><b>0</b><i>1 KUNDA</i></div>', 780, 500, frac(2, 0.25), counter=roll(frac(2, 0.3), 0, LIKES)),
   lab('<div class="card"><small>VIRTUAL KLUB FONDI</small><b>0</b><span>so‘m</span></div>', 540, 900, frac(2, 0.5), enter="up",
       counter=roll(frac(2, 0.55), 15_000_000, FUND1, 20)),
   lab(chip(f"+{LIKES} × 15 000 so‘m", True), 540, 1080, frac(2, 0.75), enter="stamp"),
 ]},
 # INVESTMENT: +20M in, -20M on renovation
 {"from": s(3), "to": s(4), "bg": {"src": f"{A1}/BG_stand_empty.png", "zoom": [1.0, 1.1]}, "items": [
   lab(chip("KATTA YANGILIK!", True), 540, 260, s(3, 0.05), enter="stamp", idle="pulse"),
   lab('<div class="card"><small>QORATEPA SPORT JAMG‘ARMASI</small><b style="color:#FFD23F">+20 000 000</b><span>so‘m investitsiya</span></div>', 540, 520, frac(3, 0.25), enter="drop", enterDur=0.6),
   lab('<div class="card"><small>VIRTUAL KLUB FONDI</small><b>0</b><span>so‘m</span></div>', 540, 860, frac(3, 0.35), enter="up",
       counter=roll(frac(3, 0.38), FUND1, FUND1 + INVEST, 14) + roll(frac(3, 0.78), FUND1 + INVEST, FUND1, 14)),
   lab(chip("−20 000 000 → STADION TA’MIRI"), 540, 1060, frac(3, 0.76), enter="stamp"),
   spr("bekzod_celebrate", 820, 1700, 700, frac(3, 0.3), enter="up", idle="hop", z=9),
 ]},
 # NEW STADIUM + SCREEN
 {"from": s(4), "to": s(5), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.0]}, "items": [
   lab(chip("YANGI TRIBUNA ✔", True), 300, 260, s(4, 0.1), enter="stamp"),
   lab(SCREEN.format(w=SCR_W, h=SCR_H, body='<div style="font-size:30px;color:#FFD23F">KUN IZOHI</div><div style="font-size:40px">@kewl.imjay45</div><div style="font-size:34px">“Stadion” ❤</div>'),
       SCR_X, SCR_Y, frac(4, 0.3), frac(4, 0.62), enter="fade", z=6),
   lab(SCREEN.format(w=SCR_W, h=SCR_H, body='<div style="font-size:30px;color:#FFD23F">YANGI MUXLISLAR</div><div style="font-size:30px;line-height:1.3">@bek_.071<br>@legends00000001<br>@rozakoldasovna</div>'),
       SCR_X, SCR_Y, frac(4, 0.62), enter="fade", z=6),
 ] + [lab(f'<div class="chip" style="font-size:36px;background:#1F4FB8">{n}</div>', x, y, frac(4, 0.35 + k * 0.08), enter="drop", enterDur=0.6, idle="sway")
      for k, (n, x, y) in enumerate(zip(names, [260, 700, 300, 760], [820, 880, 1000, 1060]))]},
 # QUESTION: two defender cards
 {"from": s(5), "to": frac(5, 0.72), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.05], "blur": 10}, "items": [
   lab('<div class="title" style="font-size:86px">HIMOYACHI KERAK</div>', 540, 250, s(5), enter="stamp"),
   lab(card(1, "Doston", 22, 67, f"{SPR}/doston.png", D_STATS, "#2a62d6"), 290, 760, frac(5, 0.2), enter="slideL", idle="sway"),
   lab(card(2, "Sherzod", 25, 69, f"{SPR}/sherzod.png", S_STATS, "#1F4FB8"), 790, 760, frac(5, 0.32), enter="slideR", idle="sway"),
   lab('<div class="title" style="font-size:72px">1 yoki 2?</div>', 540, 1210, frac(5, 0.5), enter="stamp", idle="pulse"),
 ]},
 # OUTRO HOOK
 {"from": frac(5, 0.72), "to": TOTAL + 1, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.1, 1.3], "focus": [0.5, 0.5, 0.5, 0.42]}, "items": [
   lab('<div style="position:absolute;left:-600px;top:-1000px;width:1200px;height:2000px;background:radial-gradient(circle at 50% 60%,transparent 30%,rgba(0,0,0,.75) 70%)"></div>', 540, 960, frac(5, 0.72), enter="fade", z=5),
   spr("goat_chew", 540, 1650, 1050, frac(5, 0.74), enter="up", idle="chew", z=12),
   lab('<div class="title" style="font-size:96px">ERTAGA...</div>', 540, 330, frac(5, 0.8), enter="stamp", z=25),
   lab(chip("ECHKIGA NIMA BO‘LDI? 🐐", True), 540, 460, frac(5, 0.87), enter="stamp", z=25),
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
