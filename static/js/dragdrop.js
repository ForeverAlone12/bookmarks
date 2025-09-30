// Drag & Drop функциональность для групп
class GroupReorder {
    constructor() {
        this.isReordering = false;
        this.draggedElement = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Кнопка переключения режима перетаскивания
        $('#toggleReorder').on('click', () => this.toggleReorderMode());

        // События Drag & Drop
        this.setupDragAndDrop();
    }

    toggleReorderMode() {
        this.isReordering = !this.isReordering;

        if (this.isReordering) {
            this.enterReorderMode();
        } else {
            this.exitReorderMode();
        }
    }

    enterReorderMode() {
        // Показываем элементы управления перетаскиванием
        $('.group-handle').show();
        $('#reorderHint').show();
        $('#toggleReorder')
            .html('<span class="glyphicon glyphicon-ok"></span> Сохранить порядок')
            .removeClass('btn-default')
            .addClass('btn-success');

        // Добавляем визуальные индикаторы
        $('.group-block').addClass('reordering');

        // Создаем кнопки действий
        this.createActionButtons();
    }

    exitReorderMode() {
        // Скрываем элементы управления
        $('.group-handle').hide();
        $('#reorderHint').hide();
        $('#toggleReorder')
            .html('<span class="glyphicon glyphicon-move"></span> Изменить порядок групп')
            .removeClass('btn-success')
            .addClass('btn-default');

        // Убираем визуальные индикаторы
        $('.group-block').removeClass('reordering');

        // Удаляем кнопки действий
        this.removeActionButtons();

        // Сохраняем порядок
        this.saveOrder();
    }

    createActionButtons() {
        const actionsHtml = `
            <div class="reorder-actions">
                <button id="saveOrder" class="btn btn-reorder btn-reorder-save">
                    <span class="glyphicon glyphicon-floppy-disk"></span> Сохранить порядок
                </button>
                <button id="cancelReorder" class="btn btn-reorder btn-reorder-cancel">
                    <span class="glyphicon glyphicon-remove"></span> Отменить
                </button>
            </div>
        `;

        $('.reorder-controls').append(actionsHtml);

        $('#saveOrder').on('click', () => {
            this.exitReorderMode();
        });

        $('#cancelReorder').on('click', () => {
            this.cancelReorder();
        });
    }

    removeActionButtons() {
        $('.reorder-actions').remove();
    }

    cancelReorder() {
        this.isReordering = false;
        $('.group-handle').hide();
        $('#reorderHint').hide();
        $('#toggleReorder')
            .html('<span class="glyphicon glyphicon-move"></span> Изменить порядок групп')
            .removeClass('btn-success')
            .addClass('btn-default');

        $('.group-block').removeClass('reordering');
        this.removeActionButtons();

        // Перезагружаем страницу для сброса порядка
        location.reload();
    }

    setupDragAndDrop() {
        const container = document.getElementById('groupsContainer');

        if (!container) return;

        // Обработчики для десктопных устройств
        this.setupDesktopDragAndDrop(container);

        // Обработчики для мобильных устройств
        this.setupTouchDragAndDrop(container);
    }

    setupDesktopDragAndDrop(container) {
        let dragSrcElement = null;

        container.addEventListener('dragstart', (e) => {
            if (!this.isReordering) {
                e.preventDefault();
                return;
            }

            if (e.target.classList.contains('group-handle') ||
                e.target.closest('.group-handle')) {
                dragSrcElement = e.target.closest('.group-block');
                dragSrcElement.classList.add('dragging');

                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', dragSrcElement.outerHTML);
            } else {
                e.preventDefault();
            }
        });

        container.addEventListener('dragover', (e) => {
            if (!this.isReordering) return;

            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggable = document.querySelector('.dragging');

            if (afterElement == null) {
                container.appendChild(draggable);
            } else {
                container.insertBefore(draggable, afterElement);
            }
        });

        container.addEventListener('dragend', (e) => {
            if (!this.isReordering) return;

            const draggable = document.querySelector('.dragging');
            if (draggable) {
                draggable.classList.remove('dragging');
            }
        });
    }

    setupTouchDragAndDrop(container) {
        let touchStartY = 0;
        let touchedElement = null;
        let isDragging = false;

        container.addEventListener('touchstart', (e) => {
            if (!this.isReordering) return;

            const handle = e.target.closest('.group-handle');
            if (handle) {
                touchedElement = handle.closest('.group-block');
                touchStartY = e.touches[0].clientY;
                isDragging = true;

                touchedElement.classList.add('dragging');
                e.preventDefault();
            }
        });

        container.addEventListener('touchmove', (e) => {
            if (!isDragging || !this.isReordering) return;

            const touchY = e.touches[0].clientY;
            const afterElement = this.getDragAfterElement(container, touchY);

            if (afterElement == null) {
                container.appendChild(touchedElement);
            } else {
                container.insertBefore(touchedElement, afterElement);
            }

            e.preventDefault();
        });

        container.addEventListener('touchend', () => {
            if (touchedElement) {
                touchedElement.classList.remove('dragging');
                touchedElement = null;
            }
            isDragging = false;
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.group-block:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    async saveOrder() {
        const groups = $('#groupsContainer .group-block');
        const orderData = [];

        groups.each(function(index) {
            const groupId = $(this).data('group-id');
            orderData.push({
                id: groupId,
                order: index
            });
        });

        try {
            $('.groups-container').addClass('loading');

            const response = await fetch('/admin/groups/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Порядок групп успешно сохранен!', 'success');

                // Обновляем порядок в DOM
                groups.each(function(index) {
                    $(this).data('order', index);
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error saving order:', error);
            this.showMessage('Ошибка при сохранении порядка: ' + error.message, 'error');
        } finally {
            $('.groups-container').removeClass('loading');
        }
    }

    showMessage(message, type) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const messageHtml = `
            <div class="alert ${alertClass} alert-dismissible fade in">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                ${message}
            </div>
        `;

        $('.page-header').after(messageHtml);

        setTimeout(() => {
            $('.alert').alert('close');
        }, 5000);
    }
}

// Инициализация когда DOM готов
$(document).ready(() => {
    new GroupReorder();
});