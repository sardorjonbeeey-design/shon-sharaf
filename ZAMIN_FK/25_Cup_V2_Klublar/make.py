"""Mix narration + synthesized hits/whooshes + crowd bed + music onto build/silent.mp4 -> exports/ZFK_CUP_V2_klublar.mp4, write .srt + caption.txt.
Order: python3 prep_voice.py ; node render.js video build/silent.mp4 ; python3 make.py   (plates reused from 24_Cup_V1_Elon/build/top)"""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); Z = os.path.dirname(HERE); B = HERE + "/build"; EXP = HERE + "/exports"; V = HERE + "/voice"
W = json.load(open(B + "/words.json")); END = 36.0
S = dict(hook=0, clubs=3.8, draw=9.4, caps=18.2, cta=23.0, end=30.8)
ins, fc, mix, k = ["-i", B + "/silent.mp4"], [], [], 0
def add(src, at, vol=1.0, pre="", lav=False):
    global k
    k += 1; ins.extend(src if lav else ["-i", src]); ms = int(at * 1000)
    fc.append(f"[{k}:a]aresample=48000,{pre}volume={vol},adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
for x in W: add(f"{V}/{x['beat']:02d}_fit.wav", x["start"], 1.0, "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,")
BOOM = "aevalsrc='0.9*sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*3.4)+0.25*sin(2*PI*110*t)*exp(-t*9)':d=1.5:s=48000"
POP = "aevalsrc='0.6*sin(2*PI*(520+300*exp(-t*40))*t)*exp(-t*14)':d=0.4:s=48000"
SHINE = "aevalsrc='0.4*sin(2*PI*(1800+900*exp(-t*9))*t)*exp(-t*5)':d=0.9:s=48000"
for c, v in ((0.0, .95), (S["draw"], .9), (S["caps"], .9), (S["cta"], .9), (S["end"], .95)): add(["-f", "lavfi", "-i", BOOM], c, v, lav=True)
for c in (2.0, 2.3, 2.6, 2.9,                                                    # four club cards landing on the pitch
          S["clubs"] + .2, S["clubs"] + 1.55, S["clubs"] + 2.9, S["clubs"] + 4.25,   # each club lighting up in turn
          S["draw"] + .9, S["draw"] + 1.5, S["draw"] + 2.2, S["draw"] + 4.0,
          S["caps"] + 1.0, S["caps"] + 1.4, S["caps"] + 1.8, S["caps"] + 2.2,
          S["cta"] + .4, S["cta"] + .95, S["cta"] + 1.5, S["cta"] + 2.05, S["cta"] + 4.6,
          S["end"] + 1.4, S["end"] + 2.2): add(["-f", "lavfi", "-i", POP], c, .5, lav=True)
for c in (S["draw"] + 4.2, S["end"] + 2.2): add(["-f", "lavfi", "-i", SHINE], c, .5, lav=True)
for n in ("clubs", "draw", "caps", "cta", "end"): add(["-f", "lavfi", "-t", "0.5", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=7"], S[n] - .42, .7,
    "bandpass=f=1800:w=2600,volume='pow(min(t/0.42,1),2.2)':eval=frame,afade=t=out:st=0.4:d=0.1,", lav=True)
k += 1; ins += ["-stream_loop", "-1", "-i", Z + "/03_Episode_03/sfx/crowd_bed.wav"]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{END:.2f},volume=0.17,afade=t=in:d=0.4,afade=t=out:st={END-1.2:.2f}:d=1.2[cr]"); mix.append("[cr]")
k += 1; ins += ["-i", Z + "/06_Episode_06/sfx/music.mp3"]
fc.append(f"[{k}:a]aresample=48000,aloop=loop=-1:size=2e9,atrim=0:{END:.2f},volume=0.22,afade=t=in:d=0.5,afade=t=out:st={END-1.4:.2f}:d=1.4[mu]"); mix.append("[mu]")
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{END:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
os.makedirs(EXP, exist_ok=True); out = EXP + "/ZFK_CUP_V2_klublar.mp4"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", f"{END:.3f}", "-movflags", "+faststart", out], check=True)
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"
cues = [(s["a"], s["b"] + .2, " ".join(w["w"] for w in s["words"])) for x in W for s in x["sents"]]
with open(EXP + "/ZFK_CUP_V2_klublar.srt", "w", encoding="utf-8") as f:
    for n, (a, c, t) in enumerate(cues, 1): f.write(f"{n}\n{ts(a)} --> {ts(min(c, cues[n][0] - .02) if n < len(cues) else c)}\n{t}\n\n")
open(EXP + "/caption.txt", "w", encoding="utf-8").write("""4 TA KLUB TANLANDI! 🏆

Nomlarni siz yozdingiz, eng ko‘p layk olganlari klub bo‘ldi:
🔵 PRIME AVANGARD — asoschi @rasuluvich_09
🔵 PRIME FC — asoschi @umaraliev.lll
🔵 WAKANDA TEAM — asoschi @3wx.hamrokulov
🔵 QAYRAT FC — asoschi @avazov_gk_07

Qur‘a:
⚔️ Yarim final 1 — WAKANDA TEAM vs PRIME FC
⚔️ Yarim final 2 — QAYRAT FC vs PRIME AVANGARD

Asoschilar — kapitan. 11 o‘yinchini ularning o‘zi tanlaydi.

Jamoaga kirish uchun izohga pozitsiyangizni yozing 👇
GK — darvozabon
CB — himoya
CM — markaz
ST — hujum

⏳ 24 soat · obuna shart.
Keyingi videoda kapitanlar sizni tanlaydi!

(Klublar, kubok va muxlislar — virtual o‘yin mexanikasi.)
#zaminfk #zamin #muxlislarkubogi #football #futbol #uzbekistan #reels
""")
print("OK", out)
