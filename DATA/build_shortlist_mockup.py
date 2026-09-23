#!/usr/bin/env python3
"""Render a hand-picked shortlist of boards, artists across the columns.

The companion page (build_board_mockup.py) shows every Tier A board with
artists as rows. This one shows a chosen few transposed -- artists across the
top, subjects down the side -- to read the same boards the other way round.

The shortlist is SPEC below: each entry names two artists, two subjects, which
variants to show (numbered as on the full page) and an optional note. Edit SPEC
and re-run.
"""

import html
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import two_by_two_candidates as tbt  # noqa: E402
import build_board_mockup as bm  # noqa: E402

OUT = HERE / "two-by-two_shortlist.html"

BOUCHER = "François Boucher"
RICCI = "Sebastiano Ricci"
RUBENS = "Peter Paul Rubens"
VAN_DYCK = "Anthony van Dyck"
TIEPOLO = "Giovanni Battista Tiepolo"

HUNT = "Diana / the hunt"
PORTRAIT = "Portrait head or bust"

# (artist A, artist B, subject 1, subject 2, variants to show, note)
SPEC = [
    (BOUCHER,  RICCI,   "Animals", "Venus", [4, 5, 6], ""),
    (BOUCHER,  RUBENS,  "Animals", "Venus", [4, 5, 6], ""),
    (BOUCHER,  RUBENS,  HUNT,      "Venus", [1, 2, 3, 4, 5, 6],
     "Boucher drawing — his <em>Leopard Hunt</em> is red chalk; "
     "every other work on these boards is oil."),
    (RUBENS,   RICCI,   "Animals", "Venus", [1],
     "Only one variant exists for this pairing, not six."),
    (RUBENS,   RICCI,   HUNT,      "Venus", [1, 2], ""),
    (VAN_DYCK, TIEPOLO, "Landscape", PORTRAIT, [2, 3],
     "Giovanni Battista, not Domenico — Domenico's board is a false positive "
     "(<em>The Punchinello Riding a Camel at the Head of a Caravan</em> was "
     "read as a portrait by the words &ldquo;head of a&rdquo;)."),
]


def short(name):
    return name.split(" (")[0]


