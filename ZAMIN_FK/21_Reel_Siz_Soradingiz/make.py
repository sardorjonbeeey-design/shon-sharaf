"""Reel 21 'Siz so'radingiz - biz qurdik'. Needs: prep_voice.py (build/words.json), render3d.js segments (build/3d/<seg>/f_*.jpg),
assets/poyo_*.png -> build/poyo_*.mp4, assets/card_N.png, assets/endcard.png.  python3 make.py -> exports/ZFK_REEL21_siz_soradingiz.mp4 (+ .srt, caption.txt)"""
import json, os, subprocess, textwrap
HERE = os.path.dirname(os.path.abspath(__file__)); Z = os.path.dirname(HERE); B = HERE + "/build"; EXP = HERE + "/exports"; V = HERE + "/voice"; A = HERE + "/assets"
FONT = Z + "/web/city/assets/fonts/Montserrat_900Black.ttf"
W = json.load(open(B + "/words.json")); BS = {x["beat"]: x for x in W}
S = dict(hook=0.0, ff=3.3, gar=11.5, ac=19.7, wide=27.9); END = 36.4; CTA = 31.9
DUR = dict(hook=3.3, ff=8.2, gar=8.2, ac=8.2, wide=END - 27.9); RENDER = dict(hook=3.5, ff=5.4, gar=5.4, ac=5.4, wide=8.7)
def sh(*a): subprocess.run(a, check=True)
for seg in S:                                   # 3D frame sequences -> mp4 (hold last frame / trim to slot)
    out = f"{B}/seg_{seg}.mp4"
    if not os.path.exists(out):
        sh("ffmpeg", "-loglevel", "error", "-y", "-framerate", "30", "-i", f"{B}/3d/{seg}/f_%04d.jpg", "-vf",
           f"scale=1080:1920,tpad=stop_mode=clone:stop_duration={max(0, DUR[seg]-RENDER[seg]):.2f},trim=duration={DUR[seg]:.3f},setpts=PTS-STARTPTS,format=yuv420p", "-r", "30", "-c:v", "libx264", "-crf", "16", out)
ins = []; fc = []; idx = {}
def inp(name, *args): idx[name] = len(ins) // 2; ins.extend(["-i", name] if not args else [*args, "-i", name])
for seg in S: inp(f"{B}/seg_{seg}.mp4")
for n in ("fastfood", "garaj", "akademiya"): inp(f"{B}/poyo_{n}.mp4")
for i in (1, 2, 3): inp(f"{A}/card_{i}.png", "-loop", "1", "-t", f"{END}")
inp(f"{A}/endcard.png", "-loop", "1", "-t", f"{END}")
g = lambda n: f"[{idx[n]}:v]"
fc.append("".join(g(f"{B}/seg_{s}.mp4") for s in S) + f"concat=n=5:v=1:a=0,fps=30[b0]")
cur = "b0"; k = 0
def ov(layer, spec, enable=None, x="0", y="0"):
    global cur, k; k += 1
    fc.append(f"{layer}{spec}[l{k}]"); fc.append(f"[{cur}][l{k}]overlay=x={x}:y={y}:eval=frame" + (f":enable='{enable}'" if enable else "") + f"[b{k}]"); cur = f"b{k}"
PO = [("poyo_fastfood", 8.4), ("poyo_garaj", 16.6), ("poyo_akademiya", 24.8)]
for n, st in PO:                                # Poyo stills: push-in, cross-faded over the 3D hold
    ov(g(f"{B}/{n}.mp4"), f"setpts=PTS-STARTPTS+{st}/TB,format=yuva420p,fade=t=in:st={st}:d=0.4:alpha=1,fade=t=out:st={st+3.1}:d=0.4:alpha=1", f"between(t,{st},{st+3.5})")
HOOK = [(1, .35, 400), (2, .95, 700), (3, 1.55, 1000)]
for i, st, y in HOOK:                           # three requests stack in over the empty plots
    ov(g(f"{A}/card_{i}.png"), f"format=rgba,fade=t=in:st={st}:d=0.2:alpha=1,fade=t=out:st=3.1:d=0.2:alpha=1", f"between(t,{st},3.3)", x="50", y=str(y))
CARD_AT = {1: S["ff"] + .2, 2: S["gar"] + .2, 3: S["ac"] + .2}
for i, st in CARD_AT.items():                   # each request slides in over its build
    ov(g(f"{A}/card_{i}.png"), f"format=rgba,fade=t=in:st={st}:d=0.15:alpha=1,fade=t=out:st={st+7.8}:d=0.2:alpha=1", f"between(t,{st},{st+8.0})", x="50", y=f"if(lt(t,{st}+0.35),-260+(140+260)*(1-pow(1-(t-{st})/0.35,3)),140)")
