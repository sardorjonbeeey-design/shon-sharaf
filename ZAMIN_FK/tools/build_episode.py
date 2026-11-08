"""ZAMIN FK episode builder: stills + narration + overlays -> 1080x1920 30fps MP4.

Usage: python3 build_episode.py <episode.json>
The JSON lists narration lines (file or placeholder duration), shots (image, motion, start/end
relative to a line), and overlays (HTML snippets shown between two times). Overlays are
rendered to transparent PNGs with Playwright (render_overlays.js); everything else is ffmpeg.
"""
import json, os, subprocess, sys, shutil

W, H, FPS = 1080, 1920, 30
cfg_path = os.path.abspath(sys.argv[1])
cfg = json.load(open(cfg_path))
base = os.path.dirname(cfg_path)
tools = os.path.dirname(os.path.abspath(__file__))
work = os.path.join(base, "build")
shutil.rmtree(work, ignore_errors=True)
os.makedirs(work)

def run(cmd):
    subprocess.run(cmd, check=True)

def dur(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", path]).strip())

# 1. narration timeline -------------------------------------------------------------
t = cfg.get("lead_in", 0.3)
gap = cfg.get("gap", 0.3)
lines = {}
audio_inputs = []
for ln in cfg["lines"]:
    if ln.get("file") and os.path.exists(os.path.join(base, ln["file"])):
        d = dur(os.path.join(base, ln["file"]))
        audio_inputs.append((os.path.join(base, ln["file"]), t))
        real = True
    else:
        d = ln["placeholder"]
        real = False
    lines[ln["id"]] = {"start": t, "end": t + d, "dur": d, "real": real}
    t += d + gap
total = t - gap + cfg.get("tail", 1.8)

def at(ref):
    """ref like 'L2+3.07' or 'L2.end-0.5' or a number -> absolute seconds."""
    if isinstance(ref, (int, float)):
        return float(ref)
    if ref == "end":
        return total
    import re
    m = re.fullmatch(r"(L\d+)(\.end)?([+-][\d.]+)?", ref)
    ln = lines[m.group(1)]
    v = ln["end"] if m.group(2) else ln["start"]
    if m.group(3):
        off = float(m.group(3))
        if not ln["real"] and "relative" not in ref:
            pass
        v += off
    return v

# placeholder lines: offsets inside them are scaled as fractions of the placeholder length
def at_scaled(ref):
    return at(ref)

# 2. overlays -> PNG ----------------------------------------------------------------
ov_specs = []
for i, ov in enumerate(cfg["overlays"]):
    a, b = at(ov["from"]), at(ov["to"])
    ov_specs.append({"png": os.path.join(work, f"ov{i:03d}.png"), "html": ov["html"], "a": a, "b": b,
                     "fade": ov.get("fade", 0.15)})
json.dump([{"png": o["png"], "html": o["html"]} for o in ov_specs], open(os.path.join(work, "ov.json"), "w"))
run(["node", os.path.join(tools, "render_overlays.js"), os.path.join(tools, "overlays.html"),
     os.path.join(work, "ov.json"), base])

# 3. shots -> one video track ---------------------------------------------------------
segs = []
shots = cfg["shots"]
for i, sh in enumerate(shots):
    a = at(sh["from"])
    b = at(shots[i + 1]["from"]) if i + 1 < len(shots) else total
    d = b - a
    img = os.path.join(base, sh["image"])
    z0, z1 = sh.get("zoom", [1.0, 1.08])
    # focus point in source fraction (0..1), start -> end
    fx0, fy0, fx1, fy1 = sh.get("focus", [0.5, 0.5, 0.5, 0.5])
    blur = sh.get("blur", 0)
    S = 2  # oversample so slow moves stay smooth (zoompan positions are whole pixels)
    sw, sh_ = int(W * S), int(H * S)
    n = max(2, round(d * FPS))
    p = f"(on/{n - 1})"
    z = f"({z0}+({z1}-{z0})*{p})"
    cx = f"(({fx0}+({fx1}-{fx0})*{p})*iw)"
    cy = f"(({fy0}+({fy1}-{fy0})*{p})*ih)"
    x = f"max(0,min(iw-iw/zoom,{cx}-iw/zoom/2))"
    y = f"max(0,min(ih-ih/zoom,{cy}-ih/zoom/2))"
    vf = (f"scale={sw}:{sh_}:force_original_aspect_ratio=increase,crop={sw}:{sh_},"
          f"zoompan=z='{z}':x='{x}':y='{y}':d={n}:s={W}x{H}:fps={FPS}")
    if blur:
        vf += f",gblur=sigma={blur},eq=brightness=-0.06"
    vf += ",setsar=1,format=yuv420p"
    out = os.path.join(work, f"seg{i:02d}.mp4")
    run(["ffmpeg", "-loglevel", "error", "-y", "-i", img, "-vf", vf, "-frames:v", str(n),
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", out])
    segs.append(out)
with open(os.path.join(work, "concat.txt"), "w") as f:
    f.writelines(f"file '{s}'\n" for s in segs)
run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", os.path.join(work, "concat.txt"),
     "-c", "copy", os.path.join(work, "pictures.mp4")])

# 4. overlays on top ------------------------------------------------------------------
inputs = ["-i", os.path.join(work, "pictures.mp4")]
fc, last = [], "0:v"
for k, o in enumerate(ov_specs, start=1):
    inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{total:.3f}", "-i", o["png"]]
    fd = o["fade"]
    fc.append(f"[{k}:v]format=rgba,fade=t=in:st={o['a']:.3f}:d={fd}:alpha=1,"
              f"fade=t=out:st={max(o['a'], o['b'] - fd):.3f}:d={fd}:alpha=1[o{k}]")
    fc.append(f"[{last}][o{k}]overlay=0:0:enable='between(t,{o['a']:.3f},{o['b']:.3f})'[v{k}]")
    last = f"v{k}"

# 5. audio: narration at its offsets + optional beds/sfx --------------------------------
a_idx = len(ov_specs) + 1
amix = []
for path, off in audio_inputs:
    inputs += ["-i", path]
    ms = int(off * 1000)
    fc.append(f"[{a_idx}:a]aresample=48000,adelay={ms}|{ms},volume=1.0[a{a_idx}]")
    amix.append(f"[a{a_idx}]")
    a_idx += 1
for s in cfg.get("sfx", []):
    pth = os.path.join(base, s["file"])
    if not os.path.exists(pth):
        continue
    inputs += ["-i", pth]
    ms = int(at(s["at"]) * 1000)
    fc.append(f"[{a_idx}:a]aresample=48000,adelay={ms}|{ms},volume={s.get('volume', 0.5)}[a{a_idx}]")
    amix.append(f"[a{a_idx}]")
    a_idx += 1
if amix:
    fc.append(f"{''.join(amix)}amix=inputs={len(amix)}:normalize=0,apad,atrim=0:{total:.3f},"
              f"loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
else:
    fc.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{total:.3f}[aout]")

out = os.path.join(base, "exports", cfg["output"])
os.makedirs(os.path.dirname(out), exist_ok=True)
run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc),
     "-map", f"[{last}]", "-map", "[aout]", "-t", f"{total:.3f}", "-r", str(FPS),
     "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high",
     "-ac", "2", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out])

# 6. SRT captions from overlays marked as subtitles --------------------------------------
def ts(s):
    h, r = divmod(s, 3600); m, r = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(r):02d},{int(round((r - int(r)) * 1000)):03d}"
srt = [o for o, ov in zip(ov_specs, cfg["overlays"]) if ov.get("srt")]
with open(os.path.join(base, "exports", cfg["output"].replace(".mp4", ".srt")), "w") as f:
    for n, (o, ov) in enumerate(((o, ov) for o, ov in zip(ov_specs, cfg["overlays"]) if ov.get("srt")), 1):
        f.write(f"{n}\n{ts(o['a'])} --> {ts(o['b'])}\n{ov['srt']}\n\n")
json.dump({k: v for k, v in lines.items()}, open(os.path.join(work, "timeline.json"), "w"), indent=1)
print(f"OK {out}  {total:.2f}s  lines: " + ", ".join(f"{k}{'' if v['real'] else '(placeholder)'}" for k, v in lines.items()))
