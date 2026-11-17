// Экраны клиента
import { S, A, api, route, go, render, after, sheet, closeSheet, confirmSheet, toast, busy, formData, loadBoot, homeFor,
  esc, money, ic, thumb, avatar, stars, svc, mst, dsg, promoFor, dHuman, dur, today, parseD, WD, WDF, plural, endTime, phoneFmt, hydrate } from './core.js';
import { SHAPES, LENGTHS, TYPES } from './nailart.js';

const head = (title, right = '', back = true) => `<header class="head">${back ? `<button class="icon-btn" data-act="back" aria-label="Назад">${ic('back')}</button>` : ''}<h1>${esc(title)}</h1><div class="head-r">${right}</div></header>`;
export { head };
const saveBook = () => { try { sessionStorage.setItem('book', JSON.stringify(S.book)); } catch {} };
try { S.book = JSON.parse(sessionStorage.getItem('book') || '{}'); } catch { S.book = {}; }
export const startBooking = (b, step) => { S.book = b; saveBook(); go('/book' + (step ? '?step=' + step : '')); };
const isFav = (id) => S.boot.favorites.includes(id);
const bell = () => `<a class="icon-btn" href="#/notifications" aria-label="Уведомления">${ic('bell')}${S.unread ? '<i class="dot"></i>' : ''}</a>`;

export const designCard = (d) => `<article class="dcard" data-act="design" data-id="${d.id}">
  <div class="dcard-img">${thumb(d)}${d.popular ? '<span class="tag hot">хит</span>' : ''}
    <button class="fav ${isFav(d.id) ? 'on' : ''}" data-act="fav" data-id="${d.id}" aria-label="В избранное">${ic('heart')}</button></div>
  <div class="dcard-t"><b>${esc(d.name)}</b><small>${esc(d.style || '')}${d.extra ? ' · +' + money(d.extra) : ''}</small></div></article>`;

export const STATUS = { booked: ['Ожидается', 'ok'], done: ['Завершена', 'done'], cancelled: ['Отменена', 'off'], noshow: ['Неявка', 'off'] };
export const designLine = (a) => a.design ? `<div class="a-design">${thumb({ id: a.design_id, params: a.design_params, image: a.design_image }, 'xs', { shape: a.tryon?.shape, length: a.tryon?.length })}
  <span>Дизайн: <b>${esc(a.design)}</b>${a.tryon?.shape ? `<small> · ${esc(SHAPES[a.tryon.shape] || '')}, ${esc((LENGTHS[a.tryon.length] || '').toLowerCase())}</small>` : ''}</span></div>`
  : a.tryon?.color ? `<div class="a-design"><i class="swatch" style="background:${esc(a.tryon.color)}"></i><span>Цвет из примерки${a.tryon.shape ? ` · ${esc(SHAPES[a.tryon.shape] || '')}, ${esc((LENGTHS[a.tryon.length] || '').toLowerCase())}` : ''}</span></div>` : '';

// ---------- Главная ----------
route('/', async () => {
  const b = S.boot, u = S.user;
  let next = null;
  if (u?.role === 'client') { const r = await api('/api/my/appointments'); next = r.items.filter((a) => a.status === 'booked' && a.date >= today()).pop(); }
  const cats = [...new Set(b.services.map((s) => s.category))];
  return `<div class="page home">
    <header class="hero">
      <div class="hero-top"><div><div class="logo big">${esc(b.salon.name)}</div><small>${esc(b.salon.tagline)}</small></div>${u ? bell() : `<a class="btn sm soft" href="#/login">Войти</a>`}</div>
      <h2 class="hero-h">${u ? `${esc(u.name.split(' ')[0])}, примерьте` : 'Примерьте'} маникюр<br><em>до визита в салон</em></h2>
      <p>Наведите камеру на руку — и выберите цвет, форму и дизайн. Потом запишитесь в два касания.</p>
      <div class="row gap"><a class="btn grow" href="#/tryon">${ic('sparkle')} Примерить</a><a class="btn ghost grow" href="#/book" data-act="newBook">${ic('cal')} Записаться</a></div>
    </header>
    ${next ? `<section><div class="card next" data-act="go" data-to="/me"><div class="next-d"><b>${parseD(next.date).getDate()}</b><small>${WD[parseD(next.date).getDay()]}</small></div>
      <div class="grow"><small class="muted">Ближайшая запись · ${esc(dHuman(next.date, false))}</small><b>${esc(next.time)} · ${esc(next.service)}</b><small>Мастер ${esc(next.master)}</small></div>${ic('right')}</div></section>` : ''}
    ${b.promos.length ? `<section><div class="hscroll">${b.promos.map((p) => `<div class="promo" data-act="bookService" data-id="${p.service_id || ''}"><span class="promo-p">−${p.percent}%</span><b>${esc(p.title)}</b><small>${esc(p.description)}</small><small class="muted">до ${esc(dHuman(p.date_to, false))}</small></div>`).join('')}</div></section>` : ''}
    <section><div class="sec-h"><h3>Популярные дизайны</h3><a href="#/designs">Все ${b.designs.length}</a></div>
      <div class="hscroll">${b.designs.filter((d) => d.popular).slice(0, 10).map(designCard).join('')}</div></section>
    <section><div class="sec-h"><h3>Услуги</h3><a href="#/services">Прайс</a></div>
      <div class="cats">${cats.map((c) => { const ss = b.services.filter((s) => s.category === c); return `<a class="cat" href="#/services?cat=${encodeURIComponent(c)}"><b>${esc(c)}</b><small>от ${money(Math.min(...ss.map((s) => s.price)))}</small></a>`; }).join('')}</div></section>
    <section><div class="sec-h"><h3>Мастера</h3><a href="#/masters">Все</a></div>
      <div class="hscroll">${b.masters.map((m) => `<a class="mcard" href="#/masters/${m.id}">${avatar(m, 'lg')}<b>${esc(m.name.split(' ')[0])}</b><small>${esc(m.title)}</small>${stars(m.rating)}</a>`).join('')}</div></section>
    <section><div class="card info"><div>${ic('pin')}<span>${esc(b.salon.address)}</span></div><div>${ic('clock')}<span>${esc(b.salon.hours)}</span></div>
      ${b.salon.phone ? `<div>${ic('phone')}<a href="tel:${esc(b.salon.phone.replace(/[^+\d]/g, ''))}">${esc(b.salon.phone)}</a></div>` : ''}</div>
      <div class="row gap mt"><a class="btn soft grow" href="#/me/gift">${ic('gift')} Сертификат</a><a class="btn soft grow" href="#/me/bonus">${ic('percent')} Бонусы</a></div></section>
  </div>`;
});
A.newBook = () => startBooking({});
A.bookService = (el) => startBooking(el.dataset.id ? { service_id: +el.dataset.id } : {}, el.dataset.id ? 2 : 1);
A.bookMaster = (el) => startBooking({ master_id: +el.dataset.id, masterFixed: true });

