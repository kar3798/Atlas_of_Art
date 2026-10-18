"""
Builds the antique parchment globe texture from Natural Earth II imagery.

Source (public domain): Natural Earth II with Shaded Relief and Water, 1:50m
  https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/
  Direct download: https://naciscdn.org/naturalearth/50m/raster/NE2_50M_SR_W.zip

Usage (requires Pillow):
  python3 scripts/build-antique-texture.py path/to/NE2_50M_SR_W.tif public/textures/earth-antique.jpg

The source image is not stored in the repository; only the optimized output is.
Output is deterministic: the paper aging uses a fixed random seed.
"""

import math
import random
import sys

from PIL import Image, ImageChops, ImageFilter, ImageOps

OUTPUT_SIZE = (4096, 2048)

# In NE2 the water is a uniform blue: blue exceeds red by ~85+, while land
# (including ice) stays below ~25. This threshold separates the two cleanly.
WATER_THRESHOLD = 50

# Parchment palette: land maps dark umber -> ochre -> pale parchment, so the
# source's vegetation tones and relief shading become sepia light and shade.
LAND = dict(black=(70, 50, 30), mid=(176, 146, 98), white=(240, 226, 192))
LAND_POINTS = dict(blackpoint=70, midpoint=175, whitepoint=245)

# Oceans are a darker, low-contrast warm tone so continents read clearly and
# the source's sea-floor relief stays a faint texture rather than noise.
OCEAN = dict(black=(122, 102, 72), white=(178, 156, 114))
OCEAN_POINTS = dict(blackpoint=40, whitepoint=230)

# A soft ink wash along coastlines, as on hand-colored globes.
COAST_WASH_RADIUS = 6
COAST_WASH_STRENGTH = 0.22

# Fine engraved coastline: a thin dark-ink line traced at full source resolution.
COAST_INK = (58, 40, 24)
COAST_INK_OPACITY = 0.7

# Paper aging: soft, low-frequency variation in parchment tone. Computed on the
# sphere (not the flat map) so it has no seam at ±180° and no pinching at the poles.
AGING_SEED = 1570
AGING_GRID = (512, 256)  # Low resolution is enough for soft variation; upscaled later.
AGING_OCTAVES = ((1.5, 1.0), (3.0, 0.5), (6.0, 0.25), (12.0, 0.125))
AGING_DARK = (150, 112, 66)  # Toned, older paper
AGING_LIGHT = (248, 238, 212)  # Slightly paler, less exposed paper
AGING_DARK_STRENGTH = 0.2
AGING_LIGHT_STRENGTH = 0.1
# Polar caps of old globes are often darker from handling and the meridian ring.
POLAR_DARKENING = 0.1
POLAR_START_LAT = 55


def wrap_pad(image: Image.Image, pad: int) -> Image.Image:
    """Pads horizontally by wrapping around ±180° and vertically by repeating edge rows."""
    w, h = image.size
    padded = Image.new(image.mode, (w + 2 * pad, h + 2 * pad))
    padded.paste(image, (pad, pad))
    padded.paste(image.crop((w - pad, 0, w, h)), (0, pad))
    padded.paste(image.crop((0, 0, pad, h)), (w + pad, pad))
    top = padded.crop((0, pad, w + 2 * pad, pad + 1)).resize((w + 2 * pad, pad))
    bottom = padded.crop((0, h + pad - 1, w + 2 * pad, h + pad)).resize((w + 2 * pad, pad))
    padded.paste(top, (0, 0))
    padded.paste(bottom, (0, h + pad))
    return padded


def coastline_mask(water: Image.Image) -> Image.Image:
    """A ~2px coastline at source resolution, downsampled to a fine antialiased line."""
    pad = 2
    land = wrap_pad(ImageOps.invert(water), pad)
    edge = ImageChops.difference(
        land.filter(ImageFilter.MaxFilter(3)), land.filter(ImageFilter.MinFilter(3))
    )
    w, h = water.size
    edge = edge.crop((pad, pad, pad + w, pad + h)).resize(OUTPUT_SIZE, Image.LANCZOS)
    return edge.point(lambda v: int(min(255, v * 1.4) * COAST_INK_OPACITY))


