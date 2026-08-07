(function () {
    'use strict';

    /* Подсветка активной команды в сайдбаре при скролле */
    var cmdBlocks = document.querySelectorAll('.cmd[id], h2[id]');

    if (cmdBlocks.length) {
        var currentActiveId = null;
        var intersectingMap = new Map();

        var clearActiveHighlight = function () {
            document.querySelectorAll('.tree-cmds a.active-link').forEach(function (l) { l.classList.remove('active-link'); });
            document.querySelectorAll('.tree-section summary.active-cat').forEach(function (s) { s.classList.remove('active-cat'); });
        };

        var setActiveCommand = function (id) {
            if (id === currentActiveId) return;
            currentActiveId = id;
            clearActiveHighlight();
            if (!id) return;

            var link = document.querySelector('.tree-cmds a[href="#' + id + '"]');
            if (link) {
                link.classList.add('active-link');
                var parentSection = link.closest('details.tree-section');
                if (parentSection) {
                    parentSection.querySelector('summary').classList.add('active-cat');
                    if (!parentSection.open) parentSection.open = true;
                }
            } else {
                var catSummary = document.querySelector('.tree-section[data-cat="' + id + '"] summary');
                if (catSummary) catSummary.classList.add('active-cat');
            }
        };

        var scrollSpy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) intersectingMap.set(entry.target.id, entry);
                else intersectingMap.delete(entry.target.id);
            });

            var best = null;
            intersectingMap.forEach(function (entry) {
                if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) best = entry;
            });

            if (best) setActiveCommand(best.target.id);
        }, { root: null, rootMargin: '-10% 0px -75% 0px', threshold: [0, 1] });

        cmdBlocks.forEach(function (el) { scrollSpy.observe(el); });
    }

    /* Закрытие мобильного меню при клике по ссылке в сайдбаре или в шапке */
    var menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        document.querySelectorAll('.sidebar a, .top-bar-nav a').forEach(function (link) {
            link.addEventListener('click', function () { menuToggle.checked = false; });
        });
    }

    /* Переключатель темы с сохранением выбора в localStorage */
    var THEME_KEY = 'roflobot-theme';
    var themeBtn = document.getElementById('themeBtn');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        themeBtn.textContent = theme === 'light' ? '☀️' : '🌙';
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    }

    var savedTheme = 'dark';
    try { savedTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) {}
    applyTheme(savedTheme);

    themeBtn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    /* Статус бэкенда бота */
    var STATUS_URL = 'https://roflo-api.ru/api/status';
    var CHECK_INTERVAL_MS = 30000;
    var FETCH_TIMEOUT_MS = 8000;
    var failCount = 0;

    var badge = document.getElementById('statusBadge');
    var badgeText = badge ? badge.querySelector('.status-text') : null;

    function renderStatus(state, text) {
        if (!badge || !badgeText) return;
        badge.dataset.state = state;
        badgeText.textContent = text;
    }

    function checkStatus() {
        var controller = new AbortController();
        var timeoutId = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);

        fetch(STATUS_URL, { signal: controller.signal, cache: 'no-store' })
            .then(function (response) {
                clearTimeout(timeoutId);
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
                    renderStatus('down', 'ОФФЛАЙН • ТЕХНИЧЕСКИЕ НЕПОЛАДКИ');
                }
            });
    }

    checkStatus();
    setInterval(checkStatus, CHECK_INTERVAL_MS);
})();
