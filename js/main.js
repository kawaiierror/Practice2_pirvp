ue.component('note-card', {
    props: ['card'],
    template: `
        <div class="card" :style="{ backgroundColor: card.color }">
            <input type="text" v-model="card.title" placeholder="Заголовок карточки" />
            <label for="colorInput">Цвет:</label>
            <input type="color" v-model="card.color" />
            <ul>
                <li v-for="(item, itemIndex) in card.items" :key="itemIndex">
                    <input type="checkbox" v-model="item.completed" @change="updateCard">
                    <input type="text" v-model="item.text" placeholder="Пункт списка" />
                </li>
            </ul>
            <button @click="removeCard(card.id)">Удалить</button>
            <p v-if="card.completedDate">Завершено: {{ card.completedDate }}</p>
        </div>
    `,
    methods: {
        // Метод для удаления карточки
        removeCard(cardId) {
            this.$emit('remove-card', cardId); // Генерируем событие для удаления карточки
        },
        // Метод для обновления карточки
        updateCard() {
            this.$emit('update-card', this.card); // Генерируем событие для обновления карточки
        }
    }
});

// Компонент колонки заметок
Vue.component('note-column', {
    props: ['column'], // Принимаем объект колонки как пропс
    template: `
        <div class="column">
            <h2>{{ column.title }}</h2>
            <note-card
                v-for="(card, cardIndex) in column.cards"
                :key="card.id"
                :card="card"
                @remove-card="$emit('remove-card', $event)"
                @update-card="$emit('update-card', $event)"
            ></note-card>
            <button v-if="checkForAddCard(column)" @click="$emit('add-card', column)">Добавить карточку</button>
        </div>
    `,
    methods: {
        // Метод для проверки, можно ли добавить карточку в колонку
        checkForAddCard(column) {
            if (column.title === 'Столбец 1' && column.cards.length >= 3) return false; // Ограничение на 3 карточки
            if (column.title === 'Столбец 2' && column.cards.length >= 5) return false; // Ограничение на 5 карточек
            return true; // Если нет ограничений, возвращаем true
        }
    }
});

// Главный компонент приложения заметок
Vue.component('note-app', {
    data() {
        return {
            columns: [
                { title: 'Столбец 1', cards: [] }, // Первая колонка
                { title: 'Столбец 2', cards: [] }, // Вторая колонка
                { title: 'Столбец 3', cards: [] }  // Третья колонка
            ],
            nextCardId: 1 // Идентификатор для следующей карточки
        };
    },
    created() {
        this.loadCards(); // Загружаем карточки из localStorage при создании компонента
    },
    methods: {
        // Метод для загрузки карточек из localStorage
        loadCards() {
            const savedData = JSON.parse(localStorage.getItem('cards'));
            if (savedData) {
                this.columns = savedData.columns; // Загружаем колонки
                this.nextCardId = savedData.nextCardId; // Загружаем следующий ID карточки
            }
        },
        // Метод для сохранения карточек в localStorage
        saveCards() {
            localStorage.setItem('cards', JSON.stringify({ columns: this.columns, nextCardId: this.nextCardId }));
        },
        // Метод для добавления новой карточки в колонку
        addCard(column) {
            const newCard = {
                id: this.nextCardId++, // Увеличиваем ID для новой карточки
                title: `Карточка ${this.nextCardId}`, // Заголовок карточки
                color: '#f9f9f9', // Цвет по умолчанию
                items: [
                    { text: 'Пункт 1', completed: false },
                    { text: 'Пункт 2', completed: false },
                    { text: 'Пункт 3', completed: false }
                ],
                completedDate: null // Дата завершения по умолчанию
            };
            column.cards.push(newCard); // Добавляем новую карточку в колонку
            this.saveCards(); // Сохраняем изменения в localStorage
        },
        // Метод для удаления карточки по ID
        removeCard(cardId) {
            for (let column of this.columns) {
                const index = column.cards.findIndex(card => card.id === cardId); // Находим индекс карточки
                if (index !== -1) {
                    column.cards.splice(index, 1); // Удаляем карточку из колонки
                    this.saveCards(); // Сохраняем изменения в localStorage
                    break; // Выходим из цикла после удаления
                }
            }
        },
        // Метод для обновления состояния карточки
        updateCard(card) {
            const completedItems = card.items.filter(item => item.completed).length; // Считаем завершенные пункты
            const totalItems = card.items.length; // Общее количество пунктов

            if (totalItems > 0) {
                const completionRate = completedItems / totalItems; // Рассчитываем процент завершения

                if (completionRate > 0.5 && this.columns[0].cards.includes(card)) {
                    this.moveCard(card, 1); // Перемещаем карточку во второй столбец
                } else if (completionRate === 1 && this.columns[1].cards.includes(card)) {
                    this.moveCard(card, 2); // Перемещаем карточку в третий столбец
                    card.completedDate = new Date().toLocaleString(); // Устанавливаем дату завершения
                }
            }
            this.saveCards(); // Сохраняем изменения в localStorage
        },
        // Метод для перемещения карточки между колонками
        moveCard(card, targetColumnIndex) {
            for (let column of this.columns) {
                const index = column.cards.findIndex(c => c.id === card.id); // Находим индекс карточки.
                if (index !== -1) {
                    column.cards.splice(index, 1); // Удаляем карточку из текущей колонки
                    this.columns[targetColumnIndex].cards.push(card); // Добавляем карточку в целевую колонку
                    break; // Выходим из цикла после перемещения.
                }
            }
        }
    },
    template: `
        <div>
            <div class="columns">
                <note-column
                    v-for="(column, index) in columns"
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