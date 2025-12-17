const STORAGE_KEY = 'english_trainer_progress';
const SELECTED_WORDS_KEY = 'english_trainer_selected_words';

// DOM элементы
const wordsTableBody = document.getElementById('words-table-body');
const totalWordsEl = document.getElementById('total-words');
const studyWordsEl = document.getElementById('study-words');
const averageScoreEl = document.getElementById('average-score');
const learnedWordsEl = document.getElementById('learned-words');
const toggleStudyBtn = document.getElementById('toggle-study-btn');
const resetProgressBtn = document.getElementById('reset-progress-btn');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const selectAllCheckbox = document.getElementById('select-all-checkbox');
const bulkActions = document.getElementById('bulk-actions');
const selectedCountEl = document.getElementById('selected-count');
const bulkStudyBtn = document.getElementById('bulk-study-btn');
const bulkRemoveStudyBtn = document.getElementById('bulk-remove-study-btn');
const bulkClearBtn = document.getElementById('bulk-clear-btn');

// Данные
let allWords = [];
let userProgress = {};
let filteredWords = [];
let selectedWordIds = new Set();
let showStudyOnly = false;
let searchTerm = '';

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

    // Загружаем прогресс пользователя
    loadUserProgress();

    // Инициализируем
    updateStatistics();
    renderWordsTable();
  } catch (err) {
    console.error(err);
    showError("Ошибка загрузки слов");
  }
}

// Загрузка прогресса пользователя
function loadUserProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      userProgress = JSON.parse(saved);
    } catch (e) {
      console.error("Ошибка загрузки прогресса:", e);
      userProgress = {};
    }
  }

  // Инициализируем прогресс для новых слов
  allWords.forEach(word => {
    if (!userProgress[word.id]) {
      userProgress[word.id] = {
        score: 0,
        study: false
      };
    }
  });
}

// Сохранение прогресса
function saveUserProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
    updateStatistics();

    // Обновляем глобальное состояние для других режимов
    updateStudyWordsForTrainers();
  } catch (e) {
    console.error("Ошибка сохранения прогресса:", e);
    showError("Не удалось сохранить прогресс");
  }
}

// Обновление списка изучаемых слов для тренажёров
function updateStudyWordsForTrainers() {
  const studyWords = allWords
    .filter(word => userProgress[word.id]?.study && userProgress[word.id]?.score < 10)
    .map(word => word.id);

  localStorage.setItem(SELECTED_WORDS_KEY, JSON.stringify(studyWords));
}

// Обновление статистики
function updateStatistics() {
  const words = getFilteredWords();
  const studyWords = words.filter(word => userProgress[word.id]?.study);
  const learnedWords = words.filter(word => userProgress[word.id]?.score >= 10);

  // Рассчитываем средний балл
  const totalScore = words.reduce((sum, word) => sum + (userProgress[word.id]?.score || 0), 0);
  const averageScore = words.length > 0 ? (totalScore / words.length).toFixed(1) : 0;

  // Обновляем элементы
  totalWordsEl.textContent = words.length;
  studyWordsEl.textContent = studyWords.length;
  averageScoreEl.textContent = averageScore;
  learnedWordsEl.textContent = learnedWords.length;
}

// Получение отфильтрованных слов
function getFilteredWords() {
  let words = allWords;

  // Применяем фильтр "только изучаемые"
  if (showStudyOnly) {
    words = words.filter(word => userProgress[word.id]?.study);
  }

  // Применяем поиск
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    words = words.filter(word =>
      word.english.toLowerCase().includes(term) ||
      word.russian.toLowerCase().includes(term)
    );
  }

  return words;
}

