#!/usr/bin/env python3
"""Resolve the Tier A candidate works to Getty records, with images.

The candidates file carries titles and artists only. To show a board you need
the picture, so each (artist, title) is matched against Getty's SPARQL endpoint
and then the object's JSON-LD is read for its IIIF image id, display date and
public object page.

Writes DATA/board_works.json. Network-bound and slow-ish; the result is cached,
so re-runs only fetch what is missing.
"""

import json
import re
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import two_by_two_candidates as tbt  # noqa: E402

HERE = Path(__file__).resolve().parent
CACHE = HERE / "board_works.json"
SPARQL = "https://data.getty.edu/museum/collection/sparql"

# Getty labels append an accession number, in any of three shapes:
#   "Head of a Man (90.GB.29)"              department-coded
#   "The Birth and Triumph of Venus (2005.16)"  year-coded
#   "The Martyrdom of Saint Sebastian (Ms. Ludwig IX 11, fol. 126)"  manuscript
ACCESSION_SUFFIX = re.compile(
    r"\s*\((?:Ms\.[^)]*|\d{2}\.[A-Z]{1,2}\.[^)]*|\d{4}\.[0-9.]*[^)]*)\)\s*$"
)


def curl(url, *args):
    out = subprocess.run(["curl", "-s", "-m", "60", url, *args],
                         capture_output=True, text=True)
    return out.stdout


def sparql(query):
    raw = curl(SPARQL, "--data-urlencode", f"query={query}",
               "-H", "Accept: application/sparql-results+json")
    try:
        return json.loads(raw)["results"]["bindings"]
    except (ValueError, KeyError):
        return []


def find_work(artist, title):
    """Object uuid for one (artist, title), or None.

    Looked up by title alone. Two earlier approaches failed: scanning an
    artist's output hits the endpoint's row cap and comes back full of other
    people's work, and joining through the production event to a maker silently
    drops collaborations and tapestry designs, whose maker hangs off a sub-event
    rather than the production itself. Title-first finds those; the artist is
    then confirmed from the object record, which does walk sub-events.
    """
    query = """
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?obj ?label WHERE {
  ?obj a crm:E22_Human-Made_Object ;
       rdfs:label ?label .
  FILTER(STRSTARTS(?label, %s))
}
LIMIT 25
""" % json.dumps(title)

    hits = []
    for row in sparql(query):
        if ACCESSION_SUFFIX.sub("", row["label"]["value"]) == title:
            uuid = row["obj"]["value"].rsplit("/", 1)[1]
            if uuid not in hits:
                hits.append(uuid)
    if not hits:
        return None
    if len(hits) == 1:
        return hits[0]

    # Several objects share the title -- ask each record who made it.
    surname = artist.split(" (")[0]
    for uuid in hits:
        detail = object_detail(uuid)
        if surname in (detail.get("artist") or ""):
            return uuid
    return hits[0]


def object_detail(uuid):
    d = json.loads(curl(f"https://data.getty.edu/museum/collection/object/{uuid}",
                        "-H", "Accept: application/json"))
    rec = {"dataUuid": uuid}

    for r in d.get("representation", []) or []:
        m = re.search(r"/iiif/image/([0-9a-f-]{36})/", r.get("id", ""))
        if m:
            rec["iiif"] = m.group(1)
            break

    for s in d.get("subject_of", []) or []:
        m = re.match(r"https://www\.getty\.edu/art/collection/object/(\w+)",
                     s.get("id", ""))
        if m:
            rec["objectId"] = m.group(1)
            break

    ts = (d.get("produced_by") or {}).get("timespan") or {}
    for i in ts.get("identified_by", []) or []:
        if i.get("_label") == "Dates":
            rec["date"] = i.get("content")
            break

    for r in d.get("referred_to_by", []) or []:
        if "Materials" in (r.get("_label") or ""):
            rec["medium"] = r.get("content")
            break
    return rec


def needed_works():
    artists, _centuries, themed, boards, overlap = tbt.main()
    out = set()
    for a, b, shared in boards:
        tier = tbt.tier_of(tbt.medium_of(a, artists[a]), tbt.medium_of(b, artists[b]))
        if tier != "A":
            continue
        for t1, t2 in tbt.valid_theme_pairs(themed, a, b, shared, overlap):
            for who in (a, b):
                for theme in (t1, t2):
                    for work in themed[who][theme]:
                        out.add((who, work))
    return sorted(out)


def main():
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    wanted = needed_works()
    misses = []

    for artist, title in wanted:
        key = f"{artist}||{title}"
        if key in cache and cache[key].get("iiif"):
            continue
        uuid = find_work(artist, title)
        if not uuid:
            misses.append((artist, title))
            continue
        rec = object_detail(uuid)
        rec.update(artist=artist, title=title)
        cache[key] = rec
        print(f"  ok  {artist[:24]:24}  {title[:44]}", file=sys.stderr)
        time.sleep(0.2)

    CACHE.write_text(json.dumps(cache, indent=2, ensure_ascii=False))
    print(f"\nresolved {sum(1 for v in cache.values() if v.get('iiif'))}"
          f"/{len(wanted)} works -> {CACHE.name}")
    if misses:
        print(f"unresolved ({len(misses)}):")
        for artist, title in misses:
            print(f"  {artist} — {title}")


if __name__ == "__main__":
    main()
