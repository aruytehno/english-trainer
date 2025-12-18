// Константа для ключа хранилища прогресса
const STORAGE_KEY = 'english_trainer_progress';

// Элементы прогресса
const level100Stats = document.getElementById('level-100-stats');
const level500Stats = document.getElementById('level-500-stats');
const level1000Stats = document.getElementById('level-1000-stats');
const level2000Stats = document.getElementById('level-2000-stats');
const level5000Stats = document.getElementById('level-5000-stats');

const level100Progress = document.getElementById('level-100-progress');
const level500Progress = document.getElementById('level-500-progress');
const level1000Progress = document.getElementById('level-1000-progress');
const level2000Progress = document.getElementById('level-2000-progress');
const level5000Progress = document.getElementById('level-5000-progress');

// Элементы общей статистики
const totalLearnedEl = document.getElementById('total-learned');
const totalWordsEl = document.getElementById('total-words');
const progressPercentageEl = document.getElementById('progress-percentage');
const currentLevelEl = document.getElementById('current-level');

// Уровни Oxford 5000 (здесь будут реальные данные из words.json)
// Для демо будем использовать проценты от общего числа слов
const OXFORD_LEVELS = {
  100: 0.20,  // Первые 20% слов - топ 100 (примерно)
  500: 0.40,  // Следующие 20% - до 500 слов
  1000: 0.60, // До 1000 слов (Oxford 3000)
  2000: 0.80, // До 2000 слов (Oxford 5000 B2)
  5000: 1.00  // Полные 5000 слов
};

let allWords = [];
let userProgress = {};

// Загрузка слов
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

    // Обновляем прогресс
    updateProgressDisplay();
  } catch (err) {
    console.error(err);
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
}

// Рассчет прогресса по уровням
function calculateLevelProgress() {
  const totalWordsCount = allWords.length;

  // Если нет слов, возвращаем нули
  if (totalWordsCount === 0) {
    return {
      level100: { learned: 0, total: 0, percentage: 0 },
      level500: { learned: 0, total: 0, percentage: 0 },
      level1000: { learned: 0, total: 0, percentage: 0 },
      level2000: { learned: 0, total: 0, percentage: 0 },
      level5000: { learned: 0, total: 0, percentage: 0 }
    };
  }

  // Рассчитываем пороги для каждого уровня
  const levelThresholds = {
    level100: Math.floor(totalWordsCount * OXFORD_LEVELS[100]),
    level500: Math.floor(totalWordsCount * OXFORD_LEVELS[500]),
    level1000: Math.floor(totalWordsCount * OXFORD_LEVELS[1000]),
    level2000: Math.floor(totalWordsCount * OXFORD_LEVELS[2000]),
    level5000: Math.floor(totalWordsCount * OXFORD_LEVELS[5000])
  };

  // Подсчитываем выученные слова для каждого уровня
  let level100Learned = 0;
  let level500Learned = 0;
  let level1000Learned = 0;
  let level2000Learned = 0;
  let level5000Learned = 0;

  // Проходим по всем словам
  allWords.forEach((word, index) => {
    const progress = userProgress[word.id];
    const isLearned = progress && progress.score >= 10;

    if (isLearned) {
      // Проверяем к какому уровню относится слово
      if (index < levelThresholds.level100) level100Learned++;
      if (index < levelThresholds.level500) level500Learned++;
      if (index < levelThresholds.level1000) level1000Learned++;
      if (index < levelThresholds.level2000) level2000Learned++;
      if (index < levelThresholds.level5000) level5000Learned++;
    }
  });

  // Рассчитываем проценты
  const level100Percentage = levelThresholds.level100 > 0 ?
    Math.round((level100Learned / levelThresholds.level100) * 100) : 0;
  const level500Percentage = levelThresholds.level500 > 0 ?
    Math.round((level500Learned / levelThresholds.level500) * 100) : 0;
  const level1000Percentage = levelThresholds.level1000 > 0 ?
    Math.round((level1000Learned / levelThresholds.level1000) * 100) : 0;
  const level2000Percentage = levelThresholds.level2000 > 0 ?
    Math.round((level2000Learned / levelThresholds.level2000) * 100) : 0;
  const level5000Percentage = levelThresholds.level5000 > 0 ?
    Math.round((level5000Learned / levelThresholds.level5000) * 100) : 0;

  return {
    level100: {
      learned: level100Learned,
      total: levelThresholds.level100,
      percentage: level100Percentage
    },
    level500: {
      learned: level500Learned,
      total: levelThresholds.level500,
      percentage: level500Percentage
    },
    level1000: {
      learned: level1000Learned,
      total: levelThresholds.level1000,
      percentage: level1000Percentage
    },
    level2000: {
      learned: level2000Learned,
      total: levelThresholds.level2000,
      percentage: level2000Percentage
    },
    level5000: {
      learned: level5000Learned,
      total: levelThresholds.level5000,
      percentage: level5000Percentage
    }
  };
}