// Рендеринг таблицы слов
function renderWordsTable() {
  const words = getFilteredWords();
  filteredWords = words;

  wordsTableBody.innerHTML = '';

  words.forEach(word => {
    const progress = userProgress[word.id] || { score: 0, study: false };
    const isSelected = selectedWordIds.has(word.id);
    const isLearned = progress.score >= 10;

    const row = document.createElement('tr');
    row.className = progress.study ? 'study-row' : isLearned ? 'learned-row' : '';
    row.dataset.wordId = word.id;

    row.innerHTML = `
      <td class="col-check">
        <input
          type="checkbox"
          class="word-checkbox"
          data-word-id="${word.id}"
          ${isSelected ? 'checked' : ''}
        >
      </td>
      <td class="col-word">
        <strong>${word.english}</strong>
      </td>
      <td class="col-translation">
        ${word.russian}
      </td>
      <td class="col-status">
        <span class="word-status ${progress.study ? 'study' : isLearned ? 'learned' : 'none'}">
          ${progress.study ? 'Изучаю' : isLearned ? 'Выучено' : 'Не изучено'}
        </span>
      </td>
      <td class="col-score">
        <div class="score-controls">
          <button class="score-btn ${progress.score <= 0 ? 'disabled' : ''}"
                  data-action="decrease" data-word-id="${word.id}">−</button>
          <span class="score-display score-${progress.score || 0}">
            ${progress.score || 0}
          </span>
          <button class="score-btn ${progress.score >= 10 ? 'disabled' : ''}"
                  data-action="increase" data-word-id="${word.id}">+</button>
        </div>
      </td>
      <td class="col-progress">
        <div class="progress-bar">
          <div class="progress-fill ${getProgressClass(progress.score)}"
               style="width: ${(progress.score / 10) * 100}%"></div>
        </div>
        <small style="color: #94a3b8; font-size: 12px;">
          ${progress.score}/10
        </small>
      </td>
      <td class="col-actions">
        <div class="word-actions">
          <button class="word-action-btn"
                  data-action="toggle-study"
                  data-word-id="${word.id}">
            ${progress.study ? '✗' : '✓'}
          </button>
          <button class="word-action-btn"
                  data-action="reset-word"
                  data-word-id="${word.id}">
            ⟳
          </button>
        </div>
      </td>
    `;

    wordsTableBody.appendChild(row);
  });

  updateBulkActions();
}

// Получение класса для прогресс-бара
function getProgressClass(score) {
  if (score <= 3) return 'score-1-3';
  if (score <= 6) return 'score-4-6';
  return 'score-7-10';
}

// Обработчик событий для таблицы
function handleTableClick(event) {
  const target = event.target;
  const wordId = parseInt(target.dataset.wordId);

  if (!wordId) return;

  if (target.type === 'checkbox') {
    // Обработка чекбокса
    if (target.checked) {
      selectedWordIds.add(wordId);
    } else {
      selectedWordIds.delete(wordId);
      selectAllCheckbox.checked = false;
    }
    updateBulkActions();
    return;
  }

  if (target.classList.contains('score-btn')) {
    const action = target.dataset.action;
    const progress = userProgress[wordId];

    if (action === 'increase' && progress.score < 10) {
      progress.score++;
    } else if (action === 'decrease' && progress.score > 0) {
      progress.score--;
    }

    saveUserProgress();
    renderWordsTable();
  }

  if (target.classList.contains('word-action-btn')) {
    const action = target.dataset.action;
    const progress = userProgress[wordId];

    switch (action) {
      case 'toggle-study':
        progress.study = !progress.study;
        break;
      case 'reset-word':
        progress.score = 0;
        progress.study = false;
        break;
    }

    saveUserProgress();
    renderWordsTable();
  }
}

// Обновление групповых действий
function updateBulkActions() {
  const selectedCount = selectedWordIds.size;

  if (selectedCount > 0) {
    bulkActions.style.display = 'flex';
    selectedCountEl.textContent = `Выбрано: ${selectedCount} слов`;
  } else {
    bulkActions.style.display = 'none';
  }

  // Обновляем состояние чекбокса "Выбрать все"
  const allCheckboxes = document.querySelectorAll('.word-checkbox');
  const allChecked = allCheckboxes.length > 0 &&
                    Array.from(allCheckboxes).every(cb => cb.checked);
  selectAllCheckbox.checked = allChecked;
}

