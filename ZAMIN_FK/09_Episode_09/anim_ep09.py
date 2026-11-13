"""Day 9 match film: ZAMIN FK 2–2 STAR BOYS — story in the cartoon style, the four goals as 3D clips.
Story scenes use the Days 1–3/8 engine (tools/anim) over plates rendered from the real upgraded 3D stadium
(assets/bg_*.jpg, made by goals3d/render_goals.js stills). Goal clips: build/goal1..4.mp4 (goals3d/render_goals.js video).
Usage: python3 anim_ep09.py                 -> exports/ZFK_EP09_match.mp4 (+ .srt)
       python3 anim_ep09.py --frames t1,t2  -> check frames of the story timeline in build/frames/
       python3 anim_ep09.py --audio-only    -> remix audio onto the last assembled video
Narration: voice/<KEY>.mp3 per block (A, G1, B, G2, C, G3, D, G4, E1, E2). A missing file is timed by text length and stays silent."""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
AS = "file://" + os.path.join(HERE, "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")
VOICE, BUILD, EXP = (os.path.join(HERE, d) for d in ("voice", "build", "exports"))
os.makedirs(BUILD, exist_ok=True); os.makedirs(EXP, exist_ok=True)

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

# the four goals (must match goals3d/scenarios.js): clip length, moment the ball crosses the line
GOALS = [dict(dur=8.4, tgoal=5.95), dict(dur=8.0, tgoal=4.75), dict(dur=7.8, tgoal=4.55), dict(dur=9.0, tgoal=3.97)]

# narration blocks in running order. Story blocks are 2D scenes; G* are spoken over the 3D clips right after the ball goes in.
BLOCKS = [
 ("A",  "O‘yin kuni! Zamin FK — Star Boys. Yangi stadionimizda birinchi katta sinov! O‘n sakkizinchi daqiqa… qarshi hujum!", ["Zamin", "FK", "Star", "Boys.", "sinov!", "qarshi", "hujum!"]),
 ("G1", "Gol! Mahmud! Nol — bir.", []),
 ("B",  "Rustam aka jahlda… Ammo Zamin FK javob beradi!", ["jahlda…", "javob"]),
 ("G2", "Gooool! Jovohir! Bir — bir!", []),
 ("C",  "Tanaffus. Hisob teng. Echki esa xotirjam. Ikkinchi bo‘lim — oltmish yettinchi daqiqa…", ["Tanaffus.", "teng.", "xotirjam."]),
 ("G3", "Bekzod… uzoqdan! Gol. Bir — ikki.", []),
 ("D",  "Yana ortdamiz. Lekin Zamin FK taslim bo‘lmaydi! Sakson to‘qqizinchi daqiqa…", ["taslim", "bo‘lmaydi!"]),
 ("G4", "Abdullayev! Bosh bilan! Gooool! Ikki — ikki!", []),
 ("E1", "Yakuniy hisob: ikki — ikki. Xarakter bor! Ammo klub egasi katta qarorga keldi…", ["ikki", "Xarakter", "qarorga"]),
 ("E2", "Zamin FK’ga yangi menejer kerak! Jamoani siz boshqara olasizmi? Izohlarda yozing: «Men menejer bo‘laman!» Balki keyingi menejer — aynan sizsiz!", ["menejer", "siz", "Izohlarda", "«Men", "bo‘laman!»", "sizsiz!"]),
]
TXT = {k: t for k, t, _ in BLOCKS}; HL = {k: h for k, _, h in BLOCKS}
def vfile(k): return os.path.join(VOICE, k + ".mp3")
def vdur(k): return dur(vfile(k)) if os.path.exists(vfile(k)) else len(TXT[k]) / 12.5 + 0.4
STORY = [k for k, _, _ in BLOCKS if not k.startswith("G")]
PAD = {"A": .55, "B": .7, "C": .6, "D": .6, "E1": .5, "E2": 2.6}        # hold after the last word
LEAD = .3
SEG = {}; t = 0.0                                   # story timeline (2D only): key -> (start, end)
for k in STORY:
    d = LEAD + vdur(k) + PAD[k]; SEG[k] = (t, t + d); t += d
T2 = t
# final timeline: A G1 B G2 C G3 D G4 E1 E2
ORDER = ["A", 0, "B", 1, "C", 2, "D", 3, "E1", "E2"]
FIN = {}; t = 0.0
for o in ORDER:
    d = GOALS[o]["dur"] if isinstance(o, int) else SEG[o][1] - SEG[o][0]
    FIN[o] = (t, t + d); t += d
TOTAL = t