// Рассчет общей статистики
function calculateOverallStats(levelProgress) {
  const totalWordsCount = allWords.length;
  const totalLearned = Object.values(userProgress).filter(p => p.score >= 10).length;
  const overallPercentage = totalWordsCount > 0 ?
    Math.round((totalLearned / totalWordsCount) * 100) : 0;

  // Определяем текущий уровень CEFR
  let currentLevel = "A1";
  if (levelProgress.level100.percentage >= 80) currentLevel = "A2";
  if (levelProgress.level500.percentage >= 80) currentLevel = "B1";
  if (levelProgress.level1000.percentage >= 80) currentLevel = "B2";
  if (levelProgress.level2000.percentage >= 80) currentLevel = "C1";

  return {
    totalLearned,
    totalWords: totalWordsCount,
    overallPercentage,
    currentLevel
  };
}

// Обновление отображения прогресса
function updateProgressDisplay() {
  const levelProgress = calculateLevelProgress();
  const overallStats = calculateOverallStats(levelProgress);

  // Обновляем прогресс по уровням
  level100Stats.textContent = `${levelProgress.level100.learned}/${levelProgress.level100.total} (${levelProgress.level100.percentage}%)`;
  level500Stats.textContent = `${levelProgress.level500.learned}/${levelProgress.level500.total} (${levelProgress.level500.percentage}%)`;
  level1000Stats.textContent = `${levelProgress.level1000.learned}/${levelProgress.level1000.total} (${levelProgress.level1000.percentage}%)`;
  level2000Stats.textContent = `${levelProgress.level2000.learned}/${levelProgress.level2000.total} (${levelProgress.level2000.percentage}%)`;
  level5000Stats.textContent = `${levelProgress.level5000.learned}/${levelProgress.level5000.total} (${levelProgress.level5000.percentage}%)`;

  // Обновляем прогресс-бары
  level100Progress.style.width = `${levelProgress.level100.percentage}%`;
  level500Progress.style.width = `${levelProgress.level500.percentage}%`;
  level1000Progress.style.width = `${levelProgress.level1000.percentage}%`;
  level2000Progress.style.width = `${levelProgress.level2000.percentage}%`;
  level5000Progress.style.width = `${levelProgress.level5000.percentage}%`;

  // Обновляем общую статистику
  totalLearnedEl.textContent = overallStats.totalLearned;
  totalWordsEl.textContent = overallStats.totalWords;
  progressPercentageEl.textContent = `${overallStats.overallPercentage}%`;
  currentLevelEl.textContent = overallStats.currentLevel;
}

// Обновляем прогресс каждые 2 секунды (на случай изменений в других вкладках)
function startProgressMonitoring() {
  updateProgressDisplay();
  setInterval(() => {
    loadUserProgress();
    updateProgressDisplay();
  }, 2000);
}

// Инициализация
window.addEventListener('load', () => {
  loadWords().then(() => {
    startProgressMonitoring();
  });
});