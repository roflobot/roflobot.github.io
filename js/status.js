// Опрос состояния бэкенда бота (см. GET /api/status в authServer.js) — красит плашку
// .status-badge в шапке. Числа/правила: 0 ошибок подряд — зелёная "онлайн", 1 ошибка подряд —
// жёлтая "обслуживание" (не паника, бот мог просто уйти в рестарт), 2+ ошибок подряд —
// красная "неполадки" (обрыв уже не похож на короткий рестарт).
(function () {
    'use strict';

    var STATUS_URL = 'https://roflo-api.ru/api/status';
    var CHECK_INTERVAL_MS = 30000; // раз в 30 секунд
    var FETCH_TIMEOUT_MS = 8000;   // страховка: не даём одному зависшему запросу растянуться
                                    // за пределы следующего тика и породить параллельные проверки

    var failCount = 0;

    var badge = document.getElementById('statusBadge');
    var badgeText = badge ? badge.querySelector('.status-text') : null;

    // Единая точка, которая меняет вид плашки — data-state двигает цвет (см. status.css),
    // текст выставляется явно, без завязки на CSS ::before/content (проще читать в devtools).
    function renderStatus(state, text) {
        if (!badge || !badgeText) return; // разметку могли переименовать — молча не роняем скрипт
        badge.dataset.state = state;
        badgeText.textContent = text;
    }

    function checkStatus() {
        var controller = new AbortController();
        var timeoutId = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);

        fetch(STATUS_URL, { signal: controller.signal, cache: 'no-store' })
            .then(function (response) {
                clearTimeout(timeoutId);
                // response.ok — единственный надёжный признак живого бэкенда: fetch НЕ бросает
                // исключение на 4xx/5xx (например 502 от nginx, если сам процесс бота упал,
                // а прокси перед ним ещё жив), поэтому статус-код проверяем отдельно.
                if (!response.ok) throw new Error('HTTP ' + response.status);

                failCount = 0;
                renderStatus('online', 'ОНЛАЙН • ВСЁ РАБОТАЕТ');
            })
            .catch(function () {
                clearTimeout(timeoutId);
                failCount += 1;

                if (failCount === 1) {
                    renderStatus('maintenance', 'ОФФЛАЙН • ОБСЛУЖИВАНИЕ');
                } else {
                    // failCount >= 2
                    renderStatus('down', 'ОФФЛАЙН • ТЕХНИЧЕСКИЕ НЕПОЛАДКИ');
                }
            });
    }

    checkStatus(); // сразу при загрузке страницы — не заставляем посетителя ждать первые 30с
    setInterval(checkStatus, CHECK_INTERVAL_MS);
})();
