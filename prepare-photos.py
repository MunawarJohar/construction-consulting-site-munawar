"""
Batch-clean the Christmas tree photos (or any product photos) for the website.

Usage:
    pip install pillow
    python prepare-photos.py INPUT_FOLDER OUTPUT_FOLDER [--ratio 4:3] [--width 1600]

What it does for every PNG/JPG in INPUT_FOLDER:
  - fixes phone rotation (EXIF), trims plain white/transparent borders
  - crops to a consistent ratio (default 4:3) around the centre
  - resizes to the target width (never upscales)
  - saves an optimized .jpg (typically 200-400 KB instead of 10 MB)
"""
import sys, os, argparse
from PIL import Image, ImageOps, ImageChops

def trim_border(im, tol=12):
    bg = Image.new(im.mode, im.size, im.getpixel((0, 0)))
    diff = ImageChops.difference(im, bg).convert("L").point(lambda p: 255 if p > tol else 0)
    box = diff.getbbox()
    return im.crop(box) if box else im

def crop_ratio(im, rw, rh):
    w, h = im.size
    target = rw / rh
    if w / h > target:            # too wide -> crop sides
        nw = int(h * target); x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = int(w / target); y = (h - nh) // 2   # too tall -> crop top/bottom
    return im.crop((0, y, w, y + nh))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--ratio", default="4:3"); ap.add_argument("--width", type=int, default=1600)
    a = ap.parse_args()
    rw, rh = [int(x) for x in a.ratio.split(":")]
    os.makedirs(a.dst, exist_ok=True)
    n = 0
    for name in sorted(os.listdir(a.src)):
        if not name.lower().endswith((".png", ".jpg", ".jpeg", ".webp")): continue
        im = ImageOps.exif_transpose(Image.open(os.path.join(a.src, name)))
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1]); im = bg
        else:
            im = im.convert("RGB")
        im = crop_ratio(trim_border(im), rw, rh)
        if im.width > a.width:
            im = im.resize((a.width, int(im.height * a.width / im.width)), Image.LANCZOS)
        out = os.path.join(a.dst, os.path.splitext(name)[0] + ".jpg")
        im.save(out, "JPEG", quality=84, optimize=True, progressive=True)
        n += 1; print(f"{name} -> {os.path.basename(out)}  {im.size[0]}x{im.size[1]}  {os.path.getsize(out)//1024} KB")
    print(f"Done: {n} photo(s) written to {a.dst}")

if __name__ == "__main__":
    main()
