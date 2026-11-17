// Ядро: состояние, API, маршрутизация, общие элементы интерфейса
import { drawPreview } from './nailart.js';

export const S = { boot: null, user: null, book: {}, tryon: null, unread: 0 };
export const A = {};          // обработчики действий data-act
const routes = [];
let afterRender = null;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => (Number(n) || 0).toLocaleString('ru-RU') + ' ₽';
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ymd(new Date());
export const parseD = (s) => new Date(s + 'T00:00:00');
export const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
export const WDF = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
export const dHuman = (s, withWd = true) => { const d = parseD(s); const t = today(); const pre = s === t ? 'Сегодня, ' : s === addDays(t, 1) ? 'Завтра, ' : ''; return `${pre}${d.getDate()} ${MON[d.getMonth()]}${withWd && !pre ? ', ' + WD[d.getDay()] : ''}`; };
export const dShort = (s) => { const d = parseD(s); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`; };
export const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} ч${m % 60 ? ' ' + (m % 60) + ' мин' : ''}` : `${m} мин`);
export const phoneFmt = (p) => { const d = String(p || ''); return d.length === 11 ? `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}` : d; };
export const plural = (n, a, b, c) => { const m = Math.abs(n) % 100, k = m % 10; return `${n} ${m > 10 && m < 20 ? c : k === 1 ? a : k >= 2 && k <= 4 ? b : c}`; };
export const endTime = (t, m) => { const [h, mm] = t.split(':').map(Number); const x = h * 60 + mm + m; return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`; };
export const initials = (n) => String(n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('');

export const IC = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.6 3-6 7-6s7 2.4 7 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2c3 .2 5 2 5 4.8"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.300 3.600 4 7 4c2 0 3.700 1.100 5 3 1.300-1.900 3-3 5-3 3.400 0 5.600 3.300 4.300 6.800C19.500 15.400 12 20 12 20z"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', left: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9c-2 0-4-1-4-3s3-2 4 3c1-5 4-5 4-3s-2 3-4 3z"/>',
  star: '<path d="M12 3l2.700 5.700 6.300.800-4.600 4.300 1.200 6.200L12 17l-5.600 3 1.200-6.200L3 9.500l6.300-.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.500" r="3.500"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-4 4 3 3-2 4 3"/>',
  flip: '<path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2M20 4v4h-4M4 20v-4h4"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  phone: '<path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>', pin: '<path d="M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
  logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>', percent: '<path d="M5 19L19 5"/><circle cx="7" cy="7" r="2.500"/><circle cx="17" cy="17" r="2.500"/>',
  brush: '<path d="M14 4l6 6-8 8H6v-6z"/><path d="M4 20c2 0 2-2 2-2"/>', scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.500 8l11.500 10M8.500 16L20 6"/>',
};
export const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;

// ---------- API ----------
// корень приложения (оно может лежать в подпапке сайта)
export const BASE = new URL('..', import.meta.url).href;
// Режим без сервера (демо на статическом хостинге): весь «сервер» работает в браузере, данные хранятся на устройстве
let local = null;
export async function api(url, opt = {}) {
  const method = opt.method || (opt.body ? 'POST' : 'GET');
  if (self.STATIC_DEMO) {
    local ||= import('./localapi.js').then((m) => m.initLocalApi(BASE));
    const r = await (await local)(method, url, opt.body);
    if (r.status >= 400) { const e = new Error(r.json.error || 'Ошибка'); e.status = r.status; throw e; }
    return r.json;
  }
  const o = { method, headers: {}, credentials: 'same-origin' };
  if (opt.body) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(opt.body); }
  let r, j;
  try { r = await fetch(BASE + url.replace(/^\//, ''), o); j = await r.json(); } catch { throw new Error('Нет связи с сервером. Проверьте интернет'); }
  if (!r.ok) { const e = new Error(j.error || 'Ошибка'); e.status = r.status; throw e; }
  return j;
}
export async function loadBoot() {
  S.boot = await api('/api/bootstrap'); S.user = S.boot.user;
  return S.boot;
}
export const svc = (id) => S.boot.services.find((x) => x.id === +id);
export const mst = (id) => S.boot.masters.find((x) => x.id === +id);
export const dsg = (id) => S.boot.designs.find((x) => x.id === +id);
export const promoFor = (serviceId) => S.boot.promos.filter((p) => p.active !== 0 && (!p.service_id || p.service_id === serviceId) && p.date_from <= today() && p.date_to >= today()).sort((a, b) => b.percent - a.percent)[0];

// ---------- маршрутизация ----------
export function route(pattern, fn, roles) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ re, keys, fn, roles });
}
export const go = (path) => { if (location.hash === '#' + path) render(); else location.hash = path; };
export const homeFor = (role) => (role === 'master' ? '/m' : role === 'owner' ? '/a' : '/');
export const after = (fn) => { afterRender = fn; };
export function current() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(qs || '')) };
}
let renderSeq = 0, cleanup = null;
export const onLeave = (fn) => { cleanup = fn; };
export async function render(opt = {}) {
  const seq = ++renderSeq;
  const { path, query } = current();
  const view = document.getElementById('view');
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  for (const r of routes) {
    const m = r.re.exec(path); if (!m) continue;
    if (r.roles && (!S.user || !r.roles.includes(S.user.role))) {
      if (!S.user) { sessionStorage.setItem('next', location.hash.slice(1)); return go('/login'); }
      return go(homeFor(S.user.role));
    }
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    afterRender = null;
    try {
      const html = await r.fn({ params, query });
      if (seq !== renderSeq || html == null) return;
      view.innerHTML = html;
    } catch (e) {
      if (seq !== renderSeq) return;
      if (e.status === 401) { S.user = null; return go('/login'); }
      console.error(e);
      view.innerHTML = `<div class="page"><div class="empty">${ic('close')}<p>${esc(e.message)}</p><button class="btn" data-act="reload">Повторить</button></div></div>`;
    }
    drawNav(path); hydrate(view);
    if (afterRender) afterRender();
    if (!opt.keep && !query.keep) window.scrollTo(0, 0);
    return;
  }
  go(homeFor(S.user?.role));
}
A.reload = () => render();
A.go = (el) => go(el.dataset.to);
A.back = () => (history.length > 1 ? history.back() : go(homeFor(S.user?.role)));

// отрисовка canvas-превью дизайнов
export function hydrate(root) {
  root.querySelectorAll('canvas[data-d],canvas[data-p]').forEach((c) => {
    let d = c.dataset.d ? dsg(c.dataset.d) : null;
    if (!d && c.dataset.p) { try { d = JSON.parse(c.dataset.p); } catch {} }
    if (!d) return;
    drawPreview(c, d, { shape: c.dataset.shape || undefined, length: c.dataset.length || undefined, single: c.dataset.single === '1' });
  });
}
export const thumb = (d, cls = '', o = {}) => `<canvas class="thumb ${cls}" ${d.id && dsg(d.id) ? `data-d="${d.id}"` : `data-p="${esc(JSON.stringify({ params: d.params || d, shape: d.shape, length: d.length, image: d.image }))}"`}${o.shape ? ` data-shape="${esc(o.shape)}"` : ''}${o.length ? ` data-length="${esc(o.length)}"` : ''}${o.single ? ' data-single="1"' : ''}></canvas>`;
export const avatar = (m, cls = '') => m.photo ? `<img class="ava ${cls}" src="${esc(m.photo)}" alt="">` : `<span class="ava ${cls}" style="--c:${esc(m.color || '#C98B8B')}">${esc(initials(m.name))}</span>`;
export const stars = (r) => `<span class="stars">${ic('star')}<b>${r ? Number(r).toFixed(1) : '—'}</b></span>`;

// ---------- навигация ----------
const NAV = {
  client: [['/', 'home', 'Главная'], ['/designs', 'grid', 'Дизайны'], ['/tryon', 'sparkle', 'Примерка'], ['/book', 'cal', 'Запись'], ['/me', 'user', 'Кабинет']],
  master: [['/m', 'cal', 'Расписание'], ['/m/clients', 'users', 'Клиенты'], ['/m/portfolio', 'image', 'Портфолио'], ['/m/profile', 'user', 'Профиль']],
  owner: [['/a', 'cal', 'Журнал'], ['/a/reports', 'chart', 'Отчёты'], ['/a/clients', 'users', 'Клиенты'], ['/a/manage', 'gear', 'Управление']],
};
function drawNav(path) {
  const role = S.user?.role || 'client', nav = document.getElementById('nav');
  const hide = path === '/login' || path === '/tryon';
  document.body.classList.toggle('no-nav', hide);
  document.body.dataset.role = role;
  const items = NAV[role];
  const act = [...items].sort((a, b) => b[0].length - a[0].length).find(([p]) => path === p || path.startsWith(p + '/'))?.[0];
  nav.innerHTML = `<div class="nav-brand"><span class="logo">${esc(S.boot.salon.name)}</span><small>${esc(S.boot.salon.tagline)}</small></div>` +
    items.map(([p, i, t]) => `<a href="#${p}" class="${p === act ? 'on' : ''} ${p === '/tryon' ? 'fab' : ''}">${ic(i)}<span>${t}</span>${p === '/me' && S.unread ? '<i class="dot"></i>' : ''}</a>`).join('');
}

// ---------- тосты и шторки ----------
export function toast(msg, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg;
  document.getElementById('toasts').append(t);
  setTimeout(() => t.classList.add('out'), 2800); setTimeout(() => t.remove(), 3200);
}
export function sheet(html, { wide = false } = {}) {
  closeSheet(true);
  const w = document.createElement('div'); w.className = 'sheet-wrap'; w.id = 'sheet';
  w.innerHTML = `<div class="sheet ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="sheet-x" data-act="closeSheet" aria-label="Закрыть">${ic('close')}</button>${html}</div>`;
  w.addEventListener('click', (e) => { if (e.target === w) closeSheet(); });
  document.body.append(w); document.body.classList.add('lock');
  requestAnimationFrame(() => w.classList.add('open'));
  hydrate(w);
  return w;
}
export function closeSheet(now) {
  const w = document.getElementById('sheet'); if (!w) return;
  document.body.classList.remove('lock');
  if (now === true) return w.remove();
  w.classList.remove('open'); w.id = ''; setTimeout(() => w.remove(), 220);
}
A.closeSheet = () => closeSheet();
export function confirmSheet(title, text, okLabel, danger) {
  return new Promise((res) => {
    sheet(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="row gap mt"><button class="btn ghost grow" data-act="cNo">Назад</button><button class="btn grow ${danger ? 'danger' : ''}" data-act="cYes">${esc(okLabel)}</button></div>`);
    A.cYes = () => { closeSheet(); res(true); }; A.cNo = () => { closeSheet(); res(false); };
  });
}
export const formData = (form) => Object.fromEntries(new FormData(form).entries());
export async function busy(el, fn) {
  if (el?.disabled) return; if (el) { el.disabled = true; el.classList.add('loading'); }
  try { return await fn(); } catch (e) { toast(e.message, 'err'); } finally { if (el) { el.disabled = false; el.classList.remove('loading'); } }
}
// файл изображения -> уменьшенный dataURL (jpeg)
export function fileToDataUrl(file, max = 1280, quality = 0.86) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => rej(new Error('Не удалось открыть изображение')); img.src = url;
  });
}

// ---------- делегирование событий ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = A[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
  fn(el, e);
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-submit]'); if (!f) return;
  e.preventDefault(); const fn = A[f.dataset.submit]; if (fn) fn(f, e);
});
for (const ev of ['input', 'change']) document.addEventListener(ev, (e) => {
  const el = e.target.closest(`[data-${ev}]`); if (!el) return;
  const fn = A[el.dataset[ev]]; if (fn) fn(el, e);
});
window.addEventListener('hashchange', () => { closeSheet(true); render(); });
