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
    type: 'cross',
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
    type: 'ring',
    title: "Dutch Landscapes & Golden Age Waters",
    instructions: "Here are 10 paintings at the Getty Museum. 8 of them fit around this ring; the center square is unused. The top row shares a motif, the left column shares the nationality of the artist, the bottom row shares a decade, and the right column shares something shown in the painting. Each corner satisfies two of these at once.",
    axes: {
      top:    { label: "Same Motif",        reveal: "Landscape" },
      left:   { label: "Same Nationality",  reveal: "Dutch" },
      bottom: { label: "Same Decade",       reveal: "1640s" },
      right:  { label: "Same Object Shown", reveal: "Water" },
    },
    cellAxes: {
      topLeft:     ['top', 'left'],
      top:         ['top'],
      topRight:    ['top', 'right'],
      left:        ['left'],
      right:       ['right'],
      bottomLeft:  ['left', 'bottom'],
      bottom:      ['bottom'],
      bottomRight: ['bottom', 'right'],
    },
    solution: {
      topLeft:     "ruisdael-wheatfield",
      top:         "poussin-calm",
      topRight:    "brueghel-four-elements",
      left:        "hals-saint-john",
      right:       "canaletto-grand-canal",
      bottomLeft:  "eeckhout-hagar",
      bottom:      "reni-virgin-child",
      bottomRight: "jordaens-moses-water",
    },
    artworks: [
      // ── CORNER: motif + nationality (Landscape, Dutch) ────────────────────
      {
        id:       "ruisdael-wheatfield",
        objectId: "103RFC",
        title:    "Landscape with a Wheatfield",
        artist:   "Jacob van Ruisdael",
        date:     "about late 1650s–early 1660s",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("8ec78c82-d3f1-4bfe-b345-0429f69dc889"),
      },
      // ── EDGE: motif only (Landscape) ───────────────────────────────────────
      {
        id:       "poussin-calm",
        objectId: "107VSC",
        title:    "Landscape with a Calm (Un Tem[p]s calme et serein)",
        artist:   "Nicolas Poussin",
        date:     "1650–1651",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("c68cb8b8-a473-4e07-9665-51548e31ce59"),
      },
      // ── CORNER: motif + item (Landscape, Water) ─────────────────────────────
      {
        id:       "brueghel-four-elements",
        objectId: "103RBB",
        title:    "Landscape with Allegories of the Four Elements",
        artist:   "Jan Brueghel the Younger & Frans Francken the Younger",
        date:     "1635",
        medium:   "Oil on panel",
        imageUrl: gettyImg("8885190d-c566-4344-9431-e64b3f0c1445"),
      },
      // ── EDGE: nationality only (Dutch) ──────────────────────────────────────
      {
        id:       "hals-saint-john",
        objectId: "107VP6",
        title:    "Saint John the Evangelist",
        artist:   "Frans Hals",
        date:     "about 1625",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("d3d3c01c-ebe6-4547-89e3-6526917120bd"),
      },
      // ── EDGE: item only (Water) ──────────────────────────────────────────────
      {
        id:       "canaletto-grand-canal",
        objectId: "103QTD",
        title:    "The Grand Canal in Venice from Palazzo Flangini to Campo San Marcuola",
        artist:   "Canaletto (Giovanni Antonio Canal)",
        date:     "about 1738",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("0bfd8fdf-457f-43c8-9253-a2346d37d26a"),
      },
      // ── CORNER: nationality + decade (Dutch, 1640s) ─────────────────────────
      {
        id:       "eeckhout-hagar",
        objectId: "103RCN",
        title:    "Hagar Weeping",
        artist:   "Gerbrand van den Eeckhout",
        date:     "early 1640s",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("cd34ef79-89e4-4359-ae4a-eae066c597ca"),
      },
      // ── EDGE: decade only (1640s) ─────────────────────────────────────────────
      {
        id:       "reni-virgin-child",
        objectId: "103RG5",
        title:    "Virgin and Child with Saint John the Baptist",
        artist:   "Guido Reni",
        date:     "about 1640–1642",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("29bf449e-0239-49db-9375-6ce5e4d75abb"),
      },
      // ── CORNER: decade + item (1640s, Water) ────────────────────────────────
      {
        id:       "jordaens-moses-water",
        objectId: "103REJ",
        title:    "Moses Striking Water from the Rock",
        artist:   "Jacob Jordaens",
        date:     "about 1645–1650",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("6276aafc-cacc-4174-a8f0-6a1048253c09"),
      },
      // ── DISTRACTORS ────────────────────────────────────────────────────────
      {
        id:       "vandyck-pallavicini",
        objectId: "103R9N",
        title:    "Portrait of Agostino Pallavicini",
        artist:   "Anthony van Dyck",
        date:     "about 1621",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("6f22d350-eb77-4992-b60d-72e49c64d326"),
      },
      {
        id:       "titian-davalos",
        objectId: "1096PT",
        title:    "Portrait of Alfonso d'Avalos, Marchese del Vasto, in Armor with a Page",
        artist:   "Titian (Tiziano Vecellio)",
        date:     "probably January–February 1533",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("1e68e51d-11e5-452e-b5a1-2d18ac34cb1b"),
      },
    ],
  },

];
