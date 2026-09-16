// game.js

let puzzle       = null;
let positions    = [];  // slot ids for the current puzzle (shape depends on puzzle.type)
let placed       = {};
let locked       = new Set();
let drag         = { artworkId: null, fromPos: null };
let puzzleIndex     = 0;
let wrongCenterTotal = 0;   // cumulative wrong Venus-in-center placements
let wrongSideTotal   = 0;   // cumulative wrong same-artist-match placements
let axesRevealed = false;

// ── Scoring config (loaded from SCORING.md so it's editable without touching code) ─────────
let SCORING = {
  pointsPerVenusMatch:  10,
  maxVenusMatches:      4,
  pointsPerArtistMatch: 10,
  maxArtistMatches:     4,
  maxChronologyPoints:  20,
  perfectThreshold:     90,
  goodThreshold:        70,
  okThreshold:          50,
};

async function loadScoring() {
  try {
    const res = await fetch('SCORING.md');
    if (!res.ok) return;
    const text = await res.text();
    const parsed = {};
    for (const m of text.matchAll(/^([A-Za-z][A-Za-z0-9]*)\s*:\s*(-?\d+(?:\.\d+)?)\s*$/gm)) {
      parsed[m[1]] = Number(m[2]);
    }
    Object.assign(SCORING, parsed);
  } catch (err) {
    console.warn('Could not load SCORING.md — using built-in scoring defaults.', err);
  }
}
loadScoring();

// ── Overlay ───────────────────────────────────────────────────────────────────

const overlay    = document.getElementById('imgOverlay');
const overlayImg = document.getElementById('overlayImg');
let overlayArtworkId = null;

function showOverlay(imageUrl, triggerRect, artworkId) {
  overlayImg.src = imageUrl;
  overlay.classList.add('visible');
  overlayArtworkId = artworkId;
  positionOverlay(triggerRect);
}
function hideOverlay() { overlay.classList.remove('visible'); overlayArtworkId = null; }

// Click anywhere outside a card closes the popup
document.addEventListener('click', e => {
  if (!e.target.closest('.artwork-card')) hideOverlay();
});

function positionOverlay(rect) {
  const OW = 500, OH = 620, PAD = 14;
  let x = rect.right + PAD;
  let y = rect.top;
  if (x + OW > window.innerWidth  - PAD) x = rect.left - OW - PAD;
  if (y + OH > window.innerHeight - PAD) y = window.innerHeight - OH - PAD;
  overlay.style.left = Math.max(PAD, x) + 'px';
  overlay.style.top  = Math.max(PAD, y) + 'px';
}

// ── Grid shape (per puzzle.type) ─────────────────────────────────────────────

function getPositions(p) {
  if (p.type === 'zigzag') {
    return ['center1', 'center2', 'center3', 'center4', 'side1', 'side2', 'side3', 'side4'];
  }
  return ['top', 'left', 'center', 'right', 'bottom']; // 'cross'
}

// Layout of the grid as a sequence of column-major-free rows; null = spacer cell.
function getGridLayout(p) {
  if (p.type === 'zigzag') {
    const rows = [];
    for (let r = 1; r <= 4; r++) {
      const left = (r % 2 === 1); // rows 1,3 -> side on the left; rows 2,4 -> right
      rows.push(left ? [`side${r}`, `center${r}`, null] : [null, `center${r}`, `side${r}`]);
    }
    return { columns: 3, rows };
  }
  return {
    columns: 3,
    rows: [
      [null, 'top', null],
      ['left', 'center', 'right'],
      [null, 'bottom', null],
    ],
  };
}

function cellAxisClass(p, pos) {
  if (p.type === 'zigzag') return pos.startsWith('center') ? 'cell-vertical' : 'cell-horizontal';
  if (pos === 'center') return 'cell-center';
  if (pos === 'top' || pos === 'bottom') return 'cell-vertical';
  return 'cell-horizontal';
}

function positionAxisLabels(p, pos) {
  if (p.type === 'zigzag') {
    return pos.startsWith('center') ? [p.centerAxis.label] : [p.sideAxis.label];
  }
  if (pos === 'center') return [p.verticalAxis.label, p.horizontalAxis.label];
  if (pos === 'top' || pos === 'bottom') return [p.verticalAxis.label];
  return [p.horizontalAxis.label];
}

function axisReveals(p) {
  if (p.type === 'zigzag') return { a: p.centerAxis.reveal, b: p.sideAxis.reveal };
  return { a: p.verticalAxis.reveal, b: p.horizontalAxis.reveal };
}

