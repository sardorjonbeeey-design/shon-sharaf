"""Mix narration + hits + crowd + music onto build/silent.mp4 -> exports/ZFK_EP27_sf1.mp4, write .srt + caption.txt.
Order: node render_seq.js ; python3 prep_voice.py 1.0 ; node render.js video build/silent.mp4 ; python3 make.py"""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); Z = os.path.dirname(HERE)
B, EXP, V = HERE + "/build", HERE + "/exports", HERE + "/voice"
W = json.load(open(B + "/words.json")); END = 44.0
CUT = [0.0, 3.30, 7.40, 9.90, 12.30, 14.30, 16.70, 18.60, 22.60, 24.40, 28.60, 33.30, 41.60]   # shot boundaries
KICK = [12.30, 14.30, 16.70, 20.05]     # the four goals land here (white flash in the cut)
SAVE = 20.05                            # the winning goal
ROAR = 22.60                            # the winners run in
CT   = [33.45, 36.10, 38.40]            # CTA rows
ins, fc, mix, k = ["-i", B + "/silent.mp4"], [], [], 0
def add(src, at, vol=1.0, pre="", lav=False):
    global k
    k += 1; ins.extend(src if lav else ["-i", src]); ms = int(max(0, at) * 1000)
    fc.append(f"[{k}:a]aresample=48000,{pre}volume={vol},adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
for x in W: add(f"{V}/{x['beat']:02d}_fit.wav", x["start"], 1.0,
                "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,")
BOOM  = "aevalsrc='0.9*sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*3.4)+0.25*sin(2*PI*110*t)*exp(-t*9)':d=1.5:s=48000"
THUD  = "aevalsrc='0.8*sin(2*PI*(120+180*exp(-t*30))*t)*exp(-t*12)':d=0.5:s=48000"      # boot on ball
SHINE = "aevalsrc='0.4*sin(2*PI*(1800+900*exp(-t*9))*t)*exp(-t*5)':d=0.9:s=48000"
for c in CUT:  add(["-f", "lavfi", "-i", BOOM], c, .9, lav=True)
for c in KICK: add(["-f", "lavfi", "-i", THUD], c, .85, lav=True)
add(["-f", "lavfi", "-i", SHINE], SAVE, .6, lav=True)
for c in CT + [ROAR]: add(["-f", "lavfi", "-i", SHINE], c, .45, lav=True)
for c in CUT[1:]:                                   # riser into every cut
    add(["-f", "lavfi", "-t", "0.5", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=7"], c - .42, .6,
        "bandpass=f=1800:w=2600,volume='pow(min(t/0.42,1),2.2)':eval=frame,afade=t=out:st=0.4:d=0.1,", lav=True)
k += 1; ins += ["-stream_loop", "-1", "-i", Z + "/03_Episode_03/sfx/crowd_bed.wav"]   # crowd, louder on the goals
fc.append(f"[{k}:a]aresample=48000,atrim=0:{END:.2f},volume='0.16+0.26*between(t,{ROAR-0.3:.2f},{ROAR+4.0:.2f})"
          f"+0.14*between(t,9.90,22.60)':eval=frame,afade=t=in:d=0.4,afade=t=out:st={END-1.2:.2f}:d=1.2[cr]")
mix.append("[cr]")
k += 1; ins += ["-i", Z + "/06_Episode_06/sfx/music.mp3"]
fc.append(f"[{k}:a]aresample=48000,aloop=loop=-1:size=2e9,atrim=0:{END:.2f},volume=0.19,afade=t=in:d=0.5,"
          f"afade=t=out:st={END-1.6:.2f}:d=1.6[mu]"); mix.append("[mu]")
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{END:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
os.makedirs(EXP, exist_ok=True); out = EXP + "/ZFK_EP27_sf1.mp4"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", f"{END:.3f}",
                "-movflags", "+faststart", out], check=True)
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s-int(s))*1000))%1000:03d}"
cues = [(s["a"], s["b"] + .2, " ".join(w["w"] for w in s["words"])) for x in W for s in x["sents"]]
with open(EXP + "/ZFK_EP27_sf1.srt", "w", encoding="utf-8") as f:
    for n, (a, c, t) in enumerate(cues, 1):
        f.write(f"{n}\n{ts(a)} --> {ts(min(c, cues[n][0]-.02) if n < len(cues) else c)}\n{t}\n\n")
open(EXP + "/caption.txt", "w", encoding="utf-8").write("""1-YARIM FINAL: WAKANDA TEAM 3–2 PRIME FC 🏆

Gollarni sizning o‘yinchilaringiz urdi:
⚽ 12’ @golibjon.2ta — PRIME FC
⚽ 29’ @uzb13900 — WAKANDA TEAM
⚽ 41’ @zuhriddinyuldashev13 — PRIME FC
⚽ 67’ @gulomov046 — WAKANDA TEAM
⚽ 89’ @a.farhodjon — WAKANDA TEAM (g‘alaba goli)

🟢 WAKANDA TEAM — FINALDA (asoschi/kapitan @3wx.hamrokulov)

Ertaga 2-YARIM FINAL: QAYRAT FC — PRIME AVANGARD
👇 Izohga klub nomini yozing: QAYRAT yoki AVANGARD
TO‘G‘RI TOPGAN 3 KISHI final tarkibiga kiradi.
Bir odam — bitta izoh. ⏳ 24 soat · obuna shart.

(Klublar, kubok va muxlislar — virtual o‘yin mexanikasi.)
#zaminfk #muxlislarkubogi #football #futbol #uzbekistan #reels
""")
print("OK", out)
