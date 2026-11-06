"""Remove a flat magenta (#FF00FF) or green (#00FF00) background -> trimmed transparent PNG.
Usage: python3 key_sprite.py in.png out.png [magenta|green]"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else "magenta"
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
if mode == "magenta":
    key = np.minimum(r, b) - g          # high on magenta
    spill_fix = lambda: np.minimum(np.minimum(r, b), np.maximum(g, (r + b) / 2 - 0))  # unused
else:
    key = g - np.maximum(r, b)          # high on green
lo, hi = 40.0, 120.0                     # soft edge band
alpha = 1.0 - np.clip((key - lo) / (hi - lo), 0, 1)
# despill: pull the key colour out of semi-transparent edge pixels
out = im.copy()
if mode == "magenta":
    m = np.minimum(r, b)
    excess = np.clip(m - g, 0, None) * (1 - alpha) * 0 + np.clip(m - np.maximum(g, 0), 0, None) * (alpha < 0.98)
    out[..., 0] = np.where(alpha < 0.98, np.minimum(r, g + 30), r)
    out[..., 2] = np.where(alpha < 0.98, np.minimum(b, g + 30), b)
else:
    out[..., 1] = np.where(alpha < 0.98, np.minimum(g, np.maximum(r, b) + 10), g)
a = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
rgba = Image.fromarray(out.clip(0, 255).astype(np.uint8)).convert("RGBA")
rgba.putalpha(a)
bbox = a.point(lambda v: 255 if v > 20 else 0).getbbox()
rgba.crop(bbox).save(dst)
print(dst, rgba.crop(bbox).size)