// ── Init ──────────────────────────────────────────────────────────────────────

function loadPuzzle(index) {
  puzzleIndex  = index;
  puzzle       = PUZZLES[index];
  positions    = getPositions(puzzle);
  placed       = {};
  locked       = new Set();
  drag         = { artworkId: null, fromPos: null };
  wrongCenterTotal = 0;
  wrongSideTotal   = 0;
  axesRevealed = false;
  document.body.classList.remove('answers-revealed');

  document.getElementById('puzzleLabel').textContent  = `Puzzle ${index + 1} of ${PUZZLES.length}: ${puzzle.title}`;

  const instructionsEl = document.getElementById('instructions');
  const paragraphs = Array.isArray(puzzle.instructions) ? puzzle.instructions : [puzzle.instructions];
  instructionsEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');

  buildGrid();

  // Re-wire pool (clone first, while empty, to clear stale container-level listeners
  // from a previous loadPuzzle call — cards get their own fresh listeners below)
  const oldPool = document.getElementById('candidatePool');
  const pool    = oldPool.cloneNode(false);
  oldPool.parentNode.replaceChild(pool, oldPool);

  pool.addEventListener('dragover',  e => { e.preventDefault(); pool.classList.add('drag-over'); });
  pool.addEventListener('dragleave', () => pool.classList.remove('drag-over'));
  pool.addEventListener('drop', e => {
    e.preventDefault();
    pool.classList.remove('drag-over');
    if (drag.fromPos !== null && !locked.has(drag.fromPos)) {
      returnToPool(drag.fromPos, drag.artworkId);
      updateCheckButton();
    }
  });

  const shuffled = [...puzzle.artworks].sort(() => Math.random() - 0.5);
  shuffled.forEach(a => pool.appendChild(makeCard(a)));

  document.getElementById('resultBar').setAttribute('hidden', '');
  document.getElementById('scoreDisplay').setAttribute('hidden', '');
  document.getElementById('nextPuzzleBtn').setAttribute('hidden', '');
  updateCheckButton();
}

// ── Grid building ─────────────────────────────────────────────────────────────

function buildGrid() {
  const grid = document.getElementById('puzzleGrid');
  grid.innerHTML = '';
  grid.className = `puzzle-grid grid-${puzzle.type}`;

  const { rows } = getGridLayout(puzzle);
  rows.forEach((row, rowIndex) => {
    const rowLabel = rowIndex === 0             ? puzzle.rowLabels?.top :
                      rowIndex === rows.length-1 ? puzzle.rowLabels?.bottom :
                      null;
    row.forEach(pos => {
      if (pos === null) {
        const spacer = document.createElement('div');
        spacer.className = 'grid-spacer';
        if (rowLabel) {
          spacer.classList.add('row-label');
          spacer.textContent = rowLabel;
        }
        grid.appendChild(spacer);
        return;
      }
      const cell = document.createElement('div');
      cell.className  = `cell ${cellAxisClass(puzzle, pos)}`;
      cell.id         = `cell-${pos}`;
      cell.dataset.pos = pos;
      resetCell(pos, cell);
      wireCell(cell, pos);
      grid.appendChild(cell);
    });
  });
}

// ── Cell wiring ───────────────────────────────────────────────────────────────

function wireCell(cell, pos) {
  cell.addEventListener('dragover', e => {
    if (locked.has(pos)) return;
    e.preventDefault();
    cell.classList.add('drag-over');
  });
  cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
  cell.addEventListener('drop', e => {
    e.preventDefault();
    cell.classList.remove('drag-over');
    if (locked.has(pos)) return;
    handleDrop(pos);
    updateCheckButton();
  });
}

// ── Card factory ──────────────────────────────────────────────────────────────

function makeCard(artwork) {
  const card = document.createElement('div');
  card.className  = 'artwork-card';
  card.dataset.id = artwork.id;
  card.draggable  = true;

  card.innerHTML = `
    <div class="card-img">
      <img src="${artwork.imageUrl}" alt="${artwork.title} — ${artwork.artist}, ${artwork.date}" loading="lazy">
    </div>
    <div class="card-caption">
      <div class="card-caption-title">${artwork.title}</div>
      <div class="card-caption-byline">${artwork.artist}, ${artwork.date}</div>
    </div>`;

  card.addEventListener('dragstart', e => {
    drag.artworkId = artwork.id;
    drag.fromPos   = card.closest('.cell')?.dataset.pos ?? null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', artwork.id);
    requestAnimationFrame(() => card.classList.add('dragging'));
    hideOverlay();
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));

  card.addEventListener('click', e => {
    e.stopPropagation();
    if (overlayArtworkId === artwork.id) {
      hideOverlay();
    } else {
      showOverlay(artwork.imageUrl, card.getBoundingClientRect(), artwork.id);
    }
  });

  return card;
}

