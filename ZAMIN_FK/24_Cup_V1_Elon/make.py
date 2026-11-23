"""Mix narration + synthesized hits/whooshes + crowd bed + music onto build/silent.mp4 -> exports/ZFK_CUP_V1_elon.mp4, write .srt + caption.txt.
Order: python3 prep_voice.py ; node render3d.js s1 8 ; node render3d.js s2 6.6 ; node top.js 30 ; node shot_pitch.js seq 3.3 ; node render.js video build/silent.mp4 ; python3 make.py"""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); Z = os.path.dirname(HERE); B = HERE + "/build"; EXP = HERE + "/exports"; V = HERE + "/voice"
W = json.load(open(B + "/words.json")); END = 28.6
S = dict(s1=0, s2=8.4, dive=15.2, br=17.3, cta=20.6)
ins, fc, mix, k = ["-i", B + "/silent.mp4"], [], [], 0
def add(src, at, vol=1.0, pre="", lav=False):
    global k
    k += 1; ins.extend(src if lav else ["-i", src]); ms = int(at * 1000)
    fc.append(f"[{k}:a]aresample=48000,{pre}volume={vol},adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
for x in W: add(f"{V}/{x['beat']:02d}_fit.wav", x["start"], 1.0, "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,")
BOOM = "aevalsrc='0.9*sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*3.4)+0.25*sin(2*PI*110*t)*exp(-t*9)':d=1.5:s=48000"
POP = "aevalsrc='0.6*sin(2*PI*(520+300*exp(-t*40))*t)*exp(-t*14)':d=0.4:s=48000"
SHINE = "aevalsrc='0.4*sin(2*PI*(1800+900*exp(-t*9))*t)*exp(-t*5)':d=0.9:s=48000"
for c, v in ((0.0, .95), (S["s2"], .9), (S["dive"], 1.0), (S["br"] + 2.4, .9), (S["cta"], .9)): add(["-f", "lavfi", "-i", BOOM], c, v, lav=True)
for c in (0.9, 1.35, 1.8, 2.25,                                                   # four crest slots lighting up on the LED
          S["s2"] + 2.6, S["br"] + .35, S["br"] + .75, S["br"] + 1.1, S["br"] + 1.45, S["br"] + 1.8,
          S["cta"] + .5, S["cta"] + 2.1, S["cta"] + 2.6, S["cta"] + 4.3): add(["-f", "lavfi", "-i", POP], c, .5, lav=True)
for c in (S["s2"] + 2.6, S["br"] + 2.45): add(["-f", "lavfi", "-i", SHINE], c, .5, lav=True)   # founder card, trophy
for n in ("s2", "dive", "br", "cta"): add(["-f", "lavfi", "-t", "0.5", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=7"], S[n] - .42, .7,
    "bandpass=f=1800:w=2600,volume='pow(min(t/0.42,1),2.2)':eval=frame,afade=t=out:st=0.4:d=0.1,", lav=True)
k += 1; ins += ["-stream_loop", "-1", "-i", Z + "/03_Episode_03/sfx/crowd_bed.wav"]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{END:.2f},volume=0.17,afade=t=in:d=0.4,afade=t=out:st={END-1.2:.2f}:d=1.2[cr]"); mix.append("[cr]")
k += 1; ins += ["-i", Z + "/06_Episode_06/sfx/music.mp3"]
fc.append(f"[{k}:a]aresample=48000,aloop=loop=-1:size=2e9,atrim=0:{END:.2f},volume=0.22,afade=t=in:d=0.5,afade=t=out:st={END-1.4:.2f}:d=1.4[mu]"); mix.append("[mu]")
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{END:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
os.makedirs(EXP, exist_ok=True); out = EXP + "/ZFK_CUP_V1_elon.mp4"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", f"{END:.3f}", "-movflags", "+faststart", out], check=True)
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"
cues = [(s["a"], s["b"] + .2, " ".join(w["w"] for w in s["words"]).replace("Zamin", "ZAMIN")) for x in W for s in x["sents"]]
with open(EXP + "/ZFK_CUP_V1_elon.srt", "w", encoding="utf-8") as f:
    for n, (a, c, t) in enumerate(cues, 1): f.write(f"{n}\n{ts(a)} --> {ts(min(c, cues[n][0] - .02) if n < len(cues) else c)}\n{t}\n\n")
open(EXP + "/caption.txt", "w", encoding="utf-8").write("""MUXLISLAR KUBOGI boshlanadi! 🏆

Zamin FK muxlislari 4 ta klubga bo‘linadi: 4 klub · 3 o‘yin · 1 g‘olib.

Klub nomini SIZ yozasiz 👇
Eng ko‘p layk olgan 4 ta nom — 4 ta klub bo‘ladi. Nomni yozgan odam esa o‘sha klubning asoschisi!

⏳ 24 soat.
📝 Nom qoidasi: bir-ikki so‘z, haqoratsiz, real klub yoki real odam nomi emas. Qoidaga mos kelmasa — keyingi nom o‘tadi.

G‘olib klubning nomi stadionda abadiy qoladi.

(Klublar, kubok va muxlislar — virtual o‘yin mexanikasi.)
#zaminfk #zamin #muxlislarkubogi #football #futbol #uzbekistan #reels
""")
print("OK", out)
