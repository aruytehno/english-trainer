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

  // Проверяем, не пытаемся ли мы выбрать уже выбранную карточку с другой стороны
  if (side === "left") {
    if (selectedRightIndex !== null) {
      // Если уже выбран правый элемент, проверяем совпадение
      toggleSelection("left", index);
      checkMatch();
      return;
    }
  } else {
    if (selectedLeftIndex !== null) {
      // Если уже выбран левый элемент, проверяем совпадение
      toggleSelection("right", index);
      checkMatch();
      return;
    }
  }

  // Иначе просто выбираем карточку
  if (side === "left") {
    toggleSelection("left", index);
  } else {
    toggleSelection("right", index);
  }

  // Проверяем совпадение только если выбраны оба элемента
  if (selectedLeftIndex != null && selectedRightIndex != null) {
    checkMatch();
  }
}

function toggleSelection(side, index) {
  if (side === "left") {
    const prev = selectedLeftIndex;

    // Снимаем выделение с предыдущей карточки
    if (prev != null) {
      setCardSelected("left", prev, false);
    }

    // Если кликаем на ту же карточку, снимаем выделение
    if (prev === index) {
      selectedLeftIndex = null;
    } else {
      // Выделяем новую карточку
      setCardSelected("left", index, true);
      selectedLeftIndex = index;
    }
  } else {
    const prev = selectedRightIndex;

    // Снимаем выделение с предыдущей карточки
    if (prev != null) {
      setCardSelected("right", prev, false);
    }

    // Если кликаем на ту же карточку, снимаем выделение
    if (prev === index) {
      selectedRightIndex = null;
    } else {
      // Выделяем новую карточку
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

  // Подсвечиваем оба слова зелёным
  leftCard.classList.add("matched");
  rightCard.classList.add("matched");

  // Убираем класс selected, так как у нас теперь matched
  leftCard.classList.remove("selected");
  rightCard.classList.remove("selected");

  const leftIdx = Number(leftCard.dataset.index);
  const rightIdx = Number(rightCard.dataset.index);
  const matchedId = Number(leftCard.dataset.pairId);

  // Сбрасываем выбранные индексы ДО замены слов
  selectedLeftIndex = null;
  selectedRightIndex = null;

  // Ждем немного, чтобы пользователь увидел подсветку
  setTimeout(() => {
    // Начинаем исчезновение
    leftCard.classList.add("fading-out");
    rightCard.classList.add("fading-out");
  }, 300);

  setTimeout(() => {
    // Получаем новую пару слов
    const newPair = getNextUnusedPair(matchedId) || allPairs[0];

    const newLeft = { id: newPair.id, text: newPair.en };
    const newRight = { id: newPair.id, text: newPair.ru };

    leftActive[leftIdx] = newLeft;
    rightActive[rightIdx] = newRight;

    // Обновляем содержимое карточек
    updateCardContent(leftCard, newLeft);
    updateCardContent(rightCard, newRight);

    // Убираем все классы анимации и подсветки
    leftCard.classList.remove("fading-out", "matched");
    rightCard.classList.remove("fading-out", "matched");

    // Разблокируем взаимодействие
    isInteractionLocked = false;
  }, 2000);
}

function handleWrongPair(leftCard, rightCard) {
  isInteractionLocked = true;

  // Подсвечиваем ошибку красным
  leftCard.classList.add("error");
  rightCard.classList.add("error");

  setTimeout(() => {
    // Убираем подсветку ошибки и выделение
    leftCard.classList.remove("error", "selected");
    rightCard.classList.remove("error", "selected");

    // Сбрасываем выбранные индексы
    selectedLeftIndex = null;
    selectedRightIndex = null;

    // Разблокируем взаимодействие
    isInteractionLocked = false;
  }, 800);
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