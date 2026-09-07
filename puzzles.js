// puzzles.js — Getty Museum Art Connections
//
// All images served from the Getty's IIIF image API (CC0 open content):
//   https://media.getty.edu/iiif/image/{UUID}/full/!800,800/0/default.jpg
// Getty collection pages: https://www.getty.edu/art/collection/object/{objectID}
//
// solution.horizontal and solution.vertical are SETS — either artwork may go
// in either arm slot. Only solution.center is position-specific.

function gettyImg(uuid) {
  return `https://media.getty.edu/iiif/image/${uuid}/full/!800,800/0/default.jpg`;
}

const PUZZLES = [
  {
    id: 1,
    title: "Turner & Italian Landscapes",
    verticalAxis:   { label: "Same Genre",  reveal: "Italian Landscapes" },
    horizontalAxis: { label: "Same Artist", reveal: "J.M.W. Turner" },
    solution: {
      center:     "turner-rome",
      horizontal: ["turner-tromp", "turner-conway"],   // either order in left/right
      vertical:   ["corot-italian", "lorrain-europa"],  // either order in top/bottom
    },
    artworks: [
      // ── CORRECT: vertical only (Italian landscape, not Turner) ─────────────
      {
        id:       "corot-italian",
        objectId: "103RG4",
        title:    "Italian Landscape (Site d'Italie, Soleil Levant)",
        artist:   "Jean-Baptiste-Camille Corot",
        date:     "about 1835",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("c6660fa0-2160-4baa-b538-941c273938e7"),
      },
      {
        id:       "lorrain-europa",
        objectId: "109B65",
        title:    "Coast View with the Abduction of Europa",
        artist:   "Claude Lorrain (Claude Gellée)",
        date:     "1646",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("f9c8a642-dc9c-422a-a18d-e18fcbbc0233"),
      },
      // ── CORRECT: horizontal only (Turner, not Italian) ────────────────────
      {
        id:       "turner-tromp",
        objectId: "103RK1",
        title:    "Van Tromp, going about to please his Masters, Ships a Sea, getting a Good Wetting",
        artist:   "J.M.W. Turner",
        date:     "1844",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("73c90d1d-0026-4c34-bae3-ff6a14f99fff"),
      },
      {
        id:       "turner-conway",
        objectId: "103R80",
        title:    "Conway Castle, North Wales",
        artist:   "J.M.W. Turner",
        date:     "1798",
        medium:   "Watercolor and gum arabic",
        imageUrl: gettyImg("7ad8d1bf-1fb2-46e6-974e-747f47bbd042"),
      },
      // ── CORRECT: center (Turner AND Italian) ──────────────────────────────
      {
        id:       "turner-rome",
        objectId: "103QTP",
        title:    "Modern Rome—Campo Vaccino",
        artist:   "J.M.W. Turner",
        date:     "1839",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("bc8060cb-b3ed-44ef-810b-d4d689a9cf80"),
      },
      // ── DISTRACTORS ────────────────────────────────────────────────────────
      {
        id:       "rembrandt-old-man",
        objectId: "103RE6",
        title:    "An Old Man in Military Costume",
        artist:   "Rembrandt van Rijn",
        date:     "about 1630–31",
        medium:   "Oil on panel",
        imageUrl: gettyImg("116f2def-eb34-4fcf-bfeb-fd6ab291bd3f"),
      },
      {
        id:       "degas-self",
        objectId: "103R96",
        title:    "Self-Portrait",
        artist:   "Edgar Degas",
        date:     "about 1857–58",
        medium:   "Oil on paper, laid down on canvas",
        imageUrl: gettyImg("229b0ec5-6cc5-472e-96c4-65aa00534307"),
      },
      {
        id:       "vangogh-irises",
        objectId: "90.PA.20",
        title:    "Irises",
        artist:   "Vincent van Gogh",
        date:     "1889",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("8c255d80-7382-46db-9fa8-892c0d37247e"),
      },
    ],
  },

];
