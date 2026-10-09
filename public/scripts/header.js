(function () {
  var hdr = document.getElementById('csHeader');
  var drop = document.getElementById('csDrop');
  var burger = document.getElementById('csBurger');
  if (!hdr) return;

  // выпадающее меню: наведение на desktop, тап на touch
  var closeTimer;
  function open() { clearTimeout(closeTimer); drop.classList.add('is-open'); }
  function close() { closeTimer = setTimeout(function () { drop.classList.remove('is-open'); }, 120); }
  if (drop) {
    drop.addEventListener('mouseenter', open);
    drop.addEventListener('mouseleave', close);
    drop.querySelector('.cs-hdr__dropbtn').addEventListener('click', function (e) {
      e.preventDefault();
      drop.classList.toggle('is-open');
    });
  }

  if (burger) burger.addEventListener('click', function () { hdr.classList.toggle('is-mobopen'); });

  // закрывать при скролле и клике вне
  window.addEventListener('scroll', function () {
    if (drop) drop.classList.remove('is-open');
  }, { passive: true });
  document.addEventListener('click', function (e) {
    if (drop && !drop.contains(e.target)) drop.classList.remove('is-open');
    if (!hdr.contains(e.target)) hdr.classList.remove('is-mobopen');
  });

  // подсветка активной страницы
  var path = location.pathname.replace(/\/$/, '');
  Array.prototype.forEach.call(hdr.querySelectorAll('.cs-hdr__link'), function (a) {
    if (a.getAttribute('href').replace(/\/$/, '') === path) a.classList.add('is-active');
  });
})();
