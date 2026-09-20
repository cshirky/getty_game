#!/usr/bin/env python3
"""Find artist pairs that share two visually recognizable themes.

A "Two by Two" board needs artists A and B and themes T1 and T2 such that all
four cells A/T1, A/T2, B/T1, B/T2 hold at least one work. Themes are keyed off
title text, and deliberately restricted to subjects a player can *see* -- a
crucifixion, a mother holding a baby, a landscape -- rather than ones that need
iconographic training to name.
"""

import csv
import itertools
import re
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent

# Each theme: (label, what a player sees, regex over the title).
# Order matters only for reporting; a title may match several themes.
THEMES = [
    ("Virgin and Child",
     "a seated woman holding an infant",
     r"\b(madonna|virgin)\b.{0,30}\bchild\b|\bchild\b.{0,20}\bvirgin\b"),

    ("Crucifixion",
     "a man on a cross",
     r"\bcrucifix|\bchrist on the cross\b|\bthe cross\b"),

    ("Annunciation",
     "an angel addressing a kneeling woman",
     r"\bannunciation\b"),

    ("Nativity / Adoration of the Shepherds",
     "a newborn in a stable with onlookers",
     r"\bnativity\b|\badoration of the shepherds\b"),

    ("Adoration of the Magi",
     "richly dressed kings presenting gifts to a baby",
     r"\badoration of the magi\b"),

    ("Entombment / Lamentation / Pietà",
     "a dead body being mourned or laid down",
     r"\bentombment\b|\blamentation\b|\bpiet(a|à)\b|\bdeposition\b|\bman of sorrows\b"),

    ("Last Judgment",
     "tiers of figures rising and falling",
     r"\blast judgment\b"),

    ("Pentecost",
     "a gathered group with flames overhead",
     r"\bpentecost\b"),

    ("Single saint",
     "one robed figure, often with an attribute",
     r"\bsaint\b(?!.{0,25}\b(and|with)\b)|\bst\.\s"),

    ("David in prayer",
     "a crowned man kneeling, hands together",
     r"\bdavid\b.{0,20}\b(in prayer|praying)\b|\bking david\b"),

    ("Venus",
     "a reclining or rising nude woman",
     r"\bvenus\b|\bv(e|é)nus\b"),

    ("Bacchus",
     "a wreathed youth with grapes or wine",
     r"\bbacchus\b|\bbacchanal"),

    ("Diana / the hunt",
     "a huntress with hounds, or a hunting scene",
     r"\bdiana\b|\bhunt\b|\bchasse\b"),

    ("Cupid / Psyche",
     "a winged child, or a couple with one",
     r"\bcupid\b|\bpsyche\b|\bamor\b"),

    ("Portrait head or bust",
     "one person facing the viewer",
     r"\bportrait\b|\bhead of a\b|\bbust\b|\bself-portrait\b"),

    ("Landscape",
     "open country, little or no figure interest",
     r"\blandscape\b|\bpaysage\b|\bview of\b|\bmarine\b"),

    ("Flowers / still life",
     "arranged objects or blooms on a surface",
     r"\bstill life\b|\bflower|\bfleurs\b|\bbouquet\b|\bfruit\b|\bvase of\b"),

    ("Animals",
     "one or more beasts as the subject",
     r"\bdog\b|\bhorse\b|\blion\b|\bleopard\b|\bboar\b|\bbird\b|\bstag\b|\bbull\b"),
]

COMPILED = [(label, seen, re.compile(pat, re.I)) for label, seen, pat in THEMES]

# Sheets of studies and two-sided drawings. These carry a subject in the title
# but do not *read* as one image of it -- "Four Studies of Heads Drawn over a
# Copy of Saint John the Evangelist (recto); Three Studies of Men (verso)" is a
# working sheet, and no player will see "a saint" in it.
SKETCH = re.compile(
    r"\bstud(y|ies)\b|\bsketch|\(recto\)|\(verso\)|\bcartoon for\b|"
    r"\bafter the antique\b|\bcopy (of|after)\b",
    re.I,
)

# Makers whose Getty holdings are furniture, metalwork, porcelain or textiles.
# Their titles name objects, not subjects, so they cannot anchor a visual theme.
DECORATIVE = re.compile(
    r"\b(commode|cabinet|table|clock|vase|candelabr|tureen|ewer|chandelier|"
    r"escutcheon|cupboard|stand|mount|chest|desk|secretaire|bureau|armoire|"
    r"tapestry|carpet|snuffbox|plaque|cup and|coffeepot|teapot|basin|salt\b)",
    re.I,
)


