JAZZ: female — restoration animation

Open index.html directly in a browser. No installation or server is required.
The preview has play/pause, manual scrubbing, speed controls, a wipe comparison,
and dark, light, or checkerboard backgrounds. Reduced-motion preferences are respected.

Deliverables
  flyer-before-upscaled.png             Transparent PNG, 2697 x 3072
  flyer-after-upscaled.png              Transparent PNG, 2151 x 3072
  restoration-tween.mp4                 1080 x 1620, 30 fps, 10 seconds
  restoration-tween-transparent.webp   750 x 1020, 15 fps, looping, alpha
  restoration-tween.gif                 540 x 810, 12 fps, looping
  restoration-contact-sheet.jpg        Before, midpoint, after

Method
The source photographs in ../images are unchanged. The before image uses a
green/cyan background mask bounded to the backing board. The after image uses
a manually traced mask around the gold paper. The cutout source files retain
the original RGB samples; only alpha is added. Enlargement uses Lanczos
interpolation without generated detail or synthesized lettering. Source
resolution still limits the finest readable detail.

The animation uses matching printed landmarks for a strip mesh warp, followed
by a smooth premultiplied-alpha blend. It holds the before state, transitions
to the reconstruction, holds, and returns to form a continuous ten-second loop.
This is an illustrative before/after comparison, not a reconstruction of the
physical restoration procedure. Photography and lighting differences remain.

An initial built-in image_gen pass was rejected because it changed lettering.
imagegen-prompts.json records those prompts; no AI-generated pixels are used
in the final assets. Pixel-preserving processing was selected by the user.

Rebuild (Python 3, Pillow, and ffmpeg):
  python3 scripts/prepare_posters.py
  python3 scripts/render_restoration.py
Run from the project root. The scripts also work from other directories.
