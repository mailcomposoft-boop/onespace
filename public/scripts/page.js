/* ============================================================
   Compo OneSpace — интерактив страниц (Astro)
   Подключается один раз на страницу, ПОСЛЕ блоков.
   Блоки без интерактива работают и без этого файла.
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('os-js');

  var fmt = function (n) { return Math.round(n).toLocaleString('ru-RU'); };
  var rub = function (n) { return fmt(n) + ' \u20BD'; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. Появление секций при скролле ---------- */
  function initReveal() {
    var els = $$('.os-reveal');
    if (!els.length) return;
    var show = function (e) { e.classList.add('is-in'); e.style.transform = 'none'; };
    var showAll = function () { els.forEach(show); };
    if (!('IntersectionObserver' in window)) { showAll(); return; }
    // страховка: если наблюдатель по какой-то причине не отработал — показываем всё
    setTimeout(function () { if (!document.querySelector('.os-reveal.is-in')) showAll(); }, 1200);
    var io = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) { if (r.isIntersecting) { show(r.target); io.unobserve(r.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- 2. Блок 05: табы со скриншотами ---------- */
  // Данные страницы приходят из content/pages/*.json через <script id="os-data">
  var DATA = {};
  try { var el = document.getElementById('os-data'); if (el) DATA = JSON.parse(el.textContent || '{}'); } catch (e) {}
  var SHOTS = DATA.shots || [];


  function initShots() {
    var root = $('[data-os-shots]');
    if (!root) return;
    var tabsBox = $('[data-os-shots-tabs]', root);
    var imgsBox = $('[data-os-shots-imgs]', root);
    var cap = $('[data-os-shots-cap]', root);
    var side = $('[data-os-shots-side]', root);
    var img = $('[data-os-shots-img]');

    // заглушка не нужна, если вставлены картинки
    if ($('img', imgsBox)) {
      var ph = $('.os-shot__ph', imgsBox);
      if (ph) ph.parentNode.removeChild(ph);
    }

    SHOTS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'os-tab' + (i === 0 ? ' is-on' : '');
      b.textContent = s.label;
      b.addEventListener('click', function () { pick(i); });
      tabsBox.appendChild(b);
    });

    function pick(i) {
      var s = SHOTS[i];
      $$('.os-tab', tabsBox).forEach(function (b, k) { b.classList.toggle('is-on', k === i); });
      cap.textContent = 'onespace / ' + s.label.toLowerCase();
      side.innerHTML =
        '<span class="os-tag" style="align-self:flex-start">' + s.tag + '</span>' +
        '<div style="font-family:\'Manrope\',sans-serif;font-size:21px;font-weight:700;letter-spacing:-.02em;line-height:1.25;margin-bottom:12px">' + s.title + '</div>' +
        '<div style="font-size:14.5px;line-height:1.65;color:#5B6B8C;margin-bottom:20px">' + s.body + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:9px">' +
        s.points.map(function (p) {
          return '<div class="os-check"><span class="os-check__i">\u2713</span><span style="font-size:13.5px;line-height:1.55">' + p + '</span></div>';
        }).join('') + '</div>';
      if (img) img.alt = s.title;
      // если для каждого таба загружены свои картинки — переключаем их
      var imgs = $$('img', imgsBox);
      if (imgs.length > 1) imgs.forEach(function (el, k) { el.classList.toggle('is-on', k === i); });
    }
    pick(0);
  }

  /* ---------- 3. Блок 07-A: сравнение со своим стеком ---------- */
  var CATEGORIES = [
    { id: 'tracker', title: '\u0417\u0430\u0434\u0430\u0447\u0438 \u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u044B', module: 'T', moduleName: '\u0422\u0440\u0435\u043A\u0435\u0440', color: '#0077FF',
      tools: [{ name: 'Jira', cost: 850 }, { name: 'Trello', cost: 700 }, { name: 'Asana', cost: 750 }, { name: '\u0411\u0438\u0442\u0440\u0438\u043A\u044124 (\u0437\u0430\u0434\u0430\u0447\u0438)', cost: 500 }, { name: '\u0414\u0440\u0443\u0433\u043E\u0439 \u0442\u0430\u0441\u043A-\u0442\u0440\u0435\u043A\u0435\u0440', cost: 600 }] },
    { id: 'office', title: '\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u0444\u0430\u0439\u043B\u044B', module: 'O', moduleName: '\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B', color: '#6C5CE7',
      tools: [{ name: 'Google Workspace', cost: 700 }, { name: 'Microsoft 365', cost: 750 }, { name: '\u042F\u043D\u0434\u0435\u043A\u0441 360 \u0434\u043B\u044F \u0431\u0438\u0437\u043D\u0435\u0441\u0430', cost: 500 }, { name: 'Dropbox Business', cost: 900 }, { name: '\u0414\u0440\u0443\u0433\u043E\u0435 \u0444\u0430\u0439\u043B\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435', cost: 600 }] },
    { id: 'wiki', title: '\u0411\u0430\u0437\u0430 \u0437\u043D\u0430\u043D\u0438\u0439 / Wiki', module: 'K', moduleName: 'WIKI', color: '#D89A1E',
      tools: [{ name: 'Confluence', cost: 750 }, { name: 'Notion', cost: 800 }, { name: '\u0414\u0440\u0443\u0433\u0430\u044F wiki-\u0441\u0438\u0441\u0442\u0435\u043C\u0430', cost: 600 }] },
    { id: 'dam', title: '\u041C\u0435\u0434\u0438\u0430 \u0438 \u0431\u0440\u0435\u043D\u0434-\u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B', module: 'D', moduleName: 'DAM', color: '#D6547A',
      tools: [{ name: '\u041F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444 \u043F\u043E\u0434 \u0444\u043E\u0442\u043E \u0438 \u0432\u0438\u0434\u0435\u043E', cost: 600 }, { name: '\u041E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 DAM-\u0441\u0435\u0440\u0432\u0438\u0441', cost: 1200 }] },
    { id: 'finance', title: '\u0411\u044E\u0434\u0436\u0435\u0442\u044B \u0438 \u0443\u0447\u0451\u0442 \u0432\u0440\u0435\u043C\u0435\u043D\u0438', module: 'F', moduleName: '\u0411\u044E\u0434\u0436\u0435\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435', color: '#12967F',
      tools: [{ name: 'Toggl Track', cost: 600 }, { name: 'Harvest', cost: 700 }, { name: '\u041E\u0442\u0434\u0435\u043B\u044C\u043D\u0430\u044F BI-\u043D\u0430\u0434\u0441\u0442\u0440\u043E\u0439\u043A\u0430', cost: 800 }] }
  ];
  var ALL_MODULES = ['T', 'F', 'K', 'D', 'O'];

  function initStack() {
    var root = $('[data-os-stack]');
    if (!root) return;
    var selected = {};
    var employees = 200;

    var list = $('[data-os-stack-list]', root);
    CATEGORIES.forEach(function (cat) {
      var box = document.createElement('div');
      box.className = 'os-cat';
      box.innerHTML =
        '<div class="os-cat__h"><span class="os-cat__dot" style="background:' + cat.color + '"></span>' +
        '<span class="os-cat__t">' + cat.title + '</span>' +
        '<span class="os-cat__arrow">\u2192 ' + cat.moduleName + '</span></div>' +
        '<div class="os-cat__list"></div>';
      var inner = $('.os-cat__list', box);
      cat.tools.forEach(function (tool) {
        var key = cat.id + '::' + tool.name;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'os-opt';
        b.innerHTML = '<span class="os-opt__box"></span><span class="os-opt__n">' + tool.name +
          '</span><span class="os-opt__p">~' + tool.cost + ' \u20BD / \u0447\u0435\u043B.</span>';
        b.addEventListener('click', function () {
          if (selected[key]) { delete selected[key]; } else { selected[key] = { cat: cat, tool: tool }; }
          b.classList.toggle('is-on', !!selected[key]);
          $('.os-opt__box', b).textContent = selected[key] ? '\u2713' : '';
          render();
        });
        inner.appendChild(b);
      });
      list.appendChild(box);
    });

    var range = $('[data-os-stack-emp]', root);
    var empVal = $('[data-os-stack-empval]', root);
    range.addEventListener('input', function () { employees = +range.value; render(); });

    var methodBtn = $('[data-os-stack-method]', root);
    var methodBox = $('[data-os-stack-methodbox]', root);
    methodBtn.addEventListener('click', function () {
      var on = methodBox.classList.toggle('is-on');
      methodBtn.textContent = on ? '\u0421\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u0442\u043E\u0434\u0438\u043A\u0443 \u0440\u0430\u0441\u0447\u0451\u0442\u0430' : '\u041A\u0430\u043A \u043C\u044B \u0441\u0447\u0438\u0442\u0430\u0435\u043C \u2014 \u043C\u0435\u0442\u043E\u0434\u0438\u043A\u0430';
    });

    function render() {
      var keys = Object.keys(selected);
      var costNow = keys.reduce(function (s, k) { return s + selected[k].tool.cost * employees * 12; }, 0);
      var savings = costNow * 0.4;
      var mods = {};
      keys.forEach(function (k) { mods[selected[k].cat.module] = true; });

      empVal.textContent = fmt(employees) + ' \u0447\u0435\u043B.';
      $('[data-os-stack-count]', root).textContent = keys.length
        ? keys.length + ' ' + plural(keys.length, ['\u0441\u0435\u0440\u0432\u0438\u0441', '\u0441\u0435\u0440\u0432\u0438\u0441\u0430', '\u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432'])
        : '\u2014';
      $('[data-os-stack-pills]', root).innerHTML = keys.map(function (k) {
        return '<span class="os-chip" style="font-size:11px;padding:5px 10px;border-color:' + selected[k].cat.color + '33">' + selected[k].tool.name + '</span>';
      }).join('');
      $('[data-os-stack-empty]', root).style.display = keys.length ? 'none' : 'block';
      $('[data-os-stack-dots]', root).innerHTML = ALL_MODULES.map(function (m) {
        var on = mods[m];
        return '<span style="width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;' +
          'font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;' +
          (on ? 'background:#fff;color:#0052B4' : 'background:rgba(255,255,255,.22);color:rgba(255,255,255,.7)') + '">' + m + '</span>';
      }).join('');
      $('[data-os-stack-now]', root).textContent = rub(costNow);
      $('[data-os-stack-after]', root).textContent = rub(costNow - savings);
      $('[data-os-stack-bar]', root).style.width = (costNow ? Math.max(8, (costNow - savings) / costNow * 100) : 0) + '%';
      $('[data-os-stack-savings]', root).textContent = rub(savings);
    }

    function plural(n, f) {
      var m = n % 100, k = n % 10;
      if (m > 4 && m < 21) return f[2];
      if (k === 1) return f[0];
      if (k > 1 && k < 5) return f[1];
      return f[2];
    }
    render();
  }

  /* ---------- 4. Блок 07-Б: калькулятор выгод, 5 сценариев ---------- */
  var SEGMENTS = [
    { id: 'universal', label: '\u041E\u0431\u0449\u0438\u0439 \u0440\u0430\u0441\u0447\u0451\u0442',
      title: '\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u044B \u0441\u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0442\u0435, \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0432 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 \u0432 \u043E\u0434\u043D\u043E\u043C \u043A\u043E\u043D\u0442\u0443\u0440\u0435',
      desc: '\u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439: \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 SaaS-\u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430\u0445 \u0438 \u043D\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u044B, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0443\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043C\u0435\u0436\u0434\u0443 \u0441\u0435\u0440\u0432\u0438\u0441\u0430\u043C\u0438.',
      fields: [
        { id: 'employees', label: '\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0432 OneSpace', min: 20, max: 1500, step: 10, def: 200, format: function (v) { return fmt(v) + ' \u0447\u0435\u043B.'; } },
        { id: 'saas', label: '\u0420\u0430\u0441\u0445\u043E\u0434\u044B \u043D\u0430 SaaS-\u0441\u0435\u0440\u0432\u0438\u0441\u044B \u0432 \u043C\u0435\u0441\u044F\u0446', min: 50000, max: 3000000, step: 10000, def: 450000, format: rub, hint: '\u0422\u0430\u0441\u043A-\u0442\u0440\u0435\u043A\u0435\u0440\u044B, \u0444\u0430\u0439\u043B\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430, \u0432\u0438\u043A\u0438, \u0447\u0430\u0442\u044B, \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438 \u043D\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0443' },
        { id: 'hours', label: '\u0427\u0430\u0441\u043E\u0432 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043C\u0435\u0436\u0434\u0443 \u0441\u0435\u0440\u0432\u0438\u0441\u0430\u043C\u0438', min: 1, max: 12, step: 0.5, def: 5, format: function (v) { return v + ' \u0447'; } },
        { id: 'salary', label: '\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430', min: 40000, max: 400000, step: 5000, def: 120000, format: function (v) { return rub(v) + ' / \u043C\u0435\u0441'; } }
      ],
      calc: function (v) {
        var hourly = v.salary / 168, saasNow = v.saas * 12, saasSaving = saasNow * 0.4;
        var timeHours = v.employees * v.hours * 52 * 0.5, timeMoney = timeHours * hourly;
        return {
          totalLabel: '\u041F\u043E\u0442\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u044B\u0433\u043E\u0434\u0430 \u0432 \u043F\u0435\u0440\u0432\u044B\u0439 \u0433\u043E\u0434',
          total: saasSaving + timeMoney,
          totalSub: '\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430\u0445 + \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0451\u043D\u043D\u043E\u0435 \u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u0432\u0440\u0435\u043C\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u044B',
          cards: [{ label: '\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 SaaS \u0437\u0430 \u0433\u043E\u0434', value: rub(saasSaving), gain: true },
                   { label: '\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0437\u0430 \u0433\u043E\u0434', value: fmt(timeHours) + ' \u0447' }],
          bars: [{ label: '\u0420\u0430\u0441\u0445\u043E\u0434\u044B \u043D\u0430 SaaS \u0441\u0435\u0439\u0447\u0430\u0441 / \u0433\u043E\u0434', value: rub(saasNow), pct: 100 },
                  { label: '\u0420\u0430\u0441\u0445\u043E\u0434\u044B \u0441 OneSpace / \u0433\u043E\u0434', value: rub(saasNow - saasSaving), pct: Math.max(8, (saasNow - saasSaving) / Math.max(saasNow, 1) * 100), accent: true }],
          paybackLead: '\u041E\u0440\u0438\u0435\u043D\u0442\u0438\u0440\u043E\u0432\u043E\u0447\u043D\u0430\u044F \u043E\u043A\u0443\u043F\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442\u0430', paybackValue: '12\u201318 \u043C\u0435\u0441\u044F\u0446\u0435\u0432'
        };
      },
      methodIntro: '\u0424\u043E\u0440\u043C\u0443\u043B\u0430 \u043D\u0435 \u0434\u0430\u0451\u0442 \u0442\u043E\u0447\u043D\u044B\u0439 ROI \u2014 \u0434\u043B\u044F \u043D\u0435\u0433\u043E \u043D\u0443\u0436\u043D\u0430 \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u0438, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u0440\u0430\u0437\u043C\u0435\u0440\u0430 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 \u0438 \u043D\u0430\u0431\u043E\u0440\u0430 \u043C\u043E\u0434\u0443\u043B\u0435\u0439.',
      methodBullets: ['\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 SaaS = \u0442\u0435\u043A\u0443\u0449\u0438\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044B \u00D7 12 \u043C\u0435\u0441\u044F\u0446\u0435\u0432 \u00D7 40%: \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0430 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430 \u221230\u2026\u221250% TCO \u043D\u0430 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0435 3\u20135 \u043B\u0435\u0442 \u0434\u043B\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0439 200\u2013500 \u0447\u0435\u043B\u043E\u0432\u0435\u043A.',
        '\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u0432\u0440\u0435\u043C\u0435\u043D\u0438 = \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438 \u00D7 \u0447\u0430\u0441\u044B \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u00D7 52 \u043D\u0435\u0434\u0435\u043B\u0438 \u00D7 50% \u00D7 \u0441\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441. 50% \u2014 \u043A\u043E\u043D\u0441\u0435\u0440\u0432\u0430\u0442\u0438\u0432\u043D\u0430\u044F \u0434\u043E\u043B\u044F \u0443\u0441\u0442\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0445 \u043F\u043E\u0442\u0435\u0440\u044C.',
        '\u0421\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441 = \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u00F7 168 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0447\u0430\u0441\u043E\u0432 \u0432 \u043C\u0435\u0441\u044F\u0446.'] },

    { id: 'trackerFinance', label: '\u0417\u0430\u0434\u0430\u0447\u0438 \u0438 \u0431\u044E\u0434\u0436\u0435\u0442\u044B',
      title: '\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u043C\u0430\u0440\u0436\u0438 \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F \u0431\u0435\u0437 \u0432\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u0438 \u0431\u044E\u0434\u0436\u0435\u0442\u0430',
      desc: '\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u00AB\u0422\u0440\u0435\u043A\u0435\u0440 + \u0411\u044E\u0434\u0436\u0435\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u00BB: \u0434\u043B\u044F IT-\u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0442\u043E\u0440\u043E\u0432, digital-\u0441\u0442\u0443\u0434\u0438\u0439, \u043F\u0440\u043E\u0435\u043A\u0442\u043D\u044B\u0445 \u0438 \u043C\u043E\u043D\u0442\u0430\u0436\u043D\u044B\u0445 \u043A\u043E\u043C\u0430\u043D\u0434.',
      fields: [
        { id: 'projects', label: '\u041F\u0440\u043E\u0435\u043A\u0442\u043E\u0432 \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u0432 \u0440\u0430\u0431\u043E\u0442\u0435', min: 1, max: 100, step: 1, def: 15, format: function (v) { return fmt(v) + ' \u0448\u0442.'; } },
        { id: 'avgBudget', label: '\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u0433\u043E\u0434\u043E\u0432\u043E\u0439 \u0431\u044E\u0434\u0436\u0435\u0442 \u043E\u0434\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0435\u043A\u0442\u0430', min: 500000, max: 20000000, step: 100000, def: 3000000, format: rub },
        { id: 'overrunPct', label: '\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u043F\u0435\u0440\u0435\u0440\u0430\u0441\u0445\u043E\u0434 \u0431\u044E\u0434\u0436\u0435\u0442\u0430 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432 \u0441\u0435\u0439\u0447\u0430\u0441', min: 0, max: 40, step: 1, def: 12, format: function (v) { return v + '%'; }, hint: '\u0422\u043E, \u0447\u0442\u043E \u043E\u0431\u044B\u0447\u043D\u043E \u0432\u0441\u043F\u043B\u044B\u0432\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E \u0444\u0430\u043A\u0442\u0443 \u0441\u0434\u0430\u0447\u0438' },
        { id: 'reportHours', label: '\u0427\u0430\u0441\u043E\u0432 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u0420\u041F \u0442\u0440\u0430\u0442\u0438\u0442 \u043D\u0430 \u0440\u0443\u0447\u043D\u043E\u0435 \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u043E\u0442\u0447\u0451\u0442\u043E\u0432', min: 2, max: 60, step: 1, def: 15, format: function (v) { return v + ' \u0447'; } },
        { id: 'pmSalary', label: '\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430', min: 80000, max: 350000, step: 5000, def: 150000, format: function (v) { return rub(v) + ' / \u043C\u0435\u0441'; } }
      ],
      calc: function (v) {
        var lossNow = v.projects * v.avgBudget * (v.overrunPct / 100), margin = lossNow * 0.5;
        var hoursSaved = v.reportHours * 52 * 0.6, timeMoney = hoursSaved * (v.pmSalary / 168), after = v.overrunPct * 0.5;
        return {
          totalLabel: '\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0451\u043D\u043D\u0430\u044F \u043C\u0430\u0440\u0436\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u0432 \u043F\u0435\u0440\u0432\u044B\u0439 \u0433\u043E\u0434',
          total: margin + timeMoney,
          totalSub: '\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C \u0431\u044E\u0434\u0436\u0435\u0442\u0430 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438 + \u043C\u0435\u043D\u044C\u0448\u0435 \u0440\u0443\u0447\u043D\u043E\u0439 \u043E\u0442\u0447\u0451\u0442\u043D\u043E\u0441\u0442\u0438',
          cards: [{ label: '\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0451\u043D\u043D\u0430\u044F \u043C\u0430\u0440\u0436\u0430 \u0437\u0430 \u0441\u0447\u0451\u0442 \u0432\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u0438 \u0431\u044E\u0434\u0436\u0435\u0442\u0430 / \u0433\u043E\u0434', value: rub(margin), gain: true },
                   { label: '\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0420\u041F / \u0433\u043E\u0434', value: fmt(hoursSaved) + ' \u0447' }],
          bars: [{ label: '\u041F\u0435\u0440\u0435\u0440\u0430\u0441\u0445\u043E\u0434 \u0431\u044E\u0434\u0436\u0435\u0442\u0430 \u0441\u0435\u0439\u0447\u0430\u0441', value: v.overrunPct.toFixed(0) + '%', pct: 100 },
                  { label: '\u041F\u0435\u0440\u0435\u0440\u0430\u0441\u0445\u043E\u0434 \u0441 OneSpace', value: after.toFixed(1) + '%', pct: Math.max(8, after / Math.max(v.overrunPct, 1) * 100), accent: true }],
          paybackLead: '\u042D\u0444\u0444\u0435\u043A\u0442 \u043E\u0442 \u0432\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u0438 \u0431\u044E\u0434\u0436\u0435\u0442\u0430 \u043F\u0440\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F', paybackValue: '\u0432 \u043F\u0435\u0440\u0432\u043E\u043C \u043A\u0432\u0430\u0440\u0442\u0430\u043B\u0435'
        };
      },
      methodIntro: '\u0421\u0447\u0438\u0442\u0430\u0435\u043C \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u043E, \u0447\u0442\u043E \u0432\u0438\u0434\u043D\u043E \u0432 \u0434\u0435\u043D\u044C\u0433\u0430\u0445: \u043F\u0435\u0440\u0435\u0440\u0430\u0441\u0445\u043E\u0434, \u043E \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u0432\u044B \u0443\u0437\u043D\u0430\u0451\u0442\u0435 \u043F\u043E\u0437\u0434\u043D\u043E, \u0438 \u0447\u0430\u0441\u044B \u043D\u0430 \u0440\u0443\u0447\u043D\u043E\u0435 \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0445.',
      methodBullets: ['\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0451\u043D\u043D\u0430\u044F \u043C\u0430\u0440\u0436\u0430 = \u0431\u044E\u0434\u0436\u0435\u0442 \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044F \u00D7 \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0440\u043E\u0446\u0435\u043D\u0442 \u043F\u0435\u0440\u0435\u0440\u0430\u0441\u0445\u043E\u0434\u0430 \u00D7 50%.',
        '\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0420\u041F = \u0447\u0430\u0441\u044B \u043D\u0430 \u0440\u0443\u0447\u043D\u0443\u044E \u043E\u0442\u0447\u0451\u0442\u043D\u043E\u0441\u0442\u044C \u00D7 52 \u043D\u0435\u0434\u0435\u043B\u0438 \u00D7 60% \u00D7 \u0441\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441.',
        '\u0421\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441 = \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u00F7 168 \u0447\u0430\u0441\u043E\u0432. \u041A\u043E\u044D\u0444\u0444\u0438\u0446\u0438\u0435\u043D\u0442\u044B \u2014 \u043D\u0430\u0448\u0438 \u0434\u043E\u043F\u0443\u0449\u0435\u043D\u0438\u044F, \u0430 \u043D\u0435 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u043D\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\u043D\u0435\u0434\u0440\u0435\u043D\u0438\u044F.'] },

    { id: 'wikiOffice', label: '\u0417\u043D\u0430\u043D\u0438\u044F \u0438 \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u044B',
      title: '\u0412\u043E \u0447\u0442\u043E \u043E\u0431\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u043E\u043D\u0431\u043E\u0440\u0434\u0438\u043D\u0433 \u0431\u0435\u0437 \u0431\u0430\u0437\u044B \u0437\u043D\u0430\u043D\u0438\u0439',
      desc: '\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 Wiki + \u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B: \u0434\u043B\u044F \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0430, \u0444\u0438\u043B\u0438\u0430\u043B\u044C\u043D\u044B\u0445 \u0441\u0435\u0442\u0435\u0439 \u0438 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0439 \u0441 \u0432\u044B\u0441\u043E\u043A\u043E\u0439 \u0442\u0435\u043A\u0443\u0447\u043A\u043E\u0439 \u043B\u0438\u043D\u0435\u0439\u043D\u043E\u0433\u043E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0430.',
      fields: [
        { id: 'employees', label: '\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0432 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438', min: 50, max: 1500, step: 10, def: 300, format: function (v) { return fmt(v) + ' \u0447\u0435\u043B.'; } },
        { id: 'turnover', label: '\u041D\u043E\u0432\u044B\u0445 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0432 \u0433\u043E\u0434 (\u0442\u0435\u043A\u0443\u0447\u043A\u0430 \u0438 \u0440\u043E\u0441\u0442)', min: 5, max: 500, step: 5, def: 60, format: function (v) { return fmt(v) + ' \u0447\u0435\u043B.'; } },
        { id: 'onboardingDays', label: '\u0414\u043D\u0435\u0439 \u0434\u043E \u0432\u044B\u0445\u043E\u0434\u0430 \u043D\u043E\u0432\u043E\u0433\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430 \u043D\u0430 \u043F\u043E\u043B\u043D\u0443\u044E \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C', min: 5, max: 90, step: 1, def: 30, format: function (v) { return v + ' \u0434\u043D.'; } },
        { id: 'avgSalary', label: '\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430', min: 40000, max: 300000, step: 5000, def: 90000, format: function (v) { return rub(v) + ' / \u043C\u0435\u0441'; } }
      ],
      calc: function (v) {
        var daily = v.avgSalary / 21, saving = v.turnover * v.onboardingDays * daily * 0.5 * 0.3;
        var searchHours = v.employees * 2 * 52 * 0.4, searchMoney = searchHours * (v.avgSalary / 168), after = v.onboardingDays * 0.7;
        return {
          totalLabel: '\u041F\u043E\u0442\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u044B\u0433\u043E\u0434\u0430 \u0432 \u043F\u0435\u0440\u0432\u044B\u0439 \u0433\u043E\u0434',
          total: saving + searchMoney,
          totalSub: '\u0411\u044B\u0441\u0442\u0440\u0435\u0435 \u043E\u043D\u0431\u043E\u0440\u0434\u0438\u043D\u0433 + \u043C\u0435\u043D\u044C\u0448\u0435 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u043E\u0432',
          cards: [{ label: '\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 \u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u0438 \u043E\u043D\u0431\u043E\u0440\u0434\u0438\u043D\u0433\u0430 / \u0433\u043E\u0434', value: rub(saving), gain: true },
                   { label: '\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u043E\u0432 / \u0433\u043E\u0434', value: fmt(searchHours) + ' \u0447' }],
          bars: [{ label: '\u0414\u043D\u0435\u0439 \u0434\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0438 \u0441\u0435\u0439\u0447\u0430\u0441', value: v.onboardingDays.toFixed(0) + ' \u0434\u043D.', pct: 100 },
                  { label: '\u0414\u043D\u0435\u0439 \u0441 OneSpace', value: after.toFixed(0) + ' \u0434\u043D.', pct: Math.max(8, after / Math.max(v.onboardingDays, 1) * 100), accent: true }],
          paybackLead: '\u041E\u043A\u0443\u043F\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u0442\u0435\u043C \u0431\u044B\u0441\u0442\u0440\u0435\u0435, \u0447\u0435\u043C \u0432\u044B\u0448\u0435 \u0442\u0435\u043A\u0443\u0447\u043A\u0430 \u2014', paybackValue: '\u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440 8\u201314 \u043C\u0435\u0441\u044F\u0446\u0435\u0432'
        };
      },
      methodIntro: '\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u044D\u0444\u0444\u0435\u043A\u0442 \u0437\u0434\u0435\u0441\u044C \u2014 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C: \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0449\u0430\u044F \u0431\u0430\u0437\u0430 \u0437\u043D\u0430\u043D\u0438\u0439 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u043D\u0435\u0434\u0435\u043B\u0438, \u0430 \u043D\u0435 \u043F\u043E\u043B\u0433\u043E\u0434\u0430, \u043A\u0430\u043A \u043F\u0440\u043E\u0435\u043A\u0442 \u043D\u0430 ECM \u0438\u043B\u0438 BPM.',
      methodBullets: ['\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 \u043E\u043D\u0431\u043E\u0440\u0434\u0438\u043D\u0433\u0435 = \u043D\u043E\u0432\u044B\u0445 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u00D7 \u0434\u043D\u0438 \u043E\u043D\u0431\u043E\u0440\u0434\u0438\u043D\u0433\u0430 \u00D7 50% \u043F\u043E\u0442\u0435\u0440\u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0438 \u00D7 \u0434\u043D\u0435\u0432\u043D\u0430\u044F \u0441\u0442\u0430\u0432\u043A\u0430 \u00D7 30% \u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u044F.',
        '\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 \u043F\u043E\u0438\u0441\u043A\u0435 \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u043E\u0432 = \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438 \u00D7 2 \u0447\u0430\u0441\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u00D7 52 \u043D\u0435\u0434\u0435\u043B\u0438 \u00D7 40% \u00D7 \u0441\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441.',
        '\u0414\u043D\u0435\u0432\u043D\u0430\u044F \u0441\u0442\u0430\u0432\u043A\u0430 = \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u00F7 21 \u0440\u0430\u0431\u043E\u0447\u0438\u0439 \u0434\u0435\u043D\u044C, \u0447\u0430\u0441\u043E\u0432\u0430\u044F = \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u00F7 168 \u0447\u0430\u0441\u043E\u0432.'] },

    { id: 'ai', label: 'AI-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442',
      title: '\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0443\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u043E\u0442\u0432\u0435\u0442\u043E\u0432',
      desc: '\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 AI (RAG): \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u043C \u0448\u0438\u0440\u043E\u043A\u043E, \u043A\u0440\u0438\u0442\u0438\u0447\u0435\u043D \u043F\u0440\u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u0445 \u041A\u0418\u0418, 152-\u0424\u0417 \u0438 \u0413\u041E\u0421\u0422 \u0420 57580.',
      fields: [
        { id: 'employees', label: '\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u043A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0435 \u0437\u043D\u0430\u043D\u0438\u044F \u0432 \u0440\u0430\u0431\u043E\u0442\u0435', min: 50, max: 1500, step: 10, def: 250, format: function (v) { return fmt(v) + ' \u0447\u0435\u043B.'; } },
        { id: 'searchHours', label: '\u0427\u0430\u0441\u043E\u0432 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u0443\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432', min: 1, max: 10, step: 0.5, def: 4, format: function (v) { return v + ' \u0447'; } },
        { id: 'avgSalary', label: '\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430', min: 40000, max: 350000, step: 5000, def: 110000, format: function (v) { return rub(v) + ' / \u043C\u0435\u0441'; } },
        { id: 'kii', label: '\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0441 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u043C\u0438 \u041A\u0418\u0418, 152-\u0424\u0417 \u0438\u043B\u0438 \u0413\u041E\u0421\u0422 \u0420 57580', type: 'checkbox', def: true }
      ],
      calc: function (v) {
        var hours = v.employees * v.searchHours * 52 * 0.6, money = hours * (v.avgSalary / 168), after = v.searchHours * 0.4;
        var r = {
          totalLabel: '\u041F\u043E\u0442\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u044B\u0433\u043E\u0434\u0430 \u0432 \u043F\u0435\u0440\u0432\u044B\u0439 \u0433\u043E\u0434',
          total: money,
          totalSub: '\u0412\u0440\u0435\u043C\u044F, \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0451\u043D\u043D\u043E\u0435 \u0437\u0430 \u0441\u0447\u0451\u0442 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u044B\u0445 \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u043F\u043E \u0432\u0430\u0448\u0438\u043C \u0434\u0430\u043D\u043D\u044B\u043C',
          cards: [{ label: '\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 / \u0433\u043E\u0434', value: fmt(hours) + ' \u0447', gain: true },
                   { label: '\u0412 \u043F\u0435\u0440\u0435\u0441\u0447\u0451\u0442\u0435 \u043D\u0430 \u0434\u0435\u043D\u044C\u0433\u0438 / \u0433\u043E\u0434', value: rub(money) }],
          bars: [{ label: '\u0427\u0430\u0441\u043E\u0432 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0441\u0435\u0439\u0447\u0430\u0441', value: v.searchHours.toFixed(1) + ' \u0447', pct: 100 },
                  { label: '\u0427\u0430\u0441\u043E\u0432 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u0441 AI-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u043E\u043C', value: after.toFixed(1) + ' \u0447', pct: Math.max(8, after / Math.max(v.searchHours, 0.5) * 100), accent: true }],
          paybackLead: '\u041E\u043A\u0443\u043F\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u043F\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043F\u043E\u0438\u0441\u043A\u0430 \u2014 \u043E\u0431\u044B\u0447\u043D\u043E', paybackValue: '\u0432 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0433\u043E\u0434\u0430'
        };
        if (v.kii) r.extraNote = '\u041E\u0442\u0432\u0435\u0442\u044B \u0444\u043E\u0440\u043C\u0438\u0440\u0443\u044E\u0442\u0441\u044F \u0432\u043D\u0443\u0442\u0440\u0438 \u0432\u0430\u0448\u0435\u0433\u043E \u043A\u043E\u043D\u0442\u0443\u0440\u0430: \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u0432\u0435\u043A\u0442\u043E\u0440\u043D\u044B\u0435 \u0438\u043D\u0434\u0435\u043A\u0441\u044B \u043D\u0435 \u0443\u0445\u043E\u0434\u044F\u0442 \u0432\u043E \u0432\u043D\u0435\u0448\u043D\u0438\u0435 \u0441\u0435\u0440\u0432\u0438\u0441\u044B. \u0418\u043C\u0435\u043D\u043D\u043E \u044D\u0442\u043E, \u0430 \u043D\u0435 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u0447\u0430\u0441\u043E\u0432, \u043E\u0431\u044B\u0447\u043D\u043E \u0438 \u0435\u0441\u0442\u044C \u043F\u0440\u0438\u0447\u0438\u043D\u0430 \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u043F\u0440\u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u0445 \u041A\u0418\u0418 \u0438 152-\u0424\u0417.';
        return r;
      },
      methodIntro: '\u0412 \u0434\u0435\u043D\u044C\u0433\u0430\u0445 \u0441\u0447\u0438\u0442\u0430\u0435\u043C \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0451\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F. \u0421\u043D\u044F\u0442\u044B\u0439 \u0440\u0438\u0441\u043A \u0443\u0442\u0435\u0447\u043A\u0438 \u0432\u043E \u0432\u043D\u0435\u0448\u043D\u0438\u0435 AI-\u0441\u0435\u0440\u0432\u0438\u0441\u044B \u043D\u0435 \u043E\u0446\u0438\u0444\u0440\u043E\u0432\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0438 \u0443\u043A\u0430\u0437\u0430\u043D \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E.',
      methodBullets: ['\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u0432\u0440\u0435\u043C\u0435\u043D\u0438 = \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438 \u00D7 \u0447\u0430\u0441\u044B \u043F\u043E\u0438\u0441\u043A\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u00D7 52 \u043D\u0435\u0434\u0435\u043B\u0438 \u00D7 60% \u00D7 \u0441\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441.',
        '\u0421\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441 = \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u00F7 168 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0447\u0430\u0441\u043E\u0432 \u0432 \u043C\u0435\u0441\u044F\u0446.',
        'RAG-\u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0430: \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432, \u043A \u043A\u043E\u0442\u043E\u0440\u044B\u043C \u0443 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0435\u0441\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F, \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0432\u043D\u0443\u0442\u0440\u0438 \u0432\u0430\u0448\u0435\u0433\u043E \u043A\u043E\u043D\u0442\u0443\u0440\u0430.'] },

    { id: 'docsMedia', label: '\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u043C\u0435\u0434\u0438\u0430',
      title: '\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0442\u043E\u0438\u0442 \u043F\u043E\u0438\u0441\u043A \u0444\u0430\u0439\u043B\u043E\u0432 \u0438 \u0440\u0430\u0431\u043E\u0442\u0430 \u0441 \u0432\u0435\u0440\u0441\u0438\u044F\u043C\u0438',
      desc: '\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 DAM + \u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B: \u0434\u043B\u044F \u043C\u0430\u0440\u043A\u0435\u0442\u0438\u043D\u0433\u0430, \u0434\u0438\u0437\u0430\u0439\u043D-\u0441\u0442\u0443\u0434\u0438\u0439, \u0431\u0440\u0435\u043D\u0434-\u043C\u0435\u043D\u0435\u0434\u0436\u043C\u0435\u043D\u0442\u0430 \u0438 \u043A\u043E\u043C\u0430\u043D\u0434 \u0441 \u0431\u043E\u043B\u044C\u0448\u0438\u043C \u043E\u0431\u044A\u0451\u043C\u043E\u043C \u0444\u0430\u0439\u043B\u043E\u0432.',
      fields: [
        { id: 'employees', label: '\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0440\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0441 \u0444\u0430\u0439\u043B\u0430\u043C\u0438 \u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u043C\u0438', min: 20, max: 1000, step: 10, def: 150, format: function (v) { return fmt(v) + ' \u0447\u0435\u043B.'; } },
        { id: 'searchHours', label: '\u0427\u0430\u0441\u043E\u0432 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u0443\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u043D\u0443\u0436\u043D\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0438 \u0444\u0430\u0439\u043B\u0430', min: 1, max: 10, step: 0.5, def: 3, format: function (v) { return v + ' \u0447'; }, hint: '\u041E\u0434\u0438\u043D\u043D\u0430\u0434\u0446\u0430\u0442\u044C \u043A\u043E\u043F\u0438\u0439 \u043D\u0430 \u0434\u0438\u0441\u043A\u0435, \u043D\u0438 \u043E\u0434\u043D\u0430 \u043D\u0435 \u0444\u0438\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u2014 \u0442\u0438\u043F\u043E\u0432\u0430\u044F \u043F\u043E\u0442\u0435\u0440\u044F \u0432\u0440\u0435\u043C\u0435\u043D\u0438' },
        { id: 'storageCost', label: '\u0420\u0430\u0441\u0445\u043E\u0434\u044B \u043D\u0430 \u043E\u0431\u043B\u0430\u0447\u043D\u044B\u0435 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430 \u0438 \u0444\u0430\u0439\u043B\u043E\u043E\u0431\u043C\u0435\u043D\u043D\u0438\u043A\u0438 \u0432 \u043C\u0435\u0441\u044F\u0446', min: 10000, max: 500000, step: 5000, def: 60000, format: rub },
        { id: 'avgSalary', label: '\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430', min: 40000, max: 300000, step: 5000, def: 100000, format: function (v) { return rub(v) + ' / \u043C\u0435\u0441'; } }
      ],
      calc: function (v) {
        var hours = v.employees * v.searchHours * 52 * 0.5, money = hours * (v.avgSalary / 168);
        var storage = v.storageCost * 12 * 0.3, after = v.searchHours * 0.5;
        return {
          totalLabel: '\u041F\u043E\u0442\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u044B\u0433\u043E\u0434\u0430 \u0432 \u043F\u0435\u0440\u0432\u044B\u0439 \u0433\u043E\u0434',
          total: money + storage,
          totalSub: '\u041C\u0435\u043D\u044C\u0448\u0435 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0444\u0430\u0439\u043B\u043E\u0432 + \u043A\u043E\u043D\u0441\u043E\u043B\u0438\u0434\u0430\u0446\u0438\u044F \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449',
          cards: [{ label: '\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0444\u0430\u0439\u043B\u043E\u0432 / \u0433\u043E\u0434', value: fmt(hours) + ' \u0447', gain: true },
                   { label: '\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430\u0445 \u0438 \u0444\u0430\u0439\u043B\u043E\u043E\u0431\u043C\u0435\u043D\u043D\u0438\u043A\u0430\u0445 / \u0433\u043E\u0434', value: rub(storage) }],
          bars: [{ label: '\u0427\u0430\u0441\u043E\u0432 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0441\u0435\u0439\u0447\u0430\u0441', value: v.searchHours.toFixed(1) + ' \u0447', pct: 100 },
                  { label: '\u0427\u0430\u0441\u043E\u0432 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u0441 OneSpace', value: after.toFixed(1) + ' \u0447', pct: Math.max(8, after / Math.max(v.searchHours, 0.5) * 100), accent: true }],
          paybackLead: '\u0411\u044B\u0441\u0442\u0440\u0435\u0435 \u043F\u0440\u0438 \u0431\u043E\u043B\u044C\u0448\u043E\u043C \u043E\u0431\u044A\u0451\u043C\u0435 \u043C\u0435\u0434\u0438\u0430 \u2014', paybackValue: '\u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440 10\u201315 \u043C\u0435\u0441\u044F\u0446\u0435\u0432',
          extraNote: '\u041C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435, \u0442\u0435\u0433\u0438 \u0438 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u0434\u0443\u0431\u043B\u0435\u0439: \u0440\u0430\u0437\u043C\u0435\u0442\u043A\u0443 \u0430\u0440\u0445\u0438\u0432\u0430 \u0431\u0435\u0440\u0451\u0442 \u043D\u0430 \u0441\u0435\u0431\u044F AI, \u0430 \u043D\u0435 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043D\u0435\u0434\u0435\u043B\u044F\u043C\u0438 \u0441\u043E\u0440\u0442\u0438\u0440\u0443\u0435\u0442 \u043F\u0430\u043F\u043A\u0438 \u0432\u0440\u0443\u0447\u043D\u0443\u044E.'
        };
      },
      methodIntro: '\u0421\u0447\u0438\u0442\u0430\u0435\u043C \u0432\u0440\u0435\u043C\u044F \u043D\u0430 \u043F\u043E\u0438\u0441\u043A \u0438 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u044E \u043D\u0430 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430\u0445. \u041F\u0435\u0440\u0435\u0434\u0435\u043B\u043A\u0438 \u0438\u0437-\u0437\u0430 \u0440\u0430\u0431\u043E\u0442\u044B \u0441 \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0435\u0439 \u0432\u0435\u0440\u0441\u0438\u0435\u0439 \u0432 \u0440\u0430\u0441\u0447\u0451\u0442 \u043D\u0435 \u0432\u0445\u043E\u0434\u044F\u0442.',
      methodBullets: ['\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u0432\u0440\u0435\u043C\u0435\u043D\u0438 = \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438 \u00D7 \u0447\u0430\u0441\u044B \u043F\u043E\u0438\u0441\u043A\u0430 \u0432 \u043D\u0435\u0434\u0435\u043B\u044E \u00D7 52 \u043D\u0435\u0434\u0435\u043B\u0438 \u00D7 50% \u00D7 \u0441\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441.',
        '\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u043D\u0430 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430\u0445 = \u0442\u0435\u043A\u0443\u0449\u0438\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044B \u00D7 12 \u043C\u0435\u0441\u044F\u0446\u0435\u0432 \u00D7 30% \u0437\u0430 \u0441\u0447\u0451\u0442 \u043A\u043E\u043D\u0441\u043E\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0432 \u043E\u0434\u0438\u043D \u043C\u043E\u0434\u0443\u043B\u044C.',
        '\u0421\u0442\u0430\u0432\u043A\u0430 \u0432 \u0447\u0430\u0441 = \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u0430 \u00F7 168 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0447\u0430\u0441\u043E\u0432 \u0432 \u043C\u0435\u0441\u044F\u0446.'] }
  ];

  // какие сценарии показывать и значения по умолчанию — из CMS
  if (DATA.calc && DATA.calc.segments && DATA.calc.segments.length) {
    SEGMENTS = SEGMENTS.filter(function (s) { return DATA.calc.segments.indexOf(s.id) !== -1; });
  }
  if (DATA.calc && DATA.calc.defaults) SEGMENTS.forEach(function (s) {
    s.fields.forEach(function (f) { var v = DATA.calc.defaults[f.id]; if (v != null && v !== '') f.def = Number(v); });
  });

  function initCalc() {
    var root = $('[data-os-calc]');
    if (!root) return;
    var idx = 0, vals = {};

    var tabsBox = $('[data-os-calc-tabs]', root);
    if (SEGMENTS.length < 2) tabsBox.style.display = 'none';
    SEGMENTS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'os-tab' + (i === 0 ? ' is-on' : '');
      b.innerHTML = '<span class="os-tab__sw"></span>' + s.label;
      b.addEventListener('click', function () { idx = i; reset(); });
      tabsBox.appendChild(b);
    });

    var methodBtn = $('[data-os-calc-method]', root);
    var methodBox = $('[data-os-calc-methodbox]', root);
    methodBtn.addEventListener('click', function () {
      var on = methodBox.classList.toggle('is-on');
      methodBtn.textContent = on ? '\u0421\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u0442\u043E\u0434\u0438\u043A\u0443 \u0440\u0430\u0441\u0447\u0451\u0442\u0430' : '\u041A\u0430\u043A \u043C\u044B \u0441\u0447\u0438\u0442\u0430\u0435\u043C \u2014 \u043C\u0435\u0442\u043E\u0434\u0438\u043A\u0430';
    });

    function reset() {
      var seg = SEGMENTS[idx];
      vals = {};
      seg.fields.forEach(function (f) { vals[f.id] = f.def; });
      $$('.os-tab', tabsBox).forEach(function (b, k) { b.classList.toggle('is-on', k === idx); });
      $('[data-os-calc-title]', root).textContent = seg.title;
      $('[data-os-calc-desc]', root).textContent = seg.desc;
      $('[data-os-calc-desc2]', root).textContent = seg.desc;

      var box = $('[data-os-calc-fields]', root);
      box.innerHTML = '';
      seg.fields.forEach(function (f) {
        var w = document.createElement('div');
        w.className = 'os-field';
        if (f.type === 'checkbox') {
          w.innerHTML = '<label class="os-consent" style="padding:14px;background:#FBFCFE;border:1px solid #E3E8F1;border-radius:10px;grid-template-columns:18px 1fr">' +
            '<input type="checkbox"' + (f.def ? ' checked' : '') + '><span style="font-size:13px;line-height:1.5;color:#0B1D3A">' + f.label + '</span></label>';
          $('input', w).addEventListener('change', function (e) { vals[f.id] = e.target.checked; render(); });
        } else {
          w.innerHTML = '<div class="os-field__row"><span class="os-field__lb">' + f.label +
            '</span><span class="os-field__val" data-v="' + f.id + '">' + f.format(f.def) + '</span></div>' +
            '<input class="os-range" type="range" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + f.def + '">' +
            (f.hint ? '<div class="os-field__hint">' + f.hint + '</div>' : '');
          $('input', w).addEventListener('input', function (e) {
            vals[f.id] = +e.target.value;
            $('[data-v="' + f.id + '"]', w).textContent = f.format(vals[f.id]);
            render();
          });
        }
        box.appendChild(w);
      });

      methodBox.innerHTML = '<div style="font-size:12.5px;line-height:1.7;color:#5B6B8C;margin-bottom:10px">' + seg.methodIntro + '</div>' +
        seg.methodBullets.map(function (b) {
          return '<div style="display:grid;grid-template-columns:12px 1fr;gap:10px;margin-bottom:8px"><span style="color:#0077FF">\u00B7</span>' +
            '<span style="font-size:12.5px;line-height:1.65;color:#5B6B8C">' + b + '</span></div>';
        }).join('');
      render();
    }

    function render() {
      var r = SEGMENTS[idx].calc(vals);
      $('[data-os-calc-totallabel]', root).textContent = r.totalLabel;
      $('[data-os-calc-total]', root).textContent = fmt(r.total);
      $('[data-os-calc-totalsub]', root).textContent = r.totalSub;
      $('[data-os-calc-cards]', root).innerHTML = r.cards.map(function (c) {
        return '<div class="os-mini' + (c.gain ? ' os-mini--gain' : '') + '"><div class="os-mini__lb">' + c.label +
          '</div><div class="os-mini__val" style="color:' + (c.gain ? '#0EA968' : '#0B1D3A') + '">' + c.value + '</div></div>';
      }).join('');
      $('[data-os-calc-bars]', root).innerHTML = r.bars.map(function (b) {
        return '<div style="margin-bottom:12px"><div class="os-barrow"><span>' + b.label + '</span><b class="os-mono" style="color:#0B1D3A">' + b.value + '</b></div>' +
          '<div class="os-bar"><div class="os-bar__fill' + (b.accent ? ' os-bar__fill--accent' : '') + '" style="width:' + b.pct + '%"></div></div></div>';
      }).join('');
      $('[data-os-calc-paybacklead]', root).textContent = r.paybackLead;
      $('[data-os-calc-paybackvalue]', root).textContent = r.paybackValue;
      var extra = $('[data-os-calc-extra]', root);
      extra.textContent = r.extraNote || '';
      extra.style.display = r.extraNote ? 'block' : 'none';
    }
    reset();
  }

  /* ---------- 5. Блок 09: FAQ-аккордеон ---------- */
  function initFaq() {
    $$('[data-os-faq] .os-faq__i').forEach(function (item, i) {
      var btn = $('.os-faq__q', item);
      if (i === 0) item.classList.add('is-on');
      $('.os-faq__s', item).textContent = item.classList.contains('is-on') ? '\u2212' : '+';
      btn.addEventListener('click', function () {
        var was = item.classList.contains('is-on');
        $$('[data-os-faq] .os-faq__i').forEach(function (o) {
          o.classList.remove('is-on');
          $('.os-faq__s', o).textContent = '+';
        });
        if (!was) { item.classList.add('is-on'); $('.os-faq__s', item).textContent = '\u2212'; }
      });
    });
  }

  /* Формы обслуживает отдельный файл os-form.js — см. export/forms */

  function boot() { initReveal(); initShots(); initStack(); initCalc(); initFaq(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
