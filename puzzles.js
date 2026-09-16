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
    id: 2,
    type: "zigzag",
    title: "Venus, Four Ways",
    instructions: [
      "Here are 10 artworks at the Getty Museum. 8 of them fit the grid. The center blue column holds four depictions featuring Venus, the Roman goddess of love; drag each image of Venus to one of the central boxes.",
      "Each box next to an image of Venus holds a painting by same artist. Bonus points if you get the artists in chronological order, with the earliest pair of works at the bottom, and the latest at the top.",
    ],
    centerAxis: { label: "Image of Venus", reveal: "Venus" },
    sideAxis:   { label: "Same Artist",  reveal: "Same artist as its row's center painting" },
    rowLabels: { top: "Latest", bottom: "Earliest" },
    solution: {
      centerIds: ["boucher-venus-triumph", "ricci-marine-venus", "solimena-forge", "titian-venus-adonis"],
    },
    // Approximate year for each center (Venus) painting, used to score how close
    // the player's final top-to-bottom arrangement comes to chronological order
    // (latest on top, earliest on bottom).
    chronology: {
      "titian-venus-adonis":   1557,
      "solimena-forge":        1704,
      "ricci-marine-venus":    1713,
      "boucher-venus-triumph": 1743,
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
        id:       "deheem-vase",
        objectId: "29Y70F",
        title:    "Glass Vase with Flowers and Fruit",
        artist:   "Jan Davidsz. de Heem",
        date:     "about 1673-74",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("70c596e7-ef41-429e-a8c5-b19f887f9000"),
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
