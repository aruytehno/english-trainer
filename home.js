// Константа для ключа хранилища прогресса
const STORAGE_KEY = 'english_trainer_progress';

// Элементы прогресса для CEFR уровней
const levelA1Stats = document.getElementById('level-a1-stats');
const levelA2Stats = document.getElementById('level-a2-stats');
const levelB1Stats = document.getElementById('level-b1-stats');
const levelB2Stats = document.getElementById('level-b2-stats');
const levelC1Stats = document.getElementById('level-c1-stats');

const levelA1Progress = document.getElementById('level-a1-progress');
const levelA2Progress = document.getElementById('level-a2-progress');
const levelB1Progress = document.getElementById('level-b1-progress');
const levelB2Progress = document.getElementById('level-b2-progress');
const levelC1Progress = document.getElementById('level-c1-progress');

// Элементы общей статистики
const totalLearnedEl = document.getElementById('total-learned');
const totalWordsEl = document.getElementById('total-words');
const progressPercentageEl = document.getElementById('progress-percentage');
const currentCefrLevelEl = document.getElementById('current-cefr-level');

// Количества слов для каждого уровня CEFR
const CEFR_LEVELS = {
  A1: 500,     // Beginner
  A2: 1000,    // Elementary (A1 + дополнительные 500 слов)
  B1: 1500,    // Intermediate (A2 + дополнительные 500 слов)
  B2: 2000,    // Upper Intermediate (B1 + дополнительные 500 слов)
  C1: 5000     // Advanced (B2 + дополнительные 3000 слов)
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

// Рассчет прогресса по CEFR уровням
function calculateCefrLevelProgress() {
  const totalWordsCount = allWords.length;

  // Если нет слов, возвращаем нули
  if (totalWordsCount === 0) {
    return {
      A1: { learned: 0, total: CEFR_LEVELS.A1, percentage: 0 },
      A2: { learned: 0, total: CEFR_LEVELS.A2, percentage: 0 },
      B1: { learned: 0, total: CEFR_LEVELS.B1, percentage: 0 },
      B2: { learned: 0, total: CEFR_LEVELS.B2, percentage: 0 },
      C1: { learned: 0, total: CEFR_LEVELS.C1, percentage: 0 }
    };
  }

  // Подсчитываем выученные слова для каждого уровня
  let A1Learned = 0;
  let A2Learned = 0;
  let B1Learned = 0;
  let B2Learned = 0;
  let C1Learned = 0;

  // Проходим по всем словам и считаем выученные
  allWords.forEach((word, index) => {
    const progress = userProgress[word.id];
    const isLearned = progress && progress.score >= 10;

    if (isLearned) {
      // Уровень определяется по индексу слова в общем списке
      // (предполагаем, что слова отсортированы от самых частых к менее частым)

      // A1: первые 500 слов
      if (index < 500) A1Learned++;

      // A2: первые 1000 слов
      if (index < 1000) A2Learned++;

      // B1: первые 1500 слов
      if (index < 1500) B1Learned++;

      // B2: первые 2000 слов
      if (index < 2000) B2Learned++;

      // C1: все 5000 слов
      if (index < 5000) C1Learned++;
    }
  });

  // Рассчитываем проценты для каждого уровня
  const A1Percentage = Math.round((A1Learned / Math.min(totalWordsCount, CEFR_LEVELS.A1)) * 100);
  const A2Percentage = Math.round((A2Learned / Math.min(totalWordsCount, CEFR_LEVELS.A2)) * 100);
  const B1Percentage = Math.round((B1Learned / Math.min(totalWordsCount, CEFR_LEVELS.B1)) * 100);
  const B2Percentage = Math.round((B2Learned / Math.min(totalWordsCount, CEFR_LEVELS.B2)) * 100);
  const C1Percentage = Math.round((C1Learned / Math.min(totalWordsCount, CEFR_LEVELS.C1)) * 100);

  return {
    A1: {
      learned: A1Learned,
      total: Math.min(totalWordsCount, CEFR_LEVELS.A1),
      percentage: A1Percentage
    },
    A2: {
      learned: A2Learned,
      total: Math.min(totalWordsCount, CEFR_LEVELS.A2),
      percentage: A2Percentage
    },
    B1: {
      learned: B1Learned,
      total: Math.min(totalWordsCount, CEFR_LEVELS.B1),
      percentage: B1Percentage
    },
    B2: {
      learned: B2Learned,
      total: Math.min(totalWordsCount, CEFR_LEVELS.B2),
      percentage: B2Percentage
    },
    C1: {
      learned: C1Learned,
      total: Math.min(totalWordsCount, CEFR_LEVELS.C1),
      percentage: C1Percentage
    }
  };
}

// Рассчет общей статистики
function calculateOverallStats(cefrProgress) {
  const totalWordsCount = allWords.length;
  const totalLearned = Object.values(userProgress).filter(p => p.score >= 10).length;
  const overallPercentage = totalWordsCount > 0 ?
    Math.round((totalLearned / totalWordsCount) * 100) : 0;

  // Определяем текущий уровень CEFR на основе прогресса
  let currentCefrLevel = "A1";

  if (cefrProgress.A1.percentage >= 80) currentCefrLevel = "A1";
  if (cefrProgress.A2.percentage >= 80) currentCefrLevel = "A2";
  if (cefrProgress.B1.percentage >= 80) currentCefrLevel = "B1";
  if (cefrProgress.B2.percentage >= 80) currentCefrLevel = "B2";
  if (cefrProgress.C1.percentage >= 80) currentCefrLevel = "C1";

  return {
    totalLearned,
    totalWords: totalWordsCount,
    overallPercentage,
    currentCefrLevel
  };
}

// Обновление отображения прогресса
function updateProgressDisplay() {
  const cefrProgress = calculateCefrLevelProgress();
  const overallStats = calculateOverallStats(cefrProgress);

  // Обновляем прогресс по CEFR уровням
  levelA1Stats.textContent = `${cefrProgress.A1.learned}/${cefrProgress.A1.total} (${cefrProgress.A1.percentage}%)`;
  levelA2Stats.textContent = `${cefrProgress.A2.learned}/${cefrProgress.A2.total} (${cefrProgress.A2.percentage}%)`;
  levelB1Stats.textContent = `${cefrProgress.B1.learned}/${cefrProgress.B1.total} (${cefrProgress.B1.percentage}%)`;
  levelB2Stats.textContent = `${cefrProgress.B2.learned}/${cefrProgress.B2.total} (${cefrProgress.B2.percentage}%)`;
  levelC1Stats.textContent = `${cefrProgress.C1.learned}/${cefrProgress.C1.total} (${cefrProgress.C1.percentage}%)`;

  // Обновляем прогресс-бары
  levelA1Progress.style.width = `${cefrProgress.A1.percentage}%`;
  levelA2Progress.style.width = `${cefrProgress.A2.percentage}%`;
  levelB1Progress.style.width = `${cefrProgress.B1.percentage}%`;
  levelB2Progress.style.width = `${cefrProgress.B2.percentage}%`;
  levelC1Progress.style.width = `${cefrProgress.C1.percentage}%`;

  // Обновляем общую статистику
  totalLearnedEl.textContent = overallStats.totalLearned;
  totalWordsEl.textContent = overallStats.totalWords;
  progressPercentageEl.textContent = `${overallStats.overallPercentage}%`;
  currentCefrLevelEl.textContent = overallStats.currentCefrLevel;
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