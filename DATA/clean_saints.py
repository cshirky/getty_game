#!/usr/bin/env python3
"""Clean getty_single_saint_images.csv into getty_saints_clean.csv.

Getty titles use square brackets for *supplied* titles -- descriptive labels
written by curators for works that carry no title of their own. Two shapes
appear in the raw export:

    [Head of a Saint, Chiapas]              -> the brackets wrap the title
    ["Saint Bernard", Statue by Jouffroy]   -> a real title plus context

The first shape is Getty's own convention and the bracket contents are the
title. The second is a list that got flattened into one field, so the quoted
run is the title and the remainder is context. Everything else is left alone.

Also parses the free-text date into a sortable year and a century bucket, and
drops rows that duplicate an existing title/artist/date triple (manuscript
leaves that share metadata -- fine in a catalogue, but a puzzle must not deal
the same card twice).
"""

import csv
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "getty_single_saint_images.csv"
DST = HERE / "getty_saints_clean.csv"

# ["Real Title", trailing context] -- quoted run first, remainder is context.
TITLE_WITH_CONTEXT = re.compile(r'^\["([^"]+)",\s*(.+)\]$')

# Any other fully bracketed title: the brackets are Getty's supplied-title mark.
SUPPLIED_TITLE = re.compile(r"^\[(.+)\]$")

# "1450s", "early 1460s" -- a decade. Must be tried before FIRST_YEAR, whose
# trailing \b cannot match the digits in "1460s" at all.
DECADE = re.compile(r"\b(\d{3,4})0s\b")

# The first explicit year mentioned anywhere in the date string.
FIRST_YEAR = re.compile(r"\b(\d{3,4})\b")

# "late 15th century", "early 16th century"
CENTURY_WORDS = re.compile(r"\b(\d{1,2})(?:st|nd|rd|th)\s+century\b", re.I)

CIRCA_MARKERS = ("about", "between about", "shortly after", "probably", "?")


def split_title(raw):
    """Return (title, context, supplied) for one raw title field."""
    raw = raw.strip()

    m = TITLE_WITH_CONTEXT.match(raw)
    if m:
        return m.group(1).strip(), m.group(2).strip(), False

    m = SUPPLIED_TITLE.match(raw)
    if m:
        # A nested quote here is a *quoted work being depicted*, not the title
        # of this object -- "[Engraving of Murillo's "The Infant Christ"]" is
        # titled for the engraving, so keep the whole bracket contents.
        return m.group(1).strip(), "", True

    return raw, "", False


def parse_year(raw):
    """Return (year_sort, century, circa) from Getty's free-text date."""
    raw = raw.strip()
    circa = any(marker in raw.lower() for marker in CIRCA_MARKERS)

    # A decade is inherently approximate, so it is always circa.
    m = DECADE.search(raw)
    if m:
        year = int(m.group(1) + "0")
        return year, (year // 100) + 1, True

    m = FIRST_YEAR.search(raw)
    if m:
        year = int(m.group(1))
        return year, (year // 100) + 1, circa

    # No explicit year: "late 15th century" -> midpoint of that century.
    m = CENTURY_WORDS.search(raw)
    if m:
        century = int(m.group(1))
        return (century - 1) * 100 + 50, century, True

    return None, None, circa


def main():
    if not SRC.exists():
        sys.exit(f"missing input: {SRC}")

    with SRC.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    seen = set()
    cleaned = []
    stats = {"supplied": 0, "context": 0, "no_year": 0, "dropped_dupes": 0}

    for row in rows:
        title, context, supplied = split_title(row["title of work"])
        artist = row["artist name"].strip()
        date = row["year(s) created"].strip()
        year, century, circa = parse_year(date)

        key = (title.lower(), artist.lower(), date.lower())
        if key in seen:
            stats["dropped_dupes"] += 1
            continue
        seen.add(key)

        if supplied:
            stats["supplied"] += 1
        if context:
            stats["context"] += 1
        if year is None:
            stats["no_year"] += 1

        cleaned.append(
            {
                "title": title,
                "artist": artist,
                "date_display": date,
                "year_sort": year if year is not None else "",
                "century": century if century is not None else "",
                "circa": "true" if circa else "false",
                "supplied_title": "true" if supplied else "false",
                "context": context,
            }
        )

    with DST.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(cleaned[0].keys()))
        writer.writeheader()
        writer.writerows(cleaned)

    print(f"read    {len(rows)} rows from {SRC.name}")
    print(f"wrote   {len(cleaned)} rows to {DST.name}")
    print(f"  supplied titles (brackets stripped): {stats['supplied']}")
    print(f"  titles split from context:           {stats['context']}")
    print(f"  duplicate rows dropped:              {stats['dropped_dupes']}")
    print(f"  rows with no parseable year:         {stats['no_year']}")


if __name__ == "__main__":
    main()
