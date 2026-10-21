#!/usr/bin/env python3
"""
Generate the Open Graph share image from the brand wordmark image.

Inputs:
  - public/brand-wordmark.jpg  (1280x698, B-mark + "PersianBearStudio" text)

Outputs:
  - public/og-image.png        (1200x630, the standard OG share size)
  - public/og-image.svg        (1200x630 SVG wrapper embedding the PNG as
                                a base64 data URI, for any scraper that
                                prefers .svg URLs)

Design:
  The brand wordmark image is already wide-aspect (1280x698) and contains
  the full PersianBearStudio lockup (icon + wordmark). We:
    1. Create a 1200x630 canvas in the site background color (#101114).
    2. Paste a subtle grid (matching the hero grid) for brand consistency.
    3. Place the brand-wordmark.jpg centered horizontally, vertically
       positioned in the upper-middle so a caption / headline can sit
       below it in the future.
    4. Optionally add a short eyebrow line below the wordmark.

  This avoids SVG font rendering issues (the original og-image.svg tried
  to render text with Manrope but social scrapers don't load custom fonts).
  Embedding the raster wordmark guarantees the brand looks identical to
  the website on every social platform.
"""

import base64
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parent.parent / "public"
WORDMARK = PUBLIC / "brand-wordmark.jpg"
OG_PNG = PUBLIC / "og-image.png"
OG_SVG = PUBLIC / "og-image.svg"

# Site palette
BG = (0x10, 0x11, 0x14, 0xFF)        # #101114
GRID = (0x2B, 0x2C, 0x30, 0x46)      # #2B2C30 at ~28% opacity
ACCENT = (0xF0, 0x78, 0x35, 0xFF)   # #F07835

# OG canvas
W, H = 1200, 630

# Load the wordmark and resize to fit ~78% of the canvas width
mark = Image.open(WORDMARK).convert("RGBA")
mark_target_w = int(W * 0.78)
mark_ratio = mark_target_w / mark.width
mark_target_h = int(mark.height * mark_ratio)
mark = mark.resize((mark_target_w, mark_target_h), Image.LANCZOS)

# Build the canvas
canvas = Image.new("RGBA", (W, H), BG)

# Draw subtle grid lines (every 80px), matching the hero grid aesthetic.
draw = ImageDraw.Draw(canvas)
for x in range(0, W, 80):
    draw.line([(x, 0), (x, H)], fill=GRID, width=1)
for y in range(0, H, 80):
    draw.line([(0, y), (W, y)], fill=GRID, width=1)

# Place the wordmark centered horizontally, with a small top margin.
margin_top = 60
x = (W - mark.width) // 2
y = margin_top
canvas.paste(mark, (x, y), mark)

# Add a short orange accent hairline + a small caption beneath the wordmark.
hair_y = y + mark.height + 28
hair_x_start = (W - 96) // 2
hair_x_end = hair_x_start + 96
draw.line(
    [(hair_x_start, hair_y), (hair_x_end, hair_y)],
    fill=ACCENT,
    width=2,
)

# Save PNG (flatten alpha to RGB for max compatibility with social scrapers)
final = canvas.convert("RGB")
final.save(OG_PNG, format="PNG", optimize=True)
print(f"wrote {OG_PNG} ({W}x{H})")

# Build the SVG wrapper that embeds the PNG as a base64 data URI.
# This gives scrapers that prefer .svg URLs the same exact image.
png_bytes = BytesIO()
final.save(png_bytes, format="PNG", optimize=True)
b64 = base64.b64encode(png_bytes.getvalue()).decode("ascii")

svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <title>PersianBearStudio — Good Ideas. Precise Execution.</title>
  <image href="data:image/png;base64,{b64}" width="{W}" height="{H}" x="0" y="0"/>
</svg>
"""
OG_SVG.write_text(svg, encoding="utf-8")
print(f"wrote {OG_SVG} ({W}x{H}, embeds the PNG)")

print("\nDone.")
