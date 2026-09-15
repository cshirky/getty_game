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
    type: "cross",
    title: "Turner & Italian Landscapes",
    instructions: "Here are 8 paintings at the Getty Museum. 5 of them fit in the crossword grid; drag them to their appropriate boxes. The column should contain three paintings in the same genre. The row should contain three paintings by the same artist.",
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
        id:       "deheem-vase",
        objectId: "29Y70F",
        title:    "Glass Vase with Flowers and Fruit",
        artist:   "Jan Davidsz. de Heem",
        date:     "about 1673-74",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("70c596e7-ef41-429e-a8c5-b19f887f9000"),
      },
    ],
  },

  {
    id: 2,
    type: "zigzag",
    title: "Venus, Four Ways",
    instructions: "Here are 11 paintings and drawings at the Getty Museum. 8 of them fit the grid; drag them to their appropriate boxes. The center column holds four depictions of the same subject. Each painting beside the column was made by the same artist as its neighbor in the center — drag each pair into the same row.",
    centerAxis: { label: "Same Subject", reveal: "Venus" },
    sideAxis:   { label: "Same Artist",  reveal: "Same artist as its row's center painting" },
    solution: {
      centerIds: ["boucher-venus-triumph", "ricci-marine-venus", "solimena-forge", "titian-venus-adonis"],
    },
    artworks: [
      // ── Row 1: Boucher (side on the left) ──────────────────────────────────
      {
        id:       "boucher-venus-triumph",
        objectId: "10985F",
        title:    "The Birth and Triumph of Venus",
        artist:   "François Boucher",
        date:     "about 1743",
        medium:   "Black chalk and gouache",
        imageUrl: gettyImg("40016a32-0f38-4f14-bb0b-a1eb191efe7f"),
      },
      {
        id:       "boucher-reclining-nude",
        objectId: "103QWY",
        title:    "Study of a Reclining Nude",
        artist:   "François Boucher",
        date:     "1732–1735",
        medium:   "Red and white chalk on oatmeal paper",
        imageUrl: gettyImg("6314632d-529d-448d-a0e9-b15a6307f98e"),
      },
      // ── Row 2: Ricci (side on the right) ───────────────────────────────────
      {
        id:       "ricci-marine-venus",
        objectId: "103RCT",
        title:    "Triumph of the Marine Venus",
        artist:   "Sebastiano Ricci",
        date:     "about 1713",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("eb31c802-f813-492b-bfba-f5ec79abd4a2"),
      },
      {
        id:       "ricci-tarquin",
        objectId: "103RCE",
        title:    "Tarquin the Elder Consulting Attius Navius",
        artist:   "Sebastiano Ricci",
        date:     "about 1690",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("37cc3885-33e4-4602-bf02-559ab8ec0ee8"),
      },
      // ── Row 3: Solimena (side on the left) ─────────────────────────────────
      {
        id:       "solimena-forge",
        objectId: "103RFY",
        title:    "Venus at the Forge of Vulcan",
        artist:   "Francesco Solimena",
        date:     "1704",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("0e2d21f0-e964-4988-9960-c5d14c5dc1c1"),
      },
      {
        id:       "solimena-aurora",
        objectId: "103RG1",
        title:    "Aurora Taking Leave of Tithonus",
        artist:   "Francesco Solimena",
        date:     "1704",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("5402aa28-a384-45bb-8a89-54b9929c0915"),
      },
      // ── Row 4: Titian (side on the right) ──────────────────────────────────
      {
        id:       "titian-venus-adonis",
        objectId: "103RJS",
        title:    "Venus and Adonis",
        artist:   "Titian (Tiziano Vecellio)",
        date:     "about 1555–1560",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("d353f957-af6b-4757-9291-900c3859a5d2"),
      },
      {
        id:       "titian-magdalene",
        objectId: "103R9F",
        title:    "The Penitent Magdalene",
        artist:   "Titian (Tiziano Vecellio)",
        date:     "1555–1560",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("ee8db855-5367-4932-9015-3e49f78aee53"),
      },
      // ── DISTRACTORS ────────────────────────────────────────────────────────
      {
        // Also depicts Venus, but by an artist outside the puzzle's four —
        // looks like a center candidate, but isn't one of the designated four.
        id:       "vouet-venus-adonis",
        objectId: "103RB7",
        title:    "Venus and Adonis",
        artist:   "Simon Vouet",
        date:     "about 1642",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("9873c9d7-3fa6-4465-aacd-e90acb2c8ea7"),
      },
      {
        id:       "vangogh-irises",
        objectId: "103JNH",
        title:    "Irises",
        artist:   "Vincent van Gogh",
        date:     "1889",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("8c255d80-7382-46db-9fa8-892c0d37247e"),
      },
      {
        id:       "rembrandt-bartholomew",
        objectId: "103RB6",
        title:    "Saint Bartholomew",
        artist:   "Rembrandt Harmensz. van Rijn",
        date:     "1661",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("419d4e47-23e5-4031-92cf-b196f5590113"),
      },
    ],
  },

];