def sentences(k):
    """[(text, start, end)] inside block k (seconds from the block's voice start): by text length."""
    parts = [p.strip() for p in re.findall(r"[^.!?…]+[.!?…»]*", TXT[k]) if p.strip()]
    tot = sum(len(p) for p in parts); d = vdur(k); out = []; acc = 0
    for p in parts:
        out.append((p, d * acc / tot, d * (acc + len(p)) / tot)); acc += len(p)
    return out

caps, srt = [], []
for k in STORY:
    for text, a, b in sentences(k):
        words = [w for w in text.split(" ") if w != "—"]
        a2, b2 = SEG[k][0] + LEAD + a, SEG[k][0] + LEAD + b
        tot = sum(len(w) for w in words); acc = 0; wt = []
        for w in words:
            wt.append(a2 + .9 * (b2 - a2) * acc / tot); acc += len(w)
        caps.append({"a": a2, "b": b2 - .03, "words": words, "hl": [i for i, w in enumerate(words) if w in HL[k]], "wt": wt, "bottom": 690, "size": 62})
        srt.append((FIN[k][0] + LEAD + a, FIN[k][0] + LEAD + b, text))
for gi in range(4):
    k = f"G{gi+1}"
    for text, a, b in sentences(k):
        st = FIN[gi][0] + GOALS[gi]["tgoal"] - .25
        srt.append((st + a, st + b, text))
srt.sort()

# ---- scene helpers ----
def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False, fs=42: f'<div class="chip{" y" if y else ""}" style="font-size:{fs}px">{txt}</div>'
bubble = lambda txt, fs=42: (f'<div style="background:#fff;color:#0D2557;border:6px solid #0D2557;border-radius:30px;padding:14px 26px;'
                             f'font-weight:900;font-size:{fs}px;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.4);white-space:nowrap">{txt}</div>')
crest = lambda h=110: f'<img src="{CREST}" style="height:{h}px">'
title = lambda txt, fs=128: f'<div class="title" style="font-size:{fs}px;line-height:1.02;text-align:center">{txt}</div>'
card = lambda inner, w=900, bg="rgba(13,37,87,.96)": (f'<div style="width:{w}px;box-sizing:border-box;padding:26px 30px;border-radius:34px;background:{bg};border:6px solid #fff;'
                                                     f'color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5);font-weight:900">{inner}</div>')
match_card = card(f'<div style="display:flex;align-items:center;justify-content:space-between"><div style="width:270px">{crest(130)}<div style="font-size:38px;margin-top:4px">ZAMIN FK</div></div>'
                  f'<div style="font-size:84px;color:#FFD23F">🆚</div><div style="width:270px"><div style="font-size:104px;line-height:130px">⭐</div><div style="font-size:38px;margin-top:4px">STAR BOYS</div></div></div>', 880)
dim = lambda o: f'<div style="width:1080px;height:1920px;background:rgba(5,12,32,{o})"></div>'
bg = lambda name, z0, z1, f=(.5, .5, .5, .5): {"src": f"{AS}/{name}.jpg", "zoom": [z0, z1], "focus": list(f)}
GY = 1850
S = lambda k, off=0.0: SEG[k][0] + off
E_ = lambda k, off=0.0: SEG[k][1] + off
def sent(k, i, p=0.0):                      # start of sentence i (0-based) of block k on the story timeline
    s = sentences(k)[i]; return SEG[k][0] + LEAD + s[1] + (s[2] - s[1]) * p
CR = lambda at: lab(crest(110), 150, 130, at, enter="fade", enterDur=0.01, z=25)