# captions: one drawtext per sentence (beats 1-5; the end card carries beat 6)
cues = []
for x in W:
    for s in x["sents"]: cues.append((s["a"], s["b"] + .25, " ".join(w["w"] for w in s["words"]), x["beat"]))
for n, (a, b, t, beat) in enumerate(cues):
    if beat == 6: continue
    tf = f"{B}/cap_{n}.txt"; open(tf, "w", encoding="utf-8").write("\n".join(textwrap.wrap(t.replace("Zamin", "ZAMIN"), 22)))
    fc.append(f"[{cur}]drawtext=fontfile={FONT}:textfile={tf}:fontsize=60:fontcolor=white:borderw=8:bordercolor=0x050e3c@0.95:line_spacing=10:x=(w-text_w)/2:y=h-480:enable='between(t,{a:.3f},{b:.3f})'[c{n}]"); cur = f"c{n}"
ov(g(f"{A}/endcard.png"), f"format=rgba,fade=t=in:st={CTA}:d=0.5:alpha=1", f"gte(t,{CTA})")
fc.append(f"[{cur}]format=yuv420p[vout]")
# ---------- audio ----------
ain = []; afc = []; mix = []; ak = len(ins) // 2
def add(src, at, vol=1.0, pre="", lav=False):
    global ak
    ain.extend(src if lav else ["-i", src]); ms = int(at * 1000)
    afc.append(f"[{ak}:a]aresample=48000,{pre}volume={vol},adelay={ms}|{ms}[a{ak}]"); mix.append(f"[a{ak}]"); ak += 1
for x in W: add(f"{V}/{x['beat']:02d}_fit.wav", x["start"], 1.0, "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,")
BOOM = "aevalsrc='0.9*sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*3.4)+0.25*sin(2*PI*110*t)*exp(-t*9)':d=1.5:s=48000"
POP = "aevalsrc='0.6*sin(2*PI*(520+300*exp(-t*40))*t)*exp(-t*14)':d=0.4:s=48000"
for c, v in ((S["ff"] + .5, 1.0), (S["gar"] + .5, 1.0), (S["ac"] + .5, 1.0), (CTA, .8)): add(["-f", "lavfi", "-i", BOOM], c, v, lav=True)
for c in [h[1] for h in HOOK] + list(CARD_AT.values()): add(["-f", "lavfi", "-i", POP], c, .5, lav=True)
for c in (S["ff"], S["gar"], S["ac"], S["wide"], CTA): add(["-f", "lavfi", "-t", "0.5", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=7"], c - .42, .7, "bandpass=f=1800:w=2600,volume='pow(min(t/0.42,1),2.2)':eval=frame,afade=t=out:st=0.4:d=0.1,", lav=True)
ain += ["-stream_loop", "-1", "-i", Z + "/03_Episode_03/sfx/crowd_bed.wav"]
afc.append(f"[{ak}:a]aresample=48000,atrim=0:{END:.2f},volume=0.14,afade=t=in:d=0.4,afade=t=out:st={END-1.2:.2f}:d=1.2[cr]"); mix.append("[cr]"); ak += 1
ain += ["-i", Z + "/06_Episode_06/sfx/music.mp3"]
afc.append(f"[{ak}:a]aresample=48000,atrim=0:{END:.2f},volume=0.22,afade=t=in:d=0.5,afade=t=out:st={END-1.4:.2f}:d=1.4[mu]"); mix.append("[mu]"); ak += 1
afc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:{END:.3f},loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
out = EXP + "/ZFK_REEL21_siz_soradingiz.mp4"
sh("ffmpeg", "-loglevel", "error", "-y", *ins, *ain, "-filter_complex", ";".join(fc + afc), "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", f"{END:.3f}", "-movflags", "+faststart", out)
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"
with open(EXP + "/ZFK_REEL21_siz_soradingiz.srt", "w", encoding="utf-8") as f:
    for n, (a, c, t, _) in enumerate(cues, 1): f.write(f"{n}\n{ts(a)} --> {ts(min(c, cues[n][0] - .02) if n < len(cues) else c)}\n{t.replace('Zamin', 'ZAMIN')}\n\n")
open(EXP + "/caption.txt", "w", encoding="utf-8").write("""Siz so‘radingiz — biz qurdik! 🏗️

🍔 Fast food — @_nomonjonov_asadbek
🅿️ Garaj — @_xaytboy
⚽ Yoshlar Akademiyasi — @alijonov.cls

Keyingi qurilish nima bo‘lsin? Izohga yozing — eng ko‘p layk olgan g‘oya qurilishda!

#zaminfk #zamin #football #futbol #uzbekistan #stadion #reels
""")
print("OK", out)
