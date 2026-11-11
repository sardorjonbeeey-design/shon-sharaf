"""ZAMIN FK — 'Jamoa shakllanmoqda': academy manager + the real squad on one board (name + shirt number only).
Same engine as Day 2-5 (tools/anim).
Usage: python3 anim_ep05_team.py                 -> exports/ZFK_EP05_team.mp4 + .srt + squad board PNG
       python3 anim_ep05_team.py --frames t1,t2   -> still-frame check (build/anim_video.mp4)
       python3 anim_ep05_team.py --times          -> beat timings"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
A1 = "file://" + os.path.join(Z, "02_Episode_01", "assets")
A2 = "file://" + os.path.join(Z, "02_Episode_02", "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")
COMMENT = "file://" + os.path.join(HERE, "assets", "comment_yusup_maxamadov.jpg")

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

ROSTER = json.load(open(os.path.join(HERE, "data", "roster.json")))      # real roster (/api/squad) + unique random shirt numbers
START = [p for p in ROSTER if p["role"] == "starter"]
BENCH = [p for p in ROSTER if p["role"] == "substitute"]
assert len(START) == 11 and len(BENCH) == 11 and len({p["number"] for p in ROSTER}) == 22
MANAGER = "@yusup_maxamadov"
show = lambda p: p["name"].replace("_", " ")

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
GAP = 0.12
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
t = say("bench", t + 1.6)                               # hold on the starting XI
BN = t                                                  # bench panel drops in once its line is spoken
HOLD = BN + 4.2                                         # time to read the whole board
t = say("outro", HOLD)
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
VIG = '<div style="position:absolute;left:-600px;top:-1000px;width:1200px;height:2000px;background:radial-gradient(circle at 50% 50%,transparent 28%,rgba(0,0,0,.78) 70%)"></div>'
NIGHT = ('<div style="position:absolute;left:-540px;top:-960px;width:1080px;height:1920px;'
         'background:radial-gradient(900px 700px at 50% 8%,rgba(31,79,184,.55),transparent 70%),linear-gradient(180deg,rgba(9,24,60,.93),rgba(5,13,36,.97))"></div>')

HOOK = (f'<div style="text-align:center"><img src="{CREST}" style="height:230px;filter:drop-shadow(0 10px 20px rgba(0,0,0,.5))">'
        '<div class="title" style="font-size:128px;line-height:1.0;margin-top:8px">HAQIQIY<br><span style="color:#FFD23F">JAMOA!</span></div></div>')
ANNOUNCE = card_g(
    f'<img src="{CREST}" style="height:120px"><div style="font-size:30px;font-weight:700;letter-spacing:6px;color:#9DB8FF;margin-top:4px">YOSHLAR AKADEMIYASI</div>'
    '<div style="font-size:66px;font-weight:900;line-height:1.04;margin-top:4px">BIRINCHI MENEJER</div>'
    f'<img src="{COMMENT}" style="width:780px;border-radius:18px;margin-top:22px;display:block;margin-left:auto;margin-right:auto;border:4px solid #fff">'
    f'<div style="margin-top:22px;padding:14px 10px 10px;border-radius:22px;background:#FFD23F;color:#0D2557;font-size:72px;font-weight:900;line-height:1.05">{MANAGER}</div>', 900, "#FFD23F")

# ---- the squad board: dark tactics board, shirts carry the number, plate carries the name ----
PX0, PY0, PW, PH = 50, 300, 980, 900                    # pitch box on screen
PITCH = (f'<div style="width:{PW}px;height:{PH}px;box-sizing:border-box;border-radius:34px;border:5px solid #FFD23F;overflow:hidden;position:relative;'
         'background:repeating-linear-gradient(180deg,#123a8f 0 100px,#0f3280 100px 200px);box-shadow:0 22px 50px rgba(0,0,0,.55)">'
         f'<svg viewBox="0 0 {PW} {PH}" style="position:absolute;left:0;top:0;width:100%;height:100%" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="4">'
         f'<path d="M0 {PH / 2} H{PW}"/><circle cx="{PW / 2}" cy="{PH / 2}" r="96"/>'
         f'<path d="M250 0 V150 H{PW - 250} V0"/><path d="M380 0 V58 H{PW - 380} V0"/>'
         f'<path d="M250 {PH} V{PH - 150} H{PW - 250} V{PH}"/><path d="M380 {PH} V{PH - 58} H{PW - 380} V{PH}"/></svg></div>')
HEAD = (f'<div style="width:{PW}px;display:flex;align-items:center;gap:26px"><img src="{CREST}" style="height:170px;filter:drop-shadow(0 8px 16px rgba(0,0,0,.5))">'
        '<div style="text-align:left"><div style="font-size:30px;font-weight:700;letter-spacing:10px;color:#FFD23F">ZAMIN FK</div>'
        '<div style="font-size:92px;font-weight:900;line-height:.95;color:#fff">JAMOA <span style="color:#FFD23F">TARKIBI</span></div></div></div>')
def shirt(num, gk=False, w=124):
    body, trim = ("#2E9E4F", "#0D2557") if gk else ("#1F4FB8", "#FFD23F")
    fs = 50 if num < 10 else 44
    return (f'<div style="position:relative;width:{w}px;height:{round(w * .92)}px;margin:0 auto;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))">'
            f'<svg viewBox="0 0 100 92" style="width:100%;height:100%;display:block"><path d="M32 4 L8 16 L0 40 L18 47 L24 36 L24 88 L76 88 L76 36 L82 47 L100 40 L92 16 L68 4 C64 14 36 14 32 4 Z" fill="{body}" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>'
            f'<path d="M32 4 C36 14 64 14 68 4" fill="none" stroke="{trim}" stroke-width="5" stroke-linecap="round"/></svg>'
            f'<div style="position:absolute;left:0;right:0;top:{round(w * .29)}px;text-align:center;font-weight:900;font-size:{fs}px;line-height:1;color:#fff;text-shadow:0 3px 0 rgba(13,37,87,.6)">{num}</div></div>')
def token(p):
    return (f'<div style="width:250px;text-align:center">{shirt(p["number"], p["position"] == "GK")}'
            f'<div style="display:inline-block;max-width:250px;margin-top:8px;padding:7px 14px 6px;border-radius:12px;background:#fff;color:#0D2557;'
            f'font-weight:900;font-size:23px;line-height:1.1;overflow-wrap:break-word;text-wrap:balance;box-shadow:0 6px 14px rgba(0,0,0,.4)">{show(p)}</div></div>')
SPOT = {"LW": (17, 13), "ST": (50, 10), "RW": (83, 13), "CM": (24, 40), "CAM": (50, 33), "CDM": (76, 40),
        "LB": (14, 63), "CB1": (37, 69), "CB2": (63, 69), "RB": (86, 63), "GK": (50, 88)}
cb, XI = 0, []
for p in START:
    key = p["position"]
    if key == "CB":
        cb += 1; key = "CB" + str(cb)
    fx, fy = SPOT[key]; XI.append((p, PX0 + PW * fx / 100, PY0 + PH * fy / 100))
XI.sort(key=lambda q: -q[2])                             # reveal from the goalkeeper up to the forwards
def bench_row(p):
    return (f'<div style="display:flex;align-items:center;gap:12px;min-width:0;height:44px"><div style="flex:none;width:58px;height:38px;border-radius:10px;background:#FFD23F;color:#0D2557;'
            f'font-weight:900;font-size:25px;line-height:40px;text-align:center">{p["number"]}</div>'
            f'<div style="font-weight:700;font-size:24px;white-space:nowrap;color:#fff">{show(p)}</div></div>')
BENCHP = (f'<div style="width:{PW}px;box-sizing:border-box;padding:18px 28px 16px;border-radius:30px;background:rgba(8,23,55,.94);border:4px solid #fff;box-shadow:0 16px 36px rgba(0,0,0,.55)">'
          '<div style="display:flex;align-items:center;gap:16px;font-weight:900;font-size:34px;letter-spacing:6px;color:#FFD23F;margin-bottom:8px">ZAXIRA'
          '<div style="flex:1;height:3px;background:linear-gradient(90deg,#FFD23F,transparent)"></div></div>'
          '<div style="display:grid;grid-template-columns:1.2fr 1fr;grid-auto-flow:column;grid-template-rows:repeat(6,44px);column-gap:20px;text-align:left">'
          + "".join(bench_row(p) for p in BENCH) + '</div></div>')

CTA = ('<div style="width:940px;box-sizing:border-box;padding:30px 30px 34px;border-radius:36px;background:#FFD23F;border:8px solid #0D2557;color:#0D2557;text-align:center;'
       'box-shadow:0 18px 40px rgba(0,0,0,.55)"><div style="font-size:92px;font-weight:900;line-height:1.02">SIZ QAYSI<br>POZITSIYADA<br>O‘YNAYSIZ?</div></div>')
POSROW = lambda items: '<div style="display:flex;gap:16px">' + "".join(chip(i, False, 38) for i in items) + '</div>'

SQ0, SQ1 = s("squad"), s("outro")
POP = [SQ0 + 0.35 + i * 0.24 for i in range(11)]
scenes = [
 # 1 HOOK: title readable on frame 0, goat narrates
 {"from": 0, "to": s("manager"), "bg": {"src": f"{A1}/S05_stadium_wide.png", "zoom": [1.25, 1.05], "blur": 3}, "items": [
   lab(VIG, 540, 960, -1, enter="none", z=5),
   lab(chip("⚽ KATTA O‘ZGARISHLAR", True, 46), 540, 170, -1, enter="none", z=25),
   lab(HOOK, 540, 520, -1.2, enter="stamp", idle="pulse", z=24),
   lab(chip("KLUB ✅ + JAMOA ✅", False, 50), 540, 900, SENT["hook"][1] + 0.3, enter="stamp", z=25),
   spr("goat_chew", 800, 1880, 680, -0.3, enter="up", enterDur=0.35, idle="talk", z=12),
 ]},
 # 2 ACADEMY MANAGER: official announcement
 {"from": s("manager"), "to": SQ0, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.05, 1.15], "blur": 9}, "items": [
   lab(VIG, 540, 960, s("manager"), enter="none", z=5),
   lab(chip("🎓 RASMIY E’LON", True, 46), 540, 150, s("manager", 0.05), enter="stamp", z=25),
   lab(ANNOUNCE, 540, 640, s("manager", 0.2), enter="drop", enterDur=0.55, idle="sway", z=23),
   lab('<div class="title" style="font-size:96px;color:#FFD23F;transform:rotate(-4deg)">TABRIKLAYMIZ! 🎉</div>', 540, 1150, SENT["manager"][1] + 0.45, enter="stamp", idle="pulse", z=26),
   spr("goat_chew", 850, 1880, 520, s("manager"), enter="peekR", idle="talk", z=12),
 ]},
 # 3 THE REAL SQUAD: one board — 11 on the pitch, 11 on the bench, name + number
 {"from": SQ0, "to": SQ1, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.1, 1.18], "blur": 12}, "items": [
   lab(NIGHT, 540, 960, SQ0, enter="none", z=4),
   lab(HEAD, 540, 175, SQ0 + 0.05, enter="drop", enterDur=0.4, z=20),
   lab(PITCH, PX0 + PW / 2, PY0 + PH / 2, SQ0 + 0.1, enter="up", enterDur=0.4, z=8),
 ] + [lab(token(p), x, y + 26, POP[i], enter="pop", enterDur=0.3, z=22) for i, (p, x, y) in enumerate(XI)] + [
   lab(BENCHP, 540, 1400, BN, enter="up", enterDur=0.45, z=23),
 ]},
 # 4 OUTRO
 {"from": SQ1, "to": s("cta"), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.14], "focus": [0.5, 0.5, 0.5, 0.45], "blur": 5}, "items": [
   lab(VIG, 540, 960, SQ1, enter="none", z=5),
   lab(chip("BU HALI BOSHLANISHI!", True, 54), 540, 250, SQ1 + 0.1, enter="stamp", z=25),
   lab(f'<div style="text-align:center"><img src="{CREST}" style="height:260px;filter:drop-shadow(0 10px 20px rgba(0,0,0,.5))">'
       '<div class="title" style="font-size:104px;line-height:1.02;margin-top:6px">BIRGALIKDA<br><span style="color:#FFD23F">QURAMIZ</span></div></div>', 540, 640, SENT["outro"][1], enter="stamp", idle="pulse", z=25),
   lab(chip("SIZ HAM TARIXIMIZNING BIR QISMISIZ 💙", False, 36), 540, 1010, SENT["outro"][2] + 0.3, enter="stamp", z=25),
   spr("goat_chew", 830, 1880, 560, SQ1, enter="up", idle="talk", z=12),
 ]},
 # CTA: one question, answered in a comment
 {"from": s("cta"), "to": TOTAL + 1, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.14, 1.22], "focus": [0.5, 0.45, 0.5, 0.42], "blur": 10}, "items": [
   lab(VIG, 540, 960, s("cta"), enter="none", z=5),
   lab(CTA, 540, 480, s("cta", 0.05), enter="stamp", idle="pulse", z=26),
   lab(POSROW(["DARVOZABON", "HIMOYACHI"]), 540, 800, s("cta", 0.7), enter="stamp", z=25),
   lab(POSROW(["YARIM HIMOYACHI", "HUJUMCHI"]), 540, 900, s("cta", 0.95), enter="stamp", z=25),
   lab('<div class="title" style="font-size:86px;color:#FFD23F">IZOHGA YOZING! 👇</div>', 540, 1070, SENT["cta"][1], enter="stamp", idle="pulse", z=26),
   spr("goat_chew", 860, 1880, 520, s("cta"), enter="none", idle="talk", z=12),
   lab('<div class="follow">+ OBUNA BO‘LING</div>', 400, 1440, e("cta", 0.2), idle="pulse", z=26),
 ]},
]
sfx = [(os.path.join(HERE, "sfx", "hit.wav"), a, 0.55) for a in POP] + [(os.path.join(HERE, "sfx", "hit.wav"), BN, 0.8)]
BOARD_T = round((HOLD - 0.4) * 30) / 30                 # still of the finished board

EP = {"total": TOTAL, "scenes": scenes, "captions": caps}
build = os.path.join(HERE, "build"); os.makedirs(build, exist_ok=True)
json.dump(EP, open(os.path.join(build, "anim.json"), "w"), ensure_ascii=False)
if len(sys.argv) > 1 and sys.argv[1] == "--times":
    print({k: (round(a, 2), round(b, 2)) for k, (a, b) in B.items()}, "bench", round(BN, 2), "board", BOARD_T, "total", round(TOTAL, 2)); sys.exit()
env = dict(os.environ)
if len(sys.argv) > 2 and sys.argv[1] == "--frames":
    env["ONLY"] = sys.argv[2]
silent = os.path.join(build, "anim_video.mp4")
subprocess.run(["node", os.path.join(TOOLS, "render.js"), os.path.join(build, "anim.json"), silent], check=True, env=env)
if "ONLY" in env:
    print("frames:", silent, "total", round(TOTAL, 2)); sys.exit()
inputs, fc, voice, fx = ["-i", silent], [], [], []
k = 0
for f, off in audio:
    k += 1; inputs += ["-i", f]; ms = int(off * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]"); voice.append(f"[a{k}]")
for f, at, vol in sfx:
    k += 1; inputs += ["-i", f]; ms = int(at * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms},volume={vol}[a{k}]"); fx.append(f"[a{k}]")
fc.append(f"{''.join(voice)}amix=inputs={len(voice)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5,aresample=48000[v]")
fc.append(f"{''.join(fx)}amix=inputs={len(fx)}:normalize=0,apad,atrim=0:{TOTAL:.3f}[x]")
fc.append("[v][x]amix=inputs=2:normalize=0,alimiter=limit=0.84[aout]")
exp = os.path.join(HERE, "exports"); os.makedirs(exp, exist_ok=True)
out = os.path.join(exp, "ZFK_EP05_team.mp4")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{BOARD_T:.3f}", "-i", out, "-frames:v", "1", os.path.join(exp, "ZFK_EP05_team_squad_board.png")], check=True)
ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round(x % 1 * 1000)) % 1000:03d}"
with open(os.path.join(exp, "ZFK_EP05_team.srt"), "w") as fh:
    for i, c in enumerate(caps, 1):
        fh.write(f"{i}\n{ts(c['a'])} --> {ts(c['b'])}\n{c['text']}\n\n")
print("OK", out, round(TOTAL, 2))
