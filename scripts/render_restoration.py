"""Render a registered, eased mesh tween from the two original photographs.

Requires Pillow and ffmpeg. The montage interpolates geometry and opacity;
it does not simulate the physical conservation process.
"""
from pathlib import Path
import json
import subprocess
import argparse
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'restoration'
W, H = 1000, 1360
DURATION, FPS = 10, 30
# Corresponding horizontal landmarks: header, title, venue, performers, date,
# prices and ticket information. Coordinates refer to the original photographs.
ROWS = [
    [60, 0, 40, 382], [112, 46, 43, 385], [162, 95, 43, 386],
    [214, 132, 38, 390], [251, 167, 42, 395], [300, 208, 38, 400],
    [400, 291, 40, 404], [456, 337, 43, 406], [478, 355, 43, 406],
    [504, 376, 44, 406], [533, 401, 58, 409], [579, 442, 41, 414],
    [600, 459, 40, 414],
]
CONFIG = {'width': W, 'height': H, 'duration': DURATION, 'rows': ROWS,
          'assets': json.loads((OUT / 'assets.json').read_text())['assets'],
          'paperLeft': 130, 'paperWidth': 740, 'paperTop': 90, 'verticalScale': 2.6}


def ease(t):
    t = max(0, min(1, t))
    return t*t*(3-2*t)


def progress(t):
    t %= DURATION
    if t < 1.5:
        return 0
    if t < 5:
        return ease((t - 1.5) / 3.5)
    if t < 7:
        return 1
    if t < 9:
        return 1 - ease((t - 7) / 2)
    return 0


def bounds(row, which):
    if which == 'before':
        y, _, left, right = row
    else:
        y = row[1]
        left, right = 170 - y * 7/439, 458 + y * 10/439
    span = right - left
    return left - 130/740*span, right + 130/740*span, y


def mesh(which, amount=0):
    result = []
    for a, b in zip(ROWS[:-1], ROWS[1:]):
        l0, r0, sy0 = bounds(a, which)
        l1, r1, sy1 = bounds(b, which)
        if which == 'before':
            y0 = (a[0]-60) * (442/519) * (1-amount) + a[1]*amount
            y1 = (b[0]-60) * (442/519) * (1-amount) + b[1]*amount
        else:
            y0, y1 = a[1], b[1]
        rect = (0, round(90+y0*2.6), W, round(90+y1*2.6))
        result.append((rect, (l0, sy0, l1, sy1, r1, sy1, r0, sy0)))
    return result


before = Image.open(OUT / 'before-source-cutout.png').convert('RGBa')
after = Image.open(OUT / 'after-source-cutout.png').convert('RGBa')
after_aligned = after.transform((W, H), Image.Transform.MESH, mesh('after'), Image.Resampling.BICUBIC)
cache = {}


def frame(p):
    key = round(p, 5)
    if key in cache:
        return cache[key].copy()
    # Settle the surviving paper into registration early in the dissolve.
    warped = before.transform((W, H), Image.Transform.MESH, mesh('before', ease(p/.25)), Image.Resampling.BICUBIC)
    out = Image.blend(warped, after_aligned, p).convert('RGBA')
    if p in (0, 1):
        cache[key] = out.copy()
    return out


def font(size, serif=False):
    path = '/System/Library/Fonts/Supplemental/' + ('Georgia.ttf' if serif else 'Arial.ttf')
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default(size=size)


def video_frame(art, p):
    canvas = Image.new('RGBA', (1080, 1620), '#181b1a')
    canvas.alpha_composite(art, (40, 130))
    d = ImageDraw.Draw(canvas)
    d.text((72, 38), 'JAZZ: female', font=font(40, True), fill='#f2e6ca')
    d.text((1008, 55), 'A POSTER, RESTORED', anchor='ra', font=font(18), fill='#aaa99e')
    d.line((72, 104, 1008, 104), fill='#3a3e38', width=1)
    d.text((72, 1520), 'BEFORE', font=font(19), fill='#e7c37b' if p < .5 else '#7b8179')
    d.text((1008, 1520), 'AFTER', anchor='ra', font=font(19), fill='#e7c37b' if p >= .5 else '#7b8179')
    d.line((72, 1564, 1008, 1564), fill='#3a3e38', width=3)
    d.line((72, 1564, 72+936*p, 1564), fill='#d6b374', width=3)
    return canvas.convert('RGB')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview-only', action='store_true')
    args = parser.parse_args()
    (OUT / 'tween-config.json').write_text(json.dumps(CONFIG, indent=2) + '\n')
    # A script tag keeps the local preview usable directly from file://.
    (OUT / 'tween-config.js').write_text('window.POSTER_TWEEN = ' + json.dumps(CONFIG) + ';\n')
    sheet = Image.new('RGB', (1500, 810), '#181b1a')
    for i, p in enumerate((0, .5, 1)):
        art = frame(p)
        video_frame(art, p).resize((500, 750), Image.Resampling.LANCZOS).save(OUT / f'review-{i}.jpg', quality=92)
        sheet.paste(Image.open(OUT / f'review-{i}.jpg'), (i*500, 30))
    sheet.save(OUT / 'restoration-contact-sheet.jpg', quality=92)
    if args.preview_only:
        print('Preview frames rendered.')
        return
    proc = subprocess.Popen([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', '1080x1620',
        '-framerate', str(FPS), '-i', '-', '-an', '-c:v', 'libx264',
        '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', str(OUT / 'restoration-tween.mp4'),
    ], stdin=subprocess.PIPE)
    webp = []
    try:
        for i in range(FPS*DURATION):
            p = progress(i/FPS)
            art = frame(p)
            proc.stdin.write(video_frame(art, p).tobytes())
            if i % 2 == 0:
                webp.append(art.resize((750, 1020), Image.Resampling.LANCZOS))
            if i % FPS == 0:
                print(f'Rendered {i//FPS}/{DURATION} seconds', flush=True)
    finally:
        proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError('ffmpeg failed')
    webp[0].save(OUT / 'restoration-tween-transparent.webp', save_all=True,
                 append_images=webp[1:], duration=[67, 67, 66]*50,
                 loop=0, quality=85, method=4, minimize_size=True)
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(OUT / 'restoration-tween.mp4'),
        '-vf', 'fps=12,scale=540:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse=dither=sierra2_4a',
        '-loop', '0', str(OUT / 'restoration-tween.gif'),
    ], check=True)
    print('MP4, transparent animated WebP, GIF and contact sheet saved.', flush=True)


if __name__ == '__main__':
    main()
