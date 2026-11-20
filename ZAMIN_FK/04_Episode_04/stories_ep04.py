"""Day 4 Instagram stories (1080x1920 PNG) drawn with the same engine/CSS as the episode.
Usage: python3 stories_ep04.py -> exports/ZFK_EP04_story_winner.png, exports/ZFK_EP04_story_vote.png"""
import json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
TOOLS = os.path.join(Z, "tools", "anim")
SPR = "file://" + os.path.join(Z, "01_Art_Direction", "Sprites")
A2 = "file://" + os.path.join(Z, "02_Episode_02", "assets")
A4 = "file://" + os.path.join(HERE, "assets")
CREST = "file://" + os.path.join(Z, "03_Approved_Assets", "ZFK_CREST_MASTER_V01_P_2048.png")
lab = lambda html, x, y, z=20: {"type": "label", "html": html, "x": x, "y": y, "at": -1, "enter": "none", "z": z}
spr = lambda src, x, y, h, flip=False: {"type": "sprite", "src": f"{SPR}/{src}.png", "x": x, "y": y, "h": h, "at": -1, "enter": "none", "flip": flip, "z": 12}
chip = lambda t, y=True, fs=44: f'<div class="chip{" y" if y else ""}" style="font-size:{fs}px">{t}</div>'
card = lambda body, w=900: f'<div style="width:{w}px;padding:30px;box-sizing:border-box;border-radius:34px;background:rgba(13,37,87,.95);border:6px solid #fff;color:#fff;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.5)">{body}</div>'
crest = lab(f'<img src="{CREST}" style="height:150px">', 540, 150, 25)
bg = {"src": f"{A2}/BG_stand_renovated.png", "zoom": [1.1, 1.1], "blur": 8}

winner = [crest,
  lab('<div class="title" style="font-size:120px;text-align:center;line-height:1">HAYDOVCHI<br>TOPILDI! 🚌</div>', 540, 420, 26),
  lab(f'<img src="{A4}/comment_winner.jpg" style="width:960px;border-radius:26px;border:6px solid #0D2557;box-shadow:0 0 0 8px #FFD23F,0 18px 40px rgba(0,0,0,.55);display:block">', 540, 720, 24),
  lab(card('<div style="font-size:40px;font-weight:700;color:#9DB8FF;letter-spacing:4px">@odilbek_nasrullayev</div>'
           '<div style="font-size:150px;font-weight:900;line-height:1.05">97 ❤️</div>'
           '<div style="font-size:44px;font-weight:900;color:#FFD23F">ZAMIN FK JAMOASI SIZNI TANLADI!</div>'), 540, 1060, 24),
  lab('<div class="virtual">VIRTUAL HAYDOVCHI · JAMOA TANLOVI</div>', 540, 1270, 24),
  spr("goat_chew", 540, 1900, 560)]

def opt(n, t, img):
    return (f'<div style="width:880px;height:190px;display:flex;align-items:center;gap:26px;background:#0D2557;border:6px solid #FFD23F;border-radius:30px;'
            f'overflow:hidden;color:#fff;box-shadow:0 12px 28px rgba(0,0,0,.5)"><img src="{A4}/{img}" style="width:190px;height:190px;object-fit:cover">'
            f'<div style="width:96px;height:96px;border-radius:50%;background:#FFD23F;color:#0D2557;font-size:64px;font-weight:900;display:flex;align-items:center;justify-content:center;flex:none">{n}</div>'
            f'<div style="font-size:52px;font-weight:900">{t}</div></div>')
vote = [crest,
  lab('<div class="title" style="font-size:86px;text-align:center;line-height:1.05">BIRINCHI NIMANI<br>RIVOJLANTIRAMIZ?</div>', 540, 400, 26),
  lab(opt(1, "YANGI FORMA", "opt1_jersey.jpg"), 540, 650),
  lab(opt(2, "MASHG‘ULOT BAZASI", "opt2_base.jpg"), 540, 870),
  lab(opt(3, "YOSHLAR AKADEMIYASI", "opt3_academy.jpg"), 540, 1090),
  lab('<div class="title" style="font-size:110px">SIZ TANLANG!</div>', 540, 1300, 26),
  lab(chip("Izohga 1, 2 yoki 3 yozing · 24 soat", True, 38), 540, 1430, 26),
  lab('<div style="font-size:24px;font-weight:700;color:#cfdcff;background:rgba(13,37,87,.85);padding:8px 16px;border-radius:12px">Variantlar — jamoatchilik takliflari</div>', 540, 1510, 26),
  spr("goat_side", 840, 1900, 360, True)]

build = os.path.join(HERE, "build"); os.makedirs(build, exist_ok=True)
for name, items in (("winner", winner), ("vote", vote)):
    ep = {"total": 0.1, "scenes": [{"from": 0, "to": 1, "bg": bg, "items": items}], "captions": []}
    j = os.path.join(build, f"story_{name}.json"); json.dump(ep, open(j, "w"), ensure_ascii=False)
    mp4 = os.path.join(build, f"story_{name}.mp4")
    subprocess.run(["node", os.path.join(TOOLS, "render.js"), j, mp4], check=True)
    out = os.path.join(HERE, "exports", f"ZFK_EP04_story_{name}.png")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp4, "-frames:v", "1", out], check=True)
    print("OK", out)
