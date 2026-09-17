# Scoring

The game loads this file at page load and uses the numbers below to score
each finished puzzle. Edit any number and reload the page to change how
points are awarded — just keep each line in the exact form `key: value`
(the game reads those keys literally; the surrounding prose is only for you).

## Venus in the center

Points awarded per Venus painting correctly placed in the center column
(there are 4), minus one wrong-attempt penalty already baked into the
per-match score.

```
pointsPerVenusMatch: 10
maxVenusMatches: 4
```

## Same-artist matches

Points awarded per side painting correctly matched to its row's Venus
painting by the same artist (there are 4).

```
pointsPerArtistMatch: 10
maxArtistMatches: 4
```

## Chronological order bonus

Bonus points for arranging the four center Venus paintings close to true
chronological order, latest on top and earliest on the bottom. This is
scored continuously (partial credit for a partially-correct order), up to
the maximum below.

```
maxChronologyPoints: 20
```

## Grade thresholds

The final word (Perfect / Good / OK / Poor) shown after the puzzle is
solved, based on the total score out of 100 (or whatever the point values
above add up to).

```
perfectThreshold: 95
goodThreshold: 80
okThreshold: 60
```
