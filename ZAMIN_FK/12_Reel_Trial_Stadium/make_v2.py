"""Mix narration + SFX + crowd bed + music onto build/silent_v2.mp4 -> exports/ZFK_TRIAL_stadium_v2.mp4, write .srt.
Render the picture first: node render_v2.js video build/silent_v2.mp4   (after python3 prep_voice_v2.py)"""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); Z = os.path.dirname(HERE)
BUILD = HERE + "/build"; EXP = HERE + "/exports"; V = HERE + "/voice_v2"
W = json.load(open(BUILD + "/words_v2.json")); TOTAL = W[-1]["end"] + 1.0
BS = {b["beat"]: b for b in W}
b = lambda n: BS[n]["start"]
ins, fc, mix, k = ["-i", BUILD + "/silent_v2.mp4"], [], [], 0

def add(src, at, vol=1.0, pre="", lav=False):
    global k
    k += 1; ins.extend(src if lav else ["-i", src]); ms = int(at * 1000)
    fc.append(f"[{k}:a]aresample=48000,{pre}volume={vol},adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")

for x in W:
    add(f"{V}/{x['beat']:02d}_fit.wav", x["start"], 1.0, "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,")

BOOM = "aevalsrc='0.9*sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*3.4)+0.25*sin(2*PI*110*t)*exp(-t*9)':d=1.5:s=48000"
POP = "aevalsrc='0.6*sin(2*PI*(520+300*exp(-t*40))*t)*exp(-t*14)':d=0.4:s=48000"

for c, v in ((0.0, 1.0), (b(4), .8), (b(7), .8), (b(9), .9), (b(12), 1.0)):
    add(["-f", "lavfi", "-i", BOOM], c, v, lav=True)

for c in (b(5) + .5, b(9) + .5, b(12) + .2):
    add(["-f", "lavfi", "-i", POP], c, .5, lav=True)

for n in range(2, 13):
    add(["-f", "lavfi", "-t", "0.5", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=7"], b(n) - .42, .6,
        "bandpass=f=1800:w=2600,volume='pow(min(t/0.42,1),2.2)':eval=frame,afade=t=out:st=0.4:d=0.1,", lav=True)

# crowd bed
crowd_path = HERE + "/assets/crowd_bed.wav"
if not os.path.isfile(crowd_path):
    crowd_path = Z + "/03_Episode_03/sfx/crowd_bed.wav"
k += 1; ins += ["-stream_loop", "-1", "-i", crowd_path]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{TOTAL:.2f},volume=0.14,afade=t=in:d=0.4,afade=t=out:st={TOTAL-1.2:.2f}:d=1.2[cr]"); mix.append("[cr]")

# music
music_path = HERE + "/assets/music.mp3"
if not os.path.isfile(music_path):
    music_path = Z + "/06_Episode_06/sfx/music.mp3"
k += 1; ins += ["-i", music_path]
fc.append(f"[{k}:a]aresample=48000,atrim=0:{TOTAL:.2f},volume=0.2,afade=t=in:d=0.5,afade=t=out:st={TOTAL-1.4:.2f}:d=1.4[mu]"); mix.append("[mu]")

fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{TOTAL:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
out = EXP + "/ZFK_TRIAL_stadium_v2.mp4"
os.makedirs(EXP, exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc),
    "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-ar", "48000", "-ac", "2", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", out], check=True)

def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"

cues = [(s["a"], s["b"] + .2, " ".join(w["w"] for w in s["words"]).replace("Zamin", "ZAMIN"))
        for x in W for s in x["sents"]]
with open(EXP + "/ZFK_TRIAL_stadium_v2.srt", "w", encoding="utf-8") as f:
    for n, (a, c, t) in enumerate(cues, 1):
        f.write(f"{n}\n{ts(a)} --> {ts(min(c, cues[n][0] - .02) if n < len(cues) else c)}\n{t}\n\n")
print("OK", out, round(TOTAL, 2))
