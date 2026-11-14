"""Assemble the 15 s Reel -> exports/ZFK_REEL_trial15.mp4 (+ .srt).
Inputs (all produced by the other scripts in this folder):
  build/s1.mp4 s2.mp4 s3.mp4 s3_old.mp4   3D shots (render3d.js)        build/ov/%04d.png  overlays (render_overlay.js)
  build/words.json + voice/NN_fit.wav       narration (prep_voice.py)
Usage: python3 assemble.py            full assemble
       python3 assemble.py --audio    only rebuild audio onto build/base.mp4's last video (no re-encode of video)"""
import json, os, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__)); B = H + "/build"; Z = os.path.dirname(H); EXP = H + "/exports"
os.makedirs(EXP, exist_ok=True)
def run(*a):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *a], check=True)

silent = B + "/reel_silent.mp4"
if "--audio" not in sys.argv:
    # shot 3: the old stadium turns into the current one with a bottom-to-top wipe (same camera path in both renders)
    line = "H*(1.12-(T-1.25)/1.1*1.3)"
    wipe = f"A*(1-clip((Y-{line})/36+.5,0,1))+B*clip((Y-{line})/36+.5,0,1)+120*exp(-pow((Y-{line})/12,2))"
    run("-i", B + "/s3_old.mp4", "-i", B + "/s3.mp4", "-filter_complex", f"[0][1]blend=all_expr='{wipe}',format=yuv420p[v]", "-map", "[v]", "-r", "30", B + "/s3_wipe.mp4")
    run("-i", B + "/s1.mp4", "-i", B + "/s2.mp4", "-i", B + "/s3_wipe.mp4", "-f", "lavfi", "-i", "color=c=0x050c20:s=1080x1920:r=30:d=6",
        "-framerate", "30", "-i", B + "/ov/%04d.png",
        "-filter_complex", "[0][1][2][3]concat=n=4:v=1:a=0,format=yuv420p[b];[b][4]overlay=0:0:format=auto,format=yuv420p[v]", "-map", "[v]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-r", "30", "-t", "15", "-pix_fmt", "yuv420p", silent)

# ---------------- audio: narration + sound design ----------------
W = json.load(open(B + "/words.json"))
ins, fc, mix, k = ["-i", silent], [], [], 0
def add(src, at, vol=1.0, pre="", lav=False):
    global k
    k += 1; ins.extend(src if lav else ["-i", src]); ms = int(at * 1000)
    fc.append(f"[{k}:a]aresample=48000,{pre}volume={vol},adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]")
for L in W:
    add(f"{H}/voice/{L['line']:02d}_fit.wav", L["start"], 1.0, "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,")
BOOM = "aevalsrc='0.9*sin(2*PI*(46+70*exp(-t*16))*t)*exp(-t*3.4)+0.25*sin(2*PI*110*t)*exp(-t*9)':d=1.5:s=48000"
HIT = "aevalsrc='0.7*sin(2*PI*(70+90*exp(-t*30))*t)*exp(-t*9)':d=0.6:s=48000"
for c in (0.0, 3.0, 6.0, 9.0, 12.0):                        # impact on every cut
    add(["-f", "lavfi", "-i", BOOM], c, 1.0 if c in (0, 12) else .75, lav=True)
for c in (3.0, 6.0, 9.0, 12.0):                              # whoosh into every cut
    add(["-f", "lavfi", "-t", "0.55", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=7"], c - .5, 1.0,
        "bandpass=f=1800:w=2600,volume='pow(min(t/0.5,1),2.2)':eval=frame,afade=t=out:st=0.45:d=0.1,", lav=True)
add(["-f", "lavfi", "-t", "3", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=3"], 0.0, .8, "lowpass=f=900,highpass=f=120,volume='0.05+0.1*pow(t/3,2)':eval=frame,", lav=True)   # riser under the hook
for c in (12.55, 13.2, 13.85):                               # the three end-card lines land with a hit
    add(["-f", "lavfi", "-i", HIT], c, .8, lav=True)
add(["-f", "lavfi", "-t", "2.6", "-i", "anoisesrc=color=pink:amplitude=0.9:seed=11"], 12.0, .8, "bandpass=f=700:w=1600,volume='0.5*exp(-t*1.6)':eval=frame,", lav=True)   # crowd swell at the CTA
crowd = Z + "/03_Episode_03/sfx/crowd_bed.wav"
k += 1; ins += ["-stream_loop", "-1", "-i", crowd]
fc.append(f"[{k}:a]aresample=48000,atrim=0:15,volume='if(lt(t,9),0.20,if(lt(t,12),0.10,0.17))':eval=frame,afade=t=in:d=0.4,afade=t=out:st=14.2:d=0.8[cr]"); mix.append("[cr]")
music = Z + "/06_Episode_06/sfx/music.mp3"
k += 1; ins += ["-i", music]
fc.append(f"[{k}:a]aresample=48000,atrim=0:15,volume='if(lt(t,9),0.30,if(lt(t,12),0.14,0.36))':eval=frame,afade=t=in:d=0.3,afade=t=out:st=14.3:d=0.7[mu]"); mix.append("[mu]")
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,apad,atrim=0:15,loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
out = EXP + "/ZFK_REEL_trial15.mp4"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", "15", "-movflags", "+faststart", out], check=True)

def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"
with open(EXP + "/ZFK_REEL_trial15.srt", "w", encoding="utf-8") as f:           # one cue per narration line
    for n, L in enumerate(W, 1):
        end = W[n]["start"] - .02 if n < len(W) else 15.0
        f.write(f"{n}\n{ts(L['start'])} --> {ts(min(L['end'] + .3, end))}\n{' '.join(w['w'] for w in L['words'])}\n\n")
print("OK", out)
