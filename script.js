document.addEventListener('DOMContentLoaded', function() {
    // Исходные пары слов
    const wordPairs = [
        { english: "apple", russian: "яблоко" },
        { english: "house", russian: "дом" },
        { english: "book", russian: "книга" },
        { english: "water", russian: "вода" },
        { english: "friend", russian: "друг" }
    ];

    // Элементы DOM
    const englishColumn = document.getElementById('english-column');
    const russianColumn = document.getElementById('russian-column');
    const restartBtn = document.getElementById('restart-btn');
    const matchedCountElement = document.getElementById('matched-count');
    const notification = document.getElementById('notification');
    const closeNotificationBtn = document.getElementById('close-notification');

    // Состояние игры
    let gameState = {
        selectedElement: null,
        matchedPairs: 0,
        isChecking: false,
        englishWords: [],
        russianWords: []
    };

    // Инициализация игры
    function initGame() {
        gameState.selectedElement = null;
        gameState.matchedPairs = 0;
        gameState.isChecking = false;
        
        // Очищаем колонки
        englishColumn.innerHTML = '';
        russianColumn.innerHTML = '';
        
        // Создаем массивы слов
        gameState.englishWords = [...wordPairs.map(pair => pair.english)];
        gameState.russianWords = [...wordPairs.map(pair => pair.russian)];
        
        // Перемешиваем массивы
        shuffleArray(gameState.englishWords);
        shuffleArray(gameState.russianWords);
        
        // Создаем элементы в колонках
        gameState.englishWords.forEach(word => {
            createWordElement(word, englishColumn, 'english');
        });
        
        gameState.russianWords.forEach(word => {
            createWordElement(word, russianColumn, 'russian');
        });
        
        updateMatchedCount();
    }

    // Создание элемента слова
    function createWordElement(word, container, language) {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.textContent = word;
        wordElement.dataset.word = word;
        wordElement.dataset.language = language;
        
        wordElement.addEventListener('click', function() {
            handleWordClick(this);
        });
        
        container.appendChild(wordElement);
    }

    // Обработка клика по слову
    function handleWordClick(clickedElement) {
        // Если идет проверка или элемент уже сопоставлен - игнорируем клик
        if (gameState.isChecking || clickedElement.classList.contains('correct')) {
            return;
        }
        
        // Если кликнули на уже выбранный элемент - снимаем выделение
        if (clickedElement === gameState.selectedElement) {
            clickedElement.classList.remove('selected');
            gameState.selectedElement = null;
            return;
        }
        
        const clickedLanguage = clickedElement.dataset.language;
        
        // Если кликнули в том же столбце, что и ранее выбранный элемент
        if (gameState.selectedElement && 
            gameState.selectedElement.dataset.language === clickedLanguage) {
            gameState.selectedElement.classList.remove('selected');
            clickedElement.classList.add('selected');
            gameState.selectedElement = clickedElement;
            return;
        }
        
        // Если кликнули в другом столбце
        if (gameState.selectedElement && 
            gameState.selectedElement.dataset.language !== clickedLanguage) {
            checkPair(gameState.selectedElement, clickedElement);
            return;
        }
        
        // Если это первый клик
        clickedElement.classList.add('selected');
        gameState.selectedElement = clickedElement;
    }

    // Проверка пары
    function checkPair(firstElement, secondElement) {
        gameState.isChecking = true;
        
        const firstWord = firstElement.dataset.word;
        const secondWord = secondElement.dataset.word;
        
        // Проверяем, является ли пара правильной
        const isCorrect = wordPairs.some(pair => 
            (pair.english === firstWord && pair.russian === secondWord) ||
            (pair.english === secondWord && pair.russian === firstWord)
        );
        
        if (isCorrect) {
            // Правильная пара
            firstElement.classList.remove('selected');
            secondElement.classList.remove('selected');
            
            setTimeout(() => {
                firstElement.classList.add('correct');
                secondElement.classList.add('correct');
                
                gameState.selectedElement = null;
                gameState.matchedPairs++;
                updateMatchedCount();
                gameState.isChecking = false;
                
                // Проверяем, завершена ли игра
                if (gameState.matchedPairs === wordPairs.length) {
                    setTimeout(() => {
                        notification.classList.add('active');
                    }, 500);
                }
            }, 300);
        } else {
            // Неправильная пара
            firstElement.classList.add('wrong');
            secondElement.classList.add('wrong');
            
            setTimeout(() => {
                firstElement.classList.remove('selected', 'wrong');
                secondElement.classList.remove('selected', 'wrong');
                
                gameState.selectedElement = null;
                gameState.isChecking = false;
            }, 1000);
        }
    }

    // Обновление счетчика сопоставленных пар
    function updateMatchedCount() {
        matchedCountElement.textContent = gameState.matchedPairs;
    }

    // Перемешивание массива (алгоритм Фишера-Йетса)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Обработчики событий
    restartBtn.addEventListener('click', initGame);
    
    closeNotificationBtn.addEventListener('click', function() {
        notification.classList.remove('active');
    });

    // Запускаем игру при загрузке страницы
    initGame();
});