a_cut = sent("A", 2, 0.0)
e_dark = sent("E1", 2, 0.0)
scenes = [
 # A1 — match day: the upgraded stadium, both teams on the pitch
 {"from": S("A"), "to": a_cut, "bg": bg("bg_kickoff", 1.0, 1.1, (.5, .55, .5, .6)), "items": [
   lab(crest(110), 150, 130, 0.1, enter="drop", enterDur=0.5, z=25),
   lab(title("O‘YIN<br>KUNI!", 150), 540, 330, 0.08, sent("A", 1, -.05), enter="stamp", idle="pulse", z=25),
   lab(match_card, 540, 380, sent("A", 1, 0), enter="stamp", idle="sway", z=25),
 ]},
 # A2 — touchline: Rustam aka and the goat, the counterattack is coming
 {"from": a_cut, "to": E_("A"), "bg": bg("bg_touch_00", 1.0, 1.06), "items": [
   CR(a_cut - 1),
   lab(chip("YANGI STADION · BIRINCHI SINOV ✨", True, 44), 540, 330, a_cut + .1, sent("A", 3, 0), enter="stamp", idle="pulse", z=25),
   spr("rustam_whistle", 250, GY, 470, a_cut + .1, enter="slideL", enterDur=0.5, idle="sway", z=10),
   spr("goat_chew", 800, GY + 6, 360, a_cut + .3, enter="up", idle="chew", z=12),
   lab(bubble("OLG‘A, YIGITLAR! 📢"), 330, 1330, a_cut + .7, sent("A", 3, 0), enter="pop", z=24),
   lab(title("18’", 190), 540, 300, sent("A", 3, 0), enter="stamp", idle="pulse", z=26),
   lab(chip("QARSHI HUJUM! ⚡", True, 56), 540, 500, sent("A", 4, 0), enter="stamp", idle="shake", z=26),
 ]},
 # B — 0:1, Rustam aka is furious
 {"from": S("B"), "to": E_("B"), "bg": bg("bg_touch_01", 1.04, 1.1), "items": [
   CR(S("B") - 1),
   spr("rustam_whistle", 300, GY, 520, S("B", .05), enter="slideL", enterDur=0.4, idle="shake", z=10),
   spr("goat_side", 810, GY, 330, S("B", .2), enter="up", idle="sway", z=12),
   lab(bubble("HIMOYA QANI?! 😤"), 360, 1290, S("B", .45), sent("B", 1, 0), enter="pop", z=24),
   lab(chip("0 : 1 — HALI HAMMASI OLDINDA", False, 42), 540, 330, S("B", .3), sent("B", 1, 0), enter="stamp", z=25),
   lab(title("34’", 190), 540, 300, sent("B", 1, 0), enter="stamp", idle="pulse", z=26),
   lab(chip("ZAMIN FK JAVOB BERADI! 💪", True, 50), 540, 500, sent("B", 1, .25), enter="stamp", idle="pulse", z=26),
 ]},
 # C — half-time, 1:1, the goat is calm
 {"from": S("C"), "to": E_("C"), "bg": bg("bg_touch_11", 1.0, 1.08), "items": [
   CR(S("C") - 1),
   lab(title("TANAFFUS", 124), 540, 300, S("C", .1), sent("C", 3, 0), enter="stamp", idle="pulse", z=25),
   lab(chip("1 : 1 — HISOB TENG", True, 52), 540, 470, sent("C", 1, 0), sent("C", 3, 0), enter="stamp", z=25),
   spr("goat_chew", 540, GY + 10, 520, sent("C", 2, -.15), enter="up", idle="chew", z=12),
   lab(bubble("MEN XOTIRJAMMAN 😌"), 540, 1250, sent("C", 2, .2), sent("C", 3, .1), enter="pop", z=24),
   spr("rustam_idle", 170, GY, 430, S("C", .3), enter="slideL", enterDur=0.5, idle="sway", z=10),
   lab(title("67’", 190), 540, 300, sent("C", 3, .45), enter="stamp", idle="pulse", z=26),
   lab(chip("IKKINCHI BO‘LIM ⏱", False, 50), 540, 500, sent("C", 3, .1), enter="stamp", z=26),
 ]},
 # D — 1:2, we do not give up
 {"from": S("D"), "to": E_("D"), "bg": bg("bg_touch_12", 1.04, 1.12), "items": [
   CR(S("D") - 1),
   lab(chip("1 : 2 — YANA ORTDAMIZ 😬", False, 46), 540, 330, S("D", .15), sent("D", 2, 0), enter="stamp", z=25),
   spr("rustam_whistle", 280, GY, 520, S("D", .05), enter="slideL", enterDur=0.4, idle="hop", z=10),
   spr("goat_chew", 800, GY + 6, 360, S("D", .2), enter="up", idle="chew", z=12),
   lab(bubble("TASLIM BO‘LMAYMIZ! 🔥"), 400, 1270, sent("D", 1, .1), sent("D", 2, .2), enter="pop", z=24),
   lab(title("89’", 190), 540, 300, sent("D", 2, 0), enter="stamp", idle="pulse", z=26),
   lab(chip("SO‘NGGI DAQIQALAR ⏱", True, 54), 540, 500, sent("D", 2, .3), enter="stamp", idle="shake", z=26),
 ]},
 # E1 — full time 2:2; then the owner's decision
 {"from": S("E1"), "to": E_("E1"), "bg": bg("bg_touch_22", 1.0, 1.1), "items": [
   CR(S("E1") - 1),
   lab(chip("YAKUNIY HISOB", False, 46), 540, 250, S("E1", .1), e_dark, enter="stamp", z=25),
   lab(title("2 : 2", 230), 540, 430, S("E1", .35), e_dark, enter="stamp", idle="pulse", z=25),
   lab(chip("XARAKTER BOR! 💪", True, 56), 540, 610, sent("E1", 1, 0), e_dark, enter="stamp", idle="pulse", z=25),
   spr("rustam_idle", 250, GY, 470, S("E1", .2), enter="slideL", enterDur=0.5, idle="sway", z=10),
   spr("goat_chew", 800, GY + 6, 360, S("E1", .3), enter="up", idle="chew", z=12),
   lab(dim(.62), 540, 960, e_dark, enter="fade", enterDur=0.5, z=20),
   lab(card('<div style="font-size:54px;color:#FFD23F">📢 KLUB EGASI</div><div style="font-size:74px;line-height:1.05;margin-top:8px">KATTA QARORGA KELDI…</div>'), 540, 430, e_dark + .25, enter="stamp", idle="sway", z=26),
 ]},
 # E2 — a new manager is needed: apply in the comments
 {"from": S("E2"), "to": T2 + 1, "bg": bg("bg_touch_22", 1.1, 1.16), "items": [
   CR(S("E2") - 1),
   lab(dim(.62), 540, 960, S("E2") - 1, enter="fade", enterDur=0.01, z=5),
   spr("goat_chew", 830, GY + 6, 380, S("E2") - 1, enter="fade", enterDur=0.01, idle="chew", z=12),
   lab(card('<div style="font-size:120px;line-height:1">🪑</div><div style="font-size:46px;color:#FFD23F;margin-top:6px">ZAMIN FK’GA</div>'
            '<div style="font-size:78px;line-height:1.05">YANGI MENEJER KERAK!</div>'), 540, 400, S("E2", .2), sent("E2", 2, 0), enter="stamp", idle="sway", z=26),
   lab(chip("JAMOANI SIZ BOSHQARA OLASIZMI? 🤔", True, 44), 540, 690, sent("E2", 1, 0), sent("E2", 2, 0), enter="stamp", idle="pulse", z=26),
   lab(card('<div style="font-size:48px;color:#FFD23F">💬 IZOHLARDA YOZING</div>'
            '<div style="margin-top:14px;background:#fff;color:#0D2557;border-radius:26px;padding:18px 20px;font-size:58px;line-height:1.1">«MEN MENEJER<br>BO‘LAMAN!»</div>'), 540, 420, sent("E2", 2, 0), enter="stamp", idle="pulse", z=26),
   lab(bubble("MEN HAM NOMZODMAN 🐐", 38), 760, 1380, sent("E2", 2, .55), enter="pop", z=24),
   lab(chip("KEYINGI MENEJER — BALKI SIZ! 💙", True, 46), 540, 760, sent("E2", 3, 0), enter="stamp", idle="pulse", z=26),
   lab('<div class="follow" style="font-size:50px;padding:20px 40px">@fk_zamin · BIR JAMOA 💙</div>', 540, 900, sent("E2", 3, .7), enter="stamp", z=26),
 ]},
]
EP = {"total": T2, "scenes": scenes, "captions": caps}
json.dump(EP, open(os.path.join(BUILD, "anim.json"), "w"), ensure_ascii=False)
print("story", {k: (round(a, 2), round(b, 2)) for k, (a, b) in SEG.items()}, "T2", round(T2, 2))
print("final", {str(k): (round(a, 2), round(b, 2)) for k, (a, b) in FIN.items()}, "TOTAL", round(TOTAL, 2))
print("voice missing:", [k for k, _, _ in BLOCKS if not os.path.exists(vfile(k))])

