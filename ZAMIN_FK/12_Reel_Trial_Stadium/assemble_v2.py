"""Assemble Trial Reel v2 from stadium screenshots + Poyo images + voice + SFX + music.
Each beat gets one image with Ken Burns zoom/pan, crossfade transitions."""
import json, os, subprocess, math

HERE = os.path.dirname(os.path.abspath(__file__))
Z = os.path.dirname(HERE)
BUILD = HERE + "/build"
SHOTS = BUILD + "/stadium_shots"
V = HERE + "/voice_v2"
EXP = HERE + "/exports"
os.makedirs(EXP, exist_ok=True)

W = json.load(open(BUILD + "/words_v2.json"))
BS = {b["beat"]: b for b in W}
b = lambda n: BS[n]["start"]
TOTAL = W[-1]["end"] + 1.0
FPS = 30

# Beat -> image mapping (alternating real 3D stadium + Poyo cinematic)
BEAT_IMG = {
    1:  "poyo_aerial_night.png",      # INTRO - dramatic aerial
    2:  "09_top_down.jpg",             # SCALE - real top-down
    3:  "02_stadium_34.jpg",           # FANS FILL - real 3/4 view
    4:  "poyo_inside_stands.png",      # RULE - inside stands
    5:  "10_close_stands.jpg",         # YOUR NAME - real close stands
    6:  "poyo_pitch_level.png",        # PROGRESS - pitch level
    7:  "07_high_side.jpg",            # STATUS - real high side
    8:  "poyo_behind_goal.png",        # URGENCY - behind goal
    9:  "poyo_tunnel.png",             # FOUNDERS - tunnel
    10: "01_aerial_wide.jpg",          # SCALE COMPARE - real aerial
    11: "06_corner.jpg",               # SHARE - real corner
    12: "poyo_aerial_night.png",       # CTA - dramatic aerial (reuse)
}

# Ken Burns: each beat gets zoom direction (in/out) and pan direction
KB = {
    1:  {"z0": 1.0, "z1": 1.15, "px": 0, "py": -0.03},     # slow zoom in
    2:  {"z0": 1.1, "z1": 1.0, "px": 0, "py": 0},            # zoom out
    3:  {"z0": 1.0, "z1": 1.12, "px": 0.04, "py": 0},        # zoom in + pan right
    4:  {"z0": 1.05, "z1": 1.15, "px": -0.03, "py": 0.02},   # slow zoom + drift
    5:  {"z0": 1.1, "z1": 1.0, "px": 0.02, "py": -0.01},     # zoom out
    6:  {"z0": 1.0, "z1": 1.1, "px": 0, "py": 0.03},         # zoom in + tilt
    7:  {"z0": 1.08, "z1": 1.0, "px": -0.04, "py": 0},       # zoom out + pan left
    8:  {"z0": 1.0, "z1": 1.12, "px": 0.02, "py": -0.02},    # zoom in
    9:  {"z0": 1.0, "z1": 1.18, "px": 0, "py": 0.04},        # zoom into tunnel
    10: {"z0": 1.12, "z1": 1.0, "px": 0, "py": 0},           # zoom out wide
    11: {"z0": 1.0, "z1": 1.08, "px": -0.03, "py": 0.01},    # slight zoom
    12: {"z0": 1.0, "z1": 1.2, "px": 0, "py": -0.05},        # dramatic zoom in
}

# Beat timing: start -> next beat start (or TOTAL)
beat_times = []
for i in range(1, 13):
    start = max(0, b(i) - 0.25)  # lead in slightly
    end = b(i + 1) - 0.25 if i < 12 else TOTAL
    beat_times.append((i, start, end))

# Generate frames
FRAMES_DIR = BUILD + "/frames_v3"
os.makedirs(FRAMES_DIR, exist_ok=True)

from PIL import Image
total_frames = int(TOTAL * FPS)

# Pre-load and resize all images to 1080x1920
imgs = {}
for beat_n, img_name in BEAT_IMG.items():
    path = os.path.join(SHOTS, img_name)
    img = Image.open(path).convert("RGB")
    # Scale to cover 1080x1920 (may need crop)
    tw, th = 1080, 1920
    # Scale so image covers the target with some extra for Ken Burns
    scale = max(tw * 1.25 / img.width, th * 1.25 / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    imgs[beat_n] = img

print(f"Generating {total_frames} frames...")

for f in range(total_frames):
    t = f / FPS
    # Find which beat
    beat_n = 12
    for bn, bs, be in beat_times:
        if t < be:
            beat_n = bn
            break

    bs, be = [(s, e) for n, s, e in beat_times if n == beat_n][0]
    u = max(0, min(1, (t - bs) / (be - bs)))  # 0..1 within beat

    img = imgs[beat_n]
    kb = KB[beat_n]

    # Interpolate zoom and pan
    zoom = kb["z0"] + (kb["z1"] - kb["z0"]) * u
    px = kb["px"] * u
    py = kb["py"] * u

    # Crop region from scaled image
    tw, th = 1080, 1920
    cw = int(tw / zoom)
    ch = int(th / zoom)
    cx = int((img.width - cw) / 2 + px * img.width)
    cy = int((img.height - ch) / 2 + py * img.height)
    cx = max(0, min(img.width - cw, cx))
    cy = max(0, min(img.height - ch, cy))

    crop = img.crop((cx, cy, cx + cw, cy + ch)).resize((tw, th), Image.LANCZOS)
    crop.save(f"{FRAMES_DIR}/f_{f:05d}.jpg", quality=93)

    if f % 100 == 0:
        print(f"frame {f}/{total_frames}")

print("Frames done, encoding video...")

# Encode to silent video
silent = BUILD + "/silent_v2.mp4"
subprocess.run([
    "ffmpeg", "-loglevel", "error", "-y",
    "-framerate", str(FPS), "-i", f"{FRAMES_DIR}/f_%05d.jpg",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-pix_fmt", "yuv420p", silent
], check=True)

print("Silent video done:", silent)
print("Now run: python3 make_v2.py")
