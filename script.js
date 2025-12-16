class EnglishTrainer {
    constructor() {
        this.pairs = [];
        this.selected = null;
        this.checking = false;
        this.matched = new Set();
        this.init();
    }

    async init() {
        try {
            const res = await fetch('words.json');
            let words = await res.json();
            this.pairs = words.sort(() => Math.random() - 0.5).slice(0, 5);
        } catch {
            this.pairs = [['apple','яблоко'],['house','дом'],
                          ['book','книга'],['water','вода'],['friend','друг']];
        }
        this.createCards();
        this.shuffleColumns();
    }

    createCards() {
        const cols = ['english-column', 'russian-column'];
        cols.forEach(id => document.getElementById(id).innerHTML = '');

        this.pairs.forEach(([en, ru], i) => {
            this.createCard(en, 'english', i, 'english-column');
            this.createCard(ru, 'russian', i, 'russian-column');
        });
    }

    createCard(text, type, idx, colId) {
        const card = document.createElement('div');
        card.className = 'card';
        card.textContent = text;
        card.dataset.type = type;
        card.dataset.idx = idx;
        card.onclick = () => this.handleClick(card);
        document.getElementById(colId).appendChild(card);
    }

    handleClick(card) {
        if (this.checking || card.classList.contains('matched')) return;

        if (!this.selected || card.dataset.type === this.selected.dataset.type) {
            this.selected?.classList.remove('selected');
            this.selected = card;
            card.classList.add('selected');
        } else {
            this.checkPair(this.selected, card);
        }
    }

    checkPair(a, b) {
        if (a.dataset.idx === b.dataset.idx) {
            [a, b].forEach(c => {
                c.classList.remove('selected');
                c.classList.add('matched');
            });
            this.matched.add(a.dataset.idx);
            this.selected = null;
            if (this.matched.size === this.pairs.length) {
                setTimeout(() => confirm('Поздравляем! Все пары собраны!\n\nСыграть еще?') && this.restart(), 300);
            }
        } else {
            this.checking = true;
            [a, b].forEach(c => c.classList.add('error'));
            setTimeout(() => {
                [a, b].forEach(c => c.classList.remove('error', 'selected'));
                this.selected = null;
                this.checking = false;
            }, 1000);
        }
    }

    shuffleColumns() {
        ['english-column', 'russian-column'].forEach(id => {
            const col = document.getElementById(id);
            [...col.children].sort(() => Math.random() - 0.5).forEach(c => col.appendChild(c));
        });
    }

    restart() {
        this.selected = null;
        this.checking = false;
        this.matched.clear();
        this.init();
    }
}

document.addEventListener('DOMContentLoaded', () => new EnglishTrainer());