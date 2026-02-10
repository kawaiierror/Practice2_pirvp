Vue.component('note-card', {
    props: ['card', 'isBlocked'],
    template: `
        <div class="card">
            <input type="text" v-model="card.title" :disabled="isBlocked" placeholder="Заголовок карточки" />
            <ul>
                <li v-for="(item, itemIndex) in card.items" :key="itemIndex">
                    <input type="checkbox" v-model="item.completed" @change="updateCard" :disabled="isBlocked">
                    <input type="text" v-model="item.text" :disabled="isBlocked" placeholder="Пункт списка" />
                </li>
            </ul>
            <input type="text" v-model="newItemText" :disabled="isBlocked || itemCount >= 5" placeholder="Новый пункт списка" />
            <button @click="addItem" :disabled="isBlocked || itemCount >= 5">Добавить пункт</button>
            <p v-if="card.completedDate">Завершено: <br> {{ card.completedDate }}</p>
            <button @click="removeCard(card.id)" :disabled="isBlocked">Удалить</button>
        </div>
    `,
    data() {
        return {
            newItemText: '',
        };
    },
    computed: {
        itemCount() {
            return this.card.items.length;
        }
    },
    methods: {
        removeCard(cardId) {
            this.$emit('remove-card', cardId);
        },
        updateCard() {
            this.$emit('update-card', this.card);
        },
        addItem() {
            if (this.newItemText.trim() !== '' && this.itemCount < 5) {
                this.card.items.push({text: this.newItemText, completed: false});
                this.newItemText = '';
                this.updateCard();
            }
        }
    }
});

Vue.component('note-column', {
    props: ['column', 'isBlocked'],
    template: `
        <div class="column" :class="{ disabled: isBlocked }">
            <h2>{{ column.title }}</h2>
            <note-card
                v-for="(card, cardIndex) in column.cards"
                :is-blocked="isBlocked" 
                :key="card.id"
                :card="card"
                @remove-card="$emit('remove-card', $event)"
                @update-card="$emit('update-card', $event)"
            ></note-card>
            <button v-if="column.title === 'Столбец 1' && !isBlocked && checkForAddCard(column)" 
                    @click="$emit('add-card', column)">
                Добавить карточку
            </button>
        </div>
    `,
    methods: {
        checkForAddCard(column) {
            if (column.title === 'Столбец 1' && column.cards.length >= 3) return false;
            if (column.title === 'Столбец 2' && column.cards.length >= 5) return false;
            return true;
        }
    }
});

Vue.component('note-app', {
    data() {
        return {
            columns: [
                { title: 'Столбец 1', cards: [] },
                { title: 'Столбец 2', cards: [] },
                { title: 'Столбец 3', cards: [] }
            ],
            nextCardId: 1
        };
    },
    created() {
        this.loadCards();
    },
    computed: {
        isFirstColumnBlocked() {
            const col1 = this.columns[0];
            const col2 = this.columns[1];

            const col2Full = col2.cards.length >= 5;

            const hasHighProgressCard = col1.cards.some(card => {
                const completed = card.items.filter(i => i.completed).length;
                return (completed / card.items.length) > 0.5;
            });

            return col2Full && hasHighProgressCard;
        }
    },
    methods: {
        loadCards() {
            const savedData = JSON.parse(localStorage.getItem('cards'));
            if (savedData) {
                this.columns = savedData.columns;
                this.nextCardId = savedData.nextCardId;
            }
        },
        saveCards() {
            localStorage.setItem('cards', JSON.stringify({ columns: this.columns, nextCardId: this.nextCardId }));
        },
        addCard(column) {
            const newCard = {
                id: this.nextCardId++,
                title: `Карточка ${this.nextCardId}`,
                items: [
                    { text: 'Пункт 1', completed: false },
                    { text: 'Пункт 2', completed: false },
                    { text: 'Пункт 3', completed: false }
                ],
                completedDate: null
            };
            column.cards.push(newCard);
            this.saveCards();
        },
        removeCard(cardId) {
            for (let column of this.columns) {
                const index = column.cards.findIndex(card => card.id === cardId);
                if (index !== -1) {
                    column.cards.splice(index, 1);
                    this.saveCards();
                    break;
                }
            }
        },
        updateCard(card) {
            const completedItems = card.items.filter(item => item.completed).length;
            const totalItems = card.items.length;
            if (totalItems === 0) return;

            const completionRate = completedItems / totalItems;

            if (completionRate > 0.5 && this.columns[0].cards.includes(card)) {
                if (this.columns[1].cards.length < 5) {
                    this.moveCard(card, 1);
                }

            }
            else if (completionRate === 1 && this.columns[1].cards.includes(card)) {
                card.completedDate = new Date().toLocaleString();
                this.moveCard(card, 2);
            }

            this.saveCards();
        },
        moveCard(card, targetColumnIndex) {
            for (let column of this.columns) {
                const index = column.cards.findIndex(c => c.id === card.id);
                if (index !== -1) {
                    column.cards.splice(index, 1);
                    this.columns[targetColumnIndex].cards.push(card);
                    break;
                }
            }
        }
    },
    template: `
        <div>
            <div class="columns">
                <note-column
                    v-for="(column, index) in columns"
                    :is-blocked="index === 0 && isFirstColumnBlocked" 
                    :key="index"
                    :column="column"
                    @remove-card="removeCard"
                    @update-card="updateCard"
                    @add-card="addCard"
                ></note-column>
            </div>
        </div>
    `
});

new Vue({
    el: '#app'
});