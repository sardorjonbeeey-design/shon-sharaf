"""Day 5 Instagram stories (1080x1920 PNG), same engine/CSS as the episode.
Usage: python3 stories_ep05.py -> exports/ZFK_EP05_story_result.png, exports/ZFK_EP05_story_manager.png"""
import json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
A2 = "file://" + os.path.join(Z, "02_Episode_02", "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")
lab = lambda html, x, y, z=20: {"type": "label", "html": html, "x": x, "y": y, "at": -1, "enter": "none", "z": z}
spr = lambda src, x, y, h, flip=False: {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": -1, "enter": "none", "flip": flip, "z": 12}
chip = lambda t, y=True, fs=44: f'<div class="chip{" y" if y else ""}" style="font-size:{fs}px">{t}</div>'
card = lambda body, w=900, bg="rgba(13,37,87,.95)", bc="#fff": f'<div style="width:{w}px;padding:30px;box-sizing:border-box;border-radius:34px;background:{bg};border:6px solid {bc};color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5)">{body}</div>'
crest = lab(f'<img src="{CREST}" style="height:150px">', 540, 150, 25)
bg = {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.1, 1.1], "blur": 8}

result = [crest,
  lab('<div class="title" style="font-size:104px;text-align:center;line-height:1">SIZ<br>TANLADINGIZ!</div>', 540, 410, 26),
  lab(card('<div style="font-size:320px;font-weight:900;line-height:.95;color:#FFD23F">69%</div>'
           '<div style="font-size:74px;font-weight:900;line-height:1.05">YOSHLAR<br>AKADEMIYASI ⚽</div>', 900, "#06122c", "#FFD23F"), 540, 850, 24),
  lab(chip("KELAJAK BUGUNDAN BOSHLANADI", False, 42), 540, 1200, 24),
  lab(chip("👥 208 MUXLIS · 💙 @wrr_718 · @Nursulton12340", True, 32), 540, 1300, 24),
  spr("goat_chew", 540, 1900, 520)]
manager = [crest,
  lab('<div class="title" style="font-size:112px;text-align:center;line-height:1">MANAGER<br>KERAK!</div>', 540, 410, 26),
  lab(chip("YOSHLAR AKADEMIYASI ⚽", True, 46), 540, 590, 26),
  lab(card('<div style="font-size:44px;font-weight:900;color:#0D2557">Izohga yozing:</div>'
           '<div style="font-size:94px;font-weight:900;line-height:1.02;color:#0D2557">MEN<br>MENEJERMAN!</div>', 900, "#FFD23F", "#0D2557"), 540, 850, 24),
  lab(chip("ENG KO‘P LIKE = MENEJER", False, 46), 540, 1090, 24),
  lab(chip("SHART: @ZAMINFK_BOT GA ULANGAN BO‘LISH", True, 36), 540, 1185, 24),
  lab(chip("24 SOATDAN KEYIN G‘OLIB E’LON QILINADI", False, 34), 540, 1275, 24),
  spr("goat_side", 840, 1900, 380, True)]

build = os.path.join(HERE, "build"); os.makedirs(build, exist_ok=True)
for name, items in (("result", result), ("manager", manager)):
    ep = {"total": 0.1, "scenes": [{"from": 0, "to": 1, "bg": bg, "items": items}], "captions": []}
    j = os.path.join(build, f"story_{name}.json"); json.dump(ep, open(j, "w"), ensure_ascii=False)
    mp4 = os.path.join(build, f"story_{name}.mp4")
    subprocess.run(["node", os.path.join(TOOLS, "render.js"), j, mp4], check=True)
    out = os.path.join(HERE, "exports", f"ZFK_EP05_story_{name}.png")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp4, "-frames:v", "1", out], check=True)
    print("OK", out)
