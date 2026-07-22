const API_KEY = "sk-j5X96a61005fc901818920";
const API_BASE = "https://perenual.com/api/v2";

const rounds = [
  { query: "oak", answer: "oak" },
  { query: "pine", answer: "pine" },
  { query: "birch", answer: "birch" },
  { query: "maple", answer: "maple" }
];

let current = null;
let score = 0;
let seen = 0;
let checkedThisRound = false;
let started = false;

const photo = document.getElementById("photo");
const guess = document.getElementById("guess");
const status = document.getElementById("status");
const answer = document.getElementById("answer");
const scoreEl = document.getElementById("score");
const checkBtn = document.getElementById("check");
const nextBtn = document.getElementById("next");
const beginBtn = document.getElementById("begin");
const startControls = document.getElementById("startControls");
const gameControls = document.getElementById("gameControls");

function norm(s) {
  return (s || "").trim().toLowerCase();
}

function setScore() {
  scoreEl.textContent = `Score: ${score}/${seen}`;
}

function setNextLabel() {
  nextBtn.textContent = checkedThisRound ? "Next" : "Pass";
  nextBtn.classList.toggle("pass", !checkedThisRound);
  nextBtn.classList.toggle("secondary", checkedThisRound);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSpeciesImage(species) {
  return (
    species?.default_image?.original_url ||
    species?.default_image?.regular_url ||
    species?.default_image?.medium_url ||
    species?.images?.[0]?.original_url ||
    species?.images?.[0]?.regular_url ||
    species?.images?.[0]?.medium_url ||
    null
  );
}

async function fetchRandomPerenualImage(query) {
  const url = `${API_BASE}/species-list?q=${encodeURIComponent(query)}&key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Perenual request failed: ${res.status}`);
  }

  const data = await res.json();
  const species = data?.data || [];

  if (!species.length) {
    throw new Error("No species found.");
  }

  const candidates = species.filter(s => getSpeciesImage(s));
  const chosenPool = candidates.length ? candidates : species;
  const pickedSpecies = pick(chosenPool);
  const imageUrl = getSpeciesImage(pickedSpecies);

  if (!imageUrl) {
    throw new Error("No image available for that species.");
  }

  return {
    imageUrl,
    label: pickedSpecies?.scientific_name || pickedSpecies?.common_name || query
  };
}

async function loadRound() {
  current = pick(rounds);
  checkedThisRound = false;
  guess.value = "";
  status.textContent = "Loading...";
  answer.textContent = "";
  checkBtn.disabled = false;
  nextBtn.disabled = false;
  setNextLabel();

  try {
    const result = await fetchRandomPerenualImage(current.query);
    photo.src = result.imageUrl;
    photo.alt = result.label || "Tree photo";
    status.textContent = "";
  } catch (err) {
    photo.removeAttribute("src");
    photo.alt = "Tree photo unavailable";
    status.textContent = "Could not load a Perenual image.";
    answer.textContent = String(err.message || err);
  }
}

function startGame() {
  started = true;
  startControls.classList.add("hidden");
  gameControls.classList.remove("hidden");
  loadRound();
  setScore();
}

checkBtn.addEventListener("click", () => {
  if (!current || checkedThisRound) return;

  checkedThisRound = true;
  checkBtn.disabled = true;
  seen++;
  const ok = norm(guess.value) === norm(current.answer);

  if (ok) score++;

  status.textContent = ok ? "Correct!" : "Not quite.";
  answer.textContent = `Answer: ${current.answer}`;
  setScore();
  setNextLabel();
});

nextBtn.addEventListener("click", () => {
  if (!started) return;
  if (!checkedThisRound) {
    seen++;
    loadRound();
    return;
  }
  loadRound();
});

beginBtn.addEventListener("click", startGame);

guess.addEventListener("keydown", e => {
  if (e.key === "Enter" && started && !checkedThisRound) checkBtn.click();
});

loadRound();
setScore();
