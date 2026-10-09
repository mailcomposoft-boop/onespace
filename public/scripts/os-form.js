/* ============================================================
   Compo OneSpace — обработчик форм для Tilda
   Один файл на все страницы: /compo-space, /proekty-i-marzha,
   /reglamenty-i-znaniya, /ai-bez-utechki, /dokumenty-i-media,
   /about, /contacts

   Подключается перед закрывающим тегом body, ПОСЛЕ блока с разметкой,
   тегом script с src на этот файл (пример — в README.txt).

   Работает в двух режимах:
     TILDA    — данные уходят через штатный скрытый блок формы Tilda
                (валидация, CRM, уведомления, аналитика — всё её силами)
     WEBHOOK  — прямой POST на ваш URL (если блок Tilda не найден)
   Режим выбирается автоматически.

   Обязательные поля: имя, телефон, email и согласие с политикой.
   Телефон — с маской +7 (XXX) XXX-XX-XX, отправка только при полном
   номере. Email проверяется по наличию @ и домена.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- настройки ---------- */
  var CONFIG = {
    // URL для режима WEBHOOK. Оставьте пустым, если используете только Tilda.
    webhookUrl: window.OS_FORM_ENDPOINT || '',
    // Заголовок формы, который уйдёт в письмо/CRM как источник заявки.
    // Если пустой — берётся из data-os-form-name, иначе из заголовка страницы.
    defaultFormName: '',
    // ===== БОЕВОЙ РЕЖИМ =====
    // Все защиты включены. Для отладки доставки заявок можно
    // временно поставить false — тогда форма отправится пустой,
    // а в консоль будут писаться все шаги (плюс ?osdebug=1 в адресе).
    antiBot: true,           // скрытое поле-ловушка + минимальное время заполнения
    validateFields: true,    // проверка имени, телефона и email
    requireConsent: true,    // блокировка кнопки до согласия с политикой
    // Скрывать штатный блок формы Tilda скриптом.
    // Альтернатива — подключить hide-tilda-form.css и оставить false.
    hideTildaBlock: true,
    // Минимальное время заполнения, сек (работает только при antiBot: true).
    minFillSeconds: 2,
    // Показывать в консоли, что происходит.
    debug: false
  };

  var TILDA_FIELD_MAP = {
    name: ['name', 'Name', 'Имя', 'imya'],
    company: ['company', 'Company', 'Компания', 'kompaniya'],
    phone: ['phone', 'Phone', 'Телефон', 'tel', 'telefon'],
    email: ['email', 'Email', 'E-mail', 'mail'],
    contact: ['contact'],
    task: ['task', 'comment', 'Comment', 'message', 'Message', 'Задача', 'Комментарий'],
    promo: ['promo', 'Promo', 'Рассылка', 'subscribe']
  };

  // debug можно включить без правки файла: добавьте ?osdebug=1 к адресу страницы
  if (location.search.indexOf('osdebug=1') !== -1) CONFIG.debug = true;

  function log() {
    if (CONFIG.debug && window.console) console.log.apply(console, ['[os-form]'].concat([].slice.call(arguments)));
  }
  function warn() {
    if (window.console) console.warn.apply(console, ['[os-form]'].concat([].slice.call(arguments)));
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- utm и контекст страницы ---------- */
  function context() {
    var q = new URLSearchParams(location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      var v = q.get(k) || readCookie(k);
      if (v) utm[k] = v;
    });
    return {
      page: location.pathname,
      url: location.href,
      referrer: document.referrer || '',
      utm: utm
    };
  }

  function readCookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m[2]) : '';
  }

  /* ---------- поиск скрытого блока формы Tilda ---------- */
  function findTildaForm() {
    // 1. Явно помеченный блок. В Tilda имя класса блока обязано
    //    начинаться с uc-, поэтому основной вариант — uc-os-tilda-form.
    var marked = $('.uc-os-tilda-form form, [data-os-tilda-form] form');
    if (marked) return marked;
    // 2. Любая штатная форма Tilda на странице, кроме наших
    var forms = $$('form.js-form-proccess, form.t-form');
    for (var i = 0; i < forms.length; i++) {
      if (!forms[i].closest('[data-os-form]')) return forms[i];
    }
    return null;
  }

  function findTildaInput(tildaForm, logicalName) {
    var names = TILDA_FIELD_MAP[logicalName] || [logicalName];
    for (var i = 0; i < names.length; i++) {
      var el = tildaForm.querySelector('[name="' + names[i] + '"]');
      if (el) return el;
    }
    return null;
  }

  function setNativeValue(el, value) {
    var proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (setter && setter.set) setter.set.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ---------- валидация ---------- */
  // email — по наличию @ и точки в домене
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Телефон в формате +7 (XXX) XXX-XX-XX — ровно 11 цифр.
  function phoneDigits(v) {
    return String(v || '').replace(/\D/g, '');
  }
  function phoneComplete(v) {
    var d = phoneDigits(v);
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) return true;
    return false;
  }

  // Маска ввода: +7 (XXX) XXX-XX-XX
  function formatPhone(v) {
    var d = phoneDigits(v);
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);       // 8 -> 7
    if (d[0] !== '7') d = '7' + d;                // без кода страны
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  // Ставим маску на поле телефона: ввод, вставка, автозаполнение
  function bindPhoneMask(input) {
    if (!input || input.getAttribute('data-os-masked') === '1') return;
    input.setAttribute('data-os-masked', '1');
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('autocomplete', 'tel');
    if (!input.placeholder) input.placeholder = '+7 (___) ___-__-__';

    var apply = function () {
      var atEnd = input.selectionStart === input.value.length;
      var formatted = formatPhone(input.value);
      if (formatted !== input.value) {
        input.value = formatted;
        if (atEnd) {
          var pos = formatted.length;
          try { input.setSelectionRange(pos, pos); } catch (e) {}
        }
      }
    };
    input.addEventListener('input', apply);
    input.addEventListener('paste', function () { setTimeout(apply, 0); });
    input.addEventListener('focus', function () {
      if (!input.value) { input.value = '+7 ('; try { input.setSelectionRange(4, 4); } catch (e) {} }
    });
    input.addEventListener('blur', function () {
      if (phoneDigits(input.value).length <= 1) input.value = '';
    });
  }

  // Проверка полей. Возвращает список объектов {field, message},
  // чтобы можно было подсветить конкретное поле.
  function validate(fields) {
    var errors = [];

    if (!fields.name || fields.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Укажите имя' });
    }

    // поле «Телефон или email» — одно на две сущности (осталось
    // на части старых страниц). Раскладываем и убираем сам ключ.
    if (typeof fields.contact === 'string') {
      var c = fields.contact.trim();
      if (c.indexOf('@') !== -1) fields.email = c;
      else if (phoneDigits(c)) fields.phone = c;
      delete fields.contact;
    }

    if (!fields.phone || !phoneDigits(fields.phone).length) {
      errors.push({ field: 'phone', message: 'Укажите телефон' });
    } else if (!phoneComplete(fields.phone)) {
      errors.push({ field: 'phone', message: 'Телефон введён не полностью — нужны все 10 цифр после +7' });
    }

    if (!fields.email || !fields.email.trim()) {
      errors.push({ field: 'email', message: 'Укажите email' });
    } else if (fields.email.indexOf('@') === -1) {
      errors.push({ field: 'email', message: 'В адресе email должен быть символ @' });
    } else if (!RE_EMAIL.test(fields.email.trim())) {
      errors.push({ field: 'email', message: 'Проверьте адрес email — например, name@company.ru' });
    }

    return errors;
  }

  /* ---------- отправка ---------- */
  function sendViaTilda(tildaForm, fields, done) {
    Object.keys(fields).forEach(function (k) {
      var input = findTildaInput(tildaForm, k);
      if (!input) { log('нет поля в форме Tilda:', k); return; }
      if (input.type === 'checkbox') input.checked = !!fields[k];
      else setNativeValue(input, fields[k]);
    });

    // источник заявки — в скрытое поле, если оно есть
    var src = tildaForm.querySelector('[name="source"], [name="Источник"], [name="tildaspec-formname"]');
    if (src) setNativeValue(src, fields._formName);

    var submit = tildaForm.querySelector('button[type="submit"], .t-submit, input[type="submit"]');
    if (!submit) { done(new Error('в форме Tilda нет кнопки отправки')); return; }

    var settled = false;
    function finish(err) { if (!settled) { settled = true; done(err || null); } }

    // Tilda показывает свой блок успеха — ловим его появление
    var wrap = tildaForm.closest('.t-form__wrapper') || tildaForm.parentNode;
    var obs = new MutationObserver(function () {
      var ok = wrap.querySelector('.t-form__successbox');
      if (ok && ok.offsetParent !== null) { obs.disconnect(); finish(); }
      var err = tildaForm.querySelector('.t-input-error:not(:empty), .t-form__errorbox-item');
      if (err && err.offsetParent !== null) { obs.disconnect(); finish(new Error(err.textContent.trim())); }
    });
    obs.observe(wrap, { childList: true, subtree: true, attributes: true });

    document.addEventListener('tildaform:aftersuccess', function () { obs.disconnect(); finish(); }, { once: true });

    submit.click();

    // если Tilda не подала признаков жизни — считаем отправленным,
    // чтобы пользователь не увидел зависшую кнопку
    setTimeout(function () { obs.disconnect(); finish(); }, 6000);
  }

  function sendViaWebhook(fields, done) {
    if (!CONFIG.webhookUrl) { done(new Error('не настроен ни блок формы Tilda, ни webhookUrl')); return; }
    fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(fields)
    }).then(function (r) {
      done(r.ok ? null : new Error('сервер ответил ' + r.status));
    }, function (e) { done(e); });
  }

  /* ---------- инициализация одной формы ---------- */
  function initForm(form) {
    var body = $('[data-os-formbody]', form) || form;
    var sent = $('[data-os-sent]', form);
    var btn = $('[data-os-submit]', form);
    var err = $('[data-os-err]', form);
    var need = $('[data-os-consent-data]', form);
    var promo = $$('input[type="checkbox"]', form).filter(function (c) { return c !== need; })[0];
    if (!btn) { warn('в форме нет кнопки [data-os-submit] — отправка невозможна'); return; }
    if (!need) warn('не найден чекбокс [data-os-consent-data]');
    if (!sent) warn('не найден блок [data-os-sent] — экран «Заявка отправлена» не покажется');

    var openedAt = Date.now();
    var busy = false;

    // honeypot — боты заполняют всё
    var trap = null;
    if (CONFIG.antiBot) {
      trap = document.createElement('input');
      trap.type = 'text';
      trap.name = 'os_trap';
      trap.tabIndex = -1;
      trap.autocomplete = 'off';
      trap.setAttribute('aria-hidden', 'true');
      trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
      body.appendChild(trap);
    }

    var inputs = {};
    $$('input[name], textarea[name]', body).forEach(function (i) { inputs[i.name] = i; });

    // маска телефона
    bindPhoneMask(inputs.phone);
    if (inputs.email) {
      inputs.email.setAttribute('inputmode', 'email');
      inputs.email.setAttribute('autocomplete', 'email');
    }
    if (inputs.name) inputs.name.setAttribute('autocomplete', 'name');

    // отметка обязательных полей — звёздочка в подписи
    ['name', 'phone', 'email'].forEach(function (k) {
      var input = inputs[k];
      if (!input) return;
      input.setAttribute('required', 'required');
      input.setAttribute('aria-required', 'true');
      var label = input.closest('label');
      var cap = label && label.querySelector('.os-form__lb');
      if (cap && cap.querySelector('.os-req')) return;
      if (cap) {
        var star = document.createElement('span');
        star.className = 'os-req';
        star.textContent = ' *';
        cap.appendChild(star);
      }
    });

    function markInvalid(name) {
      var input = inputs[name];
      if (input) input.classList.add('is-invalid');
    }
    function clearMarks() {
      Object.keys(inputs).forEach(function (k) { inputs[k].classList.remove('is-invalid'); });
      if (need) {
        var box = need.closest('label');
        if (box) box.classList.remove('is-invalid');
      }
    }

    function showError(msg) {
      if (!err) return;
      err.textContent = msg;
      err.classList.add('is-on');
    }
    function clearError() { if (err) err.classList.remove('is-on'); }

    function syncBtn() {
      var ok = !CONFIG.requireConsent || !need || need.checked;
      btn.classList.toggle('is-ready', ok);
      btn.disabled = false;
      if (ok) { clearError(); clearMarks(); }
    }

    if (need) need.addEventListener('change', function () {
      var box = need.closest('label');
      if (box) box.classList.remove('is-invalid');
      syncBtn();
    });
    syncBtn();

    $$('input, textarea', form).forEach(function (i) {
      i.addEventListener('input', function () { clearError(); i.classList.remove('is-invalid'); });
      i.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && i.tagName !== 'TEXTAREA') { e.preventDefault(); btn.click(); }
      });
    });

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (busy) return;

      if (CONFIG.requireConsent && need && !need.checked) {
        clearMarks();
        var box = need.closest('label');
        if (box) box.classList.add('is-invalid');
        showError('Отметьте согласие на обработку персональных данных — без него мы не можем принять заявку');
        need.focus();
        return;
      }
      if (CONFIG.antiBot) {
        if (trap && trap.value) { log('honeypot'); return; }
        if ((Date.now() - openedAt) / 1000 < CONFIG.minFillSeconds) {
          showError('Проверьте, пожалуйста, заполненные поля');
          return;
        }
      }

      var fields = {};
      $$('input[name], textarea[name]', body).forEach(function (i) {
        if ((trap && i === trap) || i.type === 'checkbox') return;
        fields[i.name] = i.value.trim();
      });
      clearMarks();

      var errors = validate(fields);
      if (errors.length && CONFIG.validateFields) {
        errors.forEach(function (e) { markInvalid(e.field); });

        // Если не заполнено несколько полей — перечисляем их одним
        // сообщением. Если проблема в одном поле — показываем причину.
        var empty = errors.filter(function (e) { return e.message.indexOf('Укажите') === 0; });
        var msg;
        if (empty.length > 1) {
          var titles = { name: 'имя', phone: 'телефон', email: 'email' };
          msg = 'Заполните обязательные поля: ' +
            empty.map(function (e) { return titles[e.field] || e.field; }).join(', ');
        } else {
          msg = errors[0].message;
        }
        showError(msg);
        var first = inputs[errors[0].field];
        if (first) first.focus();
        return;
      }
      if (errors.length) log('проверки отключены, пропускаем:', errors.map(function (e) { return e.message; }).join('; '));

      fields.promo = promo ? promo.checked : false;
      fields.consent = need ? !!need.checked : true;
      fields._formName = form.getAttribute('data-os-form-name') ||
        CONFIG.defaultFormName || document.title;

      var ctx = context();
      fields.page = ctx.page;
      fields.url = ctx.url;
      fields.referrer = ctx.referrer;
      Object.keys(ctx.utm).forEach(function (k) { fields[k] = ctx.utm[k]; });

      busy = true;
      var label = btn.textContent;
      btn.textContent = 'Отправляем…';
      btn.classList.remove('is-ready');
      btn.disabled = true;

      var tildaForm = findTildaForm();
      if (tildaForm) {
        log('режим TILDA, блок:', (tildaForm.closest('.t-rec') || {}).id || '—', fields);
        Object.keys(fields).forEach(function (k) {
          if (k.charAt(0) === '_' || k === 'consent') return;
          if (!findTildaInput(tildaForm, k)) warn('в форме Tilda нет поля с name="' + k + '" — это значение не уйдёт в заявку');
        });
      } else if (CONFIG.webhookUrl) {
        log('режим WEBHOOK', CONFIG.webhookUrl, fields);
      } else {
        warn('не найдена штатная форма Tilda и не задан webhookUrl — отправлять некуда. Добавьте на страницу блок формы (BF102) или заполните webhookUrl в начале файла.');
      }

      var finish = function (error) {
        busy = false;
        if (error) {
          btn.textContent = label;
          btn.disabled = false;
          syncBtn();
          showError('Не удалось отправить. Позвоните нам: 8 800 500-79-34');
          log('ошибка:', error.message);
          return;
        }
        clearError();
        if (body !== form) body.style.display = 'none';
        if (sent) sent.classList.add('is-on');
        else { btn.textContent = 'Заявка отправлена ✓'; }

        if (window.dataLayer) window.dataLayer.push({ event: 'form_submit', form_name: fields._formName, page: fields.page });
        if (typeof window.ym === 'function' && window.Ya && window.Ya.Metrika2) {
          try { window.ym(window.__osYmId || 0, 'reachGoal', 'FORM_SUBMIT'); } catch (e) {}
        }
      };

      if (tildaForm) sendViaTilda(tildaForm, fields, finish);
      else sendViaWebhook(fields, finish);
    });
  }

  /* ---------- скрываем штатный блок формы Tilda ---------- */
  function hideTildaBlock() {
    if (!CONFIG.hideTildaBlock) return;
    var tildaForm = findTildaForm();
    if (!tildaForm) { log('штатная форма Tilda пока не найдена'); return; }
    // прячем весь блок-запись, а не только форму
    var block = tildaForm.closest('.t-rec') || tildaForm.closest('[id^="rec"]') || tildaForm;
    if (block.getAttribute('data-os-hidden') === '1') return;
    // display:none нельзя — Tilda не отправляет такие формы.
    // position:absolute тоже не годится: Tilda считает геометрию блоков
    // при инициализации и падает с RegisterClientLocalizationsError.
    // Схлопываем высоту, оставляя блок в обычном потоке.
    block.style.setProperty('height', '0', 'important');
    block.style.setProperty('min-height', '0', 'important');
    block.style.setProperty('padding', '0', 'important');
    block.style.setProperty('margin', '0', 'important');
    block.style.setProperty('overflow', 'hidden', 'important');
    block.style.setProperty('opacity', '0', 'important');
    block.style.setProperty('pointer-events', 'none', 'important');
    block.setAttribute('aria-hidden', 'true');
    block.setAttribute('data-os-hidden', '1');
    log('блок формы Tilda скрыт:', block.id || block.className);
  }

  function boot() {
    if (!CONFIG.antiBot || !CONFIG.validateFields || !CONFIG.requireConsent || !CONFIG.hideTildaBlock) {
      warn('РЕЖИМ ТЕСТИРОВАНИЯ: отключены ' +
        [!CONFIG.antiBot && 'антибот', !CONFIG.validateFields && 'проверка полей',
         !CONFIG.requireConsent && 'обязательное согласие',
         !CONFIG.hideTildaBlock && 'скрытие блока Tilda'].filter(Boolean).join(', ') +
        '. Перед публикацией верните флаги в true в начале os-form.js.');
    }
    var forms = $$('[data-os-form]');
    if (!forms.length) {
      warn('на странице нет элементов [data-os-form]. Проверьте, что блок с разметкой вставлен и скрипт подключён ПОСЛЕ него.');
      return;
    }
    forms.forEach(initForm);
    // Скрываем блок Tilda только после того, как она сама его
    // инициализировала — иначе её скрипты падают на расчёте геометрии.
    var hideLater = function () {
      setTimeout(hideTildaBlock, 300);
      setTimeout(hideTildaBlock, 1200);
      setTimeout(hideTildaBlock, 3000);
    };
    if (document.readyState === 'complete') hideLater();
    else window.addEventListener('load', hideLater);
    log('форм найдено:', forms.length);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
