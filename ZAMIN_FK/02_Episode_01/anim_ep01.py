"""Day 1 animated episode: builds ep JSON from narration timings, renders frames, muxes audio.
Usage: python3 anim_ep01.py [--frames t1,t2,...]  (frames = quick still check)"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
AS = "file://" + os.path.join(HERE, "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

LINES = [("01_hook", 7.7), ("02_payoff", 14.4), ("03_turning_point", 8.5), ("04_consequence", 9.5), ("05_question", 11.0)]
t, L, audio = 0.3, [], []
for name, ph in LINES:
    f = next((os.path.join(HERE, "voice", name + e) for e in (".mp3", ".wav") if os.path.exists(os.path.join(HERE, "voice", name + e))), None)
    d = dur(f) if f else ph
    if f: audio.append((f, t))
    L.append((t, t + d, bool(f)))
    t += d + 0.3
TOTAL = L[-1][1] + 2.6
s = lambda i, off=0.0: L[i - 1][0] + off          # line i start + offset
e = lambda i, off=0.0: L[i - 1][1] + off          # line i end + offset

# captions: (start, end, text, highlighted word indices)
CAP = [
 (s(1), s(1, 2.35), "Bu — Zamin FK stadioni.", [3, 4]),
 (s(1, 2.6), s(1, 5.1), "Muxlislar soni... nol.", [2]),
 (s(1, 6.0), e(1, .3), "Bitta echkini hisoblamasak.", [1]),
 (s(2), s(2, 2.9), "Biz — Qoratepadan chiqqan havaskor klubmiz.", [2]),
 (s(2, 3.0), s(2, 5.2), "Bizda qattiqqo‘l murabbiy bor...", [1]),
 (s(2, 5.3), s(2, 8.0), "o‘zini yulduz deb o‘ylaydigan hujumchi bor...", [1]),
 (s(2, 8.0), s(2, 11.2), "darvozabonimiz esa qo‘lqopini hali ham qidiryapti.", [2]),
 (s(2, 11.4), e(2, .3), "Klub fondida esa atigi 15 million so‘m.", [4, 5, 6]),
 (s(3), s(3, 3.2), "Maqsadimiz — eng quyi havaskor ligadan", [3, 4]),
 (s(3, 3.0), s(3, 5.6), "O‘zbekiston futbolining eng yuqori pog‘onasigacha chiqish.", [2, 3]),
 (s(3, 5.9), e(3, .3), "Ha... hozircha yo‘l uzoq.", [3]),
 (s(4), s(4, 2.1), "Lekin bu yerda SIZ keraksiz!", [3]),
 (s(4, 2.2), s(4, 5.3), "Har bir obunachi — tribunada bitta virtual muxlis.", [2, 7]),
 (s(4, 5.4), s(4, 8.3), "Har bir layk — klub fondiga 15 ming so‘m.", [2, 5, 6, 7]),
 (s(4, 8.4), e(4, .3), "Keling, bu stadionni birga to‘ldiramiz!", [3, 4]),
 (s(5), s(5, 2.0), "Birinchi qarorni SIZ qabul qilasiz:", [2]),
 (s(5, 2.1), s(5, 7.0), "stadion, yangi hujumchi, mashg‘ulot bazasi yoki yangi murabbiy?", [0, 2, 3, 4, 7]),
 (s(5, 7.6), s(5, 9.3), "Izohga bitta so‘z yozing.", [1, 2]),
 (s(5, 9.4), e(5, .1), "Eng ko‘p layk olgan izoh — 24 soatdan keyin g‘olib!", [6, 7]),
]
caps = []
for a, b, text, hl in CAP:
    words = [w for w in text.split(" ") if w != "—"]
    span = (b - a) * 0.8
    tot = sum(len(w) for w in words)
    acc, wt = 0, []
    for w in words:
        wt.append(a + span * acc / tot); acc += len(w)
    caps.append({"a": a, "b": b, "words": words, "hl": hl, "wt": wt})

def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False: f'<div class="chip{" y" if y else ""}">{txt}</div>'
badge = '<div class="badge"><small>MUXLISLAR</small><b>0</b><i>VIRTUAL</i></div>'
fund_steps = [[s(2, 11.4) + i * 0.07, round(15_000_000 * (i / 14) ** 2)] for i in range(15)]

scenes = [
 {"from": 0, "to": s(2), "bg": {"src": f"{AS}/BG_stand_empty.png", "zoom": [1.0, 1.08], "focus": [0.5, 0.5, 0.5, 0.45]}, "items": [
   lab('<div class="title">1-KUN</div>', 540, 250, 0.15, enter="stamp", idle="pulse"),
   lab(chip("NOLDAN BOSHLAYMIZ"), 540, 390, 0.7),
   spr("goat_chew", 560, 1180, 560, 0.35, idle="chew", z=11),
   lab(badge, 190, 640, s(1, 2.6), counter=[[0, 0]]),
   lab(chip("+1 ECHKI", True), 820, 820, s(1, 6.0), enter="stamp"),
 ]},
 {"from": s(2), "to": s(2, 11.3), "bg": {"src": f"{AS}/BG_dressing_empty.png", "zoom": [1.0, 1.07]}, "items": [
   lab(chip("ZAMIN FK • QORATEPA"), 540, 300, s(2, 0.2)),
   spr("rustam_whistle", 260, 1560, 920, s(2, 3.0), enter="slideL", idle="sway"),
   lab(chip("QATTIQQO‘L MURABBIY"), 300, 540, s(2, 3.2), s(2, 5.3)),
   spr("bekzod_smug", 820, 1560, 900, s(2, 5.3), enter="slideR", idle="bob"),
   lab(chip("“YULDUZ” HUJUMCHI"), 760, 540, s(2, 5.5), s(2, 8.0)),
   spr("jasur_oneglove", 540, 1700, 960, s(2, 8.0), enter="up", idle="shake", z=12),
   lab(chip("QO‘LQOP QAYERDA?", True), 540, 560, s(2, 8.4), enter="stamp"),
 ]},
 {"from": s(2, 11.3), "to": s(3), "bg": {"src": f"{AS}/S02_office_fund.png", "zoom": [1.0, 1.1], "focus": [0.5, 0.5, 0.45, 0.5]}, "items": [
   lab('<div class="card"><small>VIRTUAL KLUB FONDI</small><b>0</b><span>so‘m</span></div>', 540, 820, s(2, 11.4), counter=fund_steps),
 ]},
 {"from": s(3), "to": s(4), "bg": {"src": f"{AS}/BG_pitch_empty.png", "zoom": [1.0, 1.1], "focus": [0.5, 0.5, 0.5, 0.42]}, "items": [
   lab(chip("MAQSAD: OLIY LIGA"), 540, 300, s(3, 0.3), s(3, 3.2)),
   spr("rustam_whistle", 300, 1600, 980, s(3), s(3, 3.2), enter="slideL", idle="shake"),
   spr("bekzod_celebrate", 560, 1620, 940, s(3, 3.2), s(3, 6.2), enter="up", idle="hop"),
   lab('<div class="title" style="font-size:120px">GOOOL?!</div>', 540, 420, s(3, 3.5), s(3, 4.8), enter="stamp"),
   spr("goat_side", 860, 1180, 330, s(3, 4.6), enter="peekR", idle="chew", z=9),
   lab(chip("TO‘P QAYERDA?", True), 800, 760, s(3, 4.8), s(3, 6.2), enter="stamp"),
   spr("aziz_ball", 400, 1620, 940, s(3, 6.2), enter="slideL", idle="sway"),
 ]},
 {"from": s(4), "to": s(5), "bg": {"src": f"{AS}/BG_stand_empty.png", "zoom": [1.12, 1.0]}, "items": [
   spr("goat_chew", 640, 1180, 540, s(4), idle="chew", enter="fade", z=11),
   lab(badge, 190, 640, s(4), counter=[[0, 0]]),
   lab('<div class="follow">+ OBUNA BO‘LISH</div>', 540, 250, s(4, 0.8), idle="pulse"),
   lab('<div class="tap"></div>', 720, 250, s(4, 2.5), s(4, 2.95), enter="pop"),
   lab('<div class="fan">SIZ</div>', 330, 1010, s(4, 3.0), enter="drop", enterDur=0.7),
   lab(chip("SIZ?", True), 330, 890, s(4, 3.5), enter="stamp"),
   lab('<div class="card"><span>1 OBUNA = 1 VIRTUAL MUXLIS</span></div>', 540, 420, s(4, 2.2), s(4, 5.4), enter="up"),
   lab('<div class="card"><span>1 LAYK = 15 000 SO‘M (VIRTUAL)</span></div>', 540, 420, s(4, 5.4), enter="up"),
 ] + [lab('<div class="fan">?</div>', x, y, s(4, 8.4 + k * 0.25), enter="drop", enterDur=0.6)
      for k, (x, y) in enumerate([(160, 1150), (470, 1150), (780, 1010), (930, 1150), (620, 1010)])]},
 {"from": s(5), "to": e(5, .1), "bg": {"src": f"{AS}/S05_stadium_wide.png", "zoom": [1.0, 1.06], "blur": 10}, "items": [
   lab(f'<img src="{CREST}" style="height:300px">', 540, 300, s(5), enter="stamp"),
 ] + [lab(f'<div class="choice"><div class="n">{n}</div>{txt}</div>', 540, y, s(5, at), enter="slideR")
      for n, txt, y, at in [(1, "STADION", 640, 2.2), (2, "HUJUMCHI", 810, 3.3), (3, "BAZA", 980, 4.6), (4, "MURABBIY", 1150, 5.8)]]},
 {"from": e(5, .1), "to": TOTAL + 1, "bg": {"src": f"{AS}/BG_stand_empty.png", "zoom": [1.05, 1.1]}, "items": [
   lab('<div class="title" style="font-size:96px">IZOHGA YOZING!</div>', 540, 380, e(5, .2), enter="stamp", idle="pulse"),
   lab(chip("STADION • HUJUMCHI • BAZA • MURABBIY"), 540, 520, e(5, .5)),
   spr("goat_chew", 790, 1720, 1000, e(5, .6), enter="peekR", idle="chew"),
   lab('<div class="virtual">FOND VA MUXLISLAR — VIRTUAL</div>', 540, 120, e(5, .2)),
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
    print("frames:", silent); sys.exit()
inputs, fc, mix = ["-i", silent], [], []
for k, (f, off) in enumerate(audio, start=1):
    inputs += ["-i", f]; ms = int(off * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5[aout]")
out = os.path.join(HERE, "exports", "ZFK_EP01_day1_anim.mp4")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)
print("OK", out, round(TOTAL, 2), "s; real lines:", [i + 1 for i, x in enumerate(L) if x[2]])
