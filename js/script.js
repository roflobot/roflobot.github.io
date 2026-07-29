(function () {
    'use strict';

    /* ---------- Подсветка активной команды в сайдбаре при скролле.
       Работает только на странице "Команды" — на остальных страницах
       cmdBlocks будет пустым массивом, и IntersectionObserver просто не
       создаётся. Раньше подсветка была завязана на общий SPA-контейнер
       #commands; теперь у страницы "Команды" свой отдельный файл, так что
       скоуп по #commands больше не нужен. ---------- */
    var cmdBlocks = document.querySelectorAll('.cmd[id], h2[id]');

    if (cmdBlocks.length) {
        var currentActiveId = null;
        var intersectingMap = new Map();

        var clearActiveHighlight = function () {
            document.querySelectorAll('.tree-cmds a.active-link').forEach(function (l) { l.classList.remove('active-link'); });
            document.querySelectorAll('.tree-section summary.active-cat').forEach(function (s) { s.classList.remove('active-cat'); });
        };

        var setActiveCommand = function (id) {
            if (id === currentActiveId) return; // без изменений — не трогаем DOM зря
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

    /* ---------- Закрытие мобильного меню при клике по любой ссылке в сайдбаре
       или в верхнем меню. Раньше это было частью общего обработчика [data-nav],
       который заодно переключал "страницы"; теперь переходы между страницами —
       обычная навигация браузера, а этот обработчик остаётся нужен только для
       ссылок, ведущих на якорь внутри уже открытой страницы (например, пункты
       команд в сайдбаре на странице "Команды"). ---------- */
    var menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        document.querySelectorAll('.sidebar a, .top-bar-nav a').forEach(function (link) {
            link.addEventListener('click', function () { menuToggle.checked = false; });
        });
    }

    /* ---------- Переключатель темы, с сохранением выбора в localStorage.
       Этот файл — не артефакт Claude, а самостоятельный статический сайт для
       GitHub Pages, localStorage там работает как в любом обычном сайте. ---------- */
    var THEME_KEY = 'roflobot-theme';
    var themeBtn = document.getElementById('themeBtn');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        themeBtn.textContent = theme === 'light' ? '☀️' : '🌙';
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* приватный режим браузера — не критично, тема просто не сохранится между визитами */ }
    }

    var savedTheme = 'dark';
    try { savedTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { /* см. выше */ }
    applyTheme(savedTheme);

    themeBtn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });
})();
