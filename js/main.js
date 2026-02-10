new Vue({
    el: '#app',
    data: {
        columns: [
            { cards: [] },
            { cards: [] },
            { cards: [] }
        ]
    },
    created() {
        this.loadData();
    },
    methods: {
        addCard(columnIndex) {
            const title = prompt("Введите заголовок для карточки:");
            if (title) {
                const items = [];
                for (let i = 0; i < 3; i++) {
                    const itemText = prompt(`Введите текст пункта ${i + 1}:`);
                    if (itemText) {
                        items.push({ text: itemText, completed: false });
                    }
                }
                this.columns[columnIndex].cards.push({ title, items });

                this.saveData();
            }
        },
        removeCard(columnIndex, cardIndex) {
            this.columns[columnIndex].cards.splice(cardIndex, 1);
            this.saveData();
        },
        updateCard(card) {
            const totalItems = card.items.length;
            const completedItems = card.items.filter(item => item.completed).length;

            if (completedItems > 0.5 * totalItems) {

                if (this.columns[0].cards.includes(card)) {
                    this.moveCardToColumn(card, 1);

                } else if (completedItems === totalItems) {
                    this.moveCardToColumn(card, 2);
                    card.completedAt = new Date().toLocaleString();
                }
            }
            this.saveData();
        },

        moveCardToColumn(card, targetColumnIndex) {
            const sourceColumnIndex = this.columns.findIndex(column => column.cards.includes(card));
            this.columns[sourceColumnIndex].cards.splice(this.columns[sourceColumnIndex].cards.indexOf(card), 1);
            this.columns[targetColumnIndex].cards.push(card);
        },

        isColumnLocked(index) {
            if (index === 0) {
                return this.columns[1].cards.length >= 5 && this.columns[0].cards.some(card => {
                    const totalItems = card.items.length;
                    const completedItems = card.items.filter(item => item.completed).length;
                    return completedItems > 0.5 * totalItems;
                });
            }
            return false;
        },

        saveData() {
            localStorage.setItem('noteAppData', JSON.stringify(this.columns));
        },

        loadData() {
            const data = localStorage.getItem('noteAppData');

            if (data) {
                this.columns = JSON.parse(data);
            }
        }
    }
});