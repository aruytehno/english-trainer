const gameArea = document.getElementById("game-area");
const wordInput = document.getElementById("word-input");

const MAX_ACTIVE_WORDS = 5;
const SPAWN_INTERVAL_MS = 2000;
const BASE_FALL_SPEED = 40; // px / sec

let gameWords = [];
let activeWords = [];
let lastTimestamp = null;
let spawnTimer = 0;
let isGameRunning = false;

async function loadGameWords() {
  try {
    const response = await fetch("words.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Не удалось загрузить words.json для игры");
    }
    const data = await response.json();
    gameWords = data.map((item) => ({
      id: item.id,
      text: item.en,
    }));
    startGame();
  } catch (err) {
    console.error(err);
  }
}

function startGame() {
  activeWords.forEach((w) => {
    if (w.element && w.element.parentNode) {
      w.element.parentNode.removeChild(w.element);
    }
  });
  activeWords = [];

  lastTimestamp = null;
  spawnTimer = 0;
  isGameRunning = true;

  for (let i = 0; i < 3; i += 1) {
    spawnWord();
  }

  requestAnimationFrame(gameLoop);
  if (wordInput) {
    wordInput.value = "";
    wordInput.focus();
  }
}

function spawnWord() {
  if (!gameWords.length || activeWords.length >= MAX_ACTIVE_WORDS) return;
  const base = gameWords[Math.floor(Math.random() * gameWords.length)];

  const wordElem = document.createElement("div");
  wordElem.className = "falling-word";
  wordElem.textContent = base.text;

  const areaRect = gameArea.getBoundingClientRect();
  const xPercent = 10 + Math.random() * 80;

  wordElem.style.left = `${xPercent}%`;
  wordElem.style.top = "-10%";

  gameArea.appendChild(wordElem);

  const instance = {
    id: base.id,
    text: base.text,
    xPercent,
    yPercent: -10,
    speed: BASE_FALL_SPEED + Math.random() * 25,
    element: wordElem,
  };

  activeWords.push(instance);
}

function gameLoop(timestamp) {
  if (!isGameRunning) return;

  if (lastTimestamp == null) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  spawnTimer += delta * 1000;
  if (spawnTimer >= SPAWN_INTERVAL_MS) {
    spawnTimer = 0;
    spawnWord();
  }

  const areaRect = gameArea.getBoundingClientRect();
  const heightPx = areaRect.height;

  for (let i = activeWords.length - 1; i >= 0; i -= 1) {
    const w = activeWords[i];
    const dy = (w.speed * delta * 100) / heightPx;
    w.yPercent += dy;

    if (w.element) {
      w.element.style.top = `${w.yPercent}%`;
    }

    if (w.yPercent > 120) {
      if (w.element && w.element.parentNode) {
        w.element.parentNode.removeChild(w.element);
      }
      activeWords.splice(i, 1);
    }
  }

  requestAnimationFrame(gameLoop);
}

function handleInput(e) {
  if (e.key !== "Enter") return;
  const value = wordInput.value.trim().toLowerCase();
  if (!value) return;

  const matchIndex = activeWords.findIndex(
    (w) => w.text.toLowerCase() === value,
  );
  if (matchIndex === -1) {
    wordInput.value = "";
    return;
  }

  const target = activeWords[matchIndex];
  fireLaserAt(target);
  wordInput.value = "";
}

function fireLaserAt(target) {
  if (!target || !target.element) return;

  const areaRect = gameArea.getBoundingClientRect();
  const inputRect = wordInput.getBoundingClientRect();
  const wordRect = target.element.getBoundingClientRect();

  const startX = inputRect.left + inputRect.width / 2 - areaRect.left;
  const startY = inputRect.top - areaRect.top;

  const endX = wordRect.left + wordRect.width / 2 - areaRect.left;
  const endY = wordRect.top + wordRect.height / 2 - areaRect.top;

  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI - 90;

  const beam = document.createElement("div");
  beam.className = "laser-beam";
  beam.style.left = `${startX}px`;
  beam.style.top = `${startY}px`;
  beam.style.height = `${distance}px`;
  beam.style.transform = `rotate(${angleDeg}deg)`;

  gameArea.appendChild(beam);

  target.element.classList.add("exploding");

  const removeTarget = () => {
    const idx = activeWords.indexOf(target);
    if (idx !== -1) {
      activeWords.splice(idx, 1);
    }
    if (target.element && target.element.parentNode) {
      target.element.parentNode.removeChild(target.element);
    }
    spawnWord();
  };

  target.element.addEventListener(
    "animationend",
    () => {
      removeTarget();
    },
    { once: true },
  );

  beam.addEventListener(
    "animationend",
    () => {
      if (beam.parentNode) {
        beam.parentNode.removeChild(beam);
      }
    },
    { once: true },
  );
}

wordInput.addEventListener("keydown", handleInput);
window.addEventListener("load", loadGameWords);