if len(sys.argv) > 2 and sys.argv[1] == "--frames":
    ts_ = [float(x) for x in sys.argv[2].split(",")]
    fd = os.path.join(BUILD, "frames"); os.makedirs(fd, exist_ok=True)
    js = (f"const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:1080,height:1920}}}});"
          f"await p.goto('file://{TOOLS}/engine.html');await p.evaluate(e=>{{window.EP=e}},JSON.parse(require('fs').readFileSync('{BUILD}/anim.json','utf8')));"
          f"await p.evaluate(()=>window.ready());for(const t of {json.dumps(ts_)}){{await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({{path:'{fd}/f_'+t.toFixed(2)+'.jpg',type:'jpeg',quality:85}});}}await b.close();}})()")
    open(os.path.join(BUILD, "frames.js"), "w").write(js)
    subprocess.run(["node", os.path.join(BUILD, "frames.js")], check=True, cwd=TOOLS)
    print("frames in", fd); sys.exit()

story = os.path.join(BUILD, "story.mp4"); silent = os.path.join(BUILD, "match_silent.mp4")
if "--audio-only" not in sys.argv:
    if "--keep-story" not in sys.argv:
        subprocess.run(["node", os.path.join(TOOLS, "render.js"), os.path.join(BUILD, "anim.json"), story], check=True)
    ins, fc, lab_ = ["-i", story], [], []
    for gi in range(4): ins += ["-i", os.path.join(BUILD, f"goal{gi+1}.mp4")]
    for n, o in enumerate(ORDER):
        if isinstance(o, int): fc.append(f"[{o+1}:v]trim=0:{GOALS[o]['dur']:.3f},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{n}]")
        else: fc.append(f"[0:v]trim={SEG[o][0]:.3f}:{SEG[o][1]:.3f},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{n}]")
        lab_.append(f"[v{n}]")
    fc.append("".join(lab_) + f"concat=n={len(ORDER)}:v=1:a=0[v]")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", silent], check=True)