function artworkById(id) {
  return puzzle.artworks.find(a => a.id === id);
}

// ── Drop handler ──────────────────────────────────────────────────────────────

function handleDrop(targetPos) {
  const { artworkId, fromPos } = drag;
  if (!artworkId) return;

  if (placed[targetPos] && !locked.has(targetPos)) {
    returnToPool(targetPos, placed[targetPos]);
  }
  if (fromPos !== null && fromPos !== targetPos && !locked.has(fromPos)) {
    delete placed[fromPos];
    resetCell(fromPos);
  }

  document.querySelector(`#candidatePool [data-id="${artworkId}"]`)?.remove();
  placeInCell(artworkId, targetPos);
}

// ── Placing ───────────────────────────────────────────────────────────────────

function placeInCell(artworkId, pos) {
  placed[pos] = artworkId;
  const artwork = artworkById(artworkId);
  const cell    = document.getElementById(`cell-${pos}`);
  cell.innerHTML = '';
  cell.appendChild(makeCard(artwork));
}

// ── Check (deferred, set-based validation) ────────────────────────────────────

function computeCorrectness() {
  if (puzzle.type === 'zigzag') {
    const centerIds = new Set(puzzle.solution.centerIds);
    const result = {};
    for (let r = 1; r <= 4; r++) {
      const centerPos = `center${r}`;
      const sidePos   = `side${r}`;
      const centerArt = artworkById(placed[centerPos]);
      const sideArt   = artworkById(placed[sidePos]);
      result[centerPos] = centerIds.has(placed[centerPos]);
      result[sidePos]   = !!(centerArt && sideArt && sideArt.artist === centerArt.artist);
    }
    return result;
  }

  const { center, horizontal, vertical } = puzzle.solution;
  const horizSet = new Set(horizontal);
  const vertSet  = new Set(vertical);
  return {
    center: placed.center === center,
    left:   horizSet.has(placed.left),
    right:  horizSet.has(placed.right),
    top:    vertSet.has(placed.top),
    bottom: vertSet.has(placed.bottom),
  };
}

function checkAll() {
  if (!positions.every(pos => placed[pos] || locked.has(pos))) return;

  // Reveal real axis labels + on-card captions for all paintings on first check
  if (!axesRevealed) {
    axesRevealed = true;
    const { a, b } = axisReveals(puzzle);
    document.getElementById('revealVertical').textContent   = a;
    document.getElementById('revealHorizontal').textContent = b;
    document.body.classList.add('answers-revealed');
    document.getElementById('resultBar').removeAttribute('hidden');
  }

  const isCorrect = computeCorrectness();

  let wrongCount    = 0;
  let resolvedCount = 0;

  positions.forEach(pos => {
    if (locked.has(pos)) return;

    if (isCorrect[pos]) {
      lockCell(pos);
    } else {
      wrongCount++;
      if (pos.startsWith('center')) wrongCenterTotal++;
      if (pos.startsWith('side'))   wrongSideTotal++;
      const artworkId = placed[pos];
      const cell      = document.getElementById(`cell-${pos}`);
      cell.classList.add('wrong');

      setTimeout(() => {
        cell.classList.remove('wrong');
        returnToPool(pos, artworkId);
        updateCheckButton();
        resolvedCount++;
        if (resolvedCount === wrongCount && locked.size === positions.length) {
          showScore();
        }
      }, 600);
    }
  });

  if (wrongCount === 0 && locked.size === positions.length) {
    showScore();
  }
}

// ── Locking ───────────────────────────────────────────────────────────────────

function lockCell(pos) {
  locked.add(pos);
  const cell = document.getElementById(`cell-${pos}`);
  cell.classList.add('correct', 'locked');
  const card = cell.querySelector('.artwork-card');
  if (card) { card.draggable = false; card.style.cursor = 'default'; }
}

// ── Return to pool ────────────────────────────────────────────────────────────

function returnToPool(pos, artworkId) {
  if (locked.has(pos)) return;
  delete placed[pos];
  resetCell(pos);
  if (!document.querySelector(`#candidatePool [data-id="${artworkId}"]`)) {
    document.getElementById('candidatePool').appendChild(makeCard(artworkById(artworkId)));
  }
}

