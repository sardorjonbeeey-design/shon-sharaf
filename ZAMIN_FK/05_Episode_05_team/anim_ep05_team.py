"""ZAMIN FK — 'Jamoa shakllanmoqda' (the real squad). Overlays/captions: the same engine as Day 2-5 (tools/anim).
Backgrounds: the project's own 3D stadium page filmed frame by frame (film/, render_film.js) with the real roster.
Usage: python3 anim_ep05_team.py                 -> exports/ZFK_EP05_team.mp4 + .srt
       python3 anim_ep05_team.py --frames t1,t2   -> stills in build/frames/
       python3 anim_ep05_team.py --times          -> beat timings"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")
COMMENT = "file://" + os.path.join(HERE, "assets", "comment_yusup_maxamadov.jpg")
PX = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"   # replaced per frame by the 3D shot

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

ROSTER = json.load(open(os.path.join(HERE, "data", "roster.json")))
START = [p for p in ROSTER if p["role"] == "starter"]
BENCH = [p for p in ROSTER if p["role"] == "substitute"]
assert len(START) == 11 and len(BENCH) == 11 and len({p["number"] for p in ROSTER}) == 22
MANAGER = "@yusup_maxamadov"
POS_UZ = {"GK": "DARVOZABON", "LB": "CHAP HIMOYACHI", "CB": "MARKAZIY HIMOYACHI", "RB": "O‘NG HIMOYACHI", "CDM": "TAYANCH YARIM HIMOYACHI",
          "CM": "MARKAZIY YARIM HIMOYACHI", "CAM": "HUJUMKOR YARIM HIMOYACHI", "LW": "CHAP QANOT", "ST": "HUJUMCHI", "RW": "O‘NG QANOT"}

# narration: (file, [(caption sentence, highlighted word indexes, spoken form used only to time the caption)])
LINES = {
 "hook":    ("01_hook",    [("ZAMIN FK da katta o‘zgarishlar!", [3, 4], None),
                            ("Endi bizda nafaqat klub, balki haqiqiy jamoa ham bor!", [5, 6], None)]),
 "manager": ("02_manager", [("Yoshlar akademiyamizning birinchi menejeri ham aniqlandi!", [2, 3], None),
                            (MANAGER + ", tabriklaymiz!", [0], "Yusup Maxamadov tabriklaymiz")]),
 "squad":   ("03_squad",   [("Mana ular — ZAMIN FK ning haqiqiy tarkibi!", [5, 6], None)]),
 "bench":   ("04_bench",   [("Va zaxiradagi o‘yinchilarimiz!", [1, 2], None)]),
 "outro":   ("05_outro",   [("Bu hali boshlanishi!", [2], None), ("ZAMIN FK endi birgalikda qurilmoqda.", [3, 4], None),
                            ("Siz ham bizning tariximizning bir qismi bo‘ling!", [3, 4, 5], None)]),
 "cta":     ("06_cta",     [("Siz qaysi pozitsiyada o‘ynaysiz?", [1, 2], None), ("Izohga yozing!", [0, 1], None)]),
}
GAP, T_ST, T_BN = 0.12, 1.0, 0.75                      # pause between lines; seconds per starter / substitute reveal
audio, caps, B, SENT = [], [], {}, {}
def say(key, t):
    name, phrases = LINES[key]
    f = os.path.join(HERE, "voice", name + ".mp3"); d = dur(f); audio.append((f, t))
    wlen = [len(sp or tx) for tx, _, sp in phrases]; a, span, ss = t + 0.03, d - 0.1, []
    for (text, hl, _), wl in zip(phrases, wlen):
        b = a + span * wl / sum(wlen)
        words = [w for w in text.split(" ") if w != "—"]; tot = sum(len(w) for w in words); acc = 0; wt = []
        for w in words:
            wt.append(a + (b - a) * 0.8 * acc / tot); acc += len(w)
        caps.append({"a": a, "b": b, "words": words, "hl": hl, "wt": wt, "text": text}); ss.append(a); a = b
    B[key] = (t, t + d); SENT[key] = ss
    return t + d + GAP
t = say("hook", 0.2)
t = say("manager", t)
t = say("squad", t)
R0 = t                                                  # starter reveals
R1 = R0 + len(START) * T_ST
t = say("bench", R1 + 0.05)
R2 = t                                                  # substitute reveals
R3 = R2 + len(BENCH) * T_BN
W0, W1 = R3, R3 + 2.3                                   # whole team, wide
t = say("outro", W1)
t = say("cta", t)
TOTAL = B["cta"][1] + 2.2
s = lambda k, off=0.0: B[k][0] + off
e = lambda k, off=0.0: B[k][1] + off

def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False, fs=42: f'<div class="chip{" y" if y else ""}" style="font-size:{fs}px">{txt}</div>'
card_g = lambda body, w=860, bc="#fff": (f'<div style="width:{w}px;padding:28px 32px;box-sizing:border-box;border-radius:34px;background:rgba(13,37,87,.95);'
                                        f'border:6px solid {bc};color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5)">{body}</div>')
SHADE = ('<div style="position:absolute;left:-540px;top:-960px;width:1080px;height:1920px;'
         'background:linear-gradient(rgba(5,13,36,.62),transparent 26%,transparent 58%,rgba(5,13,36,.72))"></div>')
DIM = '<div style="position:absolute;left:-540px;top:-960px;width:1080px;height:1920px;background:rgba(5,13,36,.5)"></div>'

HOOK = (f'<div style="text-align:center"><img src="{CREST}" style="height:210px;filter:drop-shadow(0 10px 20px rgba(0,0,0,.5))">'
        '<div class="title" style="font-size:118px;line-height:1.0;margin-top:8px">HAQIQIY<br><span style="color:#FFD23F">JAMOA!</span></div></div>')
ANNOUNCE = card_g(
    f'<img src="{CREST}" style="height:120px"><div style="font-size:30px;font-weight:700;letter-spacing:6px;color:#9DB8FF;margin-top:4px">YOSHLAR AKADEMIYASI</div>'
    '<div style="font-size:66px;font-weight:900;line-height:1.04;margin-top:4px">BIRINCHI MENEJER</div>'
    f'<img src="{COMMENT}" style="width:780px;border-radius:18px;margin-top:22px;display:block;margin-left:auto;margin-right:auto;border:4px solid #fff">'
    f'<div style="margin-top:22px;padding:14px 10px 10px;border-radius:22px;background:#FFD23F;color:#0D2557;font-size:72px;font-weight:900;line-height:1.05">{MANAGER}</div>', 900, "#FFD23F")

def reveal(p, k, n, group):
    nm = p["shirt"]; fs = 78 if len(nm) <= 9 else 62 if len(nm) <= 15 else 50
    fs = min(fs, 44) if max(len(w) for w in nm.split(" ")) > 15 else fs
    return (f'<div style="width:900px;box-sizing:border-box;display:flex;align-items:center;gap:26px;padding:20px 30px;border-radius:32px;'
            f'background:linear-gradient(100deg,#1F4FB8,#0D2557 72%);border:6px solid #FFD23F;color:#fff;box-shadow:0 16px 34px rgba(0,0,0,.55)">'
            f'<div style="flex:none;min-width:210px;text-align:center;font-size:170px;font-weight:900;line-height:.95;color:#FFD23F;text-shadow:0 6px 0 #0D2557">{p["number"]}</div>'
            f'<div style="text-align:left;min-width:0"><div style="font-size:26px;font-weight:700;letter-spacing:3px;color:#9DB8FF">{p["position"]} · {POS_UZ[p["position"]]}</div>'
            f'<div style="font-size:{fs}px;font-weight:900;line-height:1.04;margin-top:4px;overflow-wrap:break-word">{nm}</div>'
            f'<div style="font-size:24px;font-weight:700;letter-spacing:3px;color:#fff;opacity:.75;margin-top:6px">{group} · {k}/{n}</div></div></div>')
CTA = ('<div style="width:940px;box-sizing:border-box;padding:30px 30px 34px;border-radius:36px;background:#FFD23F;border:8px solid #0D2557;color:#0D2557;text-align:center;'
       'box-shadow:0 18px 40px rgba(0,0,0,.55)"><div style="font-size:92px;font-weight:900;line-height:1.02">SIZ QAYSI<br>POZITSIYADA<br>O‘YNAYSIZ?</div></div>')
POSROW = lambda items: '<div style="display:flex;gap:16px">' + "".join(chip(i, False, 38) for i in items) + '</div>'

RV = [(R0 + i * T_ST, R0 + (i + 1) * T_ST, p, i + 1, 11, "ASOSIY TARKIB") for i, p in enumerate(START)] + \
     [(R2 + i * T_BN, R2 + (i + 1) * T_BN, p, i + 1, 11, "ZAXIRA") for i, p in enumerate(BENCH)]
bg = {"src": PX, "zoom": [1, 1]}
scenes = [
 # 1 HOOK: drone flies into the stadium, the whole squad is already on the pitch
 {"from": 0, "to": s("manager"), "bg": bg, "items": [
   lab(SHADE, 540, 960, -1, enter="none", z=5),
   lab(HOOK, 540, 420, -1, enter="none", idle="pulse", to=SENT["hook"][1], z=24),
   lab(HOOK, 540, 420, SENT["hook"][1], enter="stamp", idle="pulse", z=24),
   lab(chip("⚽ KATTA O‘ZGARISHLAR", True, 44), 540, 150, s("hook", 0.1), enter="stamp", z=25),
   spr("goat_chew", 800, 1880, 620, -0.3, enter="up", enterDur=0.35, idle="talk", z=12),
 ]},
 # 2 ACADEMY MANAGER: the Youth Academy in the town, cinematic announcement
 {"from": s("manager"), "to": s("squad"), "bg": bg, "items": [
   lab(SHADE, 540, 960, s("manager"), enter="none", z=5),
   lab(chip("🎓 RASMIY E’LON", True, 44), 540, 150, s("manager", 0.05), enter="stamp", z=25),
   lab(ANNOUNCE, 540, 640, s("manager", 0.2), enter="drop", enterDur=0.55, idle="sway", z=23),
   lab('<div class="title" style="font-size:96px;color:#FFD23F;transform:rotate(-4deg)">TABRIKLAYMIZ! 🎉</div>', 540, 1150, SENT["manager"][1] + 0.45, enter="stamp", idle="pulse", z=26),
   spr("goat_chew", 850, 1880, 520, s("manager"), enter="peekR", idle="talk", z=12),
 ]},
 # 3a SQUAD: fly in behind the whole team
 {"from": s("squad"), "to": R0, "bg": bg, "items": [
   lab(SHADE, 540, 960, s("squad"), enter="none", z=5),
   lab('<div class="title" style="font-size:112px;text-align:center;line-height:1.0">HAQIQIY<br><span style="color:#FFD23F">TARKIB</span></div>', 540, 300, s("squad", 0.1), enter="stamp", z=25),
   lab(chip("22 O‘YINCHI · ZAMIN FK", True, 44), 540, 520, s("squad", 0.9), enter="stamp", idle="pulse", z=25),
 ]},
 # 3b + 3d: one cut per player — shirt back in 3D, name/number/position card below
 {"from": R0, "to": R1, "bg": bg, "items": [lab(reveal(p, k, n, g), 540, 1270, a, b, enter="pop", enterDur=0.16, exit="none", z=24) for a, b, p, k, n, g in RV[:11]]},
 # 3c BENCH: track along the touchline
 {"from": R1, "to": R2, "bg": bg, "items": [
   lab(SHADE, 540, 960, R1, enter="none", z=5),
   lab('<div class="title" style="font-size:150px">ZAXIRA</div>', 540, 300, R1 + 0.1, enter="stamp", z=25),
   lab(chip("YANA 11 O‘YINCHI", True, 44), 540, 470, R1 + 0.6, enter="stamp", idle="pulse", z=25),
 ]},
 {"from": R2, "to": R3, "bg": bg, "items": [lab(reveal(p, k, n, g), 540, 1270, a, b, enter="pop", enterDur=0.14, exit="none", z=24) for a, b, p, k, n, g in RV[11:]]},
 # 3e the whole team
 {"from": W0, "to": s("outro"), "bg": bg, "items": [
   lab(SHADE, 540, 960, W0, enter="none", z=5),
   lab('<div class="title" style="font-size:104px;text-align:center;line-height:1.02">22 O‘YINCHI<br><span style="color:#FFD23F">BITTA JAMOA</span></div>', 540, 330, W0 + 0.1, enter="stamp", idle="pulse", z=25),
 ]},
 # 4 OUTRO: rise over the team towards the stand
 {"from": s("outro"), "to": s("cta"), "bg": bg, "items": [
   lab(SHADE, 540, 960, s("outro"), enter="none", z=5),
   lab(chip("BU HALI BOSHLANISHI!", True, 52), 540, 230, s("outro", 0.1), enter="stamp", z=25),
   lab(f'<div style="display:flex;align-items:center;gap:18px"><img src="{CREST}" style="height:150px"><div class="title" style="font-size:78px;text-align:left;line-height:1.04">BIRGALIKDA<br>QURAMIZ</div></div>',
       540, 430, SENT["outro"][1], enter="stamp", z=25),
   spr("goat_chew", 830, 1880, 560, s("outro"), enter="up", idle="talk", z=12),
 ]},
 # CTA: one question, answered in a comment
 {"from": s("cta"), "to": TOTAL + 1, "bg": {"src": PX, "zoom": [1, 1], "blur": 7}, "items": [
   lab(DIM, 540, 960, s("cta"), enter="none", z=5),
   lab(CTA, 540, 480, s("cta", 0.05), enter="stamp", idle="pulse", z=26),
   lab(POSROW(["DARVOZABON", "HIMOYACHI"]), 540, 800, s("cta", 0.7), enter="stamp", z=25),
   lab(POSROW(["YARIM HIMOYACHI", "HUJUMCHI"]), 540, 900, s("cta", 0.95), enter="stamp", z=25),
   lab('<div class="title" style="font-size:86px;color:#FFD23F">IZOHGA YOZING! 👇</div>', 540, 1070, SENT["cta"][1], enter="stamp", idle="pulse", z=26),
   spr("goat_chew", 860, 1880, 520, s("cta"), enter="none", idle="talk", z=12),
   lab('<div class="follow">+ OBUNA BO‘LING</div>', 400, 1440, e("cta", 0.2), idle="pulse", z=26),
 ]},
]

# ---- 3D shots (world metres; pitch centre = 0,0,0; main stand and LED screen on the -z side) ----
def shot(a, b, layout, cam, tgt, fov=(50, 50), ease="io", **k):
    return {"from": a, "to": b, "layout": layout, "cam": cam, "tgt": tgt, "fov": list(fov), "ease": ease, **k}
info = {}                                               # player spots per layout, mirrored from film/scene.js spot()
POS_SPOT = {"GK": (42, 0), "LB": (28, -22), "RB": (28, 22), "CDM": (14, 0), "CM": (9, -13), "CAM": (5, 13), "LW": (-12, -20), "ST": (-19, 0), "RW": (-12, 20)}
cb = 0
for i, p in enumerate(START):
    if p["position"] == "CB":
        cb += 1; info[p["order"]] = (31, 7 if cb == 2 else -7)
    else:
        info[p["order"]] = POS_SPOT[p["position"]]
for k, p in enumerate(BENCH):
    info[p["order"]] = ((k - 5) * 5.4, 29.5)
shots = [
 shot(0, s("manager"), "team", [[118, 78, 126], [20, 13, 46]], [[0, 6, 0], [0, 2.5, 4]], (55, 55), "out"),
 shot(s("manager"), s("squad"), "team", [[-134, 20, -66], [-124, 10, -54]], [[-102.9, 3, -16], [-102.9, 3, -20]], (50, 46), "io", players=False),
 shot(s("squad"), R0, "team", [[0, 26, 60], [0, 5.2, 21.5]], [[0, 2, 0], [0, 2.2, 5]], (60, 52), "out"),
]
for j, (a, b, p, k, n, g) in enumerate(RV):
    x, z = info[p["order"]]; side = 1 if j % 2 else -1
    if p["role"] == "starter":                          # faces -x: camera behind on +x
        shots.append(shot(a, b, "form", [[x + 6.5, 3.1, z + side * 1.4], [x + 5.8, 2.9, z + side * 0.5]], [[x, 1.5, z], [x, 1.5, z]], (50, 50), "out", focus=p["order"]))
    else:                                               # faces -z (the pitch): camera behind on +z
        shots.append(shot(a, b, "form", [[x + side * 1.4, 3.1, z + 6.3], [x + side * 0.5, 2.9, z + 5.7]], [[x, 1.5, z], [x, 1.5, z]], (50, 50), "out", focus=p["order"]))
shots += [
 shot(R1, R2, "form", [[-24, 3.2, 35.6], [-4, 3.2, 35.6]], [[-17, 1.7, 29.5], [3, 1.7, 29.5]], (58, 58), "io"),
 shot(W0, s("cta"), "team", [[0, 6.5, 24], [0, 30, 60]], [[0, 2.2, 4], [0, 9, -18]], (58, 58), "io"),
 shot(s("cta"), TOTAL + 1, "team", [[0, 30, 60], [0, 34, 66]], [[0, 9, -18], [0, 10, -20]], (58, 58), "lin"),
]
shots.sort(key=lambda q: q["from"])
FILM = {"time": "16.4", "screen": ["YANGI TARKIB", "22 O‘YINCHI", "Birgalikda quramiz"], "shots": shots}
# sound: narration + the crowd bed and whistle already used in Day 3 + a soft hit on every reveal cut
SFX3 = os.path.join(Z, "03_Episode_03", "sfx")
sfx = [(os.path.join(SFX3, "crowd_bed.wav"), 0.0, 0.16), (os.path.join(SFX3, "whistle.wav"), s("squad") - 0.15, 0.35)] + \
      [(os.path.join(HERE, "sfx", "hit.wav"), a, 0.9) for a, *_ in RV]

EP = {"total": TOTAL, "scenes": scenes, "captions": caps}
build = os.path.join(HERE, "build"); os.makedirs(build, exist_ok=True)
json.dump(EP, open(os.path.join(build, "anim.json"), "w"), ensure_ascii=False)
json.dump(FILM, open(os.path.join(build, "film.json"), "w"), ensure_ascii=False)
if len(sys.argv) > 1 and sys.argv[1] == "--times":
    print({k: (round(a, 2), round(b, 2)) for k, (a, b) in B.items()}); print("reveals", round(R0, 2), round(R1, 2), round(R2, 2), round(R3, 2), "total", round(TOTAL, 2)); sys.exit()
env = dict(os.environ)
if len(sys.argv) > 2 and sys.argv[1] == "--frames":
    env["ONLY"] = sys.argv[2]
silent = os.path.join(build, "anim_video.mp4")
subprocess.run(["node", os.path.join(HERE, "render_film.js"), os.path.join(build, "anim.json"), os.path.join(build, "film.json"), silent], check=True, env=env, cwd=HERE)
if "ONLY" in env:
    print("frames: build/frames", "total", round(TOTAL, 2)); sys.exit()
inputs, fc, voice, fx = ["-i", silent], [], [], []
k = 0
for f, off in audio:
    k += 1; inputs += ["-i", f]; ms = int(off * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]"); voice.append(f"[a{k}]")
for f, at, vol in sfx:
    k += 1; inputs += ["-i", f]; ms = int(max(0, at) * 1000)
    fc.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=mono,adelay={ms}|{ms},volume={vol}[a{k}]"); fx.append(f"[a{k}]")
fc.append(f"{''.join(voice)}amix=inputs={len(voice)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5,aresample=48000[v]")
fc.append(f"{''.join(fx)}amix=inputs={len(fx)}:normalize=0,apad,atrim=0:{TOTAL:.3f},afade=t=out:st={TOTAL - 1.2:.3f}:d=1.2[x]")
fc.append("[v][x]amix=inputs=2:normalize=0,alimiter=limit=0.84[aout]")
out = os.path.join(HERE, "exports", "ZFK_EP05_team.mp4")
os.makedirs(os.path.dirname(out), exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)
ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round(x % 1 * 1000)) % 1000:03d}"
with open(os.path.join(HERE, "exports", "ZFK_EP05_team.srt"), "w") as fh:
    for i, c in enumerate(caps, 1):
        fh.write(f"{i}\n{ts(c['a'])} --> {ts(c['b'])}\n{c['text']}\n\n")
print("OK", out, round(TOTAL, 2))