MANUSCRIPT = re.compile(
    r"^initial\s|\bleaf from\b|\bhours\b|\bbreviar|\bmissal\b|\bpsalter\b|"
    r"\bbook of hours\b|\bcalendar page\b|\bcutting\b|\bborder with\b|"
    r"\bhistoriated\b|\bcanon table\b|\bdecorated (initial|text)\b",
    re.I,
)


def manuscript_share(titles):
    """Fraction of an artist's works that are manuscript illumination.

    A player can learn to recognize Rubens by eye in one board. Anonymous
    illuminators working a shared workshop idiom are far harder to tell apart,
    so a high share here means the pair is a poor fit for an *intro* puzzle
    however many themes it shares.
    """
    if not titles:
        return 0.0
    hits = sum(1 for t in titles if MANUSCRIPT.search(t))
    return hits / len(titles)


def load_artists():
    """artist -> list of work titles, from the corrected 5-to-25 title list."""
    path = DATA / "artist_works_5to25.csv"
    with path.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.reader(fh))
    out = {}
    for row in rows[1:]:
        if not row or not row[0].strip():
            continue
        out[row[0].strip()] = [t.strip() for t in row[1:] if t.strip()]
    return out


def load_centuries():
    """artist -> century string, scraped from the game_artists.md table."""
    path = DATA / "game_artists.md"
    out = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) >= 3 and cells[1].isdigit():
            out[cells[0]] = cells[2]
    return out


BUCKET_LABEL = {"14-16C": "15th–16th c.", "17C": "17th c.", "18C": "18th c."}


def pretty_century(raw):
    """The bucket holding most of an artist's works.

    Getty tags by century bucket, and several artists carry a stray one-work
    outlier (Rubens has a single 14-16C item among 21 17th-century ones). The
    dominant bucket is what belongs on a card; a secondary bucket is named only
    when it holds a third or more of the works.
    """
    if not raw:
        return "unknown"
    counts = []
    for chunk in raw.split(","):
        if ":" not in chunk:
            continue
        bucket, _, num = chunk.partition(":")
        try:
            counts.append((BUCKET_LABEL.get(bucket.strip(), bucket.strip()),
                           int(num.strip())))
        except ValueError:
            continue
    if not counts:
        return "unknown"
    counts.sort(key=lambda c: -c[1])
    total = sum(n for _, n in counts)
    keep = [label for label, n in counts if n * 3 >= total]
    return ", ".join(keep) if keep else counts[0][0]


SAINT_WORD = re.compile(r"\bsaints?\b", re.I)


def refine(title, labels):
    """Resolve a title that matched several themes down to what it depicts.

    "Single saint" is the greedy one: it fires on any title containing "saint",
    including "Virgin and Child with Saint Elizabeth and Saint John the
    Baptist", which a player reads as a Virgin and Child. So a title only keeps
    that label when it names exactly one saint and matched nothing more
    specific. "Saints" plural is never a single saint.
    """
    if "Single saint" not in labels:
        return labels
    others = [l for l in labels if l != "Single saint"]
    mentions = len(SAINT_WORD.findall(title))
    plural = re.search(r"\bsaints\b", title, re.I) is not None
    if others or mentions != 1 or plural:
        return others or []
    return labels


def classify(titles):
    """theme label -> matching titles, for one artist."""
    by_theme = defaultdict(list)
    for title in titles:
        if DECORATIVE.search(title) or SKETCH.search(title):
            continue
        labels = [label for label, _seen, pat in COMPILED if pat.search(title)]
        for label in refine(title, labels):
            by_theme[label].append(title)
    return by_theme


def main():
    artists = load_artists()
    centuries = load_centuries()
    themed = {name: classify(titles) for name, titles in artists.items()}
    overlap = theme_overlap(themed)

    # Every artist pair that shares at least two themes.
    boards = []
    for a, b in itertools.combinations(sorted(themed), 2):
        shared = sorted(set(themed[a]) & set(themed[b]))
        if len(shared) < 2:
            continue
        # Drop pairs whose only shared themes collide on the same work.
        if not valid_theme_pairs(themed, a, b, shared, overlap):
            continue
        boards.append((a, b, shared))

    # Richest pairs first: more shared themes, then more works to choose from.
    def depth(entry):
        a, b, shared = entry
        return len(valid_theme_pairs(themed, a, b, shared, overlap))

    boards.sort(key=lambda e: (-depth(e), -len(e[2]), e[0], e[1]))
    return artists, centuries, themed, boards, overlap


