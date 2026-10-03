"""Export authored MBG geometry and outlined lettering. Fonts remain OFL licensed."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools'))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
font_file = next((ROOT / 'node_modules/@fontsource-variable/bricolage-grotesque/files').glob('*latin-ext-wght-normal.woff2'))
font = TTFont(font_file)
font = instantiateVariableFont(font, {'wght': 650}, inplace=False)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm
latin_font = instantiateVariableFont(TTFont(ROOT / 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2'), {'wght': 650}, inplace=False)
latin_glyphs = latin_font.getGlyphSet()
latin_cmap = latin_font.getBestCmap()

def lettering(text, x, baseline, size, color):
    paths = []
    scale = size / units
    for letter in text:
        charset = cmap if ord(letter) in cmap else latin_cmap
        shapes = glyphs if ord(letter) in cmap else latin_glyphs
        name = charset[ord(letter)]
        pen = SVGPathPen(shapes)
        shapes[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        paths.append(f'<path d="{pen.getCommands()}" fill="{color}"/>')
        x += shapes[name].width * scale
    return ''.join(paths)

def export(name, light=False, mono=False, compact=False):
    ink = '#f8f7f2' if light else '#245b47'
    accent = ink if mono else '#dce5a5' if light else '#a8492f'
    width = 350 if compact else 440
    mark = f'<path d="M10 60V30C10 18 18 10 30 10S50 18 50 30V60M50 30C50 18 58 10 70 10S90 18 90 30V45" fill="none" stroke="{ink}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="90" cy="60" r="5" fill="{accent}"/>'
    words = lettering('MBG', 125, 65, 67, ink) if compact else lettering('Małopolska', 125, 36, 34, ink) + lettering('bez granic', 125, 72, 34, ink)
    text = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 90" role="img"><title>Małopolska bez granic — MBG</title><desc>Otwarte przęsła i litera M. Autorski znak; logotyp Bricolage Grotesque zamieniony na krzywe.</desc><g transform="translate(0 7)">{mark}</g>{words}</svg>'
    (ROOT / 'public/brand' / name).write_text(text, encoding='utf-8')

export('mbg-logo.svg')
export('mbg-logo-light.svg', light=True)
export('mbg-logo-mono.svg', mono=True)
export('mbg-monogram.svg', compact=True)
print('Four outlined SVG logo variants exported.')
