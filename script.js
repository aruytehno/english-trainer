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

// перемешивание
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// создание элементов
function createItems() {
  shuffle([...pairs]).forEach(p => {
    const div = document.createElement("div");
    div.textContent = p.word;
    div.className = "item";
    div.dataset.id = p.id;
    div.dataset.type = "word";
    wordsColumn.appendChild(div);
  });

  shuffle([...pairs]).forEach(p => {
    const div = document.createElement("div");
    div.textContent = p.translation;
    div.className = "item";
    div.dataset.id = p.id;
    div.dataset.type = "translation";
    translationsColumn.appendChild(div);
  });
}

// логика кликов
document.addEventListener("click", e => {
  if (!e.target.classList.contains("item")) return;
  if (e.target.classList.contains("correct")) return;

  if (!selectedItem) {
    selectedItem = e.target;
    selectedItem.classList.add("selected");
    return;
  }

  if (selectedItem.dataset.type === e.target.dataset.type) {
    selectedItem.classList.remove("selected");
    selectedItem = e.target;
    selectedItem.classList.add("selected");
    return;
  }

  // проверка пары
  if (selectedItem.dataset.id === e.target.dataset.id) {
    selectedItem.classList.add("correct");
    e.target.classList.add("correct");
  } else {
    selectedItem.classList.add("wrong");
    e.target.classList.add("wrong");

    setTimeout(() => {
      selectedItem.classList.remove("wrong");
      e.target.classList.remove("wrong");
    }, 600);
  }

  selectedItem.classList.remove("selected");
  selectedItem = null;
});

createItems();
