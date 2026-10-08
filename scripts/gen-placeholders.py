"""Generate low-res abstract placeholder images for testing.
Swap these for real project photography in public/img/ later.
"""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import os, math

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "img")
W, H = 1280, 900
rng = np.random.default_rng(7)

def lerp(a, b, t): return a + (b - a) * t

def gradient(c1, c2, c3, angle):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t = (xx * math.cos(angle) + yy * math.sin(angle))
    t = (t - t.min()) / (t.max() - t.min())
    img = np.zeros((H, W, 3), np.float32)
    for i in range(3):
        a = np.where(t < .5, lerp(c1[i], c2[i], t * 2), lerp(c2[i], c3[i], (t - .5) * 2))
        img[..., i] = a
    return img

def fbm(scale, octaves=5):
    acc = np.zeros((H, W), np.float32); amp = 1; tot = 0
    for o in range(octaves):
        s = max(2, int(scale / (2 ** o)))
        small = rng.random((H // s + 2, W // s + 2)).astype(np.float32)
        im = Image.fromarray((small * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        acc += np.asarray(im, np.float32) / 255 * amp; tot += amp; amp *= .5
    return acc / tot

def make(name, c1, c2, c3, angle, shapes, light):
    img = gradient(c1, c2, c3, angle)
    n = fbm(160)
    img *= (0.72 + 0.5 * n[..., None])
    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil, "RGBA")
    for (x, y, w, h, alpha, dark) in shapes:
        col = (0, 0, 0, alpha) if dark else (light[0], light[1], light[2], alpha)
        d.rectangle([x * W, y * H, (x + w) * W, (y + h) * H], fill=col)
    pil = pil.filter(ImageFilter.GaussianBlur(1.2))
    # vignette + grain
    arr = np.asarray(pil, np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - (((xx / W - .5) ** 2 + (yy / H - .5) ** 2) * 1.1)
    arr *= np.clip(v, .35, 1)[..., None]
    arr += rng.normal(0, 7, arr.shape)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(
        os.path.join(OUT, f"{name}.jpg"), quality=68, optimize=True)
    print("wrote", name)

os.makedirs(OUT, exist_ok=True)
make("pregame", (168, 128, 86), (92, 66, 44), (28, 20, 16), 0.9,
     [(.1, .15, .25, .8, 120, True), (.45, .0, .18, .7, 90, True), (.7, .3, .3, .7, 70, False)], (230, 200, 160))
make("lucifers-lair", (60, 12, 14), (120, 24, 20), (10, 8, 10), 2.2,
     [(.0, .6, 1, .4, 140, True), (.3, .1, .12, .9, 90, False), (.62, .2, .08, .8, 60, False)], (220, 90, 60))
make("knossos", (214, 206, 192), (170, 160, 142), (90, 84, 76), 1.4,
     [(.05, .1, .4, .3, 70, True), (.55, .25, .4, .65, 110, True), (.2, .55, .25, .4, 50, False)], (255, 250, 240))
make("school-lobby", (236, 190, 120), (200, 120, 80), (60, 60, 110), 0.4,
     [(.1, .2, .3, .3, 80, False), (.5, .4, .35, .5, 90, True), (.3, .65, .5, .2, 60, False)], (255, 240, 200))
make("tech-park", (120, 140, 140), (60, 80, 84), (16, 24, 28), 1.9,
     [(.0, .0, .12, 1, 110, True), (.2, .0, .12, 1, 80, True), (.4, .0, .12, 1, 60, True), (.6, .0, .12, 1, 40, True), (.8, .0, .12, 1, 20, True)], (200, 230, 230))
make("residence", (150, 120, 90), (70, 60, 52), (18, 16, 14), 2.6,
     [(.0, .5, 1, .5, 120, True), (.15, .1, .3, .6, 60, False), (.6, .15, .3, .35, 80, True)], (240, 220, 190))
make("studio", (40, 38, 36), (90, 80, 70), (18, 16, 14), 1.1,
     [(.1, .1, .8, .8, 60, False), (.3, .3, .4, .5, 100, True)], (230, 215, 195))
make("hero", (24, 22, 20), (70, 58, 46), (10, 10, 10), 2.0,
     [(.0, .7, 1, .3, 140, True), (.2, .0, .2, 1, 60, True), (.6, .0, .25, 1, 40, False)], (200, 170, 130))