def render():
    artists, centuries, themed, _boards, _overlap = tbt.main()
    works = bm.load_works()

    sections, nav, rows, n_grids = [], [], [], 0

    for idx, (a, b, t1, t2, picks, note) in enumerate(SPEC, 1):
        variants = list(bm.grid_variants(themed, a, b, t1, t2))
        slug = f"s{idx}"
        chosen = [(i, variants[i - 1]) for i in picks if 1 <= i <= len(variants)]
        n_grids += len(chosen)

        rows.append(
            f"<tr><td>{html.escape(short(a))}</td><td>{html.escape(short(b))}</td>"
            f"<td>{', '.join(str(i) for i, _ in chosen)} of {len(variants)}</td>"
            f"<td>{html.escape(t1)}</td><td>{html.escape(t2)}</td>"
            f"<td>{note or ''}</td></tr>"
        )
        nav.append(f'<a href="#{slug}">{html.escape(short(a))} × '
                   f'{html.escape(short(b))}<span>{html.escape(t1)} · '
                   f'{html.escape(t2)}</span></a>')

        grids = []
        for i, (w11, w12, w21, w22) in chosen:
            grids.append(f"""
            <div class="board">
              <div class="variant">Variant {i} of {len(variants)}</div>
              <div class="grid">
                <div class="corner"></div>
                <div class="colhead">{html.escape(short(a))}</div>
                <div class="colhead">{html.escape(short(b))}</div>
                <div class="rowhead">{html.escape(t1)}</div>
                {bm.card(works, a, w11)}
                {bm.card(works, b, w21)}
                <div class="rowhead">{html.escape(t2)}</div>
                {bm.card(works, a, w12)}
                {bm.card(works, b, w22)}
              </div>
            </div>""")

        note_html = f'<p class="note">{note}</p>' if note else ""
        sections.append(f"""
        <section id="{slug}">
          <h2>{html.escape(short(a))} <span class="x">×</span> {html.escape(short(b))}</h2>
          <p class="sub">
            Columns: same artist · Rows: {html.escape(t1)} / {html.escape(t2)}
            <span class="cent">{html.escape(tbt.pretty_century(centuries.get(a)))}
            &amp; {html.escape(tbt.pretty_century(centuries.get(b)))}</span>
          </p>
          {note_html}
          <div class="boards">{''.join(grids)}</div>
        </section>""")

    return PAGE.format(nav="\n".join(nav), sections="\n".join(sections),
                       rows="\n".join(rows), n_specs=len(SPEC), n_grids=n_grids)


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Two by Two — shortlist</title>
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
  header {{ padding: 28px 32px 22px; border-bottom: 1px solid var(--rule);
           background: #100e0a; }}
  h1 {{ font: 600 25px/1.2 "Playfair Display", Georgia, serif; }}
  header p {{ color: var(--dim); margin-top: 8px; max-width: 74ch; font-size: 14px; }}
  table.spec {{
    margin-top: 16px; border-collapse: collapse; font-size: 12.5px;
    max-width: 100%;
  }}
  table.spec th, table.spec td {{
    border: 1px solid var(--rule); padding: 5px 9px; text-align: left;
    vertical-align: top;
  }}
  table.spec th {{ color: var(--accent2); font-weight: 600; }}
  table.spec td:nth-child(6) {{ color: var(--dim); max-width: 34ch; }}
  .wrap {{ display: flex; align-items: flex-start; }}
  nav {{
    position: sticky; top: 0; flex: 0 0 254px; max-height: 100vh;
    overflow-y: auto; padding: 18px 14px; border-right: 1px solid var(--rule);
  }}
  nav a {{ display: block; padding: 7px 9px; border-radius: 4px;
          color: var(--ink); text-decoration: none; font-size: 13px; }}
  nav a span {{ display: block; color: var(--dim); font-size: 11px; }}
  nav a:hover {{ background: var(--panel); }}
  main {{ flex: 1; padding: 22px 32px 80px; min-width: 0; }}
  section {{
    background: var(--panel); border: 1px solid var(--rule);
    border-radius: 8px; padding: 20px 22px 24px; margin-bottom: 22px;
  }}
  h2 {{ font: 600 19px/1.3 "Playfair Display", Georgia, serif; }}
  h2 .x {{ color: var(--accent); }}
  .sub {{ color: var(--dim); font-size: 13px; margin: 5px 0 10px; }}
  .cent {{ display: block; font-size: 12px; opacity: .8; margin-top: 2px; }}
  .note {{
    border-left: 2px solid var(--accent); padding: 7px 12px; margin: 0 0 16px;
    background: rgba(224,162,78,.07); color: var(--ink);
    font-size: 13px; max-width: 78ch;
  }}
  .note em {{ font-family: "Playfair Display", Georgia, serif; }}
  .boards {{ display: flex; flex-wrap: wrap; gap: 26px; }}
  .board {{ flex: 0 0 auto; }}
  .variant {{
    color: var(--accent); font-size: 11px; letter-spacing: .1em;
    text-transform: uppercase; margin-bottom: 8px;
  }}
  .grid {{
    display: grid; gap: 9px;
    grid-template-columns: 74px repeat(2, 176px);
  }}
  .colhead, .rowhead {{
    color: var(--dim); font-size: 10.5px; letter-spacing: .07em;
    text-transform: uppercase; display: flex; align-items: center;
  }}
  .colhead {{ justify-content: center; text-align: center; color: var(--accent); }}
  .rowhead {{ color: var(--accent2); line-height: 1.25; }}
  .card {{
    background: #0c0b09; border: 1px solid var(--rule); border-radius: 5px;
    overflow: hidden; text-decoration: none; color: inherit; display: block;
    transition: border-color .15s, transform .12s;
  }}
  a.card:hover {{ border-color: var(--accent); transform: translateY(-2px); }}
  .thumb {{ height: 168px; display: flex; align-items: center;
           justify-content: center; background: #000; }}
  .thumb img {{ max-width: 100%; max-height: 100%; display: block; }}
  .missing {{ color: #b0645e; font-size: 12px; }}
  .meta {{ padding: 7px 9px 9px; }}
  .meta .t {{ font: italic 400 12px/1.3 "Playfair Display", Georgia, serif;
             margin-bottom: 2px; }}
  .meta .a, .meta .d {{ font-size: 11px; color: var(--dim); }}
  .meta .d {{ opacity: .75; }}
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
  <h1>Two by Two — shortlist</h1>
  <p>
    {n_specs} chosen pairings, {n_grids} boards, laid out with <strong>artists
    across the columns</strong> and <strong>subjects down the rows</strong> —
    the transpose of the full Tier A page. Variant numbers match that page.
    Cards link to the Getty object page.
  </p>
  <table class="spec">
    <tr><th>Artist 1</th><th>Artist 2</th><th>Variants</th>
        <th>Row 1</th><th>Row 2</th><th>Notes</th></tr>
    {rows}
  </table>
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
