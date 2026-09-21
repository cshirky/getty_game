#!/usr/bin/env python3
"""Render every Tier A board as a browsable page of 2x2 grids.

A mockup only -- nothing here is wired to the game. It exists so the boards can
be judged the way a player meets them: as pictures, side by side, where a theme
that looked right in a title list turns out to be two works with nothing
visible in common.

Reads DATA/board_works.json (written by fetch_board_images.py) and writes
DATA/two-by-two_boards.html.
"""

import html
import itertools
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import two_by_two_candidates as tbt  # noqa: E402

CACHE = HERE / "board_works.json"
OUT = HERE / "two-by-two_boards.html"
# "^!600,600" fits the image inside a 600px box. The leading caret is the
# IIIF 3.0 opt-in to upscaling: without it the server returns 400 for any
# image smaller than the box, which several of these are.
IIIF = "https://media.getty.edu/iiif/image/{}/full/%5E%21600,600/0/default.jpg"
OBJECT_PAGE = "https://www.getty.edu/art/collection/object/{}"


def load_works():
    if not CACHE.exists():
        sys.exit(f"missing {CACHE} -- run fetch_board_images.py first")
    return json.loads(CACHE.read_text())


def tier_a_boards(artists, themed, boards, overlap):
    for a, b, shared in boards:
        tier = tbt.tier_of(tbt.medium_of(a, artists[a]), tbt.medium_of(b, artists[b]))
        if tier != "A":
            continue
        for t1, t2 in tbt.valid_theme_pairs(themed, a, b, shared, overlap):
            yield a, b, t1, t2


def grid_variants(themed, a, b, t1, t2):
    """Every distinct filling of the four cells, skipping reused works.

    A cell often has more than one candidate, so one artist/theme pairing can
    yield several boards. A work cannot appear twice on the same board, which
    rules out the combinations where a title matched both themes.
    """
    for w11 in themed[a][t1]:
        for w12 in themed[a][t2]:
            if w11 == w12:
                continue
            for w21 in themed[b][t1]:
                for w22 in themed[b][t2]:
                    if w21 == w22:
                        continue
                    yield (w11, w12, w21, w22)


def card(works, artist, title):
    rec = works.get(f"{artist}||{title}") or {}
    iiif, date = rec.get("iiif"), rec.get("date")
    object_id = rec.get("objectId")
    esc_title = html.escape(title)

    if iiif:
        img = (f'<img loading="lazy" src="{IIIF.format(iiif)}" '
               f'alt="{esc_title}">')
    else:
        img = '<div class="missing">no image resolved</div>'

    inner = (f'<div class="thumb">{img}</div>'
             f'<div class="meta">'
             f'<div class="t">{esc_title}</div>'
             f'<div class="a">{html.escape(artist.split(" (")[0])}</div>'
             f'<div class="d">{html.escape(date or "date unknown")}</div>'
             f'</div>')

    if object_id:
        return (f'<a class="card" target="_blank" rel="noopener" '
                f'href="{OBJECT_PAGE.format(object_id)}">{inner}</a>')
    return f'<div class="card">{inner}</div>'


