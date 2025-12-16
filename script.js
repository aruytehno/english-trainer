class EnglishTrainer {
    constructor() {
        this.pairs = [
            ['apple', 'яблоко'],
            ['house', 'дом'],
            ['book', 'книга'],
            ['water', 'вода'],
            ['friend', 'друг']
        ];

        this.selectedCard = null;
        this.isChecking = false;
        this.matchedPairs = new Set();

        this.init();
    }

    init() {
        this.createCards();
        this.shuffleColumns();
    }

    createCards() {
        const englishColumn = document.getElementById('english-column');
        const russianColumn = document.getElementById('russian-column');

        this.pairs.forEach((pair, index) => {
            const [english, russian] = pair;

            const engCard = this.createCard(english, 'english', index);
            const rusCard = this.createCard(russian, 'russian', index);

            englishColumn.appendChild(engCard);
            russianColumn.appendChild(rusCard);
        });
    }

    createCard(text, type, pairIndex) {
        const card = document.createElement('div');
        card.className = 'card';
        card.textContent = text;
        card.dataset.type = type;
        card.dataset.pairIndex = pairIndex;

        card.addEventListener('click', () => this.handleCardClick(card));

        return card;
    }

    handleCardClick(card) {
        if (this.isChecking || card.classList.contains('matched')) return;

        if (!this.selectedCard) {
            this.selectCard(card);
        } else if (card.dataset.type === this.selectedCard.dataset.type) {
            this.selectCard(card);
        } else {
            this.checkPair(this.selectedCard, card);
        }
    }

    selectCard(card) {
        if (this.selectedCard) {
            this.selectedCard.classList.remove('selected');
        }
        this.selectedCard = card;
        card.classList.add('selected');
    }

    checkPair(card1, card2) {
        if (card1.dataset.pairIndex === card2.dataset.pairIndex) {
            this.markAsMatched(card1, card2);
        } else {
            this.showError(card1, card2);
        }
    }

    markAsMatched(card1, card2) {
        card1.classList.remove('selected');
        card2.classList.remove('selected');

        card1.classList.add('matched');
        card2.classList.add('matched');

        this.matchedPairs.add(card1.dataset.pairIndex);
        this.selectedCard = null;

        this.checkCompletion();
    }

    showError(card1, card2) {
        this.isChecking = true;

        card1.classList.add('error');
        card2.classList.add('error');

        setTimeout(() => {
            card1.classList.remove('error', 'selected');
            card2.classList.remove('error', 'selected');
            this.selectedCard = null;
            this.isChecking = false;
        }, 1000);
    }

    shuffleColumns() {
        this.shuffleColumn('english-column');
        this.shuffleColumn('russian-column');
    }

    shuffleColumn(columnId) {
        const column = document.getElementById(columnId);
        const cards = Array.from(column.children);

        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            column.appendChild(cards[j]);
        }
    }

    checkCompletion() {
        if (this.matchedPairs.size === this.pairs.length) {
            setTimeout(() => {
                alert('Поздравляем! Все пары собраны правильно!');
            }, 300);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new EnglishTrainer();
});