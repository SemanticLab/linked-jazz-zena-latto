"""Extract the photographed paper, retain source RGB, and upscale without synthesis.

Requires Pillow. Run from any directory with: python3 scripts/prepare_posters.py
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'restoration'
OUT.mkdir(exist_ok=True)


def polygon_mask(size, points):
    # Supersampling supplies a clean, fractional edge without softening the paper.
    scale = 8
    mask = Image.new('L', (size[0] * scale, size[1] * scale))
    ImageDraw.Draw(mask).polygon([(round(x * scale), round(y * scale)) for x, y in points], fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS).point(lambda a: 0 if a < 8 else a)


before = Image.open(ROOT / 'images/flyer-before.jpg').convert('RGB')
board = polygon_mask(before.size, [
    (0, 64), (411, 64), (428, 198), (455, 201),
    (460, 559), (32, 604), (0, 601),
])
alpha = Image.new('L', before.size)
values = []
for (r, g, b), allowed in zip(before.getdata(), board.getdata()):
    # The green backing is spectrally distinct from warm paper and its ink.
    # This changes alpha only; all RGB samples remain the original photograph.
    # Requiring both differences protects dark ink and blue/white repair tape.
    green_red = max(0.0, min(1.0, (g - r - 15) / 45))
    green_blue = max(0.0, min(1.0, (g - b - 3) / 15))
    cyan = max(0.0, min(1.0, (min(g, b) - r - 15) / 35))
    bright = max(0.0, min(1.0, (g - 85) / 40))
    opacity = 1 - max(green_red * green_blue, cyan) * bright
    values.append(round(allowed * opacity))
alpha.putdata(values)
# Remove isolated sub-pixel JPEG spill, keeping even small paper fragments.
pixels = alpha.load()
seen = set()
for y in range(alpha.height):
    for x in range(alpha.width):
        if pixels[x, y] < 24 or (x, y) in seen:
            continue
        group, stack = [], [(x, y)]
        seen.add((x, y))
        while stack:
            px, py = stack.pop()
            group.append((px, py))
            for nx, ny in [(px-1, py), (px+1, py), (px, py-1), (px, py+1)]:
                if 0 <= nx < alpha.width and 0 <= ny < alpha.height and (nx, ny) not in seen and pixels[nx, ny] >= 24:
                    seen.add((nx, ny))
                    stack.append((nx, ny))
        if len(group) < 5:
            for px, py in group:
                pixels[px, py] = 0
before = before.convert('RGBA')
before.putalpha(alpha)

after = Image.open(ROOT / 'images/flyer-after.jpg').convert('RGBA')
after.putalpha(polygon_mask(after.size, [
    (170, 7), (206, 10), (244, 12), (282, 13), (322, 13),
    (365, 12), (408, 11), (458, 9), (460, 119), (462, 230),
    (465, 340), (468, 439), (424, 437), (386, 437), (345, 438),
    (303, 438.5), (262, 439.5), (214, 441), (163.5, 443.5),
    (165, 334), (167, 222), (168, 111),
]))

metadata = {'method': 'Original photographed RGB with alpha masks and Lanczos resampling. No generative lettering or texture.', 'assets': {}}
for name, img in [('before', before), ('after', after)]:
    img.save(OUT / f'{name}-source-cutout.png')
    bounds = img.getchannel('A').getbbox()
    cropped = img.crop(bounds)
    scale = 3072 / max(cropped.size)
    size = tuple(round(v * scale) for v in cropped.size)
    # Pillow resizes RGBA in premultiplied-alpha space to prevent edge fringes.
    enlarged = cropped.resize(size, Image.Resampling.LANCZOS)
    enlarged.save(OUT / f'flyer-{name}-upscaled.png', optimize=True)
    metadata['assets'][name] = {'source': f'../images/flyer-{name}.jpg', 'crop': bounds, 'size': size, 'scale': scale}

(OUT / 'assets.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata, indent=2))
