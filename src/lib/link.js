// Куда ведёт кнопка.
// В CMS у кнопки выбирается действие: попап, якорь на странице или своя ссылка.
//   'popup:demo'  → '#popup:demo' — открывает общий попап (см. site.json → popups)
//   '#zayavka'    → якорь на этой же странице
//   'url' + url   → произвольный адрес: /blog, https://…
export function linkHref(action, url, fallback = '#popup:demo') {
  if (!action) return fallback;
  if (action === 'url') return url || fallback;
  if (action.startsWith('popup:')) return '#' + action;
  return action;
}
