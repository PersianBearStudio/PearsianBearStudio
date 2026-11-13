#!/usr/bin/env python3
"""
Generate favicon assets from the brand mark image.

Inputs:
  - public/brand-mark.jpg  (378x409, near-black bg with cream "B" + orange accent)

Outputs:
  - public/favicon-32.png
  - public/favicon-64.png
  - public/favicon-180.png  (apple-touch-icon)
  - public/favicon.ico       (multi-resolution: 16, 32, 48)

Why both PNG + ICO:
  - Modern browsers prefer the SVG favicon (already exists at favicon.svg)
    which we keep as the primary icon for crisp rendering at all sizes.
  - The PNGs provide a fallback for crawlers and older browsers.
  - The .ico is a safety net for very old browsers / Windows tile previews.

The brand image has its own near-black background that matches the site
(#101114), so no extra padding or background fill is needed — we just
resize the image to the target sizes with LANCZOS resampling.
"""

from pathlib import Path
from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"
SRC = PUBLIC / "brand-mark.jpg"

# Open and convert to RGBA so the favicon ICO can carry transparency
# (even though the source is opaque, this is harmless).
src = Image.open(SRC).convert("RGBA")

# The source is not square (378x409). Resizing it straight to a square
# stretched the mark horizontally, so pad it to a square canvas first, filled
# with the image's own background colour (sampled from the corner).
_side = max(src.size)
_bg = src.getpixel((2, 2))
_canvas = Image.new("RGBA", (_side, _side), _bg)
_canvas.paste(src, ((_side - src.width) // 2, (_side - src.height) // 2))
src = _canvas

# Generate square PNG favicons at common sizes.
sizes = [32, 64, 180]
for size in sizes:
    out = src.resize((size, size), Image.LANCZOS)
    target = PUBLIC / f"favicon-{size}.png"
    out.save(target, format="PNG", optimize=True)
    print(f"wrote {target} ({size}x{size})")

# Apple touch icon specifically (named conventionally).
apple = src.resize((180, 180), Image.LANCZOS)
apple_target = PUBLIC / "apple-touch-icon.png"
apple.save(apple_target, format="PNG", optimize=True)
print(f"wrote {apple_target} (180x180)")

# Multi-resolution ICO (16, 32, 48 embedded).
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_target = PUBLIC / "favicon.ico"
src.save(ico_target, format="ICO", sizes=ico_sizes)
print(f"wrote {ico_target} (multi-res: 16, 32, 48)")

print("\nDone.")
