#!/usr/bin/env python3
"""
Replace public/favicon.svg with a small SVG wrapper that embeds the brand
mark PNG as a base64 data URI. This gives us a single favicon that:
  - Renders crisply at any size (the SVG scales, the PNG inside is high-DPI)
  - Works on every modern browser (Chrome, Firefox, Safari, Edge)
  - Shows the official brand mark (not a generic geometric bear)

The embedded PNG is 128x128, plenty for favicon use, and only ~6 KB after
base64 encoding so it doesn't bloat the SVG.
"""

import base64
from io import BytesIO
from pathlib import Path
from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"
SRC = PUBLIC / "brand-mark.jpg"

# Generate a 128x128 PNG for the favicon SVG to embed.
src = Image.open(SRC).convert("RGBA")
favicon_png = src.resize((128, 128), Image.LANCZOS)
png_bytes = BytesIO()
favicon_png.save(png_bytes, format="PNG", optimize=True)
b64 = base64.b64encode(png_bytes.getvalue()).decode("ascii")

svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <title>PersianBearStudio</title>
  <image href="data:image/png;base64,{b64}" width="128" height="128" x="0" y="0"/>
</svg>
"""

target = PUBLIC / "favicon.svg"
target.write_text(svg, encoding="utf-8")
print(f"wrote {target} (128x128, embeds 128x128 brand PNG, {len(svg)} bytes)")

print("Done.")
