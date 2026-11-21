"""Day 5 animated episode: 'YOSHLAR AKADEMIYASI — MANAGER KERAK!' Same engine as Day 2-4 (tools/anim).
Usage: python3 anim_ep05.py            -> exports/ZFK_EP05_day5.mp4 + .srt (narration only)
       python3 anim_ep05.py --frames t1,t2  -> still-frame check (build/anim_video.mp4)"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
A1 = "file://" + os.path.join(Z, "02_Episode_01", "assets")
A2 = "file://" + os.path.join(Z, "02_Episode_02", "assets")
A5 = "file://" + os.path.join(HERE, "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

# verified numbers
LIKES, FANS, PCT = 142, 208, 69
FUND_OLD, ADD = 23_460_000, 142 * 15_000
FUND_NEW = FUND_OLD + ADD
assert ADD == 2_130_000 and FUND_NEW == 25_590_000

# narration: (file, [(caption sentence, highlighted word indexes, spoken form used only to time the caption)])
LINES = [
 ("01_hook",    [("69 foiz ovoz… bitta katta qaror!", [0, 1], "Oltmish to‘qqiz foiz ovoz bitta katta qaror"),
                 ("ZAMIN FK endi kelajak yulduzlarini tarbiyalaydi!", [3, 4], None)]),
 ("02_result",  [("Siz tanladingiz — YOSHLAR AKADEMIYASI!", [2, 3], None),
                 ("Muxlislarning 69 foizi aynan shu yo‘nalishni tanladi.", [1, 2], "Muxlislarning oltmish to‘qqiz foizi aynan shu yo‘nalishni tanladi"),
                 ("Demak, kelajak bugundan boshlanadi!", [1, 2], None)]),
 ("03_stadium", [("Bu orada stadionimiz ham o‘zgarishda davom etmoqda!", [2], None),
                 ("Maydon atrofida yangi reklama bannerlari paydo bo‘ldi!", [2, 3, 4], None),
                 ("ZAMIN FK endi tobora haqiqiy klubga o‘xshab bormoqda!", [4, 5], None)]),
 ("04_fund",    [("Videomiz yana 142 ta layk oldi!", [2, 4], "Videomiz yana bir yuz qirq ikki ta layk oldi"),
                 ("Klub fondiga yana 2 130 000 so‘m qo‘shildi!", [3, 4, 5, 6], "Klub fondiga yana ikki million bir yuz o‘ttiz ming so‘m qo‘shildi"),
                 ("Jami virtual fondimiz — 25 590 000 so‘m!", [1, 3, 4, 5, 6], "Jami virtual fondimiz yigirma besh million besh yuz to‘qson ming so‘m")]),
 ("05_fans",    [("Va bugungi eng faol muxlislarimiz…", [2, 3], None),
                 ("@wrr_718 va @Nursulton12340!", [0, 2], "vi er er yetti bir sakkiz va Nursulton bir ikki uch to‘rt nol"),
                 ("ZAMIN FK sizlarni ko‘rib turibdi!", [2, 3, 4], None)]),
 ("06_academy", [("Akademiyamizni ochdik…", [0], None), ("Lekin uni boshqaradigan menejerimiz hali yo‘q!", [3, 5], None)]),
 ("07_role",    [("ZAMIN FK yoshlar akademiyasiga menejer kerak!", [4, 5], None), ("Eng ko‘p layk to‘plagan muxlisimiz…", [1, 2], None),
                 ("Akademiyamizning birinchi menejeri bo‘ladi!", [1, 2], None)]),
 ("08_cta",     [("Faqat bitta shart — @zaminfk_bot ga ulangan bo‘lishingiz kerak!", [3], "Faqat bitta shart zamin ef ka bot ga ulangan bo‘lishingiz kerak"),
                 ("Nomzod bo‘lish uchun izohga yozing: MEN MENEJERMAN!", [5, 6], None),
                 ("24 soatdan keyin g‘olibni e’lon qilamiz!", [0, 1], "Yigirma to‘rt soatdan keyin g‘olibni e’lon qilamiz"),
                 ("Kelajak yulduzlari… endi sizning qo‘lingizda!", [0, 1, 4], None)]),
]
GAP = 0.12
t, L, audio, caps, sent = 0.2, [], [], [], []
for name, phrases in LINES:
    f = os.path.join(HERE, "voice", name + ".mp3")
    d = dur(f); audio.append((f, t))
    wlen = [len(sp or tx) for tx, _, sp in phrases]
    a, span, ss = t + 0.03, d - 0.1, []
    for (text, hl, _), wl in zip(phrases, wlen):
        b = a + span * wl / sum(wlen)
        words = [w for w in text.split(" ") if w != "—"]
        tot = sum(len(w) for w in words); acc = 0; wt = []
        for w in words:
            wt.append(a + (b - a) * 0.8 * acc / tot); acc += len(w)
        caps.append({"a": a, "b": b, "words": words, "hl": hl, "wt": wt, "text": text}); ss.append((a, b)); a = b
    sent.append(ss); L.append((t, t + d)); t += d + GAP
TOTAL = L[-1][1] + 2.2
s = lambda i, off=0.0: L[i - 1][0] + off
e = lambda i, off=0.0: L[i - 1][1] + off
st = lambda i, k: sent[i - 1][k][0]

def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def img(src, x, y, h, at, to=None, enter="pop", idle=None, **k):
    return {"type": "sprite", "src": src, "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False, fs=42: f'<div class="chip{" y" if y else ""}" style="font-size:{fs}px">{txt}</div>'
roll = lambda t0, v0, v1, n=18, dt=0.06: [[t0 + i * dt, round(v0 + (v1 - v0) * (i / (n - 1)) ** 0.7)] for i in range(n)]
card_g = lambda body, w=860, bc="#fff": (f'<div style="width:{w}px;padding:28px 32px;box-sizing:border-box;border-radius:34px;background:rgba(13,37,87,.95);'
                                        f'border:6px solid {bc};color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5)">{body}</div>')
VIRT = '<div class="virtual">VIRTUAL</div>'
VIG = '<div style="position:absolute;left:-600px;top:-1000px;width:1200px;height:2000px;background:radial-gradient(circle at 50% 55%,transparent 28%,rgba(0,0,0,.78) 70%)"></div>'

# 1: scoreboard
SCORE = ('<div style="width:880px;box-sizing:border-box;padding:26px 30px 30px;border-radius:30px;background:#06122c;border:10px solid #1a1f2b;outline:6px solid #FFD23F;'
         'box-shadow:0 20px 44px rgba(0,0,0,.6);text-align:center;color:#fff">'
         '<div style="font-size:46px;font-weight:900;letter-spacing:5px;color:#9DB8FF">SIZ TANLADINGIZ!</div>'
         '<div style="font-size:330px;font-weight:900;line-height:.95;color:#FFD23F;text-shadow:0 0 40px rgba(255,210,63,.55)"><b style="font-weight:900">0</b>%</div>'
         '<div style="font-size:64px;font-weight:900;line-height:1.05">YOSHLAR AKADEMIYASI</div></div>')
# 2: announcement card with result bar
ANNOUNCE = card_g(f'<img src="{CREST}" style="height:150px"><div style="font-size:30px;font-weight:700;letter-spacing:6px;color:#9DB8FF;margin-top:6px">MUXLISLAR QARORI</div>'
                  '<div style="font-size:84px;font-weight:900;line-height:1.02;margin-top:6px">YOSHLAR<br>AKADEMIYASI ⚽</div>'
                  '<div style="margin-top:22px;height:74px;border-radius:37px;background:rgba(255,255,255,.14);overflow:hidden;position:relative">'
                  f'<div style="width:{PCT}%;height:100%;background:linear-gradient(90deg,#FFE27A,#FFD23F);border-radius:37px"></div>'
                  f'<div style="position:absolute;left:0;top:0;width:{PCT}%;line-height:74px;font-size:50px;font-weight:900;color:#0D2557">{PCT}%</div></div>', 900, "#FFD23F")
# 3: generic ZAMIN FK advertising boards (no advertiser brands)
def board(body, bg, fg, w=330, h=190):
    return (f'<div style="width:{w}px;height:{h}px;box-sizing:border-box;background:{bg};color:{fg};border:6px solid #0b1020;border-radius:8px;'
            f'box-shadow:0 10px 18px rgba(0,0,0,.45), inset 0 0 0 3px rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;gap:12px;'
            f'font-weight:900;text-align:center;line-height:1.02">{body}</div>')
BOARDS = [
 (185, board(f'<img src="{CREST}" style="height:120px"><div style="font-size:50px">ZAMIN<br>FK</div>', "#0D2557", "#fff")),
 (540, board('<div style="font-size:44px">SIZ<br>TANLAYSIZ ⚽</div>', "#FFD23F", "#0D2557")),
 (895, board(f'<div style="font-size:44px">ZAMIN FK<br>BAJARADI</div><img src="{CREST}" style="height:96px">', "#1F4FB8", "#fff")),
]
BY = 1008                                              # wall centre on screen at zoom 1.3 (see scene 3)
# 5: supporter cards (text only, no portraits)
def fan(name):
    return (f'<div style="width:880px;height:190px;box-sizing:border-box;display:flex;align-items:center;gap:26px;padding:0 34px;border-radius:30px;'
            f'background:linear-gradient(100deg,#1F4FB8,#0D2557 75%);border:6px solid #FFD23F;color:#fff;box-shadow:0 14px 30px rgba(0,0,0,.5)">'
            f'<div style="width:118px;height:118px;border-radius:50%;background:#FFD23F;color:#0D2557;font-size:70px;display:flex;align-items:center;justify-content:center;flex:none">🌟</div>'
            f'<div style="text-align:left"><div style="font-size:26px;font-weight:700;letter-spacing:4px;color:#9DB8FF">ENG FAOL MUXLIS</div>'
            f'<div style="font-size:62px;font-weight:900;line-height:1.05">{name}</div></div></div>')
# 7: manager card, name left blank
MANAGER = ('<div style="width:560px;height:700px;box-sizing:border-box;border-radius:36px;background:linear-gradient(165deg,#1F4FB8,#0D2557 68%);border:8px solid #FFD23F;'
           'box-shadow:0 20px 46px rgba(0,0,0,.6);color:#fff;text-align:center;padding:26px 24px;position:relative;overflow:hidden">'
           f'<img src="{CREST}" style="height:96px;position:absolute;left:22px;top:22px">'
           '<div style="font-size:26px;font-weight:700;letter-spacing:4px;color:#9DB8FF;margin-top:14px;margin-left:90px">YOSHLAR AKADEMIYASI</div>'
           '<div style="width:260px;height:260px;margin:34px auto 0;border-radius:50%;background:rgba(255,255,255,.08);border:6px dashed #9DB8FF;display:flex;align-items:center;justify-content:center;'
           'font-size:190px;font-weight:900;color:#FFD23F">?</div>'
           '<div style="font-size:60px;font-weight:900;margin-top:22px;line-height:1">MENEJER</div>'
           '<div style="margin:26px auto 0;width:420px;height:74px;border-radius:16px;background:rgba(255,255,255,.1);border:4px dashed #FFD23F;font-size:30px;font-weight:700;'
           'letter-spacing:3px;color:#9DB8FF;line-height:74px">ISM: — — — — —</div></div>')

B = st(3, 1)                                            # banners appear with sentence 2 of beat 3
scenes = [
 # 1 HOOK: scoreboard 69% readable on frame 0, goat jumps in
 {"from": 0, "to": s(2), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.28, 1.06], "blur": 4}, "items": [
   lab(SCORE, 540, 520, -1.2, enter="stamp", z=24, counter=roll(-1.1, 0, PCT, 12, 0.05)),
   spr("goat_chew", 770, 1880, 800, -0.3, enter="up", enterDur=0.35, idle="hop", to=st(1, 1), z=12),
   spr("goat_chew", 770, 1880, 800, st(1, 1), enter="none", idle="talk", z=12),
   lab(chip("🌟 KELAJAK YULDUZLARI", True, 44), 400, 980, st(1, 1) + 0.2, enter="stamp", idle="pulse", z=25),
 ]},
 # 2 RESULT: club announcement card
 {"from": s(2), "to": s(3), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.05, 1.14], "blur": 9}, "items": [
   lab(VIG, 540, 960, s(2), enter="fade", z=5),
   lab(chip("SIZ TANLADINGIZ ✅", True), 540, 215, s(2, 0.05), enter="stamp", z=25),
   lab(ANNOUNCE, 540, 610, s(2, 0.15), enter="drop", enterDur=0.55, idle="sway", z=23),
   lab(chip("KELAJAK BUGUNDAN BOSHLANADI", False, 40), 540, 1010, st(2, 2), enter="stamp", idle="pulse", z=25),
   lab('<div style="font-size:120px">🎉</div>', 900, 1120, st(2, 1), enter="stamp", idle="pulse", z=24),
   spr("goat_chew", 240, 1880, 640, s(2), enter="up", idle="hop", z=12),
 ]},
 # 3a STADIUM: push in towards the pitch-side wall
 {"from": s(3), "to": B, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.3], "focus": [0.5, 0.5, 0.5, 0.65]}, "items": [
   lab(chip("🏟️ STADION YANGILANMOQDA", True, 44), 540, 250, s(3, 0.1), enter="stamp", z=25),
   spr("goat_side", 900, 1880, 440, s(3, 0.3), enter="peekR", idle="chew", z=12),
 ]},
 # 3b STADIUM: ZAMIN FK advertising boards drop onto the wall around the pitch
 {"from": B, "to": s(4), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.3, 1.3], "focus": [0.5, 0.65, 0.5, 0.65]}, "items": [
   lab(chip("🏟️ STADION YANGILANMOQDA", True, 44), 540, 250, B - 5, st(3, 2), enter="none", z=25),
   lab(chip("YANGI REKLAMA BANNERLARI", False, 44), 540, 370, B + 0.1, enter="stamp", z=25),
 ] + [lab(bd, x, BY, B + 0.15 + k * 0.4, enter="drop", enterDur=0.5, z=9) for k, (x, bd) in enumerate(BOARDS)] + [
   lab(f'<div style="display:flex;align-items:center;gap:18px"><img src="{CREST}" style="height:150px"><div class="title" style="font-size:120px">ZAMIN FK</div></div>', 540, 620, st(3, 2) + 0.1, enter="stamp", z=25),
   spr("goat_side", 900, 1880, 440, B - 5, enter="none", idle="chew", z=12),
 ]},
 # 4 NUMBERS: 142 likes, 208 fans, fund rolls (virtual)
 {"from": s(4), "to": s(5), "bg": {"src": f"{A1}/S02_office_fund.png", "zoom": [1.0, 1.12], "focus": [0.5, 0.5, 0.45, 0.5], "blur": 6}, "items": [
   lab('<div class="badge"><small>LAYKLAR</small><b>0</b><i>OXIRGI VIDEO</i></div>', 300, 320, s(4, 0.05), counter=roll(s(4, 0.15), 0, LIKES), z=24),
   lab('<div class="badge"><small>MUXLISLAR</small><b>0</b><i>JAMI</i></div>', 760, 320, s(4, 0.5), counter=roll(s(4, 0.6), 0, FANS), z=24),
   lab(chip("142 × 15 000 = +2 130 000 SO‘M", True, 40), 540, 560, st(4, 1), enter="stamp", z=24),
   lab('<div class="card"><small>VIRTUAL KLUB FONDI</small><b>23 460 000</b><span>SO‘M</span></div>', 540, 810, st(4, 1) + 0.3, enter="up",
       counter=[[0, "23 460 000"]] + roll(st(4, 2), FUND_OLD, FUND_NEW, 22, 0.07), z=23),
   lab(VIRT, 540, 1000, st(4, 1) + 0.5, enter="fade", z=23),
   spr("goat_side", 920, 1880, 460, st(4, 2), enter="peekR", idle="chew", z=12),
 ]},
 # 5 FANS: two equal supporter cards
 {"from": s(5), "to": s(6), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.1, 1.02], "blur": 8}, "items": [
   lab('<div class="title" style="font-size:84px;text-align:center;line-height:1.02">ENG FAOL<br>MUXLISLAR</div>', 540, 270, s(5, 0.05), enter="stamp", z=25),
   lab(fan("@wrr_718"), 540, 560, st(5, 1), enter="slideL", enterDur=0.4, idle="sway", z=23),
   lab(fan("@Nursulton12340"), 540, 790, st(5, 1) + 0.25, enter="slideR", enterDur=0.4, idle="sway", z=23),
   lab(chip("RAHMAT! 💙", True, 60), 540, 1010, st(5, 2), enter="stamp", idle="pulse", z=25),
   spr("goat_chew", 250, 1880, 620, s(5), enter="up", idle="hop", z=12),
 ]},
 # 6 ACADEMY: training ground, empty manager's chair, goat looks at it
 {"from": s(6), "to": s(7), "bg": {"src": f"{A5}/BG_academy_ground.jpg", "zoom": [1.0, 1.12], "focus": [0.5, 0.5, 0.5, 0.55], "blur": 2}, "items": [
   lab('<div style="position:absolute;left:-600px;top:-1000px;width:1200px;height:2000px;background:linear-gradient(rgba(5,13,36,.45),transparent 35%,rgba(5,13,36,.55))"></div>', 540, 960, s(6), enter="fade", z=5),
   lab(chip("YOSHLAR AKADEMIYASI ⚽", True, 48), 540, 250, s(6, 0.05), enter="stamp", z=25),
   img(f"{A5}/manager_chair.png", 660, 1800, 800, s(6, 0.2), enter="drop", enterDur=0.6, idle="sway", z=10),
   lab('<div class="title" style="font-size:230px;color:#FFD23F">?</div>', 660, 880, st(6, 1), enter="stamp", idle="pulse", z=26),
   lab('<div class="title" style="font-size:112px">MANAGER YO‘Q!</div>', 540, 480, st(6, 1) + 0.15, enter="stamp", z=26),
   spr("goat_side", 230, 1880, 520, s(6), enter="up", idle="chew", flip=True, z=12),
 ]},
 # 7 ROLE: empty manager card, name blank
 {"from": s(7), "to": s(8), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.15], "focus": [0.5, 0.5, 0.5, 0.45], "blur": 9}, "items": [
   lab(VIG, 540, 960, s(7), enter="fade", z=5),
   lab('<div class="title" style="font-size:104px">MANAGER KERAK!</div>', 540, 200, s(7, 0.05), enter="stamp", idle="pulse", z=26),
   lab(MANAGER, 540, 640, s(7, 0.25), enter="drop", enterDur=0.6, idle="sway", z=23),
   lab(chip("ENG KO‘P LIKE = MENEJER", True, 46), 540, 1050, st(7, 1), enter="stamp", z=26),
   lab(chip("SIZNING NAVBATINGIZ!", False, 46), 540, 1140, st(7, 2), enter="stamp", idle="pulse", z=26),
   spr("goat_chew", 890, 1880, 520, s(7), enter="peekR", idle="talk", z=12),
 ]},
 # 8 CTA: one condition, one comment, 24 hours
 {"from": s(8), "to": TOTAL + 1, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.06, 1.2], "focus": [0.5, 0.5, 0.5, 0.42], "blur": 10}, "items": [
   lab(card_g('<div style="font-size:30px;font-weight:700;letter-spacing:5px;color:#9DB8FF">BITTA SHART</div>'
              '<div style="font-size:74px;font-weight:900;color:#FFD23F;line-height:1.05">@ZAMINFK_BOT</div>'
              '<div style="font-size:36px;font-weight:900">GA ULANGAN BO‘LISH SHART</div>', 860), 540, 250, s(8, 0.05), enter="drop", enterDur=0.5, z=25),
   lab(card_g('<div style="font-size:40px;font-weight:900;color:#0D2557">Izohga yozing:</div>'
              '<div style="font-size:98px;font-weight:900;line-height:1.02;color:#0D2557">MEN<br>MENEJERMAN!</div>', 880, "#0D2557").replace("background:rgba(13,37,87,.95)", "background:#FFD23F"),
       540, 580, st(8, 1), enter="stamp", idle="pulse", z=27),
   lab(chip("ENG KO‘P LIKE = MENEJER", False, 44), 540, 800, st(8, 1) + 0.5, enter="stamp", z=26),
   lab(chip("⏳ 24 SOATDAN KEYIN G‘OLIB E’LON QILINADI", True, 33), 540, 890, st(8, 2), enter="stamp", z=26),
   lab('<div class="title" style="font-size:54px;text-align:center;line-height:1.08;-webkit-text-stroke:9px #0D2557">KELAJAK YULDUZLARI —<br><span style="color:#FFD23F">SIZNING QO‘LINGIZDA! 🌟</span></div>', 540, 1020, st(8, 3), enter="stamp", z=26),
   spr("goat_chew", 890, 1880, 540, s(8), enter="up", idle="talk", z=12),
   lab('<div class="follow">+ OBUNA BO‘LING</div>', 430, 1440, e(8, -0.3), idle="pulse", z=26),
 ]},
]

EP = {"total": TOTAL, "scenes": scenes, "captions": caps}
build = os.path.join(HERE, "build"); os.makedirs(build, exist_ok=True)
json.dump(EP, open(os.path.join(build, "anim.json"), "w"), ensure_ascii=False)
env = dict(os.environ)
if len(sys.argv) > 2 and sys.argv[1] == "--frames":
    env["ONLY"] = sys.argv[2]
if len(sys.argv) > 1 and sys.argv[1] == "--times":
    print("lines", [(round(a, 2), round(b, 2)) for a, b in L], "total", round(TOTAL, 2)); print([[round(a, 2) for a, _ in x] for x in sent]); sys.exit()
silent = os.path.join(build, "anim_video.mp4")
subprocess.run(["node", os.path.join(TOOLS, "render.js"), os.path.join(build, "anim.json"), silent], check=True, env=env)
if "ONLY" in env:
    print("frames:", silent, "total", round(TOTAL, 2)); sys.exit()
inputs, fc, mix = ["-i", silent], [], []
for k, (f, off) in enumerate(audio, 1):
    inputs += ["-i", f]; ms = int(off * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5[aout]")
out = os.path.join(HERE, "exports", "ZFK_EP05_day5.mp4")
os.makedirs(os.path.dirname(out), exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)
ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round(x % 1 * 1000)) % 1000:03d}"
with open(os.path.join(HERE, "exports", "ZFK_EP05_day5.srt"), "w") as fh:
    for i, c in enumerate(caps, 1):
        fh.write(f"{i}\n{ts(c['a'])} --> {ts(c['b'])}\n{c['text']}\n\n")
print("OK", out, round(TOTAL, 2))
