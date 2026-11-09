"""Day 4 animated episode: 'HAYDOVCHI TOPILDI!' Same engine as Day 2/Day 3 (tools/anim).
Usage: python3 anim_ep04.py            -> exports/ZFK_EP04_day4.mp4 + .srt (narration only, -14 LUFS)
       python3 anim_ep04.py --frames t1,t2  -> still-frame check (build/anim_video.mp4)"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
A1 = "file://" + os.path.join(Z, "02_Episode_01", "assets")
A2 = "file://" + os.path.join(Z, "02_Episode_02", "assets")
A4 = "file://" + os.path.join(HERE, "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

# narration (voice files were sped up 1.2x from voice/raw/, pitch kept): (file, [(caption sentence, highlighted word indexes)])
LINES = [
 ("01_hook",   [("97 ta layk! Haydovchimiz aniqlandi!", [0, 3]), ("ZAMIN FK avtobusining yangi virtual haydovchisi — Odilbek!", [5, 7])]),
 ("02_winner", [("Odilbek, tabriklaymiz!", [0, 1]), ("Sizni jamoamiz Toshkent safarida kutmoqda!", [2, 3])]),
 ("03_fund",   [("Bu orada videomiz 118 ta layk oldi!", [3, 5]), ("Klub fondiga yana 1 770 000 so‘m qo‘shildi!", [3, 4, 5, 6]),
                ("Jami virtual fondimiz — 23 460 000 so‘m!", [1, 4, 5, 6, 7])]),
 ("04_andijan", [("Lekin eng katta yangilik hali oldinda!", [3]), ("ZAMIN FK Andijondan haqiqiy hamkor topdi!", [2, 3, 4]),
                 ("Klubimizda katta o‘zgarishlar boshlanish arafasida!", [1, 2])]),
 ("04b_team",  [("Yana bir gap! Jamoamizga qo‘shilmoqchi bo‘lganlar ko‘p.", [3]), ("Haqiqiy jamoamiz tarkibini ham tez orada e’lon qilamiz!", [0, 2, 4, 5])]),
 ("05_vote",   [("Endi navbat sizda!", [1, 2]), ("Hamkorimiz bilan birinchi nimani rivojlantiramiz?", [4]),
                ("1 — yangi forma!", [0, 2]), ("2 — mashg‘ulot bazasi!", [0, 1, 2]), ("3 — yosh futbolchilar akademiyasi!", [0, 3]),
                ("Tanlovingizni izohga yozing!", [1, 2]), ("24 soatdan keyin g‘olibni e’lon qilamiz!", [0, 1])]),
]
GAP = 0.2
t, L, audio, caps, sent = 0.2, [], [], [], []      # sent[i] = list of (a, b) per sentence of line i
for name, phrases in LINES:
    f = os.path.join(HERE, "voice", name + ".mp3")
    d = dur(f); audio.append((f, t))
    total_chars = sum(len(p) for p, _ in phrases)
    a, span, ss = t + 0.03, d - 0.12, []
    for text, hl in phrases:
        b = a + span * len(text) / total_chars
        words = [w for w in text.split(" ") if w != "—"]
        tot = sum(len(w) for w in words); acc = 0; wt = []
        for w in words:
            wt.append(a + (b - a) * 0.85 * acc / tot); acc += len(w)
        caps.append({"a": a, "b": b, "words": words, "hl": hl, "wt": wt, "text": text}); ss.append((a, b)); a = b
    sent.append(ss); L.append((t, t + d)); t += d + GAP
TOTAL = L[-1][1] + 2.8
s = lambda i, off=0.0: L[i - 1][0] + off
e = lambda i, off=0.0: L[i - 1][1] + off
frac = lambda i, p: L[i - 1][0] + (L[i - 1][1] - L[i - 1][0]) * p
st = lambda i, k: sent[i - 1][k][0]          # start of sentence k of line i

def spr(src, x, y, h, at, to=None, enter="pop", idle="bob", **k):
    return {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": at, "to": to, "enter": enter, "idle": idle, **k}
def lab(html, x, y, at, to=None, enter="pop", idle=None, **k):
    return {"type": "label", "html": html, "x": x, "y": y, "at": at, "to": to, "enter": enter, "idle": idle, **k}
chip = lambda txt, y=False, fs=42: f'<div class="chip{" y" if y else ""}" style="font-size:{fs}px">{txt}</div>'
roll = lambda t0, v0, v1, n=18, dt=0.06: [[t0 + i * dt, round(v0 + (v1 - v0) * (i / (n - 1)) ** 0.7)] for i in range(n)]
card_g = lambda body, w=860: (f'<div style="width:{w}px;padding:28px 32px;box-sizing:border-box;border-radius:34px;background:rgba(13,37,87,.95);'
                             f'border:6px solid #fff;color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5)">{body}</div>')
VIRT = '<div class="virtual">VIRTUAL</div>'

# winning comment: the real screenshot sent by the club (Instagram, 97 likes)
def winner_shot(w=900, glow=False):
    ring = "box-shadow:0 0 0 8px #FFD23F,0 18px 40px rgba(0,0,0,.55);" if glow else "box-shadow:0 14px 34px rgba(0,0,0,.5);"
    return f'<img src="{A4}/comment_winner.jpg" style="width:{w}px;border-radius:26px;border:6px solid #0D2557;{ring}display:block">'

# virtual driver card: no portrait of the winner (none supplied) -> silhouette + bus icon
DRIVER = card_g(
    '<div style="display:flex;align-items:center;gap:26px;text-align:left">'
    '<div style="width:170px;height:170px;border-radius:50%;background:#1F4FB8;border:6px solid #FFD23F;display:flex;align-items:center;justify-content:center;font-size:96px;flex:none">🚌</div>'
    '<div><div style="font-size:30px;font-weight:700;letter-spacing:4px;color:#9DB8FF">YANGI HAYDOVCHI</div>'
    '<div style="font-size:84px;font-weight:900;line-height:1">ODILBEK</div>'
    '<div style="font-size:30px;font-weight:900;color:#FFD23F;margin-top:6px">JAMOA TANLOVI · VIRTUAL</div></div></div>', 860)

# ---------- Andijan map (Natural Earth 1:50m via world-atlas; projected in assets/uz_map.json) ----------
MAP = json.load(open(os.path.join(HERE, "assets", "uz_map.json")))
AX, AY = MAP["andijan"]
def uz_map(route_p=0.0, andijan=True):
    near = "".join(f'<path d="{p}" fill="#0f2350" stroke="#24447f" stroke-width="2"/>' for p in MAP["near"])
    # route: from the club badge (left edge, off-map: no claim about Qoratepa's exact location) to Andijan
    x0, y0, cx, cy = -60, 300, 520, 120
    route = (f'<path d="M{x0},{y0} Q{cx},{cy} {AX},{AY}" fill="none" stroke="#FFD23F" stroke-width="9" stroke-linecap="round" '
             f'stroke-dasharray="1400" stroke-dashoffset="{1400 * (1 - route_p):.0f}"/>') if route_p > 0 else ""
    dot = (f'<circle cx="{AX}" cy="{AY}" r="34" fill="#FFD23F" fill-opacity=".25"/><circle cx="{AX}" cy="{AY}" r="16" fill="#FFD23F" stroke="#0D2557" stroke-width="5"/>') if andijan else ""
    return (f'<div style="width:1080px;height:1920px;background:radial-gradient(circle at 60% 45%,#16357a 0%,#0D2557 55%,#050d24 100%);display:flex;align-items:center;justify-content:center">'
            f'<svg viewBox="-40 -40 {MAP["W"] + 80} {MAP["H"] + 80}" style="width:1060px">'
            f'<clipPath id="cl"><rect x="-40" y="-40" width="{MAP["W"] + 80}" height="{MAP["H"] + 80}"/></clipPath><g clip-path="url(#cl)">{near}'
            f'<path d="{MAP["uz"]}" fill="#1F4FB8" stroke="#9DB8FF" stroke-width="3"/>{route}{dot}</g></svg></div>')

# ---------- choice cards (FIFA-style) ----------
def choice(n, title, img, accent="#FFD23F"):
    return (f'<div style="width:290px;height:470px;border-radius:30px;background:linear-gradient(170deg,#1F4FB8,#0D2557 70%);border:6px solid {accent};'
            f'box-shadow:0 16px 36px rgba(0,0,0,.55);overflow:hidden;position:relative;color:#fff;text-align:center">'
            f'<img src="{A4}/{img}" style="width:100%;height:270px;object-fit:cover;display:block">'
            f'<div style="position:absolute;left:14px;top:14px;width:84px;height:84px;border-radius:50%;background:#FFD23F;color:#0D2557;'
            f'font-size:58px;font-weight:900;display:flex;align-items:center;justify-content:center;border:5px solid #0D2557">{n}</div>'
            f'<div style="padding:16px 8px 0;font-size:31px;font-weight:900;line-height:1.12">{title}</div></div>')
CARDS = [(1, "YANGI<br>FORMA<br>👕", "opt1_jersey.jpg", 175), (2, "MASHG‘ULOT<br>BAZASI<br>🏟️", "opt2_base.jpg", 470), (3, "YOSHLAR<br>AKADEMIYASI<br>⚽", "opt3_academy.jpg", 765)]
CY = 760

# ---------- scenes ----------
H_A = st(4, 1); H_B = st(4, 2)                        # Andijan: map from sentence 2, back to goat for sentence 3
T_A = st(5, 0) + 1.1                                  # team: goat close-up, then silhouettes on the pitch
V1, V2, V3, VCTA = st(6, 2), st(6, 3), st(6, 4), st(6, 5)
scenes = [
 # 1 HOOK (first frame readable without sound): stamp + 97 likes + goat jumps in + comment slides in
 {"from": 0, "to": s(2), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.28, 1.05], "blur": 3}, "items": [
   lab('<div class="title" style="font-size:118px;text-align:center;line-height:1">HAYDOVCHI<br>TOPILDI!</div>', 540, 300, -0.6, enter="stamp", idle="pulse", z=25),
   lab('<div class="badge"><small>G‘OLIB IZOH</small><b>0</b><i>❤️ LAYK</i></div>', 300, 640, -0.4, counter=roll(-0.75, 0, 97, 12, 0.05), z=24),
   lab(chip("🚌 TOSHKENT SAFARI", True, 36), 770, 600, 0.35, enter="stamp", z=24),
   spr("goat_chew", 760, 1880, 820, -0.3, enter="up", enterDur=0.35, idle="hop", to=frac(1, 0.45), z=12),
   spr("goat_chew", 760, 1880, 820, frac(1, 0.45), enter="none", idle="talk", z=12),
   lab(winner_shot(900), 540, 900, st(1, 1) - 0.2, enter="slideR", enterDur=0.35, z=22),
 ]},
 # 2 WINNER: real comment highlighted + virtual driver card, goat hops
 {"from": s(2), "to": s(3), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.05, 1.12], "blur": 8}, "items": [
   lab(chip("YANGI HAYDOVCHI ✅", True), 540, 240, s(2, 0.0), enter="stamp", z=25),
   lab(winner_shot(940, glow=True), 540, 470, s(2, 0.05), enter="pop", z=22),
   lab(DRIVER, 540, 800, frac(2, 0.3), enter="drop", enterDur=0.5, idle="sway", z=23),
   lab('<div style="font-size:120px">🎉</div>', 900, 1000, frac(2, 0.15), enter="stamp", idle="pulse", z=24),
   spr("goat_chew", 250, 1880, 700, s(2, 0.0), enter="up", idle="hop", z=12),
 ]},
 # 3 FUND: 118 likes -> +1 770 000 -> 23 460 000 (virtual)
 {"from": s(3), "to": s(4), "bg": {"src": f"{A1}/S02_office_fund.png", "zoom": [1.0, 1.12], "focus": [0.5, 0.5, 0.45, 0.5], "blur": 6}, "items": [
   lab('<div class="badge"><small>JAMI LAYKLAR</small><b>0</b><i>REEL · 1 KUN</i></div>', 540, 330, s(3, 0.05), counter=roll(s(3, 0.15), 0, 118), z=24),
   lab(chip("118 × 15 000 = +1 770 000 SO‘M", True, 40), 540, 560, st(3, 1), enter="stamp", z=24),
   lab('<div class="card"><small>VIRTUAL KLUB FONDI</small><b>21 690 000</b><span>SO‘M</span></div>', 540, 820, st(3, 1) + 0.3, enter="up",
       counter=[[0, "21 690 000"]] + roll(st(3, 2), 21_690_000, 23_460_000, 22, 0.07), z=23),
   lab(VIRT, 540, 1010, st(3, 1) + 0.5, enter="fade", z=23),
   spr("goat_side", 920, 1880, 480, st(3, 2), enter="peekR", idle="chew", z=12),
 ]},
 # 4a ANDIJAN tease: goat, mystery
 {"from": s(4), "to": H_A, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.2], "focus": [0.5, 0.5, 0.5, 0.42], "blur": 5}, "items": [
   lab('<div style="position:absolute;left:-600px;top:-1000px;width:1200px;height:2000px;background:radial-gradient(circle at 50% 55%,transparent 28%,rgba(0,0,0,.78) 70%)"></div>', 540, 960, s(4), enter="fade", z=5),
   lab(chip("ENG KATTA YANGILIK…", True), 540, 330, s(4, 0.1), enter="stamp", z=25),
   spr("goat_chew", 540, 1880, 1050, s(4), enter="up", idle="talk", z=12),
 ]},
 # 4b ANDIJAN map: Uzbekistan, Andijan in the east, route from the club badge, handshake
 {"from": H_A, "to": H_B, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.0], "blur": 20}, "items": [
   lab(uz_map(0), 540, 960, H_A, enter="fade", enterDur=0.3, z=5),
 ] + [lab(uz_map(p), 540, 960, H_A + 0.35 + k * 0.09, H_A + 0.35 + (k + 1) * 0.09 if p < 1 else None, enter="none", z=6)
      for k, p in enumerate([i / 10 for i in range(1, 11)])] + [
   lab(f'<div style="display:flex;align-items:center;gap:14px;background:#0D2557;border:5px solid #fff;border-radius:22px;padding:12px 20px">'
       f'<img src="{CREST}" style="height:90px"><div style="font-size:40px;font-weight:900;color:#fff">ZAMIN FK</div></div>', 230, 880, H_A + 0.1, enter="slideL", z=26),
   lab('<div class="title" style="font-size:132px">ANDIJON</div>', 540, 330, H_A + 0.9, enter="stamp", z=26),
   lab(chip("HAQIQIY HAMKOR! 🤝", True, 48), 540, 500, H_A + 1.3, enter="stamp", idle="pulse", z=26),
 ]},
 # 4c back to the goat: the announcement
 {"from": H_B, "to": s(5), "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.05, 1.15], "blur": 6}, "items": [
   lab(card_g('<div style="font-size:84px;font-weight:900;line-height:1.1">ANDIJON 🤝 ZAMIN FK</div>', 900), 540, 330, H_B, enter="stamp", z=25),
   lab(chip("HAQIQIY HAMKOR!", True, 48), 540, 520, H_B + 0.25, enter="stamp", z=25),
   lab(chip("KATTA O‘ZGARISHLAR OLDINDA…", False, 40), 540, 640, H_B + 0.6, enter="up", z=25),
   spr("goat_chew", 540, 1880, 950, H_B, enter="up", idle="talk", z=12),
 ]},
 # 5a REAL TEAM: goat looks at the camera
 {"from": s(5), "to": T_A, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.15, 1.25], "focus": [0.5, 0.5, 0.5, 0.45], "blur": 6}, "items": [
   lab(chip("YANA BIR GAP!", True), 540, 330, s(5, 0.05), enter="stamp", z=25),
   spr("goat_chew", 540, 1950, 1250, s(5), enter="fade", idle="chew", z=12),
 ]},
 # 5b REAL TEAM: real players' silhouettes walk onto the pitch (no names, no positions)
 {"from": T_A, "to": s(6), "bg": {"src": f"{A1}/BG_pitch_empty.png", "zoom": [1.0, 1.1], "focus": [0.5, 0.55, 0.5, 0.5]}, "items": [
   lab('<div style="position:absolute;left:-600px;top:-1000px;width:1200px;height:2000px;background:linear-gradient(transparent 40%,rgba(5,13,36,.65))"></div>', 540, 960, T_A, enter="fade", z=5),
   lab(f'<img src="{A4}/players_silhouette.png" style="width:1040px;filter:brightness(.08) drop-shadow(0 0 14px rgba(157,184,255,.9));display:block">', 540, 1060, T_A, enter="up", enterDur=1.6, idle="bob", z=10),
   lab('<div class="title" style="font-size:104px;text-align:center;line-height:1.02">REAL JAMOA —<br>TEZ ORADA!</div>', 540, 330, T_A + 0.3, enter="stamp", z=26),
   lab(chip("O‘YINCHILAR TARKIBI E’LON QILINADI", True, 36), 540, 560, T_A + 0.8, enter="stamp", z=26),
   spr("goat_side", 930, 1880, 420, T_A + 0.4, enter="peekR", idle="chew", z=12),
 ]},
 # 6 VOTE: three cards, goat looks at each
 {"from": s(6), "to": VCTA, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.0, 1.08], "blur": 9}, "items": [
   lab('<div class="title" style="font-size:96px">NAVBAT SIZDA!</div>', 540, 250, s(6, 0.05), enter="stamp", idle="pulse", z=26),
   lab(chip("BIRINCHI NIMANI RIVOJLANTIRAMIZ?", True, 36), 540, 400, st(6, 1), enter="stamp", z=26),
   lab(choice(*CARDS[0][:3]), CARDS[0][3], CY, V1, enter="slideL", idle="sway", z=22),
   lab(choice(*CARDS[1][:3]), CARDS[1][3], CY, V2, enter="drop", enterDur=0.5, idle="sway", z=22),
   lab(choice(*CARDS[2][:3]), CARDS[2][3], CY, V3, enter="pop", idle="sway", z=22),
   lab('<div style="font-size:24px;font-weight:700;color:#cfdcff;background:rgba(13,37,87,.85);padding:8px 16px;border-radius:12px">Variantlar — jamoatchilik takliflari</div>', 470, 1030, V1 + 0.3, enter="fade", z=22),
   # goat looks at the card being named (side sprite faces left; flipped to face right)
   spr("goat_side", 330, 1880, 520, s(6), V1, enter="up", idle="talk", z=12),
   spr("goat_side", 330, 1880, 520, V1, V2, enter="none", idle="talk", z=12),
   spr("goat_chew", 470, 1880, 560, V2, V3, enter="none", idle="talk", z=12),
   spr("goat_side", 610, 1880, 520, V3, enter="none", idle="talk", flip=True, z=12),
   lab('<div style="font-size:110px">👆</div>', CARDS[0][3], 1100, V1 + 0.1, V2, enter="pop", idle="hop", z=24),
   lab('<div style="font-size:110px">👆</div>', CARDS[1][3], 1100, V2 + 0.1, V3, enter="pop", idle="hop", z=24),
   lab('<div style="font-size:110px">👆</div>', CARDS[2][3], 1100, V3 + 0.1, VCTA, enter="pop", idle="hop", z=24),
 ]},
 # 7 CTA: quick countdown, then the dominant final screen
 {"from": VCTA, "to": TOTAL + 1, "bg": {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.08, 1.2], "focus": [0.5, 0.5, 0.5, 0.42], "blur": 10}, "items": [
   lab('<div class="title" style="font-size:300px">3</div>', 540, 760, VCTA, VCTA + 0.3, enter="stamp", enterDur=0.2, z=27),
   lab('<div class="title" style="font-size:300px">2</div>', 540, 760, VCTA + 0.3, VCTA + 0.6, enter="stamp", enterDur=0.2, z=27),
   lab('<div class="title" style="font-size:300px">1</div>', 540, 760, VCTA + 0.6, VCTA + 0.9, enter="stamp", enterDur=0.2, z=27),
   lab('<div class="title" style="font-size:92px;text-align:center;line-height:1.05">SIZ TANLAYSIZ.<br><span style="color:#FFD23F">ZAMIN FK BAJARADI.</span></div>', 540, 300, VCTA + 0.9, enter="stamp", z=26),
 ] + [lab(f'<div style="transform:scale(.62)">{choice(*c[:3])}</div>', c[3], 640, VCTA + 0.95 + k * 0.08, enter="pop", z=22) for k, c in enumerate(CARDS)] + [
   lab(card_g('<div style="font-size:76px;font-weight:900;line-height:1.05">1, 2 yoki 3?<br><span style="color:#FFD23F">Izohga yozing!</span></div>', 820), 540, 1010, VCTA + 1.2, enter="drop", enterDur=0.5, idle="pulse", z=26),
   lab(chip("⏳ 24 SOAT", True, 46), 540, 1210, VCTA + 1.5, enter="stamp", z=26),
   spr("goat_chew", 880, 1880, 520, VCTA + 1.0, enter="peekR", idle="talk", z=12),
   lab('<div class="follow">+ OBUNA BO‘LING</div>', 470, 1430, e(6, -0.4), idle="pulse", z=26),
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
for k, (f, off) in enumerate(audio, 1):
    inputs += ["-i", f]; ms = int(off * 1000)
    fc.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5[aout]")
out = os.path.join(HERE, "exports", "ZFK_EP04_day4.mp4")
os.makedirs(os.path.dirname(out), exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)
# subtitles (same sentences as the on-screen captions)
ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round(x % 1 * 1000)) % 1000:03d}"
with open(os.path.join(HERE, "exports", "ZFK_EP04_day4.srt"), "w") as fh:
    for i, c in enumerate(caps, 1):
        fh.write(f"{i}\n{ts(c['a'])} --> {ts(c['b'])}\n{c['text']}\n\n")
print("OK", out, round(TOTAL, 2))