// ── Cell reset ────────────────────────────────────────────────────────────────

function cellHintLines(pos) {
  return ['Drop here:', ...positionAxisLabels(puzzle, pos)];
}

function resetCell(pos, cellEl) {
  const cell = cellEl || document.getElementById(`cell-${pos}`);
  if (!cell) return;
  cell.classList.remove('correct', 'wrong', 'locked', 'drag-over');
  const lines = cellHintLines(pos)
    .map((l, i) => `<span${i === 0 ? ' style="opacity:.5"' : ''}>${l}</span>`)
    .join('');
  cell.innerHTML = `<span class="drop-hint">${lines}</span>`;
}

// ── Check button state ────────────────────────────────────────────────────────

function updateCheckButton() {
  const allFilled = positions.every(pos => placed[pos] || locked.has(pos));
  document.getElementById('checkBtn').disabled = !allFilled;
}

// ── Score ─────────────────────────────────────────────────────────────────────

// Pairwise closeness of the center column to chronological order (latest on
// top, earliest on bottom): for every pair of center positions, the higher
// (earlier-in-`positions`) one should date the same year or later.
function computeChronologyScore() {
  if (!puzzle.chronology) return null;
  const centerPositions = positions.filter(pos => pos.startsWith('center'));
  if (centerPositions.length < 2) return null;

  const years = centerPositions.map(pos => puzzle.chronology[placed[pos]]);
  let correctPairs = 0, totalPairs = 0;
  for (let i = 0; i < years.length; i++) {
    for (let j = i + 1; j < years.length; j++) {
      totalPairs++;
      if (years[i] >= years[j]) correctPairs++;
    }
  }
  return { correctPairs, totalPairs };
}

function showScore() {
  const centerHits = Math.max(0, SCORING.maxVenusMatches  - wrongCenterTotal);
  const matchHits  = Math.max(0, SCORING.maxArtistMatches - wrongSideTotal);
  const chrono     = computeChronologyScore();

  const centerPts = centerHits * SCORING.pointsPerVenusMatch;
  const matchPts  = matchHits  * SCORING.pointsPerArtistMatch;
  const orderPts  = chrono ? Math.round((chrono.correctPairs / chrono.totalPairs) * SCORING.maxChronologyPoints) : 0;
  const total     = centerPts + matchPts + orderPts;
  const maxTotal  = SCORING.maxVenusMatches  * SCORING.pointsPerVenusMatch
                   + SCORING.maxArtistMatches * SCORING.pointsPerArtistMatch
                   + SCORING.maxChronologyPoints;

  const label = total >= SCORING.perfectThreshold ? 'Perfect' :
                total >= SCORING.goodThreshold    ? 'Good'    :
                total >= SCORING.okThreshold       ? 'OK'      : 'Poor';
  const cls   = label.toLowerCase();

  const el = document.getElementById('scoreWord');
  el.textContent = `${label} — ${total}/${maxTotal}`;
  el.className   = `score-word ${cls}`;

  const breakdown = document.getElementById('scoreBreakdown');
  if (breakdown) {
    const lines = [
      `Venus in the center: ${centerHits}/${SCORING.maxVenusMatches} (${centerPts} pts)`,
      `Same-artist matches: ${matchHits}/${SCORING.maxArtistMatches} (${matchPts} pts)`,
    ];
    if (chrono) {
      lines.push(`Chronological order: ${chrono.correctPairs}/${chrono.totalPairs} pairs (${orderPts} pts)`);
    }
    breakdown.innerHTML = lines.map(l => `<div class="score-line">${l}</div>`).join('');
  }

  document.getElementById('scoreDisplay').removeAttribute('hidden');
  document.getElementById('resultBar').removeAttribute('hidden');
  document.getElementById('checkBtn').disabled = true;

  const nextBtn = document.getElementById('nextPuzzleBtn');
  if (puzzleIndex + 1 < PUZZLES.length) {
    nextBtn.removeAttribute('hidden');
  } else {
    nextBtn.setAttribute('hidden', '');
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.getElementById('checkBtn').addEventListener('click', checkAll);
document.getElementById('nextPuzzleBtn').addEventListener('click', () => {
  if (puzzleIndex + 1 < PUZZLES.length) loadPuzzle(puzzleIndex + 1);
});
window.addEventListener('DOMContentLoaded', () => loadPuzzle(0));
