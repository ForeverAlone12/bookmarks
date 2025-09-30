$(document).ready(function() {
    // Автоматическое закрытие alert через 5 секунд
    setTimeout(function() {
        $('.alert').fadeOut('slow');
    }, 5000);

    // Подтверждение удаления с названием элемента
    $('.btn-danger').on('click', function(e) {
        var siteName = $(this).closest('tr').find('strong').text() || 'этот элемент';
        if (!confirm('Вы уверены, что хотите удалить \"' + siteName + '\"?')) {
            e.preventDefault();
        }
    });

    // Валидация форм
    $('form').on('submit', function() {
        var requiredFields = $(this).find('[required]');
        var valid = true;

        requiredFields.each(function() {
            if (!$(this).val().trim()) {
                valid = false;
                $(this).closest('.form-group').addClass('has-error');
                $(this).tooltip({
                    title: 'Это поле обязательно для заполнения',
                    trigger: 'manual'
                }).tooltip('show');
            } else {
                $(this).closest('.form-group').removeClass('has-error');
                $(this).tooltip('destroy');
            }
        });

        return valid;
    });

    // Обработка ошибок загрузки иконок
    $('.site-icon-img').on('error', function() {
        $(this).hide();
        $(this).next('.default-icon').show();
    });

    // Плавная прокрутка для модальных окон
    $('.modal').on('show.bs.modal', function() {
        $(this).find('.modal-body').scrollTop(0);
    });

    // Анимация появления карточек при загрузке
    function animateCards() {
        $('.site-card').each(function(index) {
            var $card = $(this);
            setTimeout(function() {
                $card.addClass('animated');
            }, index * 100);
        });
    }

    // Инициализация анимаций
    setTimeout(animateCards, 500);

    // Динамическое обновление счетчиков
    function updateCounters() {
        $('.group-block').each(function() {
            var siteCount = $(this).find('.site-card').length;
            $(this).find('.site-count').text(siteCount + ' сайт(ов)');
        });
    }

    updateCounters();

    // Эффект параллакса для заголовков групп
    $(window).scroll(function() {
        var scrolled = $(window).scrollTop();
        $('.group-header').each(function() {
            var speed = 0.5;
            var $obj = $(this);
            var offset = $obj.offset().top;
            var height = $obj.outerHeight();

            if (scrolled + $(window).height() > offset && scrolled < offset + height) {
                var bgPos = -(scrolled - offset) * speed;
                $obj.css('background-position', 'center ' + bgPos + 'px');
            }
        });
    });

    console.log('Сайты загружены успешно! Grid layout активирован.');
});