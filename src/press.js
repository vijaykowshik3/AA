/**
 * Press — each publication opens inside an Apple-style reader window on our own
 * page, showing the article under its real address.
 *
 * mode: "live"     → the publisher's page loads in the window (only if the site allows framing)
 *       "snapshot" → a full-length capture of the real article (public/img/press/<id>.jpg)
 *       "card"     → a designed preview with the headline, until a snapshot exists
 */
export const PRESS = [
  {
    id: "archdaily", outlet: "ArchDaily", date: "2025", project: "pregame",
    title: "Pregame Concept Store and Bar / ATELIER ASTIL",
    url: "https://www.archdaily.com/1036871/pregame-concept-store-and-bar-atelier-astil",
    excerpt: "A sculpted, cave-like interior that turns a constrained shell in Bengaluru into a single continuous space for retail, dining and nightlife.",
    image: "img/projects/pregame/01.jpg", mode: "card",
  },
  {
    id: "elle-decor", outlet: "ELLE Decor India", date: "2025", project: "pregame",
    title: "Pregame? Inside Bengaluru’s retail store and bar by Atelier Astil",
    url: "https://elledecor.in/pregame-bar-in-bengaluru-by-atelier-astil/",
    excerpt: "Drawing from subterranean architecture and ancient carved spaces, a retail store and pub synchronised in one space across two levels.",
    image: "img/projects/pregame/05.jpg", mode: "card",
  },
  {
    id: "architects-diary", outlet: "The Architects Diary", date: "2025", project: "pregame",
    title: "This immersive concept store is sculpted as a maze in Bangalore",
    url: "https://thearchitectsdiary.com/this-immersive-concept-store-is-sculpted-as-a-maze-in-bangalore-atelier-astil/",
    excerpt: "An immersive, maze-like spatial narrative defined by sculpted interior forms.",
    image: "img/projects/pregame/04.jpg", mode: "card",
  },
  {
    id: "interior-design", outlet: "Interior Design", date: "May 2026", project: "pregame",
    title: "Inside a cavernous hybrid concept store, restaurant and bar",
    url: "https://interiordesign.net/projects/atelier-astil-hot-shots-may-2026/",
    excerpt: "Hot Shots, May 2026 — a 10,000-square-foot hybrid concept store, restaurant and bar by Atelier Astil.",
    image: "img/projects/pregame/09.jpg", mode: "card",
  },
];
