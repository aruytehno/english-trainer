const gameArea = document.getElementById("game-area");
const wordInput = document.getElementById("word-input");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const restartBtn = document.getElementById("restart-btn");
const hearts = document.querySelectorAll(".heart");

const MAX_ACTIVE_WORDS = 5;
const SPAWN_INTERVAL_MS = 2000;
const INITIAL_FALL_SPEED = 40; // px / sec

// Константы для связи со словарем (должны совпадать с dictionary.js)
const STORAGE_KEY = 'english_trainer_progress';
const SELECTED_WORDS_KEY = 'english_trainer_selected_words';

let allWords = []; // Все слова из words.json
let activeWords = [];
let lastTimestamp = null;
let spawnTimer = 0;
let isGameRunning = false;
let currentSpeed = INITIAL_FALL_SPEED;
let lives = 10;
let gameStarted = false;

// Получение изучаемых слов
function getStudyWords() {
  const studyWordsJson = localStorage.getItem(SELECTED_WORDS_KEY);
  if (studyWordsJson) {
    try {
      return JSON.parse(studyWordsJson);
    } catch (e) {
      return [];
    }
  }
  return [];
}

// Загружаем слова из JSON
async function loadGameWords() {
  try {
    const response = await fetch("words.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Не удалось загрузить words.json для игры");
    }
    const data = await response.json();

    // Получаем изучаемые слова
    const studyWordIds = getStudyWords();

    if (studyWordIds.length > 0) {
      // Если есть изучаемые слова - используем только их
      allWords = data
        .filter(item => studyWordIds.includes(item.id))
        .map((item) => ({
          id: item.id,
          russian: item.ru, // Слово падает на русском
          english: item.en  // Перевод вводим на английском
        }));
    } else {
      // Иначе используем все слова
      allWords = data.map((item) => ({
        id: item.id,
        russian: item.ru,
        english: item.en
      }));
    }

    // Если после фильтрации слов нет, используем все слова
    if (allWords.length === 0) {
      allWords = data.map((item) => ({
        id: item.id,
        russian: item.ru,
        english: item.en
      }));
    }

  } catch (err) {
    console.error(err);
  }
}

// Обновление прогресса слова в словаре
function updateWordProgressInDictionary(wordId) {
  try {
    // Получаем текущий прогресс из localStorage
    const progressJson = localStorage.getItem(STORAGE_KEY);
    let userProgress = {};

    if (progressJson) {
      userProgress = JSON.parse(progressJson);
    }

    // Инициализируем прогресс для слова, если его нет
    if (!userProgress[wordId]) {
      userProgress[wordId] = {
        score: 0,
        study: false
      };
    }

    // Увеличиваем счетчик, но не больше 10
    if (userProgress[wordId].score < 10) {
      userProgress[wordId].score++;
    }

    // Сохраняем обновленный прогресс
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));

    // Обновляем список изучаемых слов для тренажёров
    updateStudyWordsForTrainers(userProgress);

  } catch (error) {
    console.error("Ошибка при обновлении прогресса слова:", error);
  }
}

// Обновление списка изучаемых слов
function updateStudyWordsForTrainers(userProgress) {
  try {
    // Находим все слова с изучением и счетом меньше 10
    const studyWords = [];

    if (allWords && allWords.length > 0) {
      allWords.forEach(word => {
        if (userProgress[word.id]?.study && userProgress[word.id]?.score < 10) {
          studyWords.push(word.id);
        }
      });
    }

    // Сохраняем в отдельный ключ для использования в тренажёрах
    localStorage.setItem(SELECTED_WORDS_KEY, JSON.stringify(studyWords));
  } catch (error) {
    console.error("Ошибка при обновлении изучаемых слов:", error);
  }
}

// Обновляем отображение жизней
function updateLivesDisplay() {
  hearts.forEach((heart, index) => {
    if (index < lives) {
      heart.classList.remove("lost");
    } else {
      heart.classList.add("lost");
    }
  });
}

// Запуск игры
function startGame() {
  // Очищаем игровое поле
  gameArea.innerHTML = "";

  // Сбрасываем состояние
  activeWords = [];
  lastTimestamp = null;
  spawnTimer = 0;
  isGameRunning = true;
  lives = 10;
  gameStarted = true;

  // Обновляем отображение
  updateLivesDisplay();

  // Блокируем слайдер во время игры
  speedSlider.disabled = true;

  // Фокусируемся на поле ввода
  if (wordInput) {
    wordInput.value = "";
    wordInput.focus();
  }

  // Запускаем игровой цикл
  requestAnimationFrame(gameLoop);
}

// Создание падающего слова
function spawnWord() {
  if (!allWords.length || activeWords.length >= MAX_ACTIVE_WORDS || !isGameRunning) return;

  const wordData = allWords[Math.floor(Math.random() * allWords.length)];

  // Создаем элемент слова
  const wordElem = document.createElement("div");
  wordElem.className = "falling-word";
  wordElem.textContent = wordData.russian; // Показываем русское слово
  wordElem.dataset.english = wordData.english.toLowerCase(); // Сохраняем английский перевод
  wordElem.dataset.wordId = wordData.id; // Сохраняем ID слова

  // Позиционируем в случайном месте сверху
  const areaRect = gameArea.getBoundingClientRect();
  const xPercent = 10 + Math.random() * 80;

  wordElem.style.left = `${xPercent}%`;
  wordElem.style.top = "-10%";

  gameArea.appendChild(wordElem);

  // Создаем объект слова
  const wordInstance = {
    id: wordData.id,
    russian: wordData.russian,
    english: wordData.english,
    element: wordElem,
    xPercent,
    yPercent: -10,
    speed: currentSpeed + Math.random() * 25,
    isDestroyed: false
  };

  activeWords.push(wordInstance);
  return wordInstance;
}

