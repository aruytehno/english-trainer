const LEFT_SIZE = 5;
const RIGHT_SIZE = 5;

let allPairs = [];
let nextPoolIndex = 0;

let leftActive = new Array(LEFT_SIZE);
let rightActive = new Array(RIGHT_SIZE);

let selectedLeftIndex = null;
let selectedRightIndex = null;
let isInteractionLocked = false;

const leftContainer = document.getElementById("column-left");
const rightContainer = document.getElementById("column-right");
const resetBtn = document.getElementById("reset-btn");

async function loadWords() {
  try {
    const response = await fetch("words.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Не удалось загрузить words.json");
    }
    const data = await response.json();
    allPairs = shuffleArray(data.slice());
    initializeBoard();
  } catch (err) {
    console.error(err);
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initializeBoard() {
  if (!allPairs.length) return;

  // перемешиваем общий пул пар и берём первые 5 как активные
  allPairs = shuffleArray(allPairs.slice());
  nextPoolIndex = LEFT_SIZE;

  leftActive = new Array(LEFT_SIZE);
  rightActive = new Array(RIGHT_SIZE);
  selectedLeftIndex = null;
  selectedRightIndex = null;
  isInteractionLocked = false;

  leftContainer.innerHTML = "";
  rightContainer.innerHTML = "";

  const initialPairs = allPairs.slice(0, LEFT_SIZE);

  for (let i = 0; i < LEFT_SIZE; i += 1) {
    leftActive[i] = { id: initialPairs[i].id, text: initialPairs[i].en };
    const card = createWordCard("left", i, leftActive[i]);
    leftContainer.appendChild(card);
  }

  const rightItems = initialPairs.map((p) => ({
    id: p.id,
    text: p.ru,
  }));
  const shuffledForRight = shuffleArray(rightItems);

  for (let i = 0; i < RIGHT_SIZE; i += 1) {
    rightActive[i] = shuffledForRight[i];
    const card = createWordCard("right", i, rightActive[i]);
    rightContainer.appendChild(card);
  }
}

function getNextUnusedPair(excludeId) {
  if (!allPairs.length) return null;

  const activeIds = new Set();
  leftActive.forEach((item) => {
    if (item) activeIds.add(item.id);
  });

  if (excludeId != null) activeIds.delete(excludeId);

  const total = allPairs.length;
  for (let step = 0; step < total; step += 1) {
    const idx = (nextPoolIndex + step) % total;
    const candidate = allPairs[idx];
    if (!activeIds.has(candidate.id)) {
      nextPoolIndex = (idx + 1) % total;
      return candidate;
    }
  }
  return null;
}

function createWordCard(side, index, item) {
  const card = document.createElement("div");
  card.className = "word-card";
  card.dataset.side = side;
  card.dataset.index = index.toString();
  card.dataset.pairId = item.id.toString();
  const span = document.createElement("span");
  span.textContent = item.text;
  card.appendChild(span);

  card.addEventListener("click", () => handleCardClick(card));
  return card;
}

function handleCardClick(card) {
  if (isInteractionLocked) return;

  const side = card.dataset.side;
  const index = Number(card.dataset.index);

  if (side === "left") {
    toggleSelection("left", index);
  } else {
    toggleSelection("right", index);
  }

  if (selectedLeftIndex != null && selectedRightIndex != null) {
    checkMatch();
  }
}

function toggleSelection(side, index) {
  if (side === "left") {
    const prev = selectedLeftIndex;
    if (prev === index) {
      setCardSelected("left", index, false);
      selectedLeftIndex = null;
    } else {
      if (prev != null) setCardSelected("left", prev, false);
      setCardSelected("left", index, true);
      selectedLeftIndex = index;
    }
  } else {
    const prev = selectedRightIndex;
    if (prev === index) {
      setCardSelected("right", index, false);
      selectedRightIndex = null;
    } else {
      if (prev != null) setCardSelected("right", prev, false);
      setCardSelected("right", index, true);
      selectedRightIndex = index;
    }
  }
}

function setCardSelected(side, index, selected) {
  const container = side === "left" ? leftContainer : rightContainer;
  const card = container.querySelector(`.word-card[data-index="${index}"]`);
  if (!card) return;
  card.classList.toggle("selected", selected);
}

function checkMatch() {
  const leftCard = leftContainer.querySelector(
    `.word-card[data-index="${selectedLeftIndex}"]`,
  );
  const rightCard = rightContainer.querySelector(
    `.word-card[data-index="${selectedRightIndex}"]`,
  );
  if (!leftCard || !rightCard) return;

  const leftId = Number(leftCard.dataset.pairId);
  const rightId = Number(rightCard.dataset.pairId);

  if (leftId === rightId) {
    handleCorrectPair(leftCard, rightCard);
  } else {
    handleWrongPair(leftCard, rightCard);
  }
}

function handleCorrectPair(leftCard, rightCard) {
  isInteractionLocked = true;

  leftCard.classList.remove("selected");
  rightCard.classList.remove("selected");

  leftCard.classList.add("fading-out");
  rightCard.classList.add("fading-out");

  const leftIdx = Number(leftCard.dataset.index);
  const rightIdx = Number(rightCard.dataset.index);
  const matchedId = Number(leftCard.dataset.pairId);

  selectedLeftIndex = null;
  selectedRightIndex = null;

  setTimeout(() => {
    const newPair = getNextUnusedPair(matchedId) || allPairs[0];

    const newLeft = { id: newPair.id, text: newPair.en };
    const newRight = { id: newPair.id, text: newPair.ru };

    leftActive[leftIdx] = newLeft;
    rightActive[rightIdx] = newRight;

    updateCardContent(leftCard, newLeft);
    updateCardContent(rightCard, newRight);

    leftCard.classList.remove("fading-out");
    rightCard.classList.remove("fading-out");

    isInteractionLocked = false;
  }, 2000);
}

function handleWrongPair(leftCard, rightCard) {
  isInteractionLocked = true;

  leftCard.classList.add("error");
  rightCard.classList.add("error");

  setTimeout(() => {
    leftCard.classList.remove("error", "selected");
    rightCard.classList.remove("error", "selected");
    selectedLeftIndex = null;
    selectedRightIndex = null;
    isInteractionLocked = false;
  }, 500);
}

function updateCardContent(card, item) {
  card.dataset.pairId = item.id.toString();
  const span = card.querySelector("span");
  if (span) {
    span.textContent = item.text;
  }
}

resetBtn.addEventListener("click", () => {
  if (!allPairs.length) return;
  initializeBoard();
});

window.addEventListener("load", loadWords);