// Экспорт прогресса в файл
function exportProgress() {
  const exportData = {};

  // Собираем только слова с прогрессом
  allWords.forEach(word => {
    const progress = userProgress[word.id];
    if (progress && (progress.score > 0 || progress.study)) {
      exportData[word.id] = progress;
    }
  });

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `english_trainer_progress_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Импорт прогресса из файла
function importProgress(file) {
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // Валидация данных
      if (typeof importedData !== 'object') {
        throw new Error('Некорректный формат файла');
      }

      // Обновляем прогресс
      Object.keys(importedData).forEach(wordId => {
        const id = parseInt(wordId);
        if (!isNaN(id) && importedData[wordId]) {
          const data = importedData[wordId];
          if (!userProgress[id]) {
            userProgress[id] = { score: 0, study: false };
          }

          if (typeof data.score === 'number') {
            userProgress[id].score = Math.min(10, Math.max(0, data.score));
          }

          if (typeof data.study === 'boolean') {
            userProgress[id].study = data.study;
          }
        }
      });

      saveUserProgress();
      renderWordsTable();

      showSuccess('Прогресс успешно импортирован!');
    } catch (error) {
      console.error('Ошибка импорта:', error);
      showError('Ошибка при импорте файла. Проверьте формат.');
    }
  };

  reader.readAsText(file);
}

// Сброс всего прогресса
function resetProgress() {
  if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.')) {
    userProgress = {};
    allWords.forEach(word => {
      userProgress[word.id] = { score: 0, study: false };
    });
    saveUserProgress();
    renderWordsTable();
    showSuccess('Прогресс сброшен');
  }
}

// Показ сообщения об ошибке
function showError(message) {
  alert(`Ошибка: ${message}`);
}

// Показ сообщения об успехе
function showSuccess(message) {
  alert(message);
}

// Инициализация обработчиков событий
function initEventListeners() {
  // Клики по таблице
  wordsTableBody.addEventListener('click', handleTableClick);

  // Кнопка переключения режима "только изучаемые"
  toggleStudyBtn.addEventListener('click', () => {
    showStudyOnly = !showStudyOnly;
    toggleStudyBtn.textContent = showStudyOnly
      ? 'Показать все слова'
      : 'Показать изучаемые слова';
    renderWordsTable();
  });

  // Кнопка сброса прогресса
  resetProgressBtn.addEventListener('click', resetProgress);

  // Кнопка экспорта
  exportBtn.addEventListener('click', exportProgress);

  // Импорт файла
  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importProgress(file);
      e.target.value = ''; // Сбрасываем input
    }
  });

  // Поиск
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderWordsTable();
  });

  // Очистка поиска
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    renderWordsTable();
  });

  // Выбрать все
  selectAllCheckbox.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.word-checkbox');
    const isChecked = e.target.checked;

    checkboxes.forEach(cb => {
      cb.checked = isChecked;
      const wordId = parseInt(cb.dataset.wordId);
      if (isChecked) {
        selectedWordIds.add(wordId);
      } else {
        selectedWordIds.delete(wordId);
      }
    });

    updateBulkActions();
  });

  // Групповые действия
  bulkStudyBtn.addEventListener('click', () => {
    selectedWordIds.forEach(id => {
      if (userProgress[id]) {
        userProgress[id].study = true;
      }
    });
    saveUserProgress();
    renderWordsTable();
    selectedWordIds.clear();
    updateBulkActions();
  });

  bulkRemoveStudyBtn.addEventListener('click', () => {
    selectedWordIds.forEach(id => {
      if (userProgress[id]) {
        userProgress[id].study = false;
      }
    });
    saveUserProgress();
    renderWordsTable();
    selectedWordIds.clear();
    updateBulkActions();
  });

  bulkClearBtn.addEventListener('click', () => {
    selectedWordIds.clear();
    updateBulkActions();
  });
}

// Обновление index.html для добавления ссылки на словарь
// Добавьте в index.html:
/*
<li>
  <a href="dictionary.html" class="nav-tab" style="display: inline-block; width: 100%; text-align: center;">
    Словарь и прогресс
  </a>
</li>
*/

// Обновление для тренажёров (trainer.js и game.js) - добавьте в начало:
/*
function getStudyWords() {
  const studyWordsJson = localStorage.getItem('english_trainer_selected_words');
  if (studyWordsJson) {
    try {
      return JSON.parse(studyWordsJson);
    } catch (e) {
      return [];
    }
  }
  return [];
}

// Затем используйте studyWords для фильтрации слов в тренажёрах
*/

// Запуск при загрузке
window.addEventListener('load', () => {
  initEventListeners();
  loadWords();
});