// ---------- Каталог дизайнов ----------
const F = { color: '', style: '', season: '', fav: false };
const COLORS = { 'нюд': '#EBCFC2', 'розовый': '#F2A7B8', 'красный': '#B3202A', 'белый': '#FFFFFF', 'чёрный': '#1B181D', 'синий': '#1F3A8A', 'голубой': '#A9D3EE', 'зелёный': '#2E8B6A', 'фиолетовый': '#9B7BD8', 'оранжевый': '#F28C4B', 'жёлтый': '#F6DE6A', 'золото': '#D4AF6A', 'серебро': '#C9CDD6', 'мульти': 'conic-gradient(#f7a8c4,#7ec8e3,#f6e27a,#f7a8c4)' };
export { COLORS };
route('/designs', async ({ query }) => {
  if (query.fav) F.fav = true;
  const all = S.boot.designs;
  const uniq = (k) => [...new Set(all.map((d) => d[k]).filter(Boolean))];
  const list = all.filter((d) => (!F.color || d.color === F.color) && (!F.style || d.style === F.style) && (!F.season || d.season === F.season) && (!F.fav || isFav(d.id)));
  const chips = (k, vals, label) => `<div class="chips"><span class="chips-l">${label}</span>${vals.map((v) => `<button class="chip ${F[k] === v ? 'on' : ''}" data-act="dFilter" data-k="${k}" data-v="${esc(v)}">${k === 'color' ? `<i class="swatch" style="background:${COLORS[v] || '#ddd'}"></i>` : ''}${esc(v)}</button>`).join('')}</div>`;
  const active = F.color || F.style || F.season || F.fav;
  return `<div class="page">${head('Каталог дизайнов', `<button class="icon-btn ${F.fav ? 'on' : ''}" data-act="dFav" aria-label="Избранное" aria-pressed="${F.fav}">${ic('heart')}</button>`, false)}
    <div class="filters">${chips('color', uniq('color'), 'Цвет')}${chips('style', uniq('style'), 'Стиль')}${chips('season', uniq('season'), 'Сезон')}</div>
    <div class="row between list-meta"><small class="muted">${F.fav ? 'Избранное · ' : ''}${plural(list.length, 'дизайн', 'дизайна', 'дизайнов')}</small>${active ? '<button class="link" data-act="dReset">Сбросить</button>' : ''}</div>
    ${list.length ? `<div class="dgrid">${list.map(designCard).join('')}</div>` : `<div class="empty">${ic('heart')}<p>${F.fav ? 'В избранном пока пусто. Нажмите на сердечко у понравившегося дизайна.' : 'Нет дизайнов с такими фильтрами.'}</p><button class="btn soft" data-act="dReset">Показать все</button></div>`}
  </div>`;
});
A.dFilter = (el) => { const { k, v } = el.dataset; F[k] = F[k] === v ? '' : v; render({ keep: true }); };
A.dFav = () => { if (!S.user) return needAuth('Войдите, чтобы сохранять избранное'); F.fav = !F.fav; render({ keep: true }); };
A.dReset = () => { Object.assign(F, { color: '', style: '', season: '', fav: false }); render(); };
A.fav = async (el, e) => {
  e.stopPropagation();
  if (!S.user) return needAuth('Войдите, чтобы сохранять избранное');
  const id = +el.dataset.id;
  try {
    const r = await api('/api/favorites/' + id, { method: 'POST' });
    S.boot.favorites = r.favorite ? [...S.boot.favorites, id] : S.boot.favorites.filter((x) => x !== id);
    document.querySelectorAll(`.fav[data-id="${id}"]`).forEach((b) => b.classList.toggle('on', r.favorite));
    toast(r.favorite ? 'Добавлено в избранное' : 'Убрано из избранного');
  } catch (err) { toast(err.message, 'err'); }
};
A.design = (el) => {
  const d = dsg(el.dataset.id); if (!d) return;
  sheet(`<div class="dsheet"><div class="dsheet-img">${thumb(d, 'big')}</div>
    <h3>${esc(d.name)}</h3>
    <div class="tags"><span class="tag">${esc(TYPES[d.params.type] || 'Дизайн')}</span>${[d.color, d.style, d.season].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <p class="muted">Рекомендуем: форма «${esc(SHAPES[d.shape] || '')}», длина — ${esc((LENGTHS[d.length] || '').toLowerCase())}. ${d.extra ? `Доплата за дизайн: <b>${money(d.extra)}</b> к стоимости услуги.` : 'Входит в стоимость покрытия.'}</p>
    <div class="col gap"><a class="btn" href="#/tryon?design=${d.id}">${ic('sparkle')} Примерить на свою руку</a>
    <div class="row gap"><button class="btn ghost grow" data-act="bookDesign" data-id="${d.id}">${ic('cal')} Записаться с этим дизайном</button>
    <button class="btn soft fav ${isFav(d.id) ? 'on' : ''}" data-act="fav" data-id="${d.id}" aria-label="В избранное">${ic('heart')}</button></div></div></div>`);
};
A.bookDesign = (el) => { const d = dsg(el.dataset.id); closeSheet(true); startBooking({ ...(S.book.service_id && !S.book.resched ? S.book : {}), design_id: d.id, tryon: { shape: d.shape, length: d.length } }, S.book.pickDesign ? 4 : 1); };

// ---------- Услуги ----------
route('/services', async ({ query }) => {
  const cats = [...new Set(S.boot.services.map((s) => s.category))];
  return `<div class="page">${head('Услуги и цены')}
    ${cats.map((c) => `<section id="cat-${esc(c)}"><h3 class="sec-t">${esc(c)}</h3><div class="card list">${S.boot.services.filter((s) => s.category === c).map((s) => { const p = promoFor(s.id); return `
      <div class="item" data-act="bookService" data-id="${s.id}"><div class="grow"><b>${esc(s.name)}</b>${p ? ` <span class="tag hot">−${p.percent}%</span>` : ''}<small class="muted">${esc(s.description)}</small><small>${ic('clock')} ${dur(s.duration)}</small></div>
      <div class="price">${p ? `<s>${money(s.price)}</s>` : ''}<b>${money(p ? Math.round(s.price * (100 - p.percent) / 100) : s.price)}</b><span class="btn sm soft">Записаться</span></div></div>`; }).join('')}</div></section>`).join('')}
    <p class="muted center small">Доплата за дизайн зависит от сложности и указана в каталоге дизайнов.</p></div>`;
});

// ---------- Мастера ----------
route('/masters', async () => `<div class="page">${head('Наши мастера')}
  <div class="col gap">${S.boot.masters.map((m) => `<a class="card mrow" href="#/masters/${m.id}">${avatar(m, 'lg')}<div class="grow"><b>${esc(m.name)}</b><small class="muted">${esc(m.title)} · стаж ${plural(m.experience, 'год', 'года', 'лет')}</small>
    <div class="row gap">${stars(m.rating)}<small class="muted">${plural(m.reviews, 'отзыв', 'отзыва', 'отзывов')}</small></div></div>${ic('right')}</a>`).join('')}</div></div>`);
route('/masters/:id', async ({ params, query }) => {
  const m = mst(params.id); if (!m) return go('/masters');
  const d = await api('/api/masters/' + m.id);
  const tab = query.tab || 'portfolio';
  const work = m.schedule.filter((s) => !s.off).map((s) => WD[s.weekday]);
  return `<div class="page">${head('Мастер')}
    <div class="mhero">${avatar(m, 'xl')}<h2>${esc(m.name)}</h2><p class="muted">${esc(m.title)} · стаж ${plural(m.experience, 'год', 'года', 'лет')}</p>
      <div class="row gap center">${stars(m.rating)}<small class="muted">${plural(m.reviews, 'отзыв', 'отзыва', 'отзывов')}</small></div>
      <p>${esc(m.bio)}</p><small class="muted">Работает: ${[1, 2, 3, 4, 5, 6, 0].filter((w) => work.includes(WD[w])).map((w) => WD[w]).join(', ')}</small>
      <button class="btn block mt" data-act="bookMaster" data-id="${m.id}">${ic('cal')} Записаться к мастеру</button></div>
    <div class="seg"><a class="${tab === 'portfolio' ? 'on' : ''}" href="#/masters/${m.id}?tab=portfolio&keep=1">Портфолио · ${d.portfolio.length}</a><a class="${tab === 'reviews' ? 'on' : ''}" href="#/masters/${m.id}?tab=reviews&keep=1">Отзывы · ${d.reviews.length}</a><a class="${tab === 'services' ? 'on' : ''}" href="#/masters/${m.id}?tab=services&keep=1">Услуги</a></div>
    ${tab === 'portfolio' ? (d.portfolio.length ? `<div class="pgrid">${d.portfolio.map((p) => portfolioItem(p)).join('')}</div>` : '<div class="empty"><p>Портфолио скоро появится</p></div>') : ''}
    ${tab === 'reviews' ? (d.reviews.length ? `<div class="col gap">${d.reviews.map((r) => `<div class="card review"><div class="row between"><b>${esc(r.client)}</b><span class="rate">${'★'.repeat(r.rating)}<i>${'★'.repeat(5 - r.rating)}</i></span></div><p>${esc(r.text)}</p><small class="muted">${esc(r.service || '')} · ${esc(dHuman(r.created_at.slice(0, 10), false))}</small></div>`).join('')}</div>` : '<div class="empty"><p>Пока нет отзывов</p></div>') : ''}
    ${tab === 'services' ? `<div class="card list">${m.services.map(svc).filter(Boolean).map((s) => `<div class="item" data-act="bookMS" data-m="${m.id}" data-id="${s.id}"><div class="grow"><b>${esc(s.name)}</b><small class="muted">${dur(s.duration)}</small></div><div class="price"><b>${money(s.price)}</b></div></div>`).join('')}</div>` : ''}
  </div>`;
});
export const portfolioItem = (p, del = false) => { const d = p.design_id ? dsg(p.design_id) : null;
  return `<div class="pitem" ${d && !del ? `data-act="design" data-id="${d.id}"` : ''}>${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title || 'Работа мастера')}" loading="lazy">` : d ? thumb(d) : ''}
    ${d || p.title ? `<small>${esc(p.title || d.name)}</small>` : ''}${del ? `<button class="pdel" data-act="pDel" data-id="${p.id}" aria-label="Удалить">${ic('trash')}</button>` : ''}</div>`; };
A.bookMS = (el) => startBooking({ master_id: +el.dataset.m, masterFixed: true, service_id: +el.dataset.id }, 3);

// ---------- Запись ----------
const STEPS = ['Услуга', 'Мастер', 'Время', 'Подтверждение'];
route('/book', async ({ query }) => {
  const b = S.book; let step = +query.step || 1;
  if (S.user && S.user.role !== 'client') return `<div class="page">${head('Запись')}<div class="empty">${ic('cal')}<p>Онлайн-запись предназначена для клиентов. ${S.user.role === 'owner' ? 'Чтобы записать клиента, откройте Журнал и нажмите «+».' : ''}</p><a class="btn" href="#${homeFor(S.user.role)}">Перейти в кабинет</a></div></div>`;
  if (step > 1 && !b.service_id) step = 1;
  if (step > 3 && (!b.date || !b.time)) step = 3;
  if (b.resched) step = 3;
  const s = svc(b.service_id), m = b.master_id ? mst(b.master_id) : null, d = b.design_id ? dsg(b.design_id) : null;
  const top = `<header class="head"><button class="icon-btn" data-act="${step === 1 || b.resched ? 'back' : 'bookBack'}" data-step="${step}" aria-label="Назад">${ic('back')}</button><h1>${b.resched ? 'Перенос записи' : 'Онлайн-запись'}</h1><div class="head-r"></div></header>
    ${b.resched ? '' : `<ol class="steps">${STEPS.map((t, i) => `<li class="${i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}"><i>${i + 1 < step ? ic('check') : i + 1}</i><span>${t}</span></li>`).join('')}</ol>`}
    ${d && step < 4 ? `<div class="card dnote">${thumb(d, 'xs')}<span>Дизайн «${esc(d.name)}» будет добавлен к записи</span></div>` : ''}`;

  if (step === 1) {
    const allowed = b.masterFixed && m ? m.services : null;
    const list = S.boot.services.filter((x) => !allowed || allowed.includes(x.id));
    const cats = [...new Set(list.map((x) => x.category))];
    return `<div class="page">${top}${b.masterFixed && m ? `<p class="muted">Услуги мастера ${esc(m.name)}</p>` : ''}
      ${cats.map((c) => `<h3 class="sec-t">${esc(c)}</h3><div class="card list">${list.filter((x) => x.category === c).map((x) => { const p = promoFor(x.id); return `
        <button class="item ${b.service_id === x.id ? 'sel' : ''}" data-act="bSvc" data-id="${x.id}"><div class="grow"><b>${esc(x.name)}</b>${p ? ` <span class="tag hot">−${p.percent}%</span>` : ''}<small class="muted">${dur(x.duration)}</small></div><div class="price"><b>${money(x.price)}</b></div></button>`; }).join('')}</div>`).join('')}</div>`;
  }
  if (step === 2) {
    const ms = S.boot.masters.filter((x) => x.services.includes(s.id));
    return `<div class="page">${top}<p class="muted">${esc(s.name)} · ${dur(s.duration)}</p>
      <div class="col gap"><button class="card mrow ${!b.master_id ? 'sel' : ''}" data-act="bMst" data-id="0"><span class="ava lg any">${ic('users')}</span><div class="grow"><b>Любой свободный мастер</b><small class="muted">Больше всего свободного времени</small></div>${ic('right')}</button>
      ${ms.map((x) => `<button class="card mrow ${b.master_id === x.id ? 'sel' : ''}" data-act="bMst" data-id="${x.id}">${avatar(x, 'lg')}<div class="grow"><b>${esc(x.name)}</b><small class="muted">${esc(x.title)}</small><div class="row gap">${stars(x.rating)}<small class="muted">${plural(x.reviews, 'отзыв', 'отзыва', 'отзывов')}</small></div></div>${ic('right')}</button>`).join('')}</div></div>`;
  }
  if (step === 3) {
    const qs = `service_id=${s.id}&master_id=${b.master_id || 0}${b.resched ? '&exclude=' + b.resched : ''}`;
    const { days } = await api('/api/days?' + qs);
    if (!b.date || !days.find((x) => x.date === b.date && x.free)) b.date = days.find((x) => x.free)?.date || null;
    const slots = b.date ? (await api(`/api/slots?${qs}&date=${b.date}`)).slots : [];
    const grp = [['Утро', (t) => t < '12:00'], ['День', (t) => t >= '12:00' && t < '17:00'], ['Вечер', (t) => t >= '17:00']];
    after(() => document.querySelector('.day.on')?.scrollIntoView({ inline: 'center', block: 'nearest' }));
    return `<div class="page">${top}<p class="muted">${esc(s.name)} · ${m ? esc(m.name) : 'любой мастер'}</p>
      <div class="days">${days.map((x) => { const dt = parseD(x.date); return `<button class="day ${x.date === b.date ? 'on' : ''}" ${x.free ? '' : 'disabled'} data-act="bDate" data-d="${x.date}"><small>${WD[dt.getDay()]}</small><b>${dt.getDate()}</b><i>${x.free ? '' : 'нет'}</i></button>`; }).join('')}</div>
      ${b.date ? `<h3 class="sec-t">${esc(dHuman(b.date))}</h3>${grp.map(([t, f]) => { const g = slots.filter((x) => f(x.time)); return g.length ? `<small class="muted">${t}</small><div class="slots">${g.map((x) => `<button class="slot ${b.time === x.time ? 'on' : ''}" data-act="bTime" data-t="${x.time}">${x.time}</button>`).join('')}</div>` : ''; }).join('')}`
      : `<div class="empty">${ic('cal')}<p>На ближайшие три недели свободного времени нет. Попробуйте выбрать другого мастера.</p><a class="btn soft" href="#/book?step=2">Выбрать мастера</a></div>`}</div>`;
  }
  // шаг 4
  const pr = await api(`/api/price?service_id=${s.id}&design_id=${b.design_id || 0}&date=${b.date}`);
  const client = S.user?.role === 'client';
  let rest = pr.price - pr.discount;
  const maxBonus = client ? Math.min(S.user.bonus, Math.floor(rest * S.boot.settings.bonus_max_pay_pct / 100)) : 0;
  const bonus = b.use_bonus ? maxBonus : 0; rest -= bonus;
  const cert = b.cert ? Math.min(b.cert.balance, rest) : 0; rest -= cert;
  const earn = client ? Math.round((pr.price - pr.discount - bonus) * S.user.level.pct / 100) : 0;
  return `<div class="page">${top}
    <div class="card sum"><div class="sum-row">${ic('cal')}<div><b>${esc(dHuman(b.date))}, ${esc(b.time)}–${endTime(b.time, s.duration)}</b><small class="muted">${dur(s.duration)}</small></div><a class="link" href="#/book?step=3">Изменить</a></div>
      <div class="sum-row">${ic('brush')}<div><b>${esc(s.name)}</b><small class="muted">${money(s.price)}</small></div><a class="link" href="#/book?step=1">Изменить</a></div>
      <div class="sum-row">${m ? avatar(m, 'sm') : ic('users')}<div><b>${m ? esc(m.name) : 'Любой свободный мастер'}</b><small class="muted">${m ? esc(m.title) : 'Назначим при подтверждении'}</small></div><a class="link" href="#/book?step=2">Изменить</a></div></div>
    <h3 class="sec-t">Дизайн</h3>
    ${d ? `<div class="card drow">${thumb(d, 'sm', { shape: b.tryon?.shape, length: b.tryon?.length })}<div class="grow"><b>${esc(d.name)}</b><small class="muted">${b.tryon?.shape ? `${esc(SHAPES[b.tryon.shape])}, ${esc(LENGTHS[b.tryon.length]?.toLowerCase())} · ` : ''}${d.extra ? '+' + money(d.extra) : 'без доплаты'}</small>${b.snapshot ? '<small class="ok-t">Фото примерки увидит мастер</small>' : ''}</div><button class="icon-btn" data-act="bNoDesign" aria-label="Убрать дизайн">${ic('close')}</button></div>`
      : b.tryon?.color ? `<div class="card drow"><i class="swatch big" style="background:${esc(b.tryon.color)}"></i><div class="grow"><b>Свой цвет из примерки</b><small class="muted">${esc(SHAPES[b.tryon.shape] || '')}, ${esc(LENGTHS[b.tryon.length]?.toLowerCase() || '')}</small></div><button class="icon-btn" data-act="bNoDesign" aria-label="Убрать">${ic('close')}</button></div>`
      : `<div class="row gap"><button class="btn soft grow" data-act="bPickDesign">${ic('grid')} Из каталога</button><a class="btn soft grow" href="#/tryon?book=1">${ic('sparkle')} Примерить</a></div>`}
    <label class="field mt"><span>Пожелания мастеру</span><textarea rows="2" maxlength="400" data-input="bComment" placeholder="Например: хочу покороче, чувствительная кутикула">${esc(b.comment || '')}</textarea></label>
    ${client ? `<h3 class="sec-t">Оплата бонусами и сертификатом</h3>
      <label class="card switch"><div class="grow"><b>Списать бонусы</b><small class="muted">Доступно ${maxBonus} из ${S.user.bonus} (до ${S.boot.settings.bonus_max_pay_pct}% стоимости)</small></div><input type="checkbox" data-change="bBonus" ${b.use_bonus ? 'checked' : ''} ${maxBonus ? '' : 'disabled'}><i></i></label>
      ${b.cert ? `<div class="card drow">${ic('gift')}<div class="grow"><b>Сертификат ${esc(b.cert.code)}</b><small class="muted">Остаток ${money(b.cert.balance)}</small></div><button class="icon-btn" data-act="bNoCert" aria-label="Убрать сертификат">${ic('close')}</button></div>`
        : `<form class="row gap" data-submit="bCert"><input class="inp grow" name="code" placeholder="Код подарочного сертификата" autocomplete="off"><button class="btn soft">Применить</button></form>`}` : ''}
    <div class="card total"><div class="row between"><span>${esc(s.name)}</span><span>${money(s.price)}</span></div>
      ${d?.extra ? `<div class="row between"><span>Дизайн «${esc(d.name)}»</span><span>+${money(d.extra)}</span></div>` : ''}
      ${pr.discount ? `<div class="row between ok-t"><span>Акция «${esc(pr.promo.title)}» −${pr.promo.percent}%</span><span>−${money(pr.discount)}</span></div>` : ''}
      ${bonus ? `<div class="row between ok-t"><span>Бонусы</span><span>−${money(bonus)}</span></div>` : ''}${cert ? `<div class="row between ok-t"><span>Сертификат</span><span>−${money(cert)}</span></div>` : ''}
      <div class="row between total-r"><b>К оплате в салоне</b><b>${money(rest)}</b></div>${earn ? `<small class="muted">После визита начислим +${earn} бонусов (${S.user.level.pct}%, уровень «${esc(S.user.level.name)}»)</small>` : ''}</div>
    <div class="sticky-cta">${client ? `<button class="btn block" data-act="bSubmit">Подтвердить запись</button>` : `<button class="btn block" data-act="bAuth">Войти и записаться</button>`}
      <small class="muted center">Перенести или отменить запись можно в личном кабинете</small></div></div>`;
});
A.bookBack = (el) => go('/book?step=' + (+el.dataset.step - 1));
A.bSvc = (el) => { const b = S.book; b.service_id = +el.dataset.id; b.time = null; if (b.master_id && !mst(b.master_id).services.includes(b.service_id)) { b.master_id = 0; b.masterFixed = false; } saveBook(); go('/book?step=' + (b.masterFixed ? 3 : 2)); };
A.bMst = (el) => { S.book.master_id = +el.dataset.id; S.book.time = null; saveBook(); go('/book?step=3'); };
A.bDate = (el) => { S.book.date = el.dataset.d; S.book.time = null; saveBook(); render({ keep: true }); };
A.bTime = async (el) => {
  const b = S.book; b.time = el.dataset.t; saveBook();
  if (!b.resched) return go('/book?step=4');
  if (!(await confirmSheet('Перенести запись?', `Новое время: ${dHuman(b.date)}, ${b.time}`, 'Перенести'))) return;
  try { await api(`/api/appointments/${b.resched}/reschedule`, { body: { date: b.date, time: b.time } }); S.book = {}; saveBook(); toast('Запись перенесена'); go('/me'); }
  catch (e) { toast(e.message, 'err'); render({ keep: true }); }
};
A.bComment = (el) => { S.book.comment = el.value; saveBook(); };
A.bBonus = (el) => { S.book.use_bonus = el.checked; saveBook(); render({ keep: true }); };
A.bNoDesign = () => { delete S.book.design_id; delete S.book.tryon; delete S.book.snapshot; saveBook(); render({ keep: true }); };
A.bNoCert = () => { delete S.book.cert; saveBook(); render({ keep: true }); };
A.bPickDesign = () => { S.book.pickDesign = true; saveBook(); go('/designs'); toast('Выберите дизайн и нажмите «Записаться с этим дизайном»'); };
A.bCert = (f) => busy(f.querySelector('button'), async () => { const code = formData(f).code.trim(); if (!code) return; const r = await api('/api/certificates/check?code=' + encodeURIComponent(code)); S.book.cert = r.certificate; saveBook(); render({ keep: true }); });
A.bAuth = () => needAuth('Войдите или зарегистрируйтесь — это займёт минуту', true);
A.bSubmit = (el) => busy(el, async () => {
  const b = S.book;
  const r = await api('/api/appointments', { body: { service_id: b.service_id, master_id: b.master_id || 0, date: b.date, time: b.time, design_id: b.design_id, tryon: b.tryon, snapshot: b.snapshot, comment: b.comment, use_bonus: b.use_bonus, cert_code: b.cert?.code } });
  S.book = {}; saveBook(); S.lastAppt = r.appointment; await loadBoot(); go('/book/done');
}).then(() => { if (location.hash.startsWith('#/book?')) render({ keep: true }); });
route('/book/done', async () => {
  const a = S.lastAppt; if (!a) return go('/me');
  const canN = 'Notification' in window && Notification.permission === 'default';
  return `<div class="page okpage"><div class="done-ic">${ic('check')}</div><h2>Вы записаны!</h2><p class="muted">Ждём вас в студии «${esc(S.boot.salon.name)}»</p>
    <div class="card sum"><div class="sum-row">${ic('cal')}<div><b>${esc(dHuman(a.date))}, ${esc(a.time)}</b><small class="muted">${esc(a.service)} · ${dur(a.duration)}</small></div></div>
    <div class="sum-row">${ic('user')}<div><b>${esc(a.master)}</b><small class="muted">${esc(S.boot.salon.address)}</small></div></div>${a.design ? `<div class="sum-row">${ic('sparkle')}<div><b>Дизайн «${esc(a.design)}»</b><small class="muted">Мастер подготовит материалы заранее</small></div></div>` : ''}
    <div class="sum-row">${ic('bell')}<div><b>Напомним за сутки и за 2 часа</b><small class="muted">К оплате в салоне: ${money(a.pay)}</small></div></div></div>
    <div class="col gap mt">${canN ? `<button class="btn soft" data-act="askNotify">${ic('bell')} Включить уведомления на этом устройстве</button>` : ''}
    <button class="btn soft" data-act="ics" data-id="${a.id}">${ic('download')} Добавить в календарь</button><a class="btn" href="#/me">Мои записи</a></div></div>`;
});
A.askNotify = async (el) => { const p = await Notification.requestPermission(); toast(p === 'granted' ? 'Уведомления включены' : 'Уведомления не разрешены в браузере'); el.remove(); };
const apptCache = new Map();
A.ics = (el) => {
  const a = apptCache.get(+el.dataset.id) || S.lastAppt; if (!a) return;
  const f = (d, t) => d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rustyle//RU', 'BEGIN:VEVENT', `UID:appt-${a.id}@rustyle`, `DTSTART:${f(a.date, a.time)}`, `DTEND:${f(a.date, endTime(a.time, a.duration))}`,
    `SUMMARY:${a.service} — студия «${S.boot.salon.name}»`, `DESCRIPTION:Мастер ${a.master}`, `LOCATION:${S.boot.salon.address}`, 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Маникюр через 2 часа', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); l.download = 'zapis-rustyle.ics'; l.click();
};

// ---------- Вход ----------
const authForm = (mode, inSheet) => `<div class="seg"><button class="${mode === 'login' ? 'on' : ''}" data-act="authTab" data-m="login" data-s="${inSheet ? 1 : ''}">Вход</button><button class="${mode === 'reg' ? 'on' : ''}" data-act="authTab" data-m="reg" data-s="${inSheet ? 1 : ''}">Регистрация</button></div>
  <form class="col gap" data-submit="${mode === 'login' ? 'doLogin' : 'doReg'}" data-s="${inSheet ? 1 : ''}">
  ${mode === 'reg' ? `<label class="field"><span>Имя</span><input class="inp" name="name" required autocomplete="name" placeholder="Как к вам обращаться"></label>
    <label class="field"><span>Телефон</span><input class="inp" name="phone" type="tel" required autocomplete="tel" placeholder="+7 900 000-00-00"></label>`
    : `<label class="field"><span>Телефон или e-mail</span><input class="inp" name="login" required autocomplete="username" placeholder="+7 900 000-00-00"></label>`}
  <label class="field"><span>Пароль</span><input class="inp" name="password" type="password" required minlength="6" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" placeholder="Не короче 6 символов"></label>
  <button class="btn block">${mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
  ${mode === 'reg' ? `<small class="muted center">Дарим ${S.boot.settings.welcome_bonus} приветственных бонусов</small>` : ''}</form>
  ${S.boot.demo && !inSheet ? `<div class="demo"><small class="muted">Демо-вход одним нажатием</small><div class="row gap"><button class="btn soft sm grow" data-act="demo" data-r="client">Клиент</button><button class="btn soft sm grow" data-act="demo" data-r="master">Мастер</button><button class="btn soft sm grow" data-act="demo" data-r="owner">Владелец</button></div></div>` : ''}`;
route('/login', async () => {
  if (S.user) return go(homeFor(S.user.role));
  return `<div class="page login"><a class="icon-btn" href="#/" aria-label="На главную">${ic('close')}</a><div class="logo big">${esc(S.boot.salon.name)}</div><p class="muted center">${esc(S.boot.salon.tagline)}</p><div class="card" id="auth">${authForm('login')}</div></div>`;
});
function needAuth(msg, stay) {
  S.authStay = stay;
  sheet(`<h3>Вход</h3><p class="muted">${esc(msg)}</p><div id="auth">${authForm(stay ? 'reg' : 'login', true)}</div>`);
}
A.authTab = (el) => { document.getElementById('auth').innerHTML = authForm(el.dataset.m, !!el.dataset.s); };
async function afterAuth(inSheet) {
  await loadBoot(); window.dispatchEvent(new Event('auth'));
  if (inSheet) { closeSheet(true); if (S.user.role !== 'client') return go(homeFor(S.user.role)); toast(`Здравствуйте, ${S.user.name.split(' ')[0]}!`); return render({ keep: true }); }
  const next = sessionStorage.getItem('next'); sessionStorage.removeItem('next');
  go(S.user.role === 'client' && next && !/^\/(a|m)(\/|$)/.test(next) ? next : homeFor(S.user.role));
}
A.doLogin = (f) => busy(f.querySelector('button'), async () => { await api('/api/auth/login', { body: formData(f) }); await afterAuth(!!f.dataset.s); });
A.doReg = (f) => busy(f.querySelector('button'), async () => { await api('/api/auth/register', { body: formData(f) }); await afterAuth(!!f.dataset.s); });
const DEMO = { client: ['client@rustyle.demo', 'client123'], master: ['master@rustyle.demo', 'master123'], owner: ['owner@rustyle.demo', 'owner123'] };
A.demo = (el) => busy(el, async () => { const [login, password] = DEMO[el.dataset.r]; await api('/api/auth/login', { body: { login, password } }); await afterAuth(false); });
A.logout = async () => { await api('/api/auth/logout', { method: 'POST' }); S.book = {}; saveBook(); S.unread = 0; await loadBoot(); go('/'); toast('Вы вышли из аккаунта'); };

// ---------- Кабинет ----------
const apptCard = (a) => { apptCache.set(a.id, a); const st = STATUS[a.status], future = a.status === 'booked';
  return `<div class="card appt ${a.status}"><div class="row between"><b>${esc(dHuman(a.date))}, ${esc(a.time)}</b><span class="badge ${st[1]}">${st[0]}</span></div>
    <div class="appt-b"><b>${esc(a.service)}</b><small class="muted">Мастер ${esc(a.master)} · ${dur(a.duration)}</small>${designLine(a)}${a.comment ? `<small class="muted">«${esc(a.comment)}»</small>` : ''}</div>
    <div class="row between"><span class="muted small">${a.status === 'done' && a.bonus_earned ? `+${a.bonus_earned} бонусов` : ''}</span><b>${money(a.pay)}</b></div>
    <div class="row gap wrap">${future ? `<button class="btn soft sm grow" data-act="resched" data-id="${a.id}">Перенести</button><button class="btn ghost sm" data-act="ics" data-id="${a.id}" aria-label="В календарь">${ic('download')}</button><button class="btn ghost sm danger-t" data-act="cancelAppt" data-id="${a.id}">Отменить</button>` : ''}
      ${a.status === 'done' && !a.review ? `<button class="btn soft sm grow" data-act="review" data-id="${a.id}">${ic('star')} Оставить отзыв</button>` : ''}${a.status === 'done' && a.review ? `<span class="rate">${'★'.repeat(a.review)}</span>` : ''}
      ${!future ? `<button class="btn ghost sm grow" data-act="repeat" data-id="${a.id}">Повторить</button>` : ''}</div></div>`; };
route('/me', async ({ query }) => {
  const u = S.user, { items } = await api('/api/my/appointments');
  const up = items.filter((a) => a.status === 'booked').reverse(), hist = items.filter((a) => a.status !== 'booked');
  const tab = query.tab || 'up', L = u.level;
  return `<div class="page">${head('Кабинет', bell(), false)}
    <a class="card loyal" href="#/me/bonus"><div class="row between"><div><small>Карта лояльности · ${esc(L.name)}</small><b class="loyal-b">${u.bonus.toLocaleString('ru-RU')}</b><small>бонусов · кэшбэк ${L.pct}%</small></div><div class="loyal-n">${esc(u.name)}<small>${esc(phoneFmt(u.phone))}</small></div></div>
      ${L.next ? `<div class="bar"><i style="width:${Math.min(100, Math.round(u.total_spent / L.next.from * 100))}%"></i></div><small>До уровня «${esc(L.next.name)}» (${L.next.pct}%) — ${money(L.next.from - u.total_spent)}</small>` : '<small>У вас максимальный уровень 💎</small>'}</a>
    <div class="quick"><a href="#/designs?fav=1">${ic('heart')}<span>Избранное</span></a><a href="#/me/gift">${ic('gift')}<span>Сертификаты</span></a><a href="#/me/profile">${ic('gear')}<span>Профиль</span></a><button data-act="logout">${ic('logout')}<span>Выйти</span></button></div>
    <div class="seg"><a class="${tab === 'up' ? 'on' : ''}" href="#/me?tab=up&keep=1">Предстоящие · ${up.length}</a><a class="${tab === 'hist' ? 'on' : ''}" href="#/me?tab=hist&keep=1">История · ${hist.length}</a></div>
    <div class="col gap">${(tab === 'up' ? up : hist).map(apptCard).join('') || `<div class="empty">${ic('cal')}<p>${tab === 'up' ? 'У вас пока нет предстоящих записей' : 'История визитов появится после первой записи'}</p><a class="btn" href="#/book" data-act="newBook">Записаться</a></div>`}</div></div>`;
}, ['client']);
A.cancelAppt = async (el) => {
  if (!(await confirmSheet('Отменить запись?', 'Списанные бонусы и сертификат вернутся на счёт.', 'Отменить запись', true))) return;
  try { await api(`/api/appointments/${el.dataset.id}/cancel`, { method: 'POST' }); await loadBoot(); toast('Запись отменена'); render({ keep: true }); } catch (e) { toast(e.message, 'err'); }
};
A.resched = (el) => { const a = apptCache.get(+el.dataset.id); startBooking({ resched: a.id, service_id: a.service_id, master_id: a.master_id }, 3); };
A.repeat = (el) => { const a = apptCache.get(+el.dataset.id); if (!svc(a.service_id)) return toast('Эта услуга больше не оказывается', 'err'); startBooking({ service_id: a.service_id, master_id: mst(a.master_id) ? a.master_id : 0, design_id: a.design_id && dsg(a.design_id) ? a.design_id : undefined, tryon: a.tryon || undefined }, 3); };
A.review = (el) => { const a = apptCache.get(+el.dataset.id);
  sheet(`<h3>Отзыв о визите</h3><p class="muted">${esc(a.service)} · мастер ${esc(a.master)}</p><form class="col gap" data-submit="sendReview" data-id="${a.id}"><div class="rating">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="r${n}" value="${n}" ${n === 5 ? 'checked' : ''}><label for="r${n}" aria-label="${n}">★</label>`).join('')}</div>
    <textarea class="inp" name="text" rows="4" maxlength="1000" placeholder="Что понравилось? Что можно улучшить?"></textarea><button class="btn block">Отправить отзыв</button></form>`); };
A.sendReview = (f) => busy(f.querySelector('button'), async () => { await api(`/api/appointments/${f.dataset.id}/review`, { body: formData(f) }); closeSheet(); await loadBoot(); toast('Спасибо за отзыв!'); render({ keep: true }); });

route('/me/bonus', async () => {
  const { user: u, history } = await api('/api/my/loyalty'); S.user = u;
  const st = S.boot.settings;
  return `<div class="page">${head('Бонусы')}
    <div class="card loyal"><small>Уровень «${esc(u.level.name)}» · кэшбэк ${u.level.pct}%</small><b class="loyal-b">${u.bonus.toLocaleString('ru-RU')}</b><small>бонусов · 1 бонус = 1 ₽</small>
      ${u.level.next ? `<div class="bar"><i style="width:${Math.min(100, Math.round(u.total_spent / u.level.next.from * 100))}%"></i></div><small>Потрачено ${money(u.total_spent)} · до «${esc(u.level.next.name)}» — ${money(u.level.next.from - u.total_spent)}</small>` : `<small>Потрачено ${money(u.total_spent)} · максимальный уровень</small>`}</div>
    <h3 class="sec-t">Уровни</h3><div class="card list">${st.levels.map((l) => `<div class="item ${l.name === u.level.name ? 'sel' : ''}"><div class="grow"><b>${esc(l.name)}</b><small class="muted">${l.from ? 'от ' + money(l.from) + ' за всё время' : 'с первого визита'}</small></div><b>${l.pct}%</b></div>`).join('')}</div>
    <p class="muted small">Бонусы начисляются после каждого визита. Ими можно оплатить до ${st.bonus_max_pay_pct}% стоимости услуги при онлайн-записи.</p>
    <h3 class="sec-t">История</h3>${history.length ? `<div class="card list">${history.map((h) => `<div class="item"><div class="grow"><b>${esc(h.service)}</b><small class="muted">${esc(dHuman(h.date, false))}</small></div><div class="price">${h.bonus_earned ? `<b class="ok-t">+${h.bonus_earned}</b>` : ''}${h.bonus_used ? `<b class="danger-t">−${h.bonus_used}</b>` : ''}</div></div>`).join('')}</div>` : '<p class="muted">Пока нет операций</p>'}</div>`;
}, ['client']);