# ── Report ──────────────────────────────────────────────────────────────────

def is_illuminator(titles):
    """True if any work is explicitly a manuscript item.

    One marker is enough: these artists' individual illuminations are titled by
    subject alone ("The Nativity"), so only the occasional "Leaf from the Hours
    of Louis XII" reveals the whole corpus as manuscript work. Imperfect --
    an illuminator whose every Getty title is a bare subject slips through.
    """
    return any(MANUSCRIPT.search(t) for t in titles)


# Sculptors and bronziers in this file. Hand-entered, because their titles name
# subjects like anyone else's -- van Opstal's five "Marine Scene" entries are
# carved reliefs, and nothing in the text says so.
SCULPTORS = {
    "Francesco Bertos",
    "Gerard van Opstal",
    "Giambologna (Giovanni da Bologna or Jean de Boulogne)",
    "Gian Lorenzo Bernini",
    "Giovanni Battista Foggini",
    "Giovanni Francesco Susini",
    "Louis-Simon Boizot",
    "Massimiliano Soldani-Benzi",
    "Pierre-Philippe Thomire",
}

# Pairs a player cannot reasonably be asked to separate by eye, with the reason.
CAUTIONS = {
    frozenset({"Giovanni Battista Tiepolo", "Giovanni Domenico Tiepolo"}):
        "Father and son. Domenico worked in his father's manner for years and "
        "specialists still argue over attributions -- unusable as a row pair.",
    frozenset({"Agnolo Bronzino", "Pontormo (Jacopo Carucci)"}):
        "Bronzino trained under Pontormo and imitated him closely in early work.",
    frozenset({"Andrea del Sarto", "Pontormo (Jacopo Carucci)"}):
        "Pontormo was del Sarto's pupil; the early hands are close.",
}


def medium_of(name, titles):
    if name in SCULPTORS:
        return "sculpture"
    return "illumination" if is_illuminator(titles) else "painting"


def tier_of(a_med, b_med):
    if "sculpture" in (a_med, b_med):
        return "S"
    if a_med == "painting" and b_med == "painting":
        return "A"
    if a_med == "illumination" and b_med == "illumination":
        return "C"
    return "B"


TIER_BLURB = {
    "S": ("Tier S — one or both are sculptors",
          "A bronze and an oil share a theme perfectly well, but a row pairing "
          "carved and painted work teaches medium, not authorship. Usable only "
          "if both rows are sculpture."),
    "A": ("Tier A — two panel/canvas painters",
          "Both hands are on paintings or drawings at painting scale, where "
          "personal style is visible without training. These are the boards to "
          "build the intro game from."),
    "B": ("Tier B — one painter, one illuminator",
          "The row difference is legible, but a player may read it as *medium* "
          "(big oil vs. tiny illumination) rather than as authorship, which "
          "teaches the wrong lesson on an intro board."),
    "C": ("Tier C — two manuscript illuminators",
          "Thematically the richest pairs in the collection, and the hardest to "
          "see. Distinguishing two 15th-century workshop hands is exactly the "
          "art-historical knowledge this redesign is meant to stop rewarding."),
}


def theme_overlap(themed):
    """(t1, t2) -> Jaccard overlap of the works each theme matches, corpus-wide.

    Two columns only work if a player can tell which one a given work belongs
    in. Animals and Diana/the hunt both collect the same hunting scenes, so a
    board using them as its two columns has no determinate answer.
    """
    members = defaultdict(set)
    for artist, by_theme in themed.items():
        for theme, works in by_theme.items():
            for work in works:
                members[theme].add((artist, work))
    out = {}
    for t1, t2 in itertools.combinations(sorted(members), 2):
        a, b = members[t1], members[t2]
        union = a | b
        if union:
            out[(t1, t2)] = len(a & b) / len(union)
    return out


# Above this share of shared works, two themes are too alike to be columns.
CONFUSABLE = 0.15


