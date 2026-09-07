// game.js

const POSITIONS = ['top', 'left', 'center', 'right', 'bottom'];

let puzzle      = null;
let placed      = {};         // pos -> artworkId (all positions, including locked)
let locked      = new Set();  // positions confirmed correct
let drag        = { artworkId: null, fromPos: null };
let puzzleIndex = 0;

// ── Overlay ───────────────────────────────────────────────────────────────────

const overlay    = document.getElementById('imgOverlay');
const overlayImg = document.getElementById('overlayImg');

function showOverlay(imageUrl, triggerRect) {
  overlayImg.src = imageUrl;
  overlay.classList.add('visible');
  positionOverlay(triggerRect);
}

function hideOverlay() {
  overlay.classList.remove('visible');
}

function positionOverlay(rect) {
  const OW = 420, OH = 520, PAD = 14;
  let x = rect.right + PAD;
  let y = rect.top;

  if (x + OW > window.innerWidth  - PAD) x = rect.left - OW - PAD;
  if (y + OH > window.innerHeight - PAD) y = window.innerHeight - OH - PAD;

  overlay.style.left = Math.max(PAD, x) + 'px';
  overlay.style.top  = Math.max(PAD, y) + 'px';
}

// ── Init ──────────────────────────────────────────────────────────────────────

function loadPuzzle(index) {
  puzzleIndex = index;
  puzzle      = PUZZLES[index];
  placed      = {};
  locked      = new Set();
  drag        = { artworkId: null, fromPos: null };

  POSITIONS.forEach(pos => resetCell(pos));

  const shuffled = [...puzzle.artworks].sort(() => Math.random() - 0.5);
  const pool = document.getElementById('candidatePool');
  pool.innerHTML = '';
  shuffled.forEach(a => pool.appendChild(makeCard(a)));

  // Re-wire cells (clone to drop stale listeners)
  POSITIONS.forEach(pos => {
    const old   = document.getElementById(`cell-${pos}`);
    const fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    wireCell(fresh, pos);
  });

  // Pool accepts drops (return artworks from grid)
  const pool2 = document.getElementById('candidatePool');
  pool2.addEventListener('dragover', e => { e.preventDefault(); pool2.classList.add('drag-over'); });
  pool2.addEventListener('dragleave', () => pool2.classList.remove('drag-over'));
  pool2.addEventListener('drop', e => {
    e.preventDefault();
    pool2.classList.remove('drag-over');
    if (drag.fromPos !== null && !locked.has(drag.fromPos)) {
      returnToPool(drag.fromPos, drag.artworkId);
      updateCheckButton();
    }
  });

  document.getElementById('winOverlay').setAttribute('hidden', '');
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

// ── Card factory — image only ─────────────────────────────────────────────────

function makeCard(artwork) {
  const card = document.createElement('div');
  card.className  = 'artwork-card';
  card.dataset.id = artwork.id;
  card.draggable  = true;

  const img = document.createElement('img');
  img.src   = artwork.imageUrl;
  img.alt   = '';          // intentionally blank: no title/artist shown
  img.loading = 'lazy';
  card.appendChild(img);

  // Drag events
  card.addEventListener('dragstart', e => {
    drag.artworkId = artwork.id;
    drag.fromPos   = card.closest('.cell')?.dataset.pos ?? null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', artwork.id);
    requestAnimationFrame(() => card.classList.add('dragging'));
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));

  // Hover overlay
  card.addEventListener('mouseenter', () => {
    showOverlay(artwork.imageUrl, card.getBoundingClientRect());
  });
  card.addEventListener('mouseleave', hideOverlay);

  return card;
}

// ── Drop handler ──────────────────────────────────────────────────────────────

function handleDrop(targetPos) {
  const { artworkId, fromPos } = drag;
  if (!artworkId) return;

  // If something already in the target (unlocked), send it back to pool
  if (placed[targetPos] && !locked.has(targetPos)) {
    returnToPool(targetPos, placed[targetPos]);
  }

  // If artwork came from another cell, clear that source cell
  if (fromPos !== null && fromPos !== targetPos && !locked.has(fromPos)) {
    delete placed[fromPos];
    resetCell(fromPos);
  }

  // Remove from pool if present
  document.querySelector(`#candidatePool [data-id="${artworkId}"]`)?.remove();

  // Place in target
  placeInCell(artworkId, targetPos);
}

// ── Placing ───────────────────────────────────────────────────────────────────

function placeInCell(artworkId, pos) {
  placed[pos] = artworkId;
  const artwork = puzzle.artworks.find(a => a.id === artworkId);
  const cell    = document.getElementById(`cell-${pos}`);
  const card    = makeCard(artwork);
  cell.innerHTML = '';
  cell.appendChild(card);
}

// ── Check all (deferred validation) ──────────────────────────────────────────

function checkAll() {
  if (!POSITIONS.every(pos => placed[pos] || locked.has(pos))) return;

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
          setTimeout(showWin, 300);
        }
      }, 600);
    }
  });

  if (wrongCount === 0 && locked.size === 5) {
    setTimeout(showWin, 400);
  }
}

// ── Locking a correct cell ────────────────────────────────────────────────────

function lockCell(pos) {
  locked.add(pos);
  const cell = document.getElementById(`cell-${pos}`);
  cell.classList.add('correct', 'locked');
  const card = cell.querySelector('.artwork-card');
  if (card) {
    card.draggable = false;
    card.style.cursor = 'default';
  }
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
  if (pos === 'center')              return ['Drop here:', v, h];
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

// ── Win ───────────────────────────────────────────────────────────────────────

function showWin() {
  const isLast = puzzleIndex === PUZZLES.length - 1;
  document.getElementById('winBody').textContent = isLast
    ? `You've completed all ${PUZZLES.length} puzzles.`
    : `You found every connection in "${puzzle.title}".`;
  document.getElementById('nextBtn').textContent = isLast
    ? 'Play again →'
    : 'Next puzzle →';
  document.getElementById('winOverlay').removeAttribute('hidden');
}

// ── Controls ──────────────────────────────────────────────────────────────────

document.getElementById('checkBtn').addEventListener('click', checkAll);

document.getElementById('nextBtn').addEventListener('click', () => {
  loadPuzzle((puzzleIndex + 1) % PUZZLES.length);
});

// ── Boot ──────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => loadPuzzle(0));
