"""Splits the Bird Design character sheets into one optimized SVG per character.

One-off. Run from the repo root after converting the artist's PDFs with poppler:

  pdftocairo -svg source/artwork/BusPlayground_char_CMYK.pdf BusPlayground_char_CMYK.svg
  pdftocairo -svg "source/artwork/SCAVENGERS 2 characters.pdf" SCAVENGERS_2_characters.svg
  pdftocairo -svg "source/artwork/LIGHTNING BOLT 1.pdf" LIGHTNING_BOLT_1.svg
  python3 -I scripts/split-characters.py

Each path is assigned to a character by the region its bounding-box centre falls in
(R below). The regions were tuned by eye on the 1529 x 917 sheet, so a different
sheet needs new regions. Output goes to public/art/characters/.
"""
import re, sys, os, json
OUT = 'public/art/characters'
os.makedirs(OUT, exist_ok=True)

def load(fn):
    svg = open(fn).read()
    items = []
    for p in re.findall(r'<path [^>]*/>', svg):
        d = re.search(r' d="([^"]*)"', p).group(1)
        nums = list(map(float, re.findall(r'-?\d+\.?\d*(?:e-?\d+)?', d)))
        xs, ys = nums[0::2], nums[1::2]
        m = re.search(r'fill="rgb\(([\d.]+)%, ([\d.]+)%, ([\d.]+)%\)"', p)
        hexc = '#%02x%02x%02x' % tuple(round(float(v) * 2.55) for v in m.groups())
        items.append(dict(d=d, bbox=(min(xs), min(ys), max(xs), max(ys)), fill=hexc))
    return items

def short(d):  # 1-decimal coordinates, no trailing zeros
    return re.sub(r'-?\d+\.\d+', lambda m: ('%.1f' % float(m.group())).rstrip('0').rstrip('.'), d)

def write(name, its, pad=2):
    x0 = min(i['bbox'][0] for i in its) - pad; y0 = min(i['bbox'][1] for i in its) - pad
    x1 = max(i['bbox'][2] for i in its) + pad; y1 = max(i['bbox'][3] for i in its) + pad
    w, h = x1 - x0, y1 - y0
    body = ''.join(f'<path fill="{i["fill"]}" d="{short(i["d"])}"/>' for i in its)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}">{body}</svg>\n'
    open(f'{OUT}/{name}.svg', 'w').write(svg)
    return len(svg), round(w), round(h)

# Regions in sheet units (x0, y0, x1, y1); a path belongs to the region holding its bbox centre.
R = {
 'blue-flame': (15,0,150,210), 'orange-flame': (245,0,390,210), 'green-punk': (435,0,670,215),
 'pink-sunburst': (700,0,870,215), 'magenta-spiky': (930,0,1105,220),
 'orange-spotted': (115,225,250,440), 'sky-blue-big': (360,205,617,460), 'pink-pointy': (618,205,770,455),
 'orange-mushroom': (-15,500,135,655), 'green-flower': (215,455,410,700), 'blue-robot': (465,480,660,670),
 'green-robot': (685,455,935,700), 'green-teardrop': (990,475,1125,680),
}
sheet = load('BusPlayground_char_CMYK.svg')
groups = {k: [] for k in R}; stray = []
for it in sheet:
    b = it['bbox']; cx, cy = (b[0]+b[2])/2, (b[1]+b[3])/2
    for k, (a, c, e, f) in R.items():
        if a <= cx <= e and c <= cy <= f: groups[k].append(it); break
    else: stray.append(it)
print('stray paths:', [(round(s['bbox'][0]),round(s['bbox'][1]),round(s['bbox'][2]),round(s['bbox'][3]),s['fill']) for s in stray])
total = 0
for k, its in groups.items():
    n, w, h = write(k, its); total += n; print(f'{k:16} paths={len(its):3} {w}x{h} {n} bytes')

# Scavengers sheet: two pink characters
sc = load('SCAVENGERS_2_characters.svg')
for name, (a, e) in {'pink-thumbs-1': (0, 300), 'pink-thumbs-2': (500, 810)}.items():
    its = [i for i in sc if a <= (i['bbox'][0]+i['bbox'][2])/2 <= e and (i['bbox'][3]-i['bbox'][1]) < 600]
    n, w, h = write(name, its); total += n; print(f'{name:16} paths={len(its):3} {w}x{h} {n} bytes')
bolt = load('LIGHTNING_BOLT_1.svg'); n, w, h = write('lightning-bolt', bolt, pad=0); total += n; print('lightning-bolt', w, h, n)
print('total bytes', total)
pal = sorted({i['fill'] for i in sheet + sc + bolt})
print('palette:', pal)