// Игровой цикл
function gameLoop(timestamp) {
  if (!isGameRunning) return;

  if (lastTimestamp == null) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Генерация новых слов
  spawnTimer += delta * 1000;
  if (spawnTimer >= SPAWN_INTERVAL_MS) {
    spawnTimer = 0;
    spawnWord();
  }

  const areaRect = gameArea.getBoundingClientRect();
  const heightPx = areaRect.height;

  // Обновление позиций слов
  for (let i = activeWords.length - 1; i >= 0; i--) {
    const word = activeWords[i];

    if (word.isDestroyed) {
      continue;
    }

    // Двигаем слово вниз
    const dy = (word.speed * delta * 100) / heightPx;
    word.yPercent += dy;

    // Обновляем позицию
    if (word.element) {
      word.element.style.top = `${word.yPercent}%`;
    }

    // Проверяем, упало ли слово за нижнюю границу
    if (word.yPercent > 110) {
      // Удаляем слово
      if (word.element && word.element.parentNode) {
        word.element.parentNode.removeChild(word.element);
      }
      activeWords.splice(i, 1);

      // Отнимаем жизнь
      loseLife();
    }
  }

  // Проверяем условие проигрыша
  if (lives <= 0) {
    gameOver();
    return;
  }

  // Продолжаем игровой цикл
  requestAnimationFrame(gameLoop);
}

// Потеря жизни
function loseLife() {
  if (lives > 0) {
    lives--;
    updateLivesDisplay();
  }
}

// Конец игры
function gameOver() {
  isGameRunning = false;

  // Создаем overlay с сообщением
  const gameOverDiv = document.createElement("div");
  gameOverDiv.className = "game-over";
  gameOverDiv.innerHTML = `
    <h2>Игра окончена!</h2>
    <p>У вас закончились жизни</p>
    <button id="play-again-btn" class="restart-btn">Играть снова</button>
  `;

  gameArea.appendChild(gameOverDiv);

  // Обработчик для кнопки "Играть снова"
  document.getElementById("play-again-btn").addEventListener("click", () => {
    gameArea.removeChild(gameOverDiv);
    startGame();
  });

  // Разблокируем слайдер
  speedSlider.disabled = false;
}

// Обработка ввода пользователя
function handleInput(e) {
  if (e.key !== "Enter" || !isGameRunning) return;

  const inputValue = wordInput.value.trim().toLowerCase();
  if (!inputValue) return;

  // Ищем слово с соответствующим переводом
  const matchedWordIndex = activeWords.findIndex(
    (word) => word.english.toLowerCase() === inputValue && !word.isDestroyed
  );

  if (matchedWordIndex === -1) {
    // Неправильный ввод - просто очищаем поле
    wordInput.value = "";
    return;
  }

  // Нашли совпадение - уничтожаем слово
  const targetWord = activeWords[matchedWordIndex];
  destroyWord(targetWord);

  // Очищаем поле ввода
  wordInput.value = "";
}

// Уничтожение слова с эффектом
function destroyWord(word) {
  if (!word || word.isDestroyed) return;

  word.isDestroyed = true;

  // Эффект исчезновения
  word.element.classList.add("fading-out");

  // Удаляем слово после анимации
  setTimeout(() => {
    const index = activeWords.indexOf(word);
    if (index !== -1) {
      activeWords.splice(index, 1);
    }
    if (word.element && word.element.parentNode) {
      word.element.parentNode.removeChild(word.element);
    }
  }, 400);

  // Обновляем прогресс слова в словаре
  updateWordProgressInDictionary(word.id);
}

// Обновление скорости из слайдера
function updateSpeed() {
  if (gameStarted) return; // Не позволяем менять скорость во время игры

  currentSpeed = parseInt(speedSlider.value);
  speedValue.textContent = `${currentSpeed} px/сек`;
}

// Инициализация
async function init() {
  await loadGameWords();

  // Настройка слайдера скорости
  speedSlider.value = INITIAL_FALL_SPEED;
  speedValue.textContent = `${INITIAL_FALL_SPEED} px/сек`;

  speedSlider.addEventListener("input", updateSpeed);

  // Кнопка перезапуска
  restartBtn.addEventListener("click", () => {
    if (gameStarted) {
      // Если игра идет, останавливаем ее
      isGameRunning = false;
      gameStarted = false;
    }

    // Разблокируем слайдер
    speedSlider.disabled = false;

    // Перезагружаем слова (на случай изменения списка изучаемых)
    loadGameWords().then(() => {
      // Запускаем новую игру
      startGame();
    });
  });

  // Обработка ввода
  wordInput.addEventListener("keydown", handleInput);

  // Инициализируем отображение жизней
  updateLivesDisplay();
}

// Запуск при загрузке страницы
window.addEventListener("load", init);