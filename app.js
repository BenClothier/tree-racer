const API_KEY = "sk-j5X96a61005fc901818920";
const API_BASE = "https://perenual.com/api/v2";

const rounds = [
  { id: "6520", answer: "English Oak" },
  { id: "5517", answer: "Olive" },
  { id: "1289", answer: "Silver Birch" }
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
const gameStatus = document.getElementById("gameStatus");

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

async function fetchSpeciesImageById(id) {
  const url = `${API_BASE}/species/details/${encodeURIComponent(id)}?key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Perenual request failed: ${res.status}`);

  const data = await res.json();
  const images = [
    data?.default_image?.original_url,
    data?.default_image?.regular_url,
    ...(data?.other_images || []).flatMap(img => [
      img?.original_url,
      img?.regular_url
    ])
  ].filter(Boolean);

  if (!images.length) {
    throw new Error("No image available for that species.");
  }

  return {
    imageUrl: pick(images),
    label: data?.scientific_name?.[0] || data?.common_name || String(id)
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
    const result = await fetchSpeciesImageById(current.id);
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
  gameStatus.classList.remove("hidden");
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

setNextLabel();
setScore();