route('/me/gift', async () => {
  const { certificates } = await api('/api/my/loyalty');
  return `<div class="page">${head('Подарочные сертификаты')}
    <form class="card col gap" data-submit="buyCert"><b>Подарить красоту</b><div class="chips wrap">${[2000, 3000, 5000, 10000].map((a, i) => `<label class="chip-r"><input type="radio" name="amount" value="${a}" ${i === 1 ? 'checked' : ''}><span>${money(a)}</span></label>`).join('')}</div>
      <label class="field"><span>Кому</span><input class="inp" name="recipient" maxlength="80" placeholder="Имя получателя"></label><label class="field"><span>Поздравление</span><textarea class="inp" name="message" rows="2" maxlength="300" placeholder="Пара тёплых слов"></textarea></label>
      <button class="btn block">${ic('gift')} Оформить сертификат</button><small class="muted center">Оплата — в салоне или по ссылке от администратора. Код сертификата появится ниже.</small></form>
    <h3 class="sec-t">Мои сертификаты</h3><div class="col gap">${certificates.map((c) => `<div class="gcard ${c.balance ? '' : 'used'}"><small>${esc(S.boot.salon.name)} · подарочный сертификат</small><b>${money(c.amount)}</b>${c.recipient ? `<span>${esc(c.recipient)}</span>` : ''}${c.message ? `<em>«${esc(c.message)}»</em>` : ''}
      <div class="row between"><code>${esc(c.code)}</code><span>${c.balance ? 'остаток ' + money(c.balance) : 'использован'}</span></div><button class="btn sm soft" data-act="shareCert" data-code="${esc(c.code)}" data-amount="${c.amount}">Поделиться кодом</button></div>`).join('') || '<p class="muted">У вас пока нет сертификатов</p>'}</div></div>`;
}, ['client']);
A.buyCert = (f) => busy(f.querySelector('button'), async () => { await api('/api/certificates', { body: formData(f) }); toast('Сертификат оформлен'); render(); });
A.shareCert = async (el) => { const text = `Дарю тебе сертификат в студию маникюра «${S.boot.salon.name}» на ${money(el.dataset.amount)}. Код: ${el.dataset.code}`;
  try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Текст с кодом скопирован'); } } catch {} };

route('/me/profile', async () => { const u = S.user;
  return `<div class="page">${head('Профиль')}<form class="card col gap" data-submit="saveProfile"><label class="field"><span>Имя</span><input class="inp" name="name" value="${esc(u.name)}" required></label>
    <label class="field"><span>Телефон</span><input class="inp" value="${esc(phoneFmt(u.phone) || u.email)}" disabled></label><label class="field"><span>День рождения</span><input class="inp" type="date" name="birthday" value="${esc(u.birthday || '')}"></label>
    <label class="field"><span>Новый пароль</span><input class="inp" type="password" name="password" minlength="6" autocomplete="new-password" placeholder="Оставьте пустым, чтобы не менять"></label><button class="btn block">Сохранить</button></form>
    ${'Notification' in window ? `<div class="card switch mt"><div class="grow"><b>Уведомления на устройстве</b><small class="muted">${Notification.permission === 'granted' ? 'Включены — напомним о записи' : Notification.permission === 'denied' ? 'Запрещены в настройках браузера' : 'Напоминания за сутки и за 2 часа'}</small></div>${Notification.permission === 'default' ? '<button class="btn sm soft" data-act="askNotify">Включить</button>' : ''}</div>` : ''}
    <button class="btn ghost block mt" data-act="logout">${ic('logout')} Выйти</button></div>`;
}, ['client', 'master', 'owner']);
A.saveProfile = (f) => busy(f.querySelector('button'), async () => { const r = await api('/api/me', { method: 'PUT', body: formData(f) }); S.user = S.boot.user = r.user; toast('Сохранено'); });

const NIC = { booking: 'cal', reminder: 'bell', bonus: 'percent', review: 'star', gift: 'gift', info: 'bell' };
route('/notifications', async () => {
  const { items } = await api('/api/notifications');
  if (items.some((n) => !n.is_read)) { api('/api/notifications/read', { method: 'POST' }); S.unread = 0; }
  return `<div class="page">${head('Уведомления')}${items.length ? `<div class="col gap">${items.map((n) => `<div class="card notif ${n.is_read ? '' : 'new'}"><span class="notif-ic">${ic(NIC[n.kind] || 'bell')}</span><div class="grow"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small class="muted">${esc(dHuman(n.created_at.slice(0, 10), false))}, ${esc(n.created_at.slice(11, 16))}</small></div></div>`).join('')}</div>` : `<div class="empty">${ic('bell')}<p>Здесь появятся напоминания о записях и начисления бонусов</p></div>`}</div>`;
}, ['client', 'master', 'owner']);
