"""Mix narration + synthesized hits/whooshes + crowd bed + music onto build/silent.mp4 -> exports/ZFK_REEL23_transfer_jasurbek.mp4, write .srt + caption.txt.
Order: python3 prep_voice.py ; node render3d.js sign 5.7 ; node render.js video build/silent.mp4 ; python3 make.py"""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); Z = os.path.dirname(HERE); B = HERE + "/build"; EXP = HERE + "/exports"; V = HERE + "/voice"
W = json.load(open(B + "/words.json")); END = 38.0
S = dict(hook=0, vote=4.0, sign=8.9, num=14.6, bud=18.1, coach=22.5, cta=29.9)
ins, fc, mix, k = ["-i", B + "/silent.mp4"], [], [], 0
def add(src, at, vol=1.0, pre="", lav=False):
    global k
    k += 1; ins.extend(src if lav else ["-i", src]); ms = int(at * 1000)
    fc.append(f"[{k}:a]aresample=48000,{pre}volume={vol},adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
for x in W: add(f"{V}/{x['beat']:02d}_fit.wav", x["start"], 1.0, "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,")
BOOM = "aevalsrc='0.9*sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*3.4)+0.25*sin(2*PI*110*t)*exp(-t*9)':d=1.5:s=48000"
POP = "aevalsrc='0.6*sin(2*PI*(520+300*exp(-t*40))*t)*exp(-t*14)':d=0.4:s=48000"
TICK = "aevalsrc='0.35*sin(2*PI*1500*t)*exp(-t*60)':d=0.1:s=48000"
STAMP = "aevalsrc='0.8*sin(2*PI*(150+400*exp(-t*30))*t)*exp(-t*11)+0.3*sin(2*PI*80*t)*exp(-t*6)':d=0.8:s=48000"
for c, v in ((0.0, .9), (S["vote"], .9), (S["sign"] + .2, 1.0), (S["num"], .9), (S["bud"] + 2.2, .9), (S["coach"], .8), (S["cta"], .9)): add(["-f", "lavfi", "-i", BOOM], c, v, lav=True)
for c in (1.7, 2.1, S["sign"] + 1.9):                                                     # RAD / TANLANDI stamps, name card
    add(["-f", "lavfi", "-i", STAMP], c, .8, lav=True)
for c in (.25, S["vote"] + 1.2, S["vote"] + 1.4, S["vote"] + 2.3, S["sign"] + .8, S["sign"] + 3.4, S["num"] + 1.2,
          S["bud"] + .9, S["bud"] + 1.5, S["coach"] + .4, S["coach"] + .9, S["coach"] + 2.6,
          S["cta"] + 1.0, S["cta"] + 1.55, S["cta"] + 2.1, S["cta"] + 3.1, S["cta"] + 4.4): add(["-f", "lavfi", "-i", POP], c, .5, lav=True)
for c in [S["bud"] + .5 + i * .09 for i in range(24)]: add(["-f", "lavfi", "-i", TICK], c, .35, lav=True)        # budget counter ticking
for c in [S["vote"] + .4 + i * .09 for i in range(20)]: add(["-f", "lavfi", "-i", TICK], c, .3, lav=True)        # percent counter ticking
for n in ("vote", "sign", "num", "bud", "coach", "cta"): add(["-f", "lavfi", "-t", "0.5", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=7"], S[n] - .42, .7, "bandpass=f=1800:w=2600,volume='pow(min(t/0.42,1),2.2)':eval=frame,afade=t=out:st=0.4:d=0.1,", lav=True)
k += 1; ins += ["-stream_loop", "-1", "-i", Z + "/03_Episode_03/sfx/crowd_bed.wav"]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{END:.2f},volume=0.16,afade=t=in:d=0.4,afade=t=out:st={END-1.2:.2f}:d=1.2[cr]"); mix.append("[cr]")
k += 1; ins += ["-i", Z + "/06_Episode_06/sfx/music.mp3"]
fc.append(f"[{k}:a]aresample=48000,aloop=loop=-1:size=2e9,atrim=0:{END:.2f},volume=0.2,afade=t=in:d=0.5,afade=t=out:st={END-1.4:.2f}:d=1.4[mu]"); mix.append("[mu]")
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{END:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
out = EXP + "/ZFK_REEL23_transfer_jasurbek.mp4"
os.makedirs(EXP, exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", f"{END:.3f}", "-movflags", "+faststart", out], check=True)
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"
cues = [(s["a"], s["b"] + .2, " ".join(w["w"] for w in s["words"]).replace("Zamin", "ZAMIN")) for x in W for s in x["sents"]]
with open(EXP + "/ZFK_REEL23_transfer_jasurbek.srt", "w", encoding="utf-8") as f:
    for n, (a, c, t) in enumerate(cues, 1): f.write(f"{n}\n{ts(a)} --> {ts(min(c, cues[n][0] - .02) if n < len(cues) else c)}\n{t}\n\n")
open(EXP + "/caption.txt", "w", encoding="utf-8").write("""Siz tanladingiz — Jasurbek bizda! 🔵⚪️

Ovoz natijasi: 64% — 2-variant.
❤ Eng ko‘p layk olgan izoh: 81 layk.

🆕 Jasurbek Rahimov — 19 yosh, himoyachi, O‘zbekiston (OVR 66)
💸 Transfer: 12 500 000 so‘m
💰 Byudjet: 79 875 000 → 67 375 000 so‘m

Murabbiy Rustam aka: «Siz yulduzni emas, kelajakni sotib oldingiz».

Endi mashqni SIZ tanlaysiz 👇
1 — TEZLIK
2 — HIMOYA
3 — ZARBA
Izohga 1, 2 yoki 3 yozing. 24 soatdan keyin eng ko‘p layk olgan izoh g‘olib — natijani keyingi o‘yinda ko‘rasiz.

(Fond, transfer va muxlislar — virtual o‘yin mexanikasi.)
#zaminfk #zamin #football #futbol #uzbekistan #transfer #reels
""")
print("OK", out)
