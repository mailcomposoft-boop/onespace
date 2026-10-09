(function () {
  'use strict';
  // Попапы: любая ссылка вида #popup:<id> открывает <dialog id="popup:<id>">
  function find(hash) {
    if (!hash || hash.indexOf('#popup:') !== 0) return null;
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  }
  function open(dlg) {
    if (!dlg || dlg.open) return;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.classList.add('os-pop-lock');
    var first = dlg.querySelector('input[name="name"]');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function close(dlg) {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#popup:"]');
    if (a) {
      var dlg = find(a.getAttribute('href'));
      if (dlg) { e.preventDefault(); open(dlg); }
      return;
    }
    var x = e.target.closest && e.target.closest('[data-os-pop-close]');
    if (x) { close(x.closest('dialog')); return; }
    // клик по подложке
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('os-pop')) close(e.target);
  });

  Array.prototype.forEach.call(document.querySelectorAll('dialog.os-pop'), function (d) {
    d.addEventListener('close', function () { document.documentElement.classList.remove('os-pop-lock'); });
  });

  // ссылка с хэшем снаружи: compo-space.ru/#popup:demo
  if (location.hash) open(find(location.hash));
})();
