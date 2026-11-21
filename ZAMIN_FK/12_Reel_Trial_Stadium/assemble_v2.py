"""Assemble Trial Reel v2 — real stadium shots only + word-by-word captions.
Ken Burns zoom/pan on each beat, synced text overlay from voice timestamps."""
import json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = HERE + "/build"
SHOTS = BUILD + "/stadium_shots"
EXP = HERE + "/exports"
os.makedirs(EXP, exist_ok=True)

FONT_DIR = os.path.join(os.path.dirname(HERE), "web/city/assets/fonts")
FONT_BOLD = os.path.join(FONT_DIR, "Montserrat_800ExtraBold.ttf")
FONT_SEMI = os.path.join(FONT_DIR, "Montserrat_600SemiBold.ttf")

W = json.load(open(BUILD + "/words_v2.json"))
BS = {b["beat"]: b for b in W}
b_start = lambda n: BS[n]["start"]
TOTAL = W[-1]["end"] + 1.0
FPS = 30

# All real stadium shots — no Poyo
BEAT_IMG = {
    1:  "01_aerial_wide.jpg",
    2:  "09_top_down.jpg",
    3:  "02_stadium_34.jpg",
    4:  "03_inside_low.jpg",
    5:  "10_close_stands.jpg",
    6:  "04_pitch_level.jpg",
    7:  "07_high_side.jpg",
    8:  "05_behind_goal.jpg",
    9:  "08_tunnel.jpg",
    10: "06_corner.jpg",
    11: "02_stadium_34.jpg",
    12: "01_aerial_wide.jpg",
}

KB = {
    1:  {"z0": 1.0, "z1": 1.15, "px": 0, "py": -0.03},
    2:  {"z0": 1.1, "z1": 1.0, "px": 0, "py": 0},
    3:  {"z0": 1.0, "z1": 1.12, "px": 0.04, "py": 0},
    4:  {"z0": 1.05, "z1": 1.15, "px": -0.03, "py": 0.02},
    5:  {"z0": 1.1, "z1": 1.0, "px": 0.02, "py": -0.01},
    6:  {"z0": 1.0, "z1": 1.1, "px": 0, "py": 0.03},
    7:  {"z0": 1.08, "z1": 1.0, "px": -0.04, "py": 0},
    8:  {"z0": 1.0, "z1": 1.12, "px": 0.02, "py": -0.02},
    9:  {"z0": 1.0, "z1": 1.18, "px": 0, "py": 0.04},
    10: {"z0": 1.12, "z1": 1.0, "px": 0, "py": 0},
    11: {"z0": 1.0, "z1": 1.08, "px": -0.03, "py": 0.01},
    12: {"z0": 1.0, "z1": 1.2, "px": 0, "py": -0.05},
}

beat_times = []
for i in range(1, 13):
    start = max(0, b_start(i) - 0.25)
    end = b_start(i + 1) - 0.25 if i < 12 else TOTAL
    beat_times.append((i, start, end))

FRAMES_DIR = BUILD + "/frames_v3"
os.makedirs(FRAMES_DIR, exist_ok=True)

from PIL import Image, ImageDraw, ImageFont

TW, TH = 1080, 1920
total_frames = int(TOTAL * FPS)

# Load fonts
font_cap = ImageFont.truetype(FONT_BOLD, 52)
font_cap_sm = ImageFont.truetype(FONT_SEMI, 44)

# Pre-load images
imgs = {}
for beat_n, img_name in BEAT_IMG.items():
    path = os.path.join(SHOTS, img_name)
    img = Image.open(path).convert("RGB")
    scale = max(TW * 1.25 / img.width, TH * 1.25 / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    imgs[beat_n] = img

# Build flat word timeline from all beats
all_words = []
for beat in W:
    for w in beat["words"]:
        all_words.append(w)

def get_caption_at(t):
    """Return (spoken_so_far, current_word) for time t within a beat's sentence."""
    for beat in W:
        if t < beat["start"] - 0.1 or t > beat["end"] + 0.5:
            continue
        for sent in beat.get("sents", []):
            if t < sent["a"] - 0.05:
                continue
            words = sent["words"]
            spoken = []
            current = None
            for w in words:
                if t >= w["a"]:
                    spoken.append(w["w"])
                    if t <= w["b"] + 0.15:
                        current = w["w"]
            if spoken:
                return " ".join(spoken), current
    return None, None

def draw_caption(draw, text, highlight_word, y_pos):
    """Draw caption text centered with highlighted current word."""
    if not text:
        return
    # Word wrap if too wide
    max_w = TW - 120
    lines = []
    words = text.split()
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        bbox = draw.textbbox((0, 0), test, font=font_cap)
        if bbox[2] - bbox[0] > max_w and line:
            lines.append(line)
            line = w
        else:
            line = test
    if line:
        lines.append(line)

    line_h = 64
    total_h = len(lines) * line_h
    cy = y_pos - total_h // 2

    for li, line_text in enumerate(lines):
        # Draw word by word for highlighting
        line_words = line_text.split()
        # Measure full line width
        full_bbox = draw.textbbox((0, 0), line_text, font=font_cap)
        full_w = full_bbox[2] - full_bbox[0]
        x = (TW - full_w) // 2
        y = cy + li * line_h

        # Dark pill background
        pad = 16
        pill_rect = [x - pad, y - 6, x + full_w + pad, y + line_h - 6]
        draw.rounded_rectangle(pill_rect, radius=14, fill=(20, 20, 20))

        # Draw each word
        cur_x = x
        for wi, w in enumerate(line_words):
            is_current = (highlight_word and w == highlight_word)
            color = (0, 200, 255) if is_current else (255, 255, 255)
            draw.text((cur_x, y), w, font=font_cap, fill=color)
            wb = draw.textbbox((0, 0), w + " ", font=font_cap)
            cur_x += wb[2] - wb[0]

print(f"Generating {total_frames} frames with captions...")

for f in range(total_frames):
    t = f / FPS
    beat_n = 12
    for bn, bs, be in beat_times:
        if t < be:
            beat_n = bn
            break

    bs, be = [(s, e) for n, s, e in beat_times if n == beat_n][0]
    u = max(0, min(1, (t - bs) / (be - bs)))

    img = imgs[beat_n]
    kb = KB[beat_n]

    zoom = kb["z0"] + (kb["z1"] - kb["z0"]) * u
    px = kb["px"] * u
    py = kb["py"] * u

    cw = int(TW / zoom)
    ch = int(TH / zoom)
    cx = int((img.width - cw) / 2 + px * img.width)
    cy = int((img.height - ch) / 2 + py * img.height)
    cx = max(0, min(img.width - cw, cx))
    cy = max(0, min(img.height - ch, cy))

    crop = img.crop((cx, cy, cx + cw, cy + ch)).resize((TW, TH), Image.LANCZOS)

    # Draw caption overlay
    draw = ImageDraw.Draw(crop)
    caption_text, current_word = get_caption_at(t)
    if caption_text:
        draw_caption(draw, caption_text, current_word, TH - 320)

    crop.save(f"{FRAMES_DIR}/f_{f:05d}.jpg", quality=93)

    if f % 150 == 0:
        print(f"frame {f}/{total_frames}")

print("Frames done, encoding video...")

silent = BUILD + "/silent_v2.mp4"
subprocess.run([
    "ffmpeg", "-loglevel", "error", "-y",
    "-framerate", str(FPS), "-i", f"{FRAMES_DIR}/f_%05d.jpg",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-pix_fmt", "yuv420p", silent
], check=True)

print("Silent video done:", silent)
print("Now run: python3 make_v2.py")
