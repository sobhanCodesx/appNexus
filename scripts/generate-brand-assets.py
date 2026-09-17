from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets" / "images"
SOURCE = IMAGES / "logo.png"
MASTER = IMAGES / "playnexus-app-icon.png"


def contain(image: Image.Image, size: int, ratio: float) -> Image.Image:
    target = int(size * ratio)
    resized = image.copy()
    resized.thumbnail((target, target), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


source = Image.open(SOURCE).convert("RGBA")
pixels = source.load()
mark = Image.new("RGBA", source.size, (0, 0, 0, 0))
mark_pixels = mark.load()

for y in range(source.height):
    for x in range(source.width):
        red, green, blue, _ = pixels[x, y]
        cyan_strength = max(0, min(255, (min(green, blue) - 105) * 2))
        if cyan_strength > 8 and green - red > 55 and blue - red > 70:
            mark_pixels[x, y] = (31, 224, 239, cyan_strength)

bounds = mark.getbbox()
if bounds is None:
    raise RuntimeError("Could not extract the PlayNexus mark")

mark = mark.crop(bounds)
master = Image.open(MASTER).convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
master.save(MASTER, optimize=True)

foreground = contain(mark, 1024, 0.62)
foreground.save(IMAGES / "playnexus-adaptive-foreground.png", optimize=True)

monochrome = Image.new("RGBA", foreground.size, (255, 255, 255, 0))
monochrome.putalpha(foreground.getchannel("A"))
monochrome.save(IMAGES / "playnexus-monochrome.png", optimize=True)

splash = contain(mark, 512, 0.72)
splash.save(IMAGES / "playnexus-splash.png", optimize=True)

notification = contain(mark, 96, 0.72)
alpha = notification.getchannel("A").point(lambda value: 255 if value >= 32 else 0)
white = Image.new("RGBA", notification.size, (255, 255, 255, 0))
white.putalpha(alpha)
white.save(IMAGES / "playnexus-notification.png", optimize=True)
