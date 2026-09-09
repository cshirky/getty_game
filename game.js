// game.js

const POSITIONS = ['top', 'left', 'center', 'right', 'bottom'];

let puzzle       = null;
let placed       = {};
let locked       = new Set();
let drag         = { artworkId: null, fromPos: null };
let puzzleIndex  = 0;
let wrongTotal   = 0;   // cumulative wrong placements across all checks
let axesRevealed = false;

// ── Overlay ───────────────────────────────────────────────────────────────────

const overlay    = document.getElementById('imgOverlay');
const overlayImg = document.getElementById('overlayImg');

function showOverlay(imageUrl, triggerRect) {
  overlayImg.src = imageUrl;
  overlay.classList.add('visible');
  positionOverlay(triggerRect);
}
function hideOverlay() { overlay.classList.remove('visible'); }

function positionOverlay(rect) {
  const OW = 500, OH = 620, PAD = 14;
  let x = rect.right + PAD;
  let y = rect.top;
  if (x + OW > window.innerWidth  - PAD) x = rect.left - OW - PAD;
  if (y + OH > window.innerHeight - PAD) y = window.innerHeight - OH - PAD;
  overlay.style.left = Math.max(PAD, x) + 'px';
  overlay.style.top  = Math.max(PAD, y) + 'px';
}

// ── Init ──────────────────────────────────────────────────────────────────────

function loadPuzzle(index) {
  puzzleIndex  = index;
  puzzle       = PUZZLES[index];
  placed       = {};
  locked       = new Set();
  drag         = { artworkId: null, fromPos: null };
  wrongTotal   = 0;
  axesRevealed = false;

  POSITIONS.forEach(pos => resetCell(pos));

  const shuffled = [...puzzle.artworks].sort(() => Math.random() - 0.5);
  const pool = document.getElementById('candidatePool');
  pool.innerHTML = '';
  shuffled.forEach(a => pool.appendChild(makeCard(a)));

  // Re-wire cells (clone to clear stale listeners)
  POSITIONS.forEach(pos => {
    const old   = document.getElementById(`cell-${pos}`);
    const fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    wireCell(fresh, pos);
  });

  // Pool as drop target (return artworks from grid)
  const pool2 = document.getElementById('candidatePool');
  pool2.addEventListener('dragover',  e => { e.preventDefault(); pool2.classList.add('drag-over'); });
  pool2.addEventListener('dragleave', () => pool2.classList.remove('drag-over'));
  pool2.addEventListener('drop', e => {
    e.preventDefault();
    pool2.classList.remove('drag-over');
    if (drag.fromPos !== null && !locked.has(drag.fromPos)) {
      returnToPool(drag.fromPos, drag.artworkId);
      updateCheckButton();
    }
  });

  document.getElementById('resultBar').setAttribute('hidden', '');
  document.getElementById('scoreDisplay').setAttribute('hidden', '');
  document.getElementById('revealListGrid').innerHTML = '';
  updateCheckButton();
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
    </div>`;

  card.addEventListener('dragstart', e => {
    drag.artworkId = artwork.id;
    drag.fromPos   = card.closest('.cell')?.dataset.pos ?? null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', artwork.id);
    requestAnimationFrame(() => card.classList.add('dragging'));
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));

  card.addEventListener('mouseenter', () => showOverlay(artwork.imageUrl, card.getBoundingClientRect()));
  card.addEventListener('mouseleave', hideOverlay);

  return card;
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
  const artwork = puzzle.artworks.find(a => a.id === artworkId);
  const cell    = document.getElementById(`cell-${pos}`);
  cell.innerHTML = '';
  cell.appendChild(makeCard(artwork));
}

// ── Check (deferred, set-based validation) ────────────────────────────────────

function checkAll() {
  if (!POSITIONS.every(pos => placed[pos] || locked.has(pos))) return;

  // Reveal real axis labels + full painting list on first check
  if (!axesRevealed) {
    axesRevealed = true;
    document.getElementById('revealVertical').textContent   = puzzle.verticalAxis.reveal;
    document.getElementById('revealHorizontal').textContent = puzzle.horizontalAxis.reveal;

    document.getElementById('revealListGrid').innerHTML = puzzle.artworks.map(a => `
      <div class="reveal-item">
        <span class="reveal-title">${a.title}</span>
        <span class="reveal-byline">${a.artist}, ${a.date}</span>
      </div>`).join('');

    document.getElementById('resultBar').removeAttribute('hidden');
  }

  const { center, horizontal, vertical } = puzzle.solution;
  const horizSet = new Set(horizontal);
  const vertSet  = new Set(vertical);

  const isCorrect = {
    center: placed.center === center,
    left:   horizSet.has(placed.left),
    right:  horizSet.has(placed.right),
    top:    vertSet.has(placed.top),
    bottom: vertSet.has(placed.bottom),
  };

  let wrongCount    = 0;
  let resolvedCount = 0;

  POSITIONS.forEach(pos => {
    if (locked.has(pos)) return;

    if (isCorrect[pos]) {
      lockCell(pos);
    } else {
      wrongCount++;
      const artworkId = placed[pos];
      const cell      = document.getElementById(`cell-${pos}`);
      cell.classList.add('wrong');

      setTimeout(() => {
        cell.classList.remove('wrong');
        returnToPool(pos, artworkId);
        updateCheckButton();
        resolvedCount++;
        if (resolvedCount === wrongCount && locked.size === 5) {
          showScore();
        }
      }, 600);
    }
  });

  wrongTotal += wrongCount;

  if (wrongCount === 0 && locked.size === 5) {
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
    const artwork = puzzle.artworks.find(a => a.id === artworkId);
    document.getElementById('candidatePool').appendChild(makeCard(artwork));
  }
}

// ── Cell reset ────────────────────────────────────────────────────────────────

function cellHintLines(pos) {
  const v = puzzle.verticalAxis.label;
  const h = puzzle.horizontalAxis.label;
  if (pos === 'center')                  return ['Drop here:', v, h];
  if (pos === 'top' || pos === 'bottom') return ['Drop here:', v];
  return ['Drop here:', h];
}

function resetCell(pos) {
  const cell = document.getElementById(`cell-${pos}`);
  if (!cell) return;
  cell.classList.remove('correct', 'wrong', 'locked', 'drag-over');
  const lines = cellHintLines(pos)
    .map((l, i) => `<span${i === 0 ? ' style="opacity:.5"' : ''}>${l}</span>`)
    .join('');
  cell.innerHTML = `<span class="drop-hint">${lines}</span>`;
}

// ── Check button state ────────────────────────────────────────────────────────

function updateCheckButton() {
  const allFilled = POSITIONS.every(pos => placed[pos] || locked.has(pos));
  document.getElementById('checkBtn').disabled = !allFilled;
}

// ── Score ─────────────────────────────────────────────────────────────────────

function showScore() {
  const label = wrongTotal === 0 ? 'Perfect' :
                wrongTotal === 1 ? 'Good'    :
                wrongTotal === 2 ? 'OK'      : 'Poor';
  const cls   = label.toLowerCase();
  const el    = document.getElementById('scoreWord');
  el.textContent = label;
  el.className   = `score-word ${cls}`;
  document.getElementById('scoreDisplay').removeAttribute('hidden');
  document.getElementById('resultBar').removeAttribute('hidden');
  document.getElementById('checkBtn').disabled = true;
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.getElementById('checkBtn').addEventListener('click', checkAll);
window.addEventListener('DOMContentLoaded', () => loadPuzzle(0));
