// Точка входа
import { S, api, loadBoot, render, toast, BASE } from './core.js';
import './client.js';
import './tryon.js';
import './master.js';
import './owner.js';

let swReg = null;
async function pollNotifications() {
  if (!S.user || document.hidden) return;
  try {
    const { items } = await api('/api/notifications');
    const unread = items.filter((n) => !n.is_read);
    const changed = S.unread !== unread.length; S.unread = unread.length;
    const last = +localStorage.getItem('lastNotif') || 0, fresh = unread.filter((n) => n.id > last);
    if (fresh.length) {
      localStorage.setItem('lastNotif', Math.max(...fresh.map((n) => n.id)));
      if (last) { // не показываем старые уведомления при первом входе
        const n = fresh[0]; toast(n.title);
        if ('Notification' in window && Notification.permission === 'granted') {
          const o = { body: n.body, icon: BASE + 'icons/icon-192.png', badge: BASE + 'icons/icon-192.png', tag: 'n' + n.id };
          try { swReg ? swReg.showNotification(n.title, o) : new Notification(n.title, o); } catch {}
        }
      }
    }
    if (changed) document.querySelectorAll('#nav a[href="#/me"]').forEach((a) => a.classList.toggle('has-dot', !!S.unread));
  } catch {}
}
(async () => {
  try { await loadBoot(); } catch (e) { document.getElementById('view').innerHTML = `<div class="page"><div class="empty"><p>${e.message}</p><button class="btn" onclick="location.reload()">Обновить</button></div></div>`; return; }
  document.title = `${S.boot.salon.name} — ${S.boot.salon.tagline.toLowerCase()}`;
  await pollNotifications();
  await render();
  setInterval(pollNotifications, 60000);
  window.addEventListener('auth', pollNotifications);
  document.addEventListener('visibilitychange', pollNotifications);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register(BASE + 'sw.js').then((r) => { swReg = r; }).catch(() => {});
})();
