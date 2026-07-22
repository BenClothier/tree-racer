const API_KEY = "2b10lmyqdNHUjR80Hl5EcWVNe";
const API_BASE = "https://my-api.plantnet.org/v2";

const rounds = [
  { query: "oak", answer: "oak" },
  { query: "pine", answer: "pine" },
  { query: "birch", answer: "birch" },
  { query: "maple", answer: "maple" }
];

let current = null;
let score = 0;
let seen = 0;

const photo = document.getElementById("photo");
const guess = document.getElementById("guess");
const status = document.getElementById("status");
const answer = document.getElementById("answer");
const scoreEl = document.getElementById("score");
const checkBtn = document.getElementById("check");
const nextBtn = document.getElementById("next");

function norm(s) {
  return (s || "").trim().toLowerCase();
}

function setScore() {
  scoreEl.textContent = `Score: ${score}/${seen}`;
}

async function fetchRandomPlantnetImage(speciesQuery) {
  const url = `${API_BASE}/taxonomy?species=${encodeURIComponent(speciesQuery)}&images=true&api-key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Pl@ntNet request failed: ${res.status}`);
  }

  const data = await res.json();
  const species = data?.results || data?.data || data || [];

  if (!species.length) {
    throw new Error("No species found.");
  }

  const pickedSpecies = species[Math.floor(Math.random() * species.length)];
  const images = pickedSpecies?.images || [];

  if (!images.length) {
    throw new Error("No images available for that species.");
  }

  const pickedImage = images[Math.floor(Math.random() * images.length)];
  const imageUrl =
    pickedImage?.url ||
    pickedImage?.imageUrl ||
    pickedImage?.thumbnailUrl ||
    pickedImage?.originalUrl;

  if (!imageUrl) {
    throw new Error("Image URL not found in Pl@ntNet response.");
  }

  return {
    imageUrl,
    label: pickedSpecies?.scientificName || pickedSpecies?.name || speciesQuery
  };
}

async function loadRound() {
  current = rounds[Math.floor(Math.random() * rounds.length)];
  guess.value = "";
  status.textContent = "Loading...";
  answer.textContent = "";

  try {
    const result = await fetchRandomPlantnetImage(current.query);
    photo.src = result.imageUrl;
    photo.alt = result.label || "Tree photo";
    status.textContent = "";
  } catch (err) {
    photo.removeAttribute("src");
    photo.alt = "Tree photo unavailable";
    status.textContent = "Could not load a Pl@ntNet image.";
    answer.textContent = String(err.message || err);
  }
}

checkBtn.addEventListener("click", () => {
  if (!current) return;

  seen++;
  const ok = norm(guess.value) === norm(current.answer);

  if (ok) score++;

  status.textContent = ok ? "Correct!" : "Not quite.";
  answer.textContent = `Answer: ${current.answer}`;
  setScore();
});

nextBtn.addEventListener("click", loadRound);
guess.addEventListener("keydown", e => {
  if (e.key === "Enter") checkBtn.click();
});

loadRound();
setScore();
