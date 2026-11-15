"""Day 10 Reel: new manager announced (the winning Instagram comment, shown as the original screenshot) -> the audience now decides what
ZAMIN FK Club / ZAMIN FK City get. Existing cartoon engine (tools/anim) over plates of the real 3D stadium + town (plates.js).
Usage: python3 prep_voice.py && python3 anim_ep10.py          -> exports/ZFK_EP10_reel.mp4 (+ .srt)
       python3 anim_ep10.py --frames t1,t2                    -> check frames in build/frames/
       python3 anim_ep10.py --audio-only                      -> remix audio onto the last assembled video"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); Z = os.path.dirname(HERE); TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites"); AS = "file://" + os.path.join(HERE, "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")
BUILD, EXP, VOICE = (os.path.join(HERE, d) for d in ("build", "exports", "voice")); os.makedirs(BUILD, exist_ok=True); os.makedirs(EXP, exist_ok=True)
W = json.load(open(BUILD + "/words.json")); TAIL = 1.0
TOTAL = W[-1]["end"] + TAIL
BS = {b["beat"]: b for b in W}
def word(beat, i):                       # start time of word i (0-based) of a beat
    return BS[beat]["words"][i]["a"]
def sent(beat, i):
    return BS[beat]["sents"][i]
SX = lambda b, i: sent(b, i)["a"]
# ---- captions: one cue per sentence, word-by-word, yellow = key words ----
KEY = {"tanladingiz!", "yangi", "menejeri", "tabriklaymiz!", "menejer", "qaror", "klubi", "shahrimiz", "nima", "qo‘shamiz?", "quramiz?", "g‘oya", "sizdan!", "g‘oyangizni",
       "layk", "amalga", "oshiramiz!", "yigirma", "to‘rt", "soat!", "qo‘lingizda!", "quramiz!", "yozing!", "o‘zgartiramiz", "imkoniyat"}
def show(w): return w.replace("Zamin", "ZAMIN") if w.startswith("Zamin") else w
caps, srt = [], []
for b in W:
    for s in b["sents"]:
        ws = [x for x in s["words"] if x["w"] != "—"]
        caps.append({"a": s["a"] - .02, "b": s["b"] + .3, "words": [show(x["w"]) for x in ws], "hl": [i for i, x in enumerate(ws) if x["w"].lower() in KEY], "wt": [x["a"] for x in ws], "bottom": 470, "size": 66})
        srt.append((s["a"], s["b"] + .2, " ".join(show(x["w"]) for x in ws).replace("ZAMIN FKning", "Zamin FKning").replace("ZAMIN FKni", "Zamin FKni")))
for i in range(len(caps) - 1): caps[i]["b"] = min(caps[i]["b"], caps[i + 1]["a"])

# ---- helpers (same look as Days 8/9) ----
def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False, fs=42: f'<div class="chip{" y" if y else ""}" style="font-size:{fs}px;white-space:nowrap">{txt}</div>'
bubble = lambda txt, fs=42: (f'<div style="background:#fff;color:#0D2557;border:6px solid #0D2557;border-radius:30px;padding:14px 26px;'
                             f'font-weight:900;font-size:{fs}px;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.4);white-space:nowrap">{txt}</div>')
crest = lambda h=110: f'<img src="{CREST}" style="height:{h}px">'
title = lambda txt, fs=128: f'<div class="title" style="font-size:{fs}px;line-height:1.02;text-align:center;white-space:nowrap">{txt}</div>'
card = lambda inner, w=900, bg="rgba(13,37,87,.96)": (f'<div style="width:{w}px;box-sizing:border-box;padding:26px 30px;border-radius:34px;background:{bg};border:6px solid #fff;'
                                                     f'color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5);font-weight:900">{inner}</div>')
dim = lambda o: f'<div style="width:1080px;height:1920px;background:rgba(5,12,32,{o})"></div>'
flash = lambda at: lab('<div style="width:1080px;height:1920px;background:rgba(255,255,255,.55)"></div>', 540, 960, at, at + .22, enter="fade", enterDur=.01, z=40)
bg = lambda name, z0, z1, f=(.5, .5, .5, .5), blur=0: {"src": f"{AS}/{name}.jpg", "zoom": [z0, z1], "focus": list(f), "blur": blur}
CR = lambda at: lab(crest(110), 150, 130, at, enter="fade", enterDur=.01, z=25)
GY = 1850
# the winning comment: the ORIGINAL screenshot, untouched, in the Day-2 "comment shot" frame
CW, CH = 960, round(960 * 202 / 1165)
def shot(w=CW, rot=0):
    return (f'<img src="{AS}/comment_winner.jpg" style="width:{w}px;border-radius:26px;border:6px solid #FFD23F;box-shadow:0 18px 40px rgba(0,0,0,.6);transform:rotate({rot}deg);display:block">')
def uname_box(cy):                       # yellow ring on the username (screenshot x 158-505, y 12-55 of 1165x202)
    s = CW / 1165; x0, x1, y0, y1 = 158 * s, 505 * s, 10 * s, 56 * s
    cx = 540 - CW / 2 + (x0 + x1) / 2; cyy = cy - CH / 2 + (y0 + y1) / 2 + 2
    return lab(f'<div style="width:{x1-x0+36:.0f}px;height:{y1-y0+22:.0f}px;border:7px solid #FFD23F;border-radius:20px;box-shadow:0 0 28px #FFD23F, inset 0 0 18px rgba(255,210,63,.5)"></div>', cx, cyy, 0, enter="stamp", idle="pulse", z=28)

b1, b2, b3, b4, b5, b6 = (BS[i]["start"] for i in range(1, 7)); e = lambda i: BS[i]["end"]
sc = []
# ---- BEAT 1 — HOOK: new stadium, goat reacts, the comment slams in, YANGI MENEJER TANLANDI! ----
sc.append({"from": 0, "to": b2, "bg": bg("bg_club_wide", 1.0, 1.14, (.5, .5, .5, .55)), "items": [
  CR(-1),
  lab(title("YANGI<br>MENEJER<br><span style='color:#FFD23F'>TANLANDI!</span>", 136), 540, 400, 0.0, enter="fade", idle="pulse", z=26, enterDur=.01),
  spr("goat_chew", 790, GY + 6, 380, 0.45, enter="up", idle="hop", z=12, enterDur=.4),
  lab(bubble("VAY! 😮"), 560, 1380, 0.8, sent(1, 1)["a"], enter="pop", z=24),
  lab(shot(), 540, 1020, SX(1, 1) - .1, enter="drop", enterDur=.55, idle="sway", z=22),
]})
# ---- BEAT 2 — THE WINNER: original comment, username highlighted, stamp SIZ TANLADINGIZ! ----
cy2 = 840
sc.append({"from": b2, "to": b3, "bg": bg("bg_club_stand", 1.0, 1.1, (.5, .5, .5, .45)), "items": [
  lab(dim(.72), 540, 960, b2, enter="fade", enterDur=.01, z=5), flash(b2),
  CR(b2 - 1),
  lab(chip("🎉 TABRIKLAYMIZ!", True, 62), 540, 330, b2 + .05, SX(2, 1), enter="stamp", idle="pulse", z=26),
  lab(shot(), 540, cy2, b2 + .05, enter="pop", enterDur=.4, idle="sway", z=22),
  uname_box(cy2),
  lab(title("SIZ<br>TANLADINGIZ!", 112), 540, 1130, SX(2, 1) + .05, enter="stamp", idle="pulse", z=26),
]})
for it in sc[-1]["items"]:                    # the highlight ring starts when the narrator congratulates
    if it["type"] == "label" and "border:7px solid" in it["html"]: it["at"] = b2 + .8
# ---- BEAT 3 — THE NEW IDEA: you decide too; club + city ----
wk, ws = word(3, 12), word(3, 18)            # "klubi" ... "shahrimiz"
sc.append({"from": b3, "to": wk - .1, "bg": bg("bg_club_high", 1.0, 1.12, (.5, .55, .5, .5)), "items": [
  flash(b3), CR(b3 - 1),
  lab(chip("ENDI FAQAT MENEJER EMAS 🪑", False, 46), 540, 330, b3 + .1, SX(3, 0) + 2.0, enter="stamp", z=26),
  lab(title("ENDI SIZ HAM<br><span style='color:#FFD23F'>QAROR</span><br>QILASIZ!", 128), 540, 760, SX(3, 0) + 1.7, enter="stamp", idle="pulse", z=26),
  spr("goat_chew", 800, GY + 6, 350, b3 + .3, enter="up", idle="chew", z=12),
]})
sc.append({"from": wk - .1, "to": ws - .1, "bg": bg("bg_club_wide", 1.1, 1.0, (.5, .5, .5, .55)), "items": [
  flash(wk - .1), CR(wk - 1.1),
  lab(title("ZAMIN FK<br><span style='color:#FFD23F'>KLUBI</span>", 150), 540, 420, wk - .05, enter="stamp", idle="pulse", z=26),
  spr("goat_chew", 810, GY + 6, 360, wk - .3, enter="fade", enterDur=.01, idle="chew", z=12),
  lab(bubble("👈 KLUB"), 330, 1430, wk + .2, enter="pop", z=24),
]})
sc.append({"from": ws - .1, "to": b4, "bg": bg("bg_city_f", 1.0, 1.12, (.5, .6, .5, .6)), "items": [
  flash(ws - .1), CR(ws - 1.1),
  lab(title("ZAMIN FK<br><span style='color:#FFD23F'>CITY</span>", 150), 540, 420, ws - .05, enter="stamp", idle="pulse", z=26),
  spr("goat_chew", 270, GY + 6, 360, ws - .3, enter="fade", enterDur=.01, idle="chew", z=12, flip=True),
  lab(bubble("SHAHAR 👉"), 760, 1430, ws + .2, enter="pop", z=24),
]})
# ---- BEAT 4 — OPEN PARTICIPATION: club / city alternate, free-form question marks ----
Q = lambda ch, fs=520, col="#FFD23F": f'<div style="font-weight:900;font-size:{fs}px;line-height:1;color:{col};-webkit-text-stroke:16px #0D2557;paint-order:stroke fill;text-shadow:0 20px 40px rgba(0,0,0,.5)">{ch}</div>'
typing = lambda: card('<div style="font-size:40px;color:#FFD23F;text-align:left">💬 sizning izohingiz</div><div style="margin-top:10px;background:#fff;color:#0D2557;border-radius:24px;padding:16px 24px;font-size:62px;text-align:left">G‘oya… ✍️</div>', 860)
s41, s42, s43, s44 = (sent(4, i) for i in range(4)); mid = (s43["a"] + s43["b"]) / 2
sc.append({"from": b4, "to": s42["a"] - .05, "bg": bg("bg_club_goal", 1.0, 1.12, (.5, .45, .5, .5)), "items": [
  flash(b4), CR(b4 - 1),
  lab(chip("ZAMIN FK KLUBI ⚽", True, 54), 540, 330, b4 + .05, enter="stamp", z=26),
  lab(Q("?"), 540, 900, b4 + .15, enter="stamp", idle="pulse", z=22),
  lab(bubble("NIMA QO‘SHAMIZ? 💭", 50), 540, 1330, s41["a"] + .5, enter="pop", z=24),
]})
sc.append({"from": s42["a"] - .05, "to": s43["a"] - .05, "bg": bg("bg_city_b", 1.0, 1.12, (.5, .55, .5, .55)), "items": [
  flash(s42["a"] - .05), CR(s42["a"] - 1.05),
  lab(chip("ZAMIN FK CITY 🏙", True, 54), 540, 330, s42["a"], enter="stamp", z=26),
  lab(Q("?"), 540, 900, s42["a"] + .1, enter="stamp", idle="pulse", z=22),
  lab(bubble("NIMA QURAMIZ? 🏗", 50), 540, 1330, s42["a"] + .5, enter="pop", z=24),
]})
sc.append({"from": s43["a"] - .05, "to": mid, "bg": bg("bg_club_stand", 1.0, 1.1, (.5, .5, .5, .45)), "items": [
  flash(s43["a"] - .05), CR(s43["a"] - 1.05),
  lab(chip("NIMANI O‘ZGARTIRAMIZ? 🔧", True, 50), 540, 330, s43["a"], enter="stamp", z=26),
  lab(Q("?", 380), 330, 800, s43["a"] + .1, enter="stamp", idle="shake", z=22),
  lab(Q("?", 300), 780, 1000, s43["a"] + .35, enter="stamp", idle="pulse", z=22),
  lab(bubble("💬 …", 56), 560, 1330, s43["a"] + .6, enter="pop", z=24),
]})
sc.append({"from": mid, "to": s44["a"] - .05, "bg": bg("bg_city_e", 1.0, 1.12, (.5, .5, .5, .5)), "items": [
  flash(mid), CR(mid - 1),
  lab(chip("YANGI IMKONIYAT? ✨", True, 52), 540, 330, mid + .02, enter="stamp", z=26),
  lab(Q("?", 400), 760, 820, mid + .1, enter="stamp", idle="shake", z=22),
  lab(Q("?", 320), 300, 1010, mid + .3, enter="stamp", idle="pulse", z=22),
  lab(bubble("💬 …", 56), 560, 1330, mid + .5, enter="pop", z=24),
]})
sc.append({"from": s44["a"] - .05, "to": b5, "bg": bg("bg_club_wide", 1.0, 1.1, (.5, .5, .5, .55)), "items": [
  flash(s44["a"] - .05), CR(s44["a"] - 1.05),
  lab(title("BU SAFAR<br><span style='color:#FFD23F'>G‘OYA<br>SIZDAN!</span>", 140), 540, 640, s44["a"] + .1, enter="stamp", idle="pulse", z=26),
  spr("goat_chew", 820, GY + 6, 360, s44["a"] + .1, enter="up", idle="hop", z=12),
]})
# ---- BEAT 5 — CTA: goat into the lens, comment area is the focus; G‘OYA SIZDAN! / ENG KO‘P LAYK = G‘OLIB / 24 SOAT ----
c1, c2, c3, c4, c5 = (sent(5, i) for i in range(5))
sc.append({"from": b5, "to": b6, "bg": bg("bg_club_wide", 1.1, 1.18, (.5, .5, .5, .55), 7), "items": [
  lab(dim(.6), 540, 960, b5, enter="fade", enterDur=.01, z=5), flash(b5), CR(b5 - 1),
  lab(title("G‘OYA<br><span style='color:#FFD23F'>SIZDAN!</span>", 150), 540, 380, b5 + .05, enter="stamp", idle="pulse", z=26),
  spr("goat_chew", 880, GY + 12, 600, b5 + .1, enter="up", idle="chew", z=12),
  lab(typing(), 450, 1000, c1["a"], c2["a"] + 1.0, enter="pop", idle="sway", z=24),
  lab(chip("KLUB YOKI SHAHAR — FARQI YO‘Q 🏟🏙", True, 44), 540, 760, c2["a"], c3["a"] - .1, enter="stamp", z=26),
  lab(card('<div style="font-size:46px;color:#FFD23F">ENG KO‘P LAYK</div><div style="font-size:92px;line-height:1">❤ = G‘OLIB</div>'), 540, 760, c3["a"], enter="stamp", idle="pulse", z=26),
  lab(card('<div style="font-size:120px;line-height:1">⏱ 24 SOAT</div>', 640, "rgba(255,210,63,.97)").replace("color:#fff", "color:#0D2557"), 540, 1040, c4["a"], enter="stamp", idle="pulse", z=27),
]})
# ---- OUTRO ----
sc.append({"from": b6, "to": TOTAL, "bg": bg("bg_club_wide", 1.15, 1.22, (.5, .5, .5, .55), 9), "items": [
  lab(dim(.68), 540, 960, b6, enter="fade", enterDur=.01, z=5), flash(b6),
  lab(crest(230), 540, 250, b6 + .1, enter="drop", enterDur=.5, z=25),
  lab(title("SIZNING<br>G‘OYANGIZ?", 120), 540, 560, b6 + .15, enter="stamp", z=26),
  lab(chip("KLUB YOKI SHAHAR", True, 62), 540, 790, b6 + .5, enter="stamp", z=26),
  lab(title("IZOHLARDA!", 118), 540, 940, b6 + .9, enter="stamp", z=26),
  lab(chip("⏱ 24 SOAT", True, 70), 540, 1100, b6 + 1.3, enter="stamp", idle="pulse", z=26),
]})
json.dump({"total": TOTAL, "scenes": sc, "captions": caps}, open(BUILD + "/anim.json", "w"), ensure_ascii=False)
print("TOTAL", round(TOTAL, 2), "scenes", len(sc))

if len(sys.argv) > 2 and sys.argv[1] == "--frames":
    ts_ = [float(x) for x in sys.argv[2].split(",")]; fd = os.path.join(BUILD, "frames"); os.makedirs(fd, exist_ok=True)
    js = (f"const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:1080,height:1920}}}});"
          f"await p.goto('file://{TOOLS}/engine.html');await p.evaluate(e=>{{window.EP=e}},JSON.parse(require('fs').readFileSync('{BUILD}/anim.json','utf8')));"
          f"await p.evaluate(()=>window.ready());for(const t of {json.dumps(ts_)}){{await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({{path:'{fd}/f_'+t.toFixed(2)+'.jpg',type:'jpeg',quality:85}});}}await b.close();}})()")
    open(os.path.join(BUILD, "frames.js"), "w").write(js); subprocess.run(["node", os.path.join(BUILD, "frames.js")], check=True, cwd=TOOLS); sys.exit()

if "--stories" in sys.argv:
    S1 = [CR(0), lab(title("YANGI MENEJER<br><span style='color:#FFD23F'>TANLANDI!</span>", 100), 540, 380, 0, enter="fade", enterDur=.01, z=26),
          lab(shot(1000), 540, 860, 0, enter="fade", enterDur=.01, z=22), lab(chip("SIZ TANLADINGIZ! 💙", True, 58), 540, 1090, 0, enter="fade", enterDur=.01, z=26),
          lab(chip("ZAMIN FK", False, 50), 540, 1250, 0, enter="fade", enterDur=.01, z=26),
          spr("goat_chew", 800, GY + 6, 420, 0, enter="fade", enterDur=.01, idle="", z=12)]
    S2 = [CR(0), lab(title("G‘OYA<br><span style='color:#FFD23F'>SIZDAN!</span>", 170), 540, 400, 0, enter="fade", enterDur=.01, z=26),
          lab(chip("KLUB YOKI SHAHAR — FARQI YO‘Q", True, 46), 540, 760, 0, enter="fade", enterDur=.01, z=26),
          lab(typing(), 540, 960, 0, enter="fade", enterDur=.01, z=24),
          lab(card('<div style="font-size:46px;color:#FFD23F">ENG KO‘P LAYK</div><div style="font-size:92px;line-height:1">❤ = G‘OLIB</div>', 760), 540, 1200, 0, enter="fade", enterDur=.01, z=26),
          lab(chip("⏱ 24 SOAT", True, 66), 540, 1420, 0, enter="fade", enterDur=.01, z=26),
          spr("goat_chew", 840, GY + 12, 500, 0, enter="fade", enterDur=.01, idle="", z=12)]
    st = {"total": 3, "captions": [], "scenes": [{"from": 0, "to": 3, "bg": bg("bg_club_high", 1.0, 1.0, (.5, .55, .5, .5)), "items": S1},
                                                {"from": 0, "to": 3, "bg": bg("bg_club_wide", 1.1, 1.1, (.5, .5, .5, .55), 5), "items": [lab(dim(.55), 540, 960, 0, enter="fade", enterDur=.01, z=5)] + S2}]}
    for n, sc_ in enumerate(st["scenes"], 1):
        json.dump({"total": 3, "captions": [], "scenes": [sc_]}, open(f"{BUILD}/story{n}.json", "w"), ensure_ascii=False)
        js = (f"const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:1080,height:1920}}}});"
              f"await p.goto('file://{TOOLS}/engine.html');await p.evaluate(e=>{{window.EP=e}},JSON.parse(require('fs').readFileSync('{BUILD}/story{n}.json','utf8')));"
              f"await p.evaluate(()=>window.ready());await p.evaluate(()=>window.renderAt(1.5));await p.screenshot({{path:'{EXP}/ZFK_EP10_story{n}.png'}});await b.close();}})()")
        open(f"{BUILD}/story.js", "w").write(js); subprocess.run(["node", f"{BUILD}/story.js"], check=True, cwd=TOOLS)
    print("stories ok"); sys.exit()
silent = os.path.join(BUILD, "story.mp4")
if "--audio-only" not in sys.argv:
    subprocess.run(["node", os.path.join(TOOLS, "render.js"), os.path.join(BUILD, "anim.json"), silent], check=True)

# ---------------- audio ----------------
ins, fc, mix, k = ["-i", silent], [], [], 0
def add(src, at, vol=1.0, pre="", lav=False):
    global k
    k += 1; ins.extend(src if lav else ["-i", src]); ms = int(at * 1000)
    fc.append(f"[{k}:a]aresample=48000,{pre}volume={vol},adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
for b in W: add(f"{VOICE}/{b['beat']:02d}_fit.wav", b["start"], 1.0, "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,")
BOOM = "aevalsrc='0.9*sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*3.4)+0.25*sin(2*PI*110*t)*exp(-t*9)':d=1.5:s=48000"
HIT = "aevalsrc='0.7*sin(2*PI*(70+90*exp(-t*30))*t)*exp(-t*9)':d=0.6:s=48000"
for c, v in ((0.0, 1.0), (b2 + .05, .8), (SX(2, 1) + .05, .8), (b5 + .05, .9), (c3["a"], .7), (c4["a"], .8), (b6 + .1, 1.0)): add(["-f", "lavfi", "-i", BOOM], c, v, lav=True)
for c in (b6 + .5, b6 + .9, b6 + 1.3): add(["-f", "lavfi", "-i", HIT], c, .7, lav=True)
cuts = [b2, b3, wk - .1, ws - .1, b4, s42["a"] - .05, s43["a"] - .05, mid, s44["a"] - .05, b5, b6]
for c in cuts: add(["-f", "lavfi", "-t", "0.5", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=7"], c - .42, .8, "bandpass=f=1800:w=2600,volume='pow(min(t/0.42,1),2.2)':eval=frame,afade=t=out:st=0.4:d=0.1,", lav=True)
crowd = Z + "/03_Episode_03/sfx/crowd_bed.wav"; k += 1; ins += ["-stream_loop", "-1", "-i", crowd]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{TOTAL:.2f},volume='if(lt(t,{b2:.2f}),0.28,if(lt(t,{b5:.2f}),0.12,0.16))':eval=frame,afade=t=in:d=0.4,afade=t=out:st={TOTAL-1.2:.2f}:d=1.2[cr]"); mix.append("[cr]")
music = Z + "/06_Episode_06/sfx/music.mp3"; k += 1; ins += ["-i", music]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{TOTAL:.2f},volume='if(lt(t,{b5:.2f}),0.17,0.24)':eval=frame,afade=t=in:d=0.5,afade=t=out:st={TOTAL-1.4:.2f}:d=1.4[mu]"); mix.append("[mu]")
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
out = EXP + "/ZFK_EP10_reel.mp4"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"
with open(EXP + "/ZFK_EP10_reel.srt", "w", encoding="utf-8") as f:
    for n, (a, b, text) in enumerate(srt, 1): f.write(f"{n}\n{ts(a)} --> {ts(min(b, srt[n][0] - .02) if n < len(srt) else b)}\n{text}\n\n")
print("OK", out, round(TOTAL, 2))