def can_fill(by_theme, t1, t2):
    """Can one artist supply two *distinct* works for themes t1 and t2?

    Themes overlap -- "Leopard Hunt" is both Animals and Diana/the hunt -- and a
    work can only sit in one cell. So a theme pair is only playable if each
    artist has two different works to give it.
    """
    w1, w2 = by_theme.get(t1, []), by_theme.get(t2, [])
    if not w1 or not w2:
        return False
    if len(w1) == 1 and len(w2) == 1:
        return w1[0] != w2[0]
    return True


def valid_theme_pairs(themed, a, b, shared, overlap=None):
    """Theme pairs that make a playable board for this artist pair.

    Excludes pairs whose themes are too alike to serve as distinguishable
    columns when `overlap` is supplied.
    """
    out = []
    for t1, t2 in itertools.combinations(shared, 2):
        if not (can_fill(themed[a], t1, t2) and can_fill(themed[b], t1, t2)):
            continue
        if overlap is not None and overlap.get((t1, t2), 0) > CONFUSABLE:
            continue
        out.append((t1, t2))
    return out


def render(artists, centuries, themed, boards, overlap):
    seen_by = {"desc": dict((label, seen) for label, seen, _ in THEMES)}
    out = []
    w = out.append

    w("# Two by Two — candidate boards")
    w("")
    w("Generated by `DATA/two_by_two_candidates.py` from "
      "`DATA/artist_works_5to25.csv`. Re-run it after editing the theme list.")
    w("")
    w("## How a board is built")
    w("")
    w("Six works are shown; four go into a 2×2 grid.")
    w("")
    w("- Each **row** is one artist.")
    w("- Each **column** is one theme.")
    w("- So a board needs artists A and B and themes T1 and T2 with all four")
    w("  cells filled: A/T1, A/T2, B/T1, B/T2.")
    w("- The two leftover works are distractors.")
    w("")
    w("A pair of artists sharing *n* themes yields `n choose 2` possible boards.")
    w("")

    w("## Method, and what it does not know")
    w("")
    w("Themes are matched on **title text**, not on the images. That has limits")
    w("worth knowing before trusting any row below:")
    w("")
    w("- A title can be silent about what is visible. An untitled saint holding")
    w("  keys is Peter to the eye and nothing to a regex.")
    w("- Getty titles describe the *object*, so furniture, silver, porcelain and")
    w("  tapestry are filtered out by keyword; a few object titles may survive.")
    w("- Sheets of studies and recto/verso drawings are also excluded. They name")
    w("  a subject but do not read as one picture of it, so they make poor cards")
    w("  in a game about looking.")
    w("- **No image URLs are in this dataset.** Every candidate here still needs")
    w("  its four images pulled and eyeballed before it becomes a real board.")
    w("- Centuries come from `game_artists.md`, which buckets as `14-16C` /")
    w("  `17C` / `18C`. Listed below is the bucket holding most of an artist's")
    w("  works, plus any second bucket holding a third or more.")
    w("- Two themes that collect the same works cannot be the two columns, since")
    w("  a player could not say which column a work belongs in. Pairs overlapping")
    w(f"  by more than {CONFUSABLE:.0%} of their works are dropped.")
    w("")
    w("### Coverage")
    w("")
    w("The source file lists titles only for artists holding **5 to 25** works.")
    w("Twenty-six artists in the collection hold more and have no title list —")
    w("but every one of them is a manuscript illuminator or scribe (Hoefnagel,")
    w("Lauber, the Bedford Master, Simon Bening), so Tier A below is not missing")
    w("a major painter. Boucher, at 30 works, is in the file anyway.")
    w("")
    w("### Themes, and what a player sees")
    w("")
    w("| Theme | Visible without knowing anything |")
    w("|---|---|")
    for label, seen, _ in THEMES:
        w(f"| {label} | {seen} |")
    w("")

    tiers = defaultdict(list)
    for a, b, shared in boards:
        t = tier_of(medium_of(a, artists[a]), medium_of(b, artists[b]))
        tiers[t].append((a, b, shared))

    w("## Summary")
    w("")
    w(f"- **{len(artists)}** artists in the source file; "
      f"**{sum(1 for t in themed.values() if t)}** have at least one themed work.")
    w(f"- **{len(boards)}** artist pairs share two or more themes.")
    for t in "ABCS":
        w(f"  - Tier {t}: {len(tiers[t])} pairs")
    w("")

    # Tier A in full: these are the ones worth building.
    for t in "ABCS":
        title, blurb = TIER_BLURB[t]
        w(f"## {title}")
        w("")
        w(blurb)
        w("")
        if not tiers[t]:
            w("_None._")
            w("")
            continue

        if t == "A":
            for a, b, shared in tiers[t]:
                w(f"### {a} + {b}")
                w("")
                w(f"- **{a}** — {pretty_century(centuries.get(a))}")
                w(f"- **{b}** — {pretty_century(centuries.get(b))}")
                pairs = valid_theme_pairs(themed, a, b, shared, overlap)
                w(f"- Shared themes: {len(shared)} → "
                  f"**{len(pairs)} playable board(s)**")
                caution = CAUTIONS.get(frozenset({a, b}))
                if caution:
                    w("")
                    w(f"> **Avoid.** {caution}")
                w("")
                if pairs:
                    w("Playable column pairs:")
                    w("")
                    for t1, t2 in pairs:
                        w(f"- {t1} × {t2}")
                    w("")
                w(f"| Theme | {a} | {b} |")
                w("|---|---|---|")
                for theme in shared:
                    av = "<br>".join(themed[a][theme])
                    bv = "<br>".join(themed[b][theme])
                    w(f"| **{theme}** | {av} | {bv} |")
                w("")
        else:
            w(f"| Artists | Centuries | Shared themes |")
            w("|---|---|---|")
            for a, b, shared in tiers[t]:
                ca = pretty_century(centuries.get(a))
                cb = pretty_century(centuries.get(b))
                cent = ca if ca == cb else f"{ca} / {cb}"
                flag = " ⚠️" if frozenset({a, b}) in CAUTIONS else ""
                w(f"| {a} + {b}{flag} | {cent} | {', '.join(shared)} |")
            w("")
            w("Works for these pairs are in the index below.")
            w("")

    w("## What the shape of this says")
    w("")
    w("- **One rich Tier A pair exists**, and it is Boucher / Ricci / Rubens")
    w("  circling the same mythological material — Venus, Diana, hunts,")
    w("  landscape. Those three artists supply most of the multi-board options.")
    w("- **Everything else in Tier A is a one-board pair**, and most rest on the")
    w("  same two columns: *Portrait head or bust* × *Virgin and Child*, or")
    w("  *Single saint* × *Virgin and Child*. Fine for one puzzle, repetitive as")
    w("  a series.")
    w("- **The collection's real depth is in illumination** (Tier C, 50 pairs),")
    w("  which is exactly where authorship is hardest to see. A game about")
    w("  looking has to spend the thinner painting material carefully.")
    w("- If Two by Two needs more than a handful of boards, the pool has to grow")
    w("  past this file — either artists below 5 works, or themes keyed to")
    w("  something other than title text.")
    w("")

    # One index of every themed work, so pair tables stay readable.
    w("## Artist–theme index")
    w("")
    w("Every work that matched a theme, by artist. `MS` marks an artist whose")
    w("Getty holdings are manuscript illumination.")
    w("")
    for name in sorted(themed):
        if not themed[name]:
            continue
        mark = " `MS`" if is_illuminator(artists[name]) else ""
        w(f"### {name}{mark}")
        w("")
        w(f"_{pretty_century(centuries.get(name))} · "
          f"{len(artists[name])} works catalogued_")
        w("")
        for theme in sorted(themed[name]):
            works = "; ".join(themed[name][theme])
            w(f"- **{theme}** — {works}")
        w("")

    return "\n".join(out)


def main_cli():
    artists, centuries, themed, boards, overlap = main()
    doc = DATA / "two-by-two_candidates.md"
    doc.write_text(render(artists, centuries, themed, boards, overlap),
                   encoding="utf-8")

    playable = sum(
        len(valid_theme_pairs(themed, a, b, shared, overlap))
        for a, b, shared in boards
    )
    tiers = Counter(
        tier_of(medium_of(a, artists[a]), medium_of(b, artists[b]))
        for a, b, _ in boards
    )
    print(f"wrote {doc}")
    print(f"  artists with a themed work: "
          f"{sum(1 for t in themed.values() if t)}/{len(artists)}")
    print(f"  artist pairs sharing 2+ themes: {len(boards)}")
    print(f"  playable boards: {playable}")
    for t in "ABCS":
        print(f"    tier {t}: {tiers[t]} pairs")


if __name__ == "__main__":
    main_cli()
