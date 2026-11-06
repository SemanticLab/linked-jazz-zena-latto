"""Create a gold-border sibling while preserving the source and its alpha.

Only near-white regions connected to the cutout's outside edge are selected.
Isolated bright highlights within the photograph remain untouched.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'images/latto_cutout.png'
output = ROOT / 'restoration/latto-cutout-gold.png'
original = Image.open(source).convert('RGBA')
r, g, b, alpha = original.split()
lightest_shared = ImageChops.darker(ImageChops.darker(r, g), b)
occupied = alpha.point(lambda value: 255 if value > 16 else 0)
candidate = ImageChops.multiply(lightest_shared.point(lambda value: 255 if value >= 235 else 0), occupied)
edge = ImageChops.subtract(occupied, occupied.filter(ImageFilter.MinFilter(15)))
seeds = ImageChops.multiply(candidate, edge).tobytes()
index = seeds.find(b'\xff')
components = 0
while index >= 0:
    point = (index % original.width, index // original.width)
    if candidate.getpixel(point) == 255:
        ImageDraw.floodfill(candidate, point, 128)
        components += 1
    index = seeds.find(b'\xff', index + 1)
# Two enclosed white cutout areas have no alpha boundary: between the arm and
# torso, and beneath the saxophone neck. They are part of the same paper rim.
for point in [(600, 2800), (2406, 1729)]:
    assert candidate.getpixel(point) == 255
    ImageDraw.floodfill(candidate, point, 128)
    components += 1
mask = candidate.point(lambda value: 255 if value == 128 else 0)
assert mask.getbbox(), 'No border component found'
mask = mask.filter(ImageFilter.GaussianBlur(.65))
gold = Image.new('RGB', original.size, '#dfc28c')
result = Image.composite(gold, original.convert('RGB'), mask).convert('RGBA')
result.putalpha(alpha)
assert ImageChops.difference(result.getchannel('A'), alpha).getbbox() is None
# The face, lenses and torso are interior photo regions, outside the border.
for region in [(1780, 935, 1900, 1030), (2010, 1010, 2100, 1090), (1720, 1180, 1920, 1320), (1100, 2000, 1800, 2600)]:
    assert ImageChops.difference(result.crop(region), original.crop(region)).getbbox(alpha_only=False) is None
result.save(output, optimize=True)
preview = Image.new('RGBA', result.size, '#191c1b')
preview.alpha_composite(result)
preview.resize((613, 1080), Image.Resampling.LANCZOS).convert('RGB').save('/private/tmp/latto-gold-border-review.jpg', quality=93)
print(f'Created {output.name}; color #dfc28c; {components} edge-connected regions; original alpha preserved.')
