const wordToTranslate = document.getElementById("word-to-translate");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const resetQuizBtn = document.getElementById("reset-quiz-btn");
const tryAgainBtn = document.getElementById("try-again-btn");
const progressFill = document.getElementById("progress-fill");
const quizResult = document.getElementById("quiz-result");

// Элементы статистики
const totalWordsEl = document.getElementById("total-words");
const remainingWordsEl = document.getElementById("remaining-words");
const correctCountEl = document.getElementById("correct-count");
const incorrectCountEl = document.getElementById("incorrect-count");
const resultTotalEl = document.getElementById("result-total");
const resultCorrectEl = document.getElementById("result-correct");
const resultIncorrectEl = document.getElementById("result-incorrect");
const resultAccuracyEl = document.getElementById("result-accuracy");

let allWords = [];
let currentWords = [];
let currentQuestion = null;
let currentOptions = [];
let correctAnswer = null;
let isAnswered = false;
let score = {
  total: 0,
  correct: 0,
  incorrect: 0
};

// Загрузка слов из JSON
async function loadWords() {
  try {
    const response = await fetch("words.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Не удалось загрузить words.json");
    }
    const data = await response.json();
    allWords = data.map(item => ({
      id: item.id,
      english: item.en,
      russian: item.ru
    }));
    startQuiz();
  } catch (err) {
    console.error(err);
    wordToTranslate.textContent = "Ошибка загрузки слов";
  }
}

// Начало новой викторины
function startQuiz() {
  // Сбрасываем статистику
  score = {
    total: 0,
    correct: 0,
    incorrect: 0
  };

  // Перемешиваем слова и берем 20 для викторины
  currentWords = shuffleArray([...allWords]).slice(0, 20);

  // Обновляем статистику
  updateStats();

  // Скрываем результаты
  quizResult.style.display = "none";

  // Загружаем первый вопрос
  loadNextQuestion();
}

// Загрузка следующего вопроса
function loadNextQuestion() {
  if (currentWords.length === 0) {
    showResults();
    return;
  }

  // Берем следующее слово
  currentQuestion = currentWords.shift();

  // Генерируем варианты ответов (3 неправильных + 1 правильный)
  currentOptions = generateOptions(currentQuestion);

  // Обновляем интерфейс
  updateQuestionDisplay();

  // Сбрасываем состояние ответа
  isAnswered = false;
  nextBtn.style.display = "none";

  // Включаем кнопки вариантов
  enableOptions(true);

  // Обновляем прогресс
  updateProgress();
}

// Генерация вариантов ответов
function generateOptions(question) {
  // Создаем массив с правильным ответом
  const options = [{
    text: question.english,
    isCorrect: true,
    original: question
  }];

  // Добавляем 3 случайных неправильных варианта
  const otherWords = allWords
    .filter(word => word.id !== question.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  otherWords.forEach(word => {
    options.push({
      text: word.english,
      isCorrect: false,
      original: word
    });
  });

  // Перемешиваем варианты
  return shuffleArray(options);
}

// Обновление отображения вопроса
function updateQuestionDisplay() {
  // Показываем слово для перевода
  wordToTranslate.textContent = currentQuestion.russian;

  // Очищаем контейнер с вариантами
  optionsContainer.innerHTML = "";

  // Создаем кнопки вариантов
  currentOptions.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = `${index + 1}. ${option.text}`;
    button.dataset.index = index;
    button.dataset.isCorrect = option.isCorrect;

    button.addEventListener("click", () => handleOptionClick(button, option));

    optionsContainer.appendChild(button);
  });
}

// Обработка клика по варианту ответа
function handleOptionClick(button, option) {
  if (isAnswered) return;

  isAnswered = true;
  score.total++;

  // Отключаем все кнопки
  enableOptions(false);

  if (option.isCorrect) {
    // Правильный ответ
    button.classList.add("correct");
    score.correct++;

    // Через 1 секунду автоматически переходим к следующему вопросу
    setTimeout(() => {
      if (currentWords.length > 0) {
        loadNextQuestion();
      } else {
        showResults();
      }
    }, 1000);
  } else {
    // Неправильный ответ
    button.classList.add("incorrect");
    score.incorrect++;

    // Находим и подсвечиваем правильный ответ
    const correctButton = document.querySelector('.option-btn[data-is-correct="true"]');
    correctButton.classList.add("correct");

    // Показываем кнопку "Продолжить"
    nextBtn.style.display = "block";
  }

  // Обновляем статистику
  updateStats();
}

// Включение/отключение кнопок вариантов
function enableOptions(enabled) {
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(button => {
    if (enabled) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', 'disabled');
    }
  });
}

// Обновление статистики
function updateStats() {
  totalWordsEl.textContent = allWords.length;
  remainingWordsEl.textContent = currentWords.length;
  correctCountEl.textContent = score.correct;
  incorrectCountEl.textContent = score.incorrect;

  const progress = ((20 - currentWords.length) / 20) * 100;
  progressFill.style.width = `${progress}%`;
}

// Обновление прогресс-бара
function updateProgress() {
  const progress = ((20 - currentWords.length) / 20) * 100;
  progressFill.style.width = `${progress}%`;
}

// Показать результаты
function showResults() {
  quizResult.style.display = "block";

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  resultTotalEl.textContent = score.total;
  resultCorrectEl.textContent = score.correct;
  resultIncorrectEl.textContent = score.incorrect;
  resultAccuracyEl.textContent = `${accuracy}%`;
}

// Перемешивание массива
function shuffleArray(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Обработчики событий
nextBtn.addEventListener("click", () => {
  if (currentWords.length > 0) {
    loadNextQuestion();
  } else {
    showResults();
  }
});

resetQuizBtn.addEventListener("click", startQuiz);
tryAgainBtn.addEventListener("click", startQuiz);

// Запуск при загрузке страницы
window.addEventListener("load", loadWords);