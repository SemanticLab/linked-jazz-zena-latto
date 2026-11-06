"""Crop the animated glint portrait to a square head-and-shoulders loop.

  uv run --with pillow scripts/crop_latto_glint.py

Reads restoration/latto-glint-gold.webp and writes two 300 x 300 loops beside
it: one on the site's dark background, one transparent. Frame timings and the
glint are taken from the source unchanged.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'restoration' / 'latto-glint-gold.webp'
BOX = (59, 0, 607, 548)      # square region of the 613 x 1080 source: head, sunglasses, top of the sax
SIZE = 300
BACKGROUND = '#191c1b'       # --bg in assets/site.css

source = Image.open(SOURCE)
frames, durations = [], []
for index in range(source.n_frames):
    source.seek(index)
    source.load()
    durations.append(source.info['duration'])
    # Resize with premultiplied alpha so the outline keeps a clean edge.
    frame = source.convert('RGBA').crop(BOX).convert('RGBa')
    frames.append(frame.resize((SIZE, SIZE), Image.Resampling.LANCZOS).convert('RGBA'))

def save(path, images):
    images[0].save(path, format='WEBP', save_all=True, append_images=images[1:],
                   duration=durations, loop=0, quality=90, method=6,
                   minimize_size=True, allow_mixed=True)
    check = Image.open(path)
    total = 0
    for index in range(check.n_frames):
        check.seek(index)
        check.load()
        total += check.info['duration']
    assert check.size == (SIZE, SIZE) and check.n_frames == len(images) and total == sum(durations)
    print(f'{path.name}: {SIZE} x {SIZE}; {check.n_frames} frames; {total} ms; {path.stat().st_size / 1024:.1f} KiB; infinite loop')

backdrop = Image.new('RGBA', (SIZE, SIZE), BACKGROUND)
save(SOURCE.with_name('latto-glint-gold-300.webp'), [Image.alpha_composite(backdrop, f).convert('RGB') for f in frames])
save(SOURCE.with_name('latto-glint-gold-300-transparent.webp'), frames)