# ---- audio: narration + crowd (louder in the 3D clips, roar on every goal) + whistles + kick thumps, -14 LUFS ----
inputs, fc, mix, k = ["-i", silent], [], [], 0
def add(path, at, vol=1.0, pre=""):
    global k
    k += 1; inputs.extend(["-i", path]); ms = int(at * 1000)
    fc.append(f"[{k}:a]{pre}aresample=48000,volume={vol},adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
HAVE_VO = all(os.path.exists(vfile(k_)) for k_, _, _ in BLOCKS)     # a half-narrated film is worse than none: mix the voice only when every block exists
for key, _, _ in BLOCKS:
    if not HAVE_VO: break
    if key.startswith("G"): gi = int(key[1]) - 1; add(vfile(key), FIN[gi][0] + GOALS[gi]["tgoal"] - .25, 1.15)
    else: add(vfile(key), FIN[key][0] + LEAD)
wh = os.path.join(Z, "03_Episode_03", "sfx", "whistle.wav")
for at in (FIN[0][0] + .05, FIN["C"][0] + .05, FIN["E1"][0] + .05): add(wh, at, .5)
crowd = os.path.join(Z, "03_Episode_03", "sfx", "crowd_bed.wav")
gexp = "+".join(f"0.22*between(t,{FIN[g][0]:.2f},{FIN[g][1]:.2f})+0.75*between(t,{FIN[g][0]+GOALS[g]['tgoal']:.2f},{FIN[g][1]:.2f})*exp(-(t-{FIN[g][0]+GOALS[g]['tgoal']:.2f})/2.2)" for g in range(4))
k += 1; inputs += ["-stream_loop", "-1", "-i", crowd]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{TOTAL:.2f},volume='0.10+{gexp}':eval=frame,afade=t=in:d=0.6,afade=t=out:st={TOTAL-1.2:.2f}:d=1.2[crowd]"); mix.append("[crowd]")
# roar: filtered noise swell on each goal; thump on each shot
for g in range(4):
    tg = FIN[g][0] + GOALS[g]["tgoal"]
    k += 1; inputs += ["-f", "lavfi", "-t", "3.2", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=%d" % (g + 3)]
    fc.append(f"[{k}:a]aresample=48000,bandpass=f=900:w=1400,volume='0.55*min(1,t*6)*exp(-t/1.3)':eval=frame,adelay={int(tg*1000)}|{int(tg*1000)}[a{k}]"); mix.append(f"[a{k}]")
music = os.path.join(Z, "06_Episode_06", "sfx", "music.mp3")
if os.path.exists(music):
    st = FIN["E1"][0]; k += 1; inputs += ["-i", music]
    fc.append(f"[{k}:a]aresample=48000,atrim=0:{TOTAL-st:.2f},volume=0.16,afade=t=in:d=1.5,afade=t=out:st={TOTAL-st-1.5:.2f}:d=1.5,adelay={int(st*1000)}|{int(st*1000)}[a{k}]"); mix.append(f"[a{k}]")
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
out = os.path.join(EXP, "ZFK_EP09_match.mp4")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)

def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"
with open(os.path.join(EXP, "ZFK_EP09_match.srt"), "w", encoding="utf-8") as f:
    for n, (a, b, text) in enumerate(srt, 1):
        f.write(f"{n}\n{ts(a)} --> {ts(min(b, srt[n][0] - 0.02) if n < len(srt) else b)}\n{text}\n\n")
print("OK", out, round(TOTAL, 2))
