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
    id: 3,
    type: "grid2x2",
    title: "Two by Two",
    instructions: [
      "Here are 6 artworks from the Getty Museum. Four of them fill the grid; two do not belong.",
      "Each <strong>row</strong> must hold two works by the <strong>same artist</strong>. Each <strong>column</strong> must hold two works of the <strong>same subject</strong>. Nothing is labelled — work it out by looking.",
      "Either artist can take either row, and either subject can take either column. Only the pattern has to hold.",
    ],
    rowAxis:    { label: "Same Artist",  reveal: "Rows: Agnolo Bronzino / Anthony van Dyck" },
    columnAxis: { label: "Same Subject", reveal: "Columns: a portrait drawing / a single saint" },
    artworks: [
      // ── Bronzino ───────────────────────────────────────────────────────────
      {
        id:       "bronzino-head-of-a-man",
        objectId: "103R4A",
        title:    "Head of a Man",
        artist:   "Agnolo Bronzino",
        theme:    "portrait",
        date:     "about 1550–1555",
        medium:   "Black chalk",
        imageUrl: gettyImg("bc6c5fdd-44d8-4eaf-80a3-9e6ca8448ffc"),
      },
      {
        id:       "bronzino-john-baptist",
        objectId: "103RCY",
        title:    "Saint John the Baptist",
        artist:   "Agnolo Bronzino",
        theme:    "saint",
        date:     "about 1542–1545",
        medium:   "Oil on panel",
        imageUrl: gettyImg("96af3363-a0d3-47e2-b03d-8ba10177405f"),
      },
      // ── Van Dyck ───────────────────────────────────────────────────────────
      {
        id:       "vandyck-van-balen",
        objectId: "103QXN",
        title:    "Portrait of Hendrick van Balen",
        artist:   "Anthony van Dyck",
        theme:    "portrait",
        date:     "about 1627–1632",
        medium:   "Black chalk",
        imageUrl: gettyImg("6a62bf2f-04d1-4734-9e97-9cd1237546da"),
      },
      {
        id:       "vandyck-apostle-simon",
        objectId: "103RGM",
        title:    "The Apostle Simon",
        artist:   "Anthony van Dyck",
        theme:    "saint",
        date:     "about 1618",
        medium:   "Oil on panel",
        imageUrl: gettyImg("19c651ee-404f-43b4-9511-cddf5cc8769c"),
      },
      // ── DISTRACTORS ────────────────────────────────────────────────────────
      // Right artist, wrong subject: van Dyck, but neither a portrait nor a
      // saint — excluded by the column rule.
      {
        id:       "vandyck-landscape",
        objectId: "103QS7",
        title:    "Landscape",
        artist:   "Anthony van Dyck",
        theme:    "landscape",
        date:     "about 1640",
        medium:   "Pen and brown ink and watercolor",
        imageUrl: gettyImg("0cff9091-e65c-4f63-8da5-44d0c4bc0782"),
      },
      // Right subject, wrong artist: a single saint, but by a third hand with
      // no partner on the board — excluded by the row rule.
      {
        id:       "rembrandt-bartholomew",
        objectId: "103RB6",
        title:    "Saint Bartholomew",
        artist:   "Rembrandt Harmensz. van Rijn",
        theme:    "saint",
        date:     "1661",
        medium:   "Oil on canvas",
        imageUrl: gettyImg("419d4e47-23e5-4031-92cf-b196f5590113"),
      },
    ],
  },

];