def value_noise_3d(seed: int):
    """Smooth 3D value noise in [0, 1] (lattice values with smoothstep interpolation)."""
    rng = random.Random(seed)
    perm = list(range(256))
    rng.shuffle(perm)
    perm += perm
    values = [rng.random() for _ in range(256)]

    def lattice(x: int, y: int, z: int) -> float:
        return values[perm[perm[perm[x & 255] + (y & 255)] + (z & 255)]]

    def noise(x: float, y: float, z: float) -> float:
        ix, iy, iz = math.floor(x), math.floor(y), math.floor(z)
        fx, fy, fz = x - ix, y - iy, z - iz
        sx, sy, sz = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy), fz * fz * (3 - 2 * fz)

        def lerp(a: float, b: float, t: float) -> float:
            return a + (b - a) * t

        x00 = lerp(lattice(ix, iy, iz), lattice(ix + 1, iy, iz), sx)
        x10 = lerp(lattice(ix, iy + 1, iz), lattice(ix + 1, iy + 1, iz), sx)
        x01 = lerp(lattice(ix, iy, iz + 1), lattice(ix + 1, iy, iz + 1), sx)
        x11 = lerp(lattice(ix, iy + 1, iz + 1), lattice(ix + 1, iy + 1, iz + 1), sx)
        return lerp(lerp(x00, x10, sy), lerp(x01, x11, sy), sz)

    return noise


def aging_masks() -> tuple[Image.Image, Image.Image]:
    """Masks for darker and lighter paper tones, sampled on the sphere."""
    noise = value_noise_3d(AGING_SEED)
    total_amp = sum(amp for _, amp in AGING_OCTAVES)
    w, h = AGING_GRID
    dark, light = [], []

    for row in range(h):
        lat = math.radians(90 - (row + 0.5) * 180 / h)
        polar = max(0.0, (abs(math.degrees(lat)) - POLAR_START_LAT) / (90 - POLAR_START_LAT))
        for col in range(w):
            lng = math.radians((col + 0.5) * 360 / w - 180)
            x, y, z = math.cos(lat) * math.cos(lng), math.cos(lat) * math.sin(lng), math.sin(lat)
            n = sum(
                amp * noise(x * freq + 17.3, y * freq + 5.1, z * freq + 11.7)
                for freq, amp in AGING_OCTAVES
            ) / total_amp
            # Stretch the noise (which clusters near 0.5) to use the full range.
            t = min(1.0, max(0.0, (n - 0.3) / 0.4))
            dark.append(int(255 * min(1.0, t * AGING_DARK_STRENGTH + polar * polar * POLAR_DARKENING)))
            light.append(int(255 * (1 - t) * AGING_LIGHT_STRENGTH))

    def upscale(values: list[int]) -> Image.Image:
        grid = Image.new('L', AGING_GRID)
        grid.putdata(values)
        # Wrap-pad before resampling so interpolation is continuous across ±180°.
        pad, scale = 4, OUTPUT_SIZE[0] // w
        big = wrap_pad(grid, pad).resize(((w + 2 * pad) * scale, (h + 2 * pad) * scale), Image.BICUBIC)
        return big.crop((pad * scale, pad * scale, pad * scale + OUTPUT_SIZE[0], pad * scale + OUTPUT_SIZE[1]))

    return upscale(dark), upscale(light)


def main(source_path: str, output_path: str) -> None:
    Image.MAX_IMAGE_PIXELS = None  # The 1:50m source is 10800x5400.
    source = Image.open(source_path).convert('RGB')

    # Build the land mask at full resolution, then downsample for smooth coastlines.
    red, _, blue = source.split()
    water = ImageChops.subtract(blue, red).point(
        lambda v: 255 if v > WATER_THRESHOLD else 0
    )
    land_mask = ImageOps.invert(water).resize(OUTPUT_SIZE, Image.LANCZOS)
    coast_ink = coastline_mask(water)

    luminance = source.convert('L').resize(OUTPUT_SIZE, Image.LANCZOS)
    del source, red, blue, water

    land = ImageOps.colorize(luminance, **LAND, **LAND_POINTS)
    ocean = ImageOps.colorize(luminance, **OCEAN, **OCEAN_POINTS)

    near_coast = land_mask.filter(ImageFilter.GaussianBlur(COAST_WASH_RADIUS))
    wash = near_coast.point(lambda v: int(v * COAST_WASH_STRENGTH))
    ocean = Image.composite(Image.new('RGB', OUTPUT_SIZE, OCEAN['black']), ocean, wash)

    result = Image.composite(land, ocean, land_mask)
    result = Image.composite(Image.new('RGB', OUTPUT_SIZE, COAST_INK), result, coast_ink)

    # Age the whole sheet last, so ink and terrain share the same paper tone.
    dark, light = aging_masks()
    toned = ImageChops.multiply(result, Image.new('RGB', OUTPUT_SIZE, AGING_DARK))
    result = Image.composite(toned, result, dark)
    result = Image.composite(Image.new('RGB', OUTPUT_SIZE, AGING_LIGHT), result, light)

    result.save(output_path, 'JPEG', quality=84, optimize=True, progressive=True)
    print(f'Wrote {output_path} ({result.width}x{result.height})')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
