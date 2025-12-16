const pairs = [
  { id: 1, word: "apple", translation: "яблоко" },
  { id: 2, word: "dog", translation: "собака" },
  { id: 3, word: "house", translation: "дом" },
  { id: 4, word: "book", translation: "книга" },
  { id: 5, word: "sun", translation: "солнце" }
];

const wordsColumn = document.getElementById("words");
const translationsColumn = document.getElementById("translations");

let selectedItem = null;
let isBlocked = false;

/* ---------- utils ---------- */

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

/* ---------- rendering ---------- */

function createItems() {
  wordsColumn.innerHTML = "";
  translationsColumn.innerHTML = "";

  shuffle(pairs).forEach(p => {
    wordsColumn.appendChild(createItem(p.word, p.id, "word"));
  });

  shuffle(pairs).forEach(p => {
    translationsColumn.appendChild(createItem(p.translation, p.id, "translation"));
  });
}

function createItem(text, id, type) {
  const div = document.createElement("div");
  div.className = "item";
  div.textContent = text;
  div.dataset.id = id;
  div.dataset.type = type;
  return div;
}

/* ---------- game logic ---------- */

document.addEventListener("click", e => {
  if (isBlocked) return;

  const target = e.target;
  if (!target.classList.contains("item")) return;
  if (target.classList.contains("correct")) return;

  // первый клик
  if (!selectedItem) {
    selectItem(target);
    return;
  }

  // клик по тому же столбцу — смена выбора
  if (selectedItem.dataset.type === target.dataset.type) {
    clearSelection();
    selectItem(target);
    return;
  }

  // проверка пары
  checkPair(target);
});

function selectItem(item) {
  selectedItem = item;
  item.classList.add("selected");
}

function clearSelection() {
  if (selectedItem) {
    selectedItem.classList.remove("selected");
    selectedItem = null;
  }
}

function checkPair(target) {
  if (selectedItem.dataset.id === target.dataset.id) {
    markCorrect(target);
  } else {
    markWrong(target);
  }
  clearSelection();
}

function markCorrect(target) {
  selectedItem.classList.add("correct");
  target.classList.add("correct");
}

function markWrong(target) {
  isBlocked = true;

  selectedItem.classList.add("wrong");
  target.classList.add("wrong");

  setTimeout(() => {
    selectedItem.classList.remove("wrong");
    target.classList.remove("wrong");
    isBlocked = false;
  }, 600);
}

/* ---------- start ---------- */

createItems();
