"""
Builds everything in public/media as responsive WebP.

Usage:  python tools/import_images.py [aurora_source_dir]
        (default aurora source dir: ../images next to this project)
Deps:   pip install pillow

Two groups:
  AURORA   the high-resolution art plates (source files end in -1 … -10)
  LOCAL    project screenshots and certificates kept in tools/sources/
Widths above an image's native size are upscaled with Lanczos + a light unsharp mask.
"""

from __future__ import annotations

import glob
import os
import sys

from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AURORA_SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), "images")
LOCAL_SRC = os.path.join(ROOT, "tools", "sources")
OUT = os.path.join(ROOT, "public", "media")

# name: (source number, widths, crop as fractions (x0, y0, x1, y1) | None, mirror)
AURORA = {
    "hero-aurora": (1, (1280, 1672, 2400), None, False),
    "about-portrait": (2, (720, 1122), None, False),
    "contact-planet": (8, (760, 1122), None, False),
    "light-ribbons": (10, (720, 1122), None, False),
}

# name: (path under tools/sources, widths, crop in pixels (x0, y0, x1, y1) | None)
LOCAL = {
    # selected work
    "eloria-home": ("projects/eloria-home.jpg", (900, 1440), None),
    "eloria-library": ("projects/eloria-library.jpg", (900, 1440), None),
    "eloria-subscribe": ("projects/eloria-subscribe.jpg", (900, 1440), None),
    "chess-desktop": ("projects/chess-desktop.jpg", (900, 1280), None),
    "chess-live": ("projects/chess-live.png", (900, 1440), None),
    "chess-mobile": ("projects/chess-mobile.jpg", (520, 780), None),
    "leap-phone": ("projects/leap-one.jpg", (520, 780), None),
    "leap-desktop": ("projects/leap-desktop.png", (660,), (400, 0, 1060, 900)),
    # the Computerjy Maher series
    "maher-v1": ("projects/cm1-english.jpg", (900, 1440), None),
    "maher-v1-ar": ("projects/cm1-hero.jpg", (900, 1440), None),
    "maher-v2": ("projects/cm2-room.jpg", (900, 1440), None),
    "maher-v3": ("projects/cm3-hero.jpg", (900, 1440), None),
    "maher-v3-products": ("projects/cm3-products.jpg", (900, 1440), None),
    "maher-v4": ("projects/cm4-desktop.jpg", (900, 1440), None),
    "maher-v4-door": ("projects/cm4-door.jpg", (900, 1440), None),
    "maher-v4-phone": ("projects/cm4-phone.jpg", (900, 1440), None),
    # certificates
    "cert-ibm": ("certs/ibm-fullstack.webp", (800, 1179), None),
    "cert-ecppt": ("certs/ecppt.png", (800, 1074), None),
}


def find_aurora(n: int) -> str:
    for f in glob.glob(os.path.join(AURORA_SRC, "*.png")) + glob.glob(os.path.join(AURORA_SRC, "*.jpg")):
        stem = os.path.splitext(os.path.basename(f))[0]
        if stem.split("-")[-1] == str(n):
            return f
    raise FileNotFoundError(f"no source image ending in -{n} in {AURORA_SRC}")


def export(name: str, im: Image.Image, widths) -> None:
    for tw in widths:
        th = round(im.height * tw / im.width)
        out = im.resize((tw, th), Image.LANCZOS) if tw != im.width else im
        if tw > im.width:
            out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
        out.save(os.path.join(OUT, f"{name}-{tw}.webp"), "WEBP", quality=86, method=6)
    print(f"  {name}: {im.width}x{im.height} -> {', '.join(map(str, widths))}")


def main():
    os.makedirs(OUT, exist_ok=True)
    for old in glob.glob(os.path.join(OUT, "*.webp")):
        os.remove(old)

    for name, (n, widths, crop, mirror) in AURORA.items():
        im = Image.open(find_aurora(n)).convert("RGB")
        if crop:
            w, h = im.size
            im = im.crop((round(crop[0] * w), round(crop[1] * h), round(crop[2] * w), round(crop[3] * h)))
        if mirror:
            im = ImageOps.mirror(im)
        export(name, im, widths)

    for name, (path, widths, crop) in LOCAL.items():
        im = Image.open(os.path.join(LOCAL_SRC, path)).convert("RGB")
        if crop:
            im = im.crop(crop)
        export(name, im, widths)

    # ambient spill: a tiny, heavily blurred copy of the hero used as edge light
    hero = Image.open(find_aurora(1)).convert("RGB")
    amb = hero.resize((480, round(480 * hero.height / hero.width)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(18))
    amb.save(os.path.join(OUT, "hero-ambient-480.webp"), "WEBP", quality=80)
    print("  hero-ambient: 480")


if __name__ == "__main__":
    main()
