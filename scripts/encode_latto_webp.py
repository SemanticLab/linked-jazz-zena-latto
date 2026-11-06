"""Encode and validate a compact five-second transparent WebP loop."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops

manifest = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2])
frames = [Image.open(row['file']).convert('RGBA') for row in manifest]
durations = [row['duration'] for row in manifest]
assert sum(durations) == 5000
assert frames[0].getpixel((0, 0))[3] == 0
assert ImageChops.difference(frames[0], frames[-1]).getbbox(alpha_only=False) is None
# The source photograph must remain still; only the sunglasses region changes.
assert ImageChops.difference(frames[0].crop((0, 270, 613, 1080)), frames[20].crop((0, 270, 613, 1080))).getbbox(alpha_only=False) is None
frames[0].save(out, format='WEBP', save_all=True, append_images=frames[1:],
               duration=durations, loop=0, quality=86, method=6,
               minimize_size=True, allow_mixed=True)
animation = Image.open(out)
duration = 0
for index in range(animation.n_frames):
    animation.seek(index)
    animation.load()
    duration += animation.info['duration']
    assert animation.convert('RGBA').getpixel((0, 0))[3] == 0
assert duration == 5000
assert animation.info.get('loop') == 0
print(f'{out.name}: {animation.width} × {animation.height}; {animation.n_frames} frames; {duration} ms; {out.stat().st_size/1024:.1f} KiB; transparent; infinite loop')
# Contact sheet of the actual decoded file, for visual checking.
sheet = Image.new('RGB', (3*340, 600), '#191c1b')
for column, target in enumerate((0, 1290, 1710)):
    elapsed = 0
    for index in range(animation.n_frames):
        animation.seek(index)
        animation.load()
        end = elapsed + animation.info['duration']
        if end > target:
            rgba = animation.convert('RGBA')
            rgba.thumbnail((340, 600), Image.Resampling.LANCZOS)
            sheet.paste(rgba, (column*340, 0), rgba)
            break
        elapsed = end
sheet.save(out.with_name(out.stem+'-webp-review.jpg'), quality=92)