def render():
    artists, centuries, themed, boards, overlap = tbt.main()
    works = load_works()

    sections, nav, n_boards, n_grids = [], [], 0, 0
    for a, b, t1, t2 in tier_a_boards(artists, themed, boards, overlap):
        variants = list(grid_variants(themed, a, b, t1, t2))
        if not variants:
            continue
        n_boards += 1
        n_grids += len(variants)
        slug = f"b{n_boards}"
        short_a, short_b = a.split(" (")[0], b.split(" (")[0]
        nav.append(f'<a href="#{slug}">{html.escape(short_a)} × '
                   f'{html.escape(short_b)}<span>{html.escape(t1)} · '
                   f'{html.escape(t2)}</span></a>')

        grids = []
        for i, (w11, w12, w21, w22) in enumerate(variants, 1):
            label = (f'<div class="variant">Variant {i} of {len(variants)}</div>'
                     if len(variants) > 1 else "")
            grids.append(f"""
            {label}
            <div class="grid">
              <div class="corner"></div>
              <div class="colhead">{html.escape(t1)}</div>
              <div class="colhead">{html.escape(t2)}</div>
              <div class="rowhead">{html.escape(short_a)}</div>
              {card(works, a, w11)}
              {card(works, a, w12)}
              <div class="rowhead">{html.escape(short_b)}</div>
              {card(works, b, w21)}
              {card(works, b, w22)}
            </div>""")

        sections.append(f"""
        <section id="{slug}">
          <h2>{html.escape(short_a)} <span class="x">×</span> {html.escape(short_b)}</h2>
          <p class="sub">
            Rows: same artist · Columns: {html.escape(t1)} / {html.escape(t2)}
            <span class="cent">{html.escape(tbt.pretty_century(centuries.get(a)))}
            &amp; {html.escape(tbt.pretty_century(centuries.get(b)))}</span>
          </p>
          {''.join(grids)}
        </section>""")

    return PAGE.format(
        nav="\n".join(nav),
        sections="\n".join(sections),
        n_boards=n_boards,
        n_grids=n_grids,
    )


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Two by Two — Tier A boards</title>
<style>
  :root {{
    --bg: #14120e; --panel: #1d1a15; --ink: #f2ece1; --dim: #a49c8d;
    --rule: #3a352d; --accent: #e0a24e; --accent2: #8fb4ee;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg); color: var(--ink);
    font: 15px/1.5 "Source Sans 3", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }}
  header {{
    padding: 28px 32px 22px; border-bottom: 1px solid var(--rule);
    background: #100e0a;
  }}
  h1 {{ font: 600 25px/1.2 "Playfair Display", Georgia, serif; }}
  header p {{ color: var(--dim); margin-top: 8px; max-width: 70ch; font-size: 14px; }}
  .wrap {{ display: flex; align-items: flex-start; }}
  nav {{
    position: sticky; top: 0; flex: 0 0 258px; max-height: 100vh;
    overflow-y: auto; padding: 18px 14px; border-right: 1px solid var(--rule);
  }}
  nav a {{
    display: block; padding: 7px 9px; border-radius: 4px;
    color: var(--ink); text-decoration: none; font-size: 13px;
  }}
  nav a span {{ display: block; color: var(--dim); font-size: 11px; }}
  nav a:hover {{ background: var(--panel); }}
  main {{ flex: 1; padding: 22px 32px 80px; min-width: 0; }}
  section {{
    background: var(--panel); border: 1px solid var(--rule);
    border-radius: 8px; padding: 20px 22px 24px; margin-bottom: 22px;
  }}
  h2 {{ font: 600 19px/1.3 "Playfair Display", Georgia, serif; }}
  h2 .x {{ color: var(--accent); }}
  .sub {{ color: var(--dim); font-size: 13px; margin: 5px 0 18px; }}
  .cent {{ display: block; font-size: 12px; opacity: .8; margin-top: 2px; }}
  .variant {{
    color: var(--accent); font-size: 11px; letter-spacing: .1em;
    text-transform: uppercase; margin: 16px 0 8px;
  }}
  .grid {{
    display: grid; gap: 10px;
    grid-template-columns: 92px repeat(2, minmax(0, 1fr));
    max-width: 680px;
  }}
  .colhead, .rowhead {{
    color: var(--dim); font-size: 11px; letter-spacing: .08em;
    text-transform: uppercase; display: flex; align-items: center;
  }}
  .colhead {{ justify-content: center; text-align: center; color: var(--accent2); }}
  .rowhead {{ color: var(--accent); }}
  .card {{
    background: #0c0b09; border: 1px solid var(--rule); border-radius: 5px;
    overflow: hidden; text-decoration: none; color: inherit; display: block;
    transition: border-color .15s, transform .12s;
  }}
  a.card:hover {{ border-color: var(--accent); transform: translateY(-2px); }}
  .thumb {{
    height: 210px; display: flex; align-items: center;
    justify-content: center; background: #000;
  }}
  .thumb img {{ max-width: 100%; max-height: 100%; display: block; }}
  .missing {{ color: #b0645e; font-size: 12px; }}
  .meta {{ padding: 8px 10px 10px; }}
  .meta .t {{
    font: italic 400 13px/1.3 "Playfair Display", Georgia, serif;
    margin-bottom: 3px;
  }}
  .meta .a {{ font-size: 11.5px; color: var(--dim); }}
  .meta .d {{ font-size: 11.5px; color: var(--dim); opacity: .75; }}
  @media (max-width: 760px) {{
    .wrap {{ display: block; }}
    nav {{ position: static; width: auto; max-height: none;
          border-right: 0; border-bottom: 1px solid var(--rule); }}
    main {{ padding: 18px; }}
  }}
</style>
</head>
<body>
<header>
  <h1>Two by Two — Tier A boards</h1>
  <p>
    Every 2&times;2 the Tier A pairs can make: {n_boards} artist/subject pairings,
    {n_grids} grids once each cell's alternatives are counted. Rows are one
    artist, columns one subject. A mockup for judging the boards by eye —
    nothing here is connected to the game. Subjects were matched on title text,
    so this page is where that guess gets checked against the pictures. Cards
    link to the Getty object page.
  </p>
</header>
<div class="wrap">
  <nav>{nav}</nav>
  <main>{sections}</main>
</div>
</body>
</html>
"""


if __name__ == "__main__":
    OUT.write_text(render(), encoding="utf-8")
    print(f"wrote {OUT}")
