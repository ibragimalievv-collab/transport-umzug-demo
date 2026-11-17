// Экраны владельца
import { S, A, api, route, go, render, after, sheet, closeSheet, confirmSheet, toast, busy, formData, loadBoot, fileToDataUrl, hydrate,
  esc, money, ic, thumb, avatar, svc, mst, dsg, dHuman, dShort, dur, today, addDays, parseD, ymd, WD, WDF, plural, endTime, phoneFmt } from './core.js';
import { head, STATUS, designLine, COLORS } from './client.js';
import { dateNav, staffAppt, clientsList, clientCard } from './master.js';
import { SHAPES, LENGTHS, FINISHES, TYPES, drawPreview } from './nailart.js';

const O = ['owner'];
const toMin = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
const reload = async (msg) => { closeSheet(); await loadBoot(); if (msg) toast(msg); render({ keep: true }); };
const opt = (v, t, cur) => `<option value="${esc(v)}" ${String(v) === String(cur ?? '') ? 'selected' : ''}>${esc(t)}</option>`;
const fld = (label, inner) => `<label class="field"><span>${label}</span>${inner}</label>`;
const sw = (name, label, on) => `<label class="switch"><div class="grow"><b>${label}</b></div><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i></label>`;

// ---------- Журнал ----------
let jCache = [];
route('/a', async ({ query }) => {
  const date = /^\d{4}-\d\d-\d\d$/.test(query.date) ? query.date : today(), view = query.view === 'week' ? 'week' : 'day';
  const masters = S.boot.masters.filter((m) => m.active);
  const tabs = `<div class="seg"><a class="${view === 'day' ? 'on' : ''}" href="#/a?date=${date}">День</a><a class="${view === 'week' ? 'on' : ''}" href="#/a?view=week&date=${date}">Неделя</a></div>`;
  const fab = `<button class="fab-add" data-act="jNew" data-date="${date}" aria-label="Новая запись">${ic('plus')}</button>`;
  const bellBtn = `<a class="icon-btn" href="#/notifications" aria-label="Уведомления">${ic('bell')}</a>`;
  if (view === 'week') {
    const mon = addDays(date, -((parseD(date).getDay() + 6) % 7)), days = [...Array(7)].map((_, i) => addDays(mon, i));
    const { items } = await api(`/api/admin/journal?from=${days[0]}&to=${days[6]}`);
    const cell = (m, d) => { const s = m.schedule.find((x) => x.weekday === parseD(d).getDay()), off = !s || s.off, it = items.filter((a) => a.master_id === m.id && a.date === d && a.status !== 'noshow');
      const pct = off ? 0 : Math.min(100, Math.round(it.reduce((x, a) => x + a.duration, 0) / (toMin(s.end) - toMin(s.start)) * 100));
      return `<td class="${off ? 'offc' : ''} ${d === today() ? 'tod' : ''}"><a href="#/a?date=${d}">${off && !it.length ? '<small>вых</small>' : `<b>${it.length}</b><div class="bar"><i style="width:${pct}%;background:${esc(m.color)}"></i></div><small>${pct}%</small>`}</a></td>`; };
    return `<div class="page wide">${head('Журнал записи', bellBtn, false)}${tabs}
      <div class="datenav"><a class="icon-btn" href="#/a?view=week&date=${addDays(date, -7)}" aria-label="Предыдущая неделя">${ic('left')}</a><b class="datenav-c">${dShort(days[0])} — ${dShort(days[6])}</b><a class="icon-btn" href="#/a?view=week&date=${addDays(date, 7)}" aria-label="Следующая неделя">${ic('right')}</a></div>
      <div class="card tablew"><table class="weekt"><thead><tr><th></th>${days.map((d) => `<th class="${d === today() ? 'tod' : ''}"><a href="#/a?date=${d}">${WD[parseD(d).getDay()]}<b>${parseD(d).getDate()}</b></a></th>`).join('')}</tr></thead>
        <tbody>${masters.map((m) => `<tr><th><span class="mdot" style="background:${esc(m.color)}"></span>${esc(m.name.split(' ')[0])}</th>${days.map((d) => cell(m, d)).join('')}</tr>`).join('')}
        <tr class="tot"><th>Итого</th>${days.map((d) => { const it = items.filter((a) => a.date === d && a.status !== 'noshow'); return `<td><b>${it.length}</b><small>${Math.round(it.reduce((x, a) => x + a.price - a.discount, 0) / 1000)} т.₽</small></td>`; }).join('')}</tr></tbody></table></div>
      <p class="muted small">В ячейке — число записей и загрузка мастера по графику. Нажмите на день, чтобы открыть его.</p>${fab}</div>`;
  }
  const { items } = await api(`/api/admin/journal?from=${date}&to=${date}`); jCache = items;
  const wd = parseD(date).getDay();
  const sch = masters.map((m) => m.schedule.find((x) => x.weekday === wd));
  const starts = sch.filter((s) => s && !s.off).map((s) => toMin(s.start)), ends = sch.filter((s) => s && !s.off).map((s) => toMin(s.end));
  const t0 = Math.min(600, ...starts, ...items.map((a) => toMin(a.time))), t1 = Math.max(1200, ...ends, ...items.map((a) => toMin(a.time) + a.duration));
  const PX = 1.15, hours = []; for (let t = Math.floor(t0 / 60) * 60; t < t1; t += 60) hours.push(t);
  const base = hours[0], H = (t1 - base) * PX;
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  const sum = items.filter((a) => a.status !== 'noshow').reduce((x, a) => x + a.price - a.discount, 0);
  after(() => { const g = document.querySelector('.jgrid-wrap'); if (g && date === today()) g.scrollTop = Math.max(0, (nowMin - base) * PX - 120); });
  return `<div class="page wide">${head('Журнал записи', bellBtn, false)}${tabs}${dateNav(date, '/a?')}
    <p class="muted small">${plural(items.length, 'запись', 'записи', 'записей')} · ожидаемая выручка ${money(sum)}</p>
    <div class="jgrid-wrap"><div class="jgrid" style="--cols:${masters.length}">
      <div class="jhead"><div class="jtime"></div>${masters.map((m, i) => `<div class="jm">${avatar(m, 'sm')}<span><b>${esc(m.name.split(' ')[0])}</b><small>${!sch[i] || sch[i].off ? 'выходной' : sch[i].start + '–' + sch[i].end}</small></span></div>`).join('')}</div>
      <div class="jbody" style="height:${H}px"><div class="jtime">${hours.map((t) => `<span style="top:${(t - base) * PX}px">${String(t / 60).padStart(2, '0')}:00</span>`).join('')}</div>
        ${masters.map((m, i) => { const s = sch[i], off = !s || s.off;
          return `<div class="jcol ${off ? 'offc' : ''}" style="--c:${esc(m.color)}">${hours.map((t) => `<i class="jline" style="top:${(t - base) * PX}px"></i>`).join('')}
            ${off ? '' : `<i class="jwork" style="top:${(toMin(s.start) - base) * PX}px;height:${(toMin(s.end) - toMin(s.start)) * PX}px" data-act="jNew" data-date="${date}" data-m="${m.id}"></i>`}
            ${items.filter((a) => a.master_id === m.id).map((a) => `<button class="jap ${a.status}" style="top:${(toMin(a.time) - base) * PX}px;height:${a.duration * PX - 2}px" data-act="jOpen" data-id="${a.id}"><b>${esc(a.time)} ${esc(a.client.split(' ')[0])}</b><small>${esc(a.service)}</small>${a.design || a.tryon?.color ? '<em>✦ дизайн</em>' : ''}</button>`).join('')}</div>`; }).join('')}
        ${date === today() && nowMin > base && nowMin < t1 ? `<i class="jnow" style="top:${(nowMin - base) * PX}px"></i>` : ''}</div></div></div>${fab}</div>`;
}, O);
A.jOpen = (el) => { const a = jCache.find((x) => x.id === +el.dataset.id); if (a) sheet(`<h3>${esc(dHuman(a.date))}</h3>${staffAppt(a, 'owner')}${a.status === 'booked' ? `<button class="btn soft block mt" data-act="jMove" data-id="${a.id}">${ic('cal')} Перенести</button>` : ''}`); };
const slotForm = (v, a) => `<form class="col gap" data-submit="${a ? 'jMoveSave' : 'jCreate'}" ${a ? `data-id="${a.id}"` : ''}>
  ${a ? '' : `${fld('Клиент', `<select class="inp" name="client_id" data-change="jClient"><option value="">+ Новый клиент</option>${v.clients.map((c) => opt(c.id, `${c.name} · ${phoneFmt(c.phone)}`)).join('')}</select>`)}
    <div class="row gap" id="jnewc"><input class="inp grow" name="client_name" placeholder="Имя"><input class="inp grow" name="client_phone" type="tel" placeholder="+7 900 000-00-00"></div>
    ${fld('Услуга', `<select class="inp" name="service_id" data-change="jSlots">${S.boot.services.filter((s) => s.active).map((s) => opt(s.id, `${s.name} · ${dur(s.duration)} · ${money(s.price)}`)).join('')}</select>`)}`}
  ${a ? `<input type="hidden" name="service_id" value="${a.service_id}"><input type="hidden" name="exclude" value="${a.id}">` : ''}
  ${fld('Мастер', `<select class="inp" name="master_id" data-change="jSlots">${a ? '' : '<option value="0">Любой свободный</option>'}${S.boot.masters.filter((m) => m.active).map((m) => opt(m.id, m.name, v.master)).join('')}</select>`)}
  <div class="row gap">${fld('Дата', `<input class="inp" type="date" name="date" value="${v.date}" min="${today()}" data-change="jSlots" required>`)}${fld('Время', `<select class="inp" name="time" required><option value="">…</option></select>`)}</div>
  ${a ? '' : fld('Комментарий', '<input class="inp" name="comment" maxlength="400">')}<button class="btn block">${a ? 'Перенести запись' : 'Записать клиента'}</button></form>`;
async function fillSlots(f) {
  const d = formData(f), sel = f.elements.time;
  try { const { slots } = await api(`/api/slots?service_id=${d.service_id}&master_id=${d.master_id || 0}&date=${d.date}${d.exclude ? '&exclude=' + d.exclude : ''}`);
    sel.innerHTML = slots.length ? slots.map((s) => `<option>${s.time}</option>`).join('') : '<option value="">нет свободного времени</option>';
  } catch { sel.innerHTML = '<option value="">—</option>'; }
}
A.jSlots = (el) => fillSlots(el.form);
A.jClient = (el) => { document.getElementById('jnewc').hidden = !!el.value; };
A.jNew = async (el) => { const { items } = await api('/api/admin/clients'); const d = el.dataset.date < today() ? today() : el.dataset.date;
  const w = sheet(`<h3>Новая запись</h3>${slotForm({ clients: items, date: d, master: el.dataset.m || 0 })}`); fillSlots(w.querySelector('form')); };
A.jCreate = (f) => busy(f.querySelector('button'), async () => { const d = formData(f); if (!d.time) throw new Error('Выберите время'); await api('/api/admin/appointments', { body: d }); closeSheet(); toast('Клиент записан'); go(`/a?date=${d.date}`); });
A.jMove = (el) => { const a = jCache.find((x) => x.id === +el.dataset.id); const w = sheet(`<h3>Перенос записи</h3><p class="muted">${esc(a.client)} · ${esc(a.service)}</p>${slotForm({ date: a.date < today() ? today() : a.date, master: a.master_id }, a)}`); fillSlots(w.querySelector('form')); };
A.jMoveSave = (f) => busy(f.querySelector('button'), async () => { const d = formData(f); if (!d.time) throw new Error('Выберите время'); await api(`/api/appointments/${f.dataset.id}/reschedule`, { body: d }); closeSheet(); toast('Запись перенесена'); go(`/a?date=${d.date}`); });

// ---------- Отчёты ----------
route('/a/reports', async ({ query }) => {
  const t = today(), d = new Date();
  const P = { 7: ['7 дней', addDays(t, -6), t], 30: ['30 дней', addDays(t, -29), t], m: ['Этот месяц', t.slice(0, 8) + '01', t], pm: ['Прошлый месяц', ymd(new Date(d.getFullYear(), d.getMonth() - 1, 1)), ymd(new Date(d.getFullYear(), d.getMonth(), 0))] };
  const key = query.from ? '' : query.p || '30', from = query.from || P[key][1], to = query.to || P[key][2];
  const r = await api(`/api/admin/reports?from=${from}&to=${to}`), T = r.total;
  const days = []; for (let x = r.from; x <= r.to && days.length < 92; x = addDays(x, 1)) days.push(r.byDay.find((b) => b.date === x) || { date: x, revenue: 0, visits: 0 });
  const max = Math.max(1, ...days.map((x) => x.revenue)), maxS = Math.max(1, ...r.services.map((s) => s.n));
  const kpi = (l, v, s = '') => `<div><small>${l}</small><b>${v}</b>${s ? `<small class="muted">${s}</small>` : ''}</div>`;
  return `<div class="page wide">${head('Отчёты', '', false)}
    <div class="chips">${Object.entries(P).map(([k, v]) => `<a class="chip ${key === k ? 'on' : ''}" href="#/a/reports?p=${k}">${v[0]}</a>`).join('')}</div>
    <form class="row gap period" data-submit="repPeriod"><input class="inp" type="date" name="from" value="${r.from}" aria-label="Начало периода"><span>—</span><input class="inp" type="date" name="to" value="${r.to}" aria-label="Конец периода"><button class="btn soft sm">Показать</button></form>
    <div class="kpis four">${kpi('Выручка', money(T.revenue))}${kpi('Визиты', T.visits, `${T.clients} клиентов`)}${kpi('Средний чек', money(T.avg))}${kpi('Зарплата мастеров', money(T.salary), `${T.revenue ? Math.round(T.salary / T.revenue * 100) : 0}% выручки`)}
      ${kpi('Новые клиенты', T.new_clients)}${kpi('Неявки / отмены', `${T.noshow || 0} / ${T.cancelled || 0}`)}${kpi('Скидки по акциям', money(T.discounts))}${kpi('Оплачено бонусами', money(T.bonus_used), `сертификатами ${money(T.cert_used)}`)}</div>
    <h3 class="sec-t">Выручка по дням</h3><div class="card"><div class="chart" role="img" aria-label="Выручка по дням">${days.map((x) => `<div class="cbar" title="${dShort(x.date)}: ${money(x.revenue)}, визитов ${x.visits}"><i style="height:${Math.round(x.revenue / max * 100)}%"></i></div>`).join('')}</div>
      <div class="row between muted small"><span>${dShort(r.from)}</span><span>макс. ${money(max)} в день</span><span>${dShort(r.to)}</span></div></div>
    <h3 class="sec-t">Мастера: загрузка и зарплата</h3><div class="card tablew"><table class="rep"><thead><tr><th>Мастер</th><th>Загрузка</th><th>Визиты</th><th>Выручка</th><th>Зарплата</th></tr></thead><tbody>
      ${r.masters.map((m) => `<tr><th><span class="mdot" style="background:${esc(m.color)}"></span>${esc(m.name)}</th><td><div class="bar"><i style="width:${Math.min(100, m.occupancy)}%;background:${esc(m.color)}"></i></div><small>${m.occupancy}% · ${m.hours} ч</small></td><td>${m.visits}</td><td>${money(m.revenue)}</td><td><b>${money(m.salary)}</b><small class="muted"> ${m.commission}%</small></td></tr>`).join('')}
      <tr class="tot"><th>Итого</th><td></td><td>${T.visits}</td><td>${money(T.revenue)}</td><td><b>${money(T.salary)}</b></td></tr></tbody></table></div>
    <h3 class="sec-t">Популярные услуги</h3><div class="card col gap">${r.services.slice(0, 10).map((s) => `<div class="srow"><div class="row between"><span>${esc(s.name)}</span><b>${s.n} · ${money(s.revenue)}</b></div><div class="bar"><i style="width:${Math.round(s.n / maxS * 100)}%"></i></div></div>`).join('') || '<p class="muted">Нет данных за период</p>'}</div>
    ${r.designs.length ? `<h3 class="sec-t">Популярные дизайны</h3><div class="hscroll">${r.designs.map((x) => `<div class="dcard"><div class="dcard-img">${thumb(x)}</div><div class="dcard-t"><b>${esc(x.name)}</b><small>${plural(x.n, 'запись', 'записи', 'записей')}</small></div></div>`).join('')}</div>` : ''}</div>`;
}, O);
A.repPeriod = (f) => { const d = formData(f); if (d.from && d.to && d.from <= d.to) go(`/a/reports?from=${d.from}&to=${d.to}`); else toast('Проверьте даты периода', 'err'); };

// ---------- Клиенты ----------
route('/a/clients', async () => { const { items } = await api('/api/admin/clients'); return `<div class="page">${head(`База клиентов · ${items.length}`, '', false)}${clientsList(items, '/a/clients')}</div>`; }, O);
route('/a/clients/:id', ({ params }) => clientCard(params.id, 'owner'), O);

// ---------- Управление ----------
route('/a/manage', async () => { const b = S.boot, row = (to, i, t, s) => `<a class="item" href="#${to}"><span class="notif-ic">${ic(i)}</span><div class="grow"><b>${t}</b><small class="muted">${s}</small></div>${ic('right')}</a>`;
  return `<div class="page">${head('Управление', '', false)}<div class="card list">
    ${row('/a/services', 'scissors', 'Услуги и цены', plural(b.services.filter((s) => s.active).length, 'услуга', 'услуги', 'услуг'))}${row('/a/masters', 'users', 'Мастера и графики', plural(b.masters.filter((m) => m.active).length, 'мастер', 'мастера', 'мастеров'))}
    ${row('/a/designs', 'sparkle', 'Дизайны для примерки', plural(b.designs.length, 'дизайн', 'дизайна', 'дизайнов'))}${row('/a/promos', 'percent', 'Акции', plural(b.promos.filter((p) => p.active).length, 'активная', 'активные', 'активных'))}
    ${row('/a/loyalty', 'star', 'Бонусная программа', `${b.settings.levels.length} уровня кэшбэка`)}${row('/a/certs', 'gift', 'Подарочные сертификаты', 'Выпуск и остатки')}${row('/a/salon', 'pin', 'О салоне', esc(b.salon.address))}${row('/me/profile', 'user', 'Мой профиль', esc(S.user.name))}</div>
    <button class="btn ghost block mt" data-act="logout">${ic('logout')} Выйти</button></div>`; }, O);

// услуги
route('/a/services', async () => { const cats = [...new Set(S.boot.services.map((s) => s.category))];
  return `<div class="page">${head('Услуги и цены', `<button class="icon-btn" data-act="sEdit" aria-label="Добавить услугу">${ic('plus')}</button>`)}
    ${cats.map((c) => `<h3 class="sec-t">${esc(c)}</h3><div class="card list">${S.boot.services.filter((s) => s.category === c).map((s) => `<button class="item ${s.active ? '' : 'dim'}" data-act="sEdit" data-id="${s.id}"><div class="grow"><b>${esc(s.name)}</b><small class="muted">${dur(s.duration)}${s.active ? '' : ' · скрыта'}</small></div><div class="price"><b>${money(s.price)}</b></div>${ic('edit')}</button>`).join('')}</div>`).join('')}</div>`; }, O);
A.sEdit = (el) => { const s = svc(el.dataset.id) || { active: 1, duration: 60, category: 'Маникюр' }, cats = [...new Set(S.boot.services.map((x) => x.category))];
  sheet(`<h3>${s.id ? 'Услуга' : 'Новая услуга'}</h3><form class="col gap" data-submit="sSave"><input type="hidden" name="id" value="${s.id || ''}">${fld('Название', `<input class="inp" name="name" value="${esc(s.name || '')}" required maxlength="120">`)}
    ${fld('Категория', `<input class="inp" name="category" value="${esc(s.category)}" list="cats" required><datalist id="cats">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>`)}${fld('Описание', `<textarea class="inp" name="description" rows="2" maxlength="400">${esc(s.description || '')}</textarea>`)}
    <div class="row gap">${fld('Длительность', `<select class="inp" name="duration">${[30, 60, 90, 120, 150, 180, 210, 240].map((d) => opt(d, dur(d), s.duration)).join('')}</select>`)}${fld('Цена, ₽', `<input class="inp" type="number" name="price" min="0" step="50" value="${s.price ?? ''}" required>`)}</div>
    ${sw('active', 'Доступна для записи', s.active)}<div class="row gap">${s.id ? `<button type="button" class="btn ghost danger-t" data-act="sDel" data-id="${s.id}">Удалить</button>` : ''}<button class="btn grow">Сохранить</button></div></form>`); };
A.sSave = (f) => busy(f.querySelector('button.grow'), async () => { const d = formData(f); await api('/api/admin/services', { body: { ...d, active: !!d.active } }); await reload('Услуга сохранена'); });
A.sDel = async (el) => { if (!(await confirmSheet('Удалить услугу?', 'Если по услуге уже были записи, она будет скрыта, а история сохранится.', 'Удалить', true))) return; try { await api('/api/admin/services/' + el.dataset.id, { method: 'DELETE' }); await reload('Готово'); } catch (e) { toast(e.message, 'err'); } };

// мастера
route('/a/masters', async () => `<div class="page">${head('Мастера и графики', `<button class="icon-btn" data-act="mEdit" aria-label="Добавить мастера">${ic('plus')}</button>`)}
  <div class="col gap">${S.boot.masters.map((m) => `<button class="card mrow ${m.active ? '' : 'dim'}" data-act="mEdit" data-id="${m.id}">${avatar(m, 'lg')}<div class="grow"><b>${esc(m.name)}</b><small class="muted">${esc(m.title)} · ${m.commission}% от выручки${m.active ? '' : ' · не работает'}</small>
    <small>${[1, 2, 3, 4, 5, 6, 0].map((wd) => { const s = m.schedule.find((x) => x.weekday === wd); return `<span class="wd ${!s || s.off ? 'off' : ''}">${WD[wd]}</span>`; }).join('')}</small></div>${ic('edit')}</button>`).join('')}</div></div>`, O);
A.mEdit = (el) => { const m = mst(el.dataset.id) || { active: 1, commission: 40, experience: 1, color: '#C98B8B', services: [], schedule: [...Array(7)].map((_, wd) => ({ weekday: wd, start: '10:00', end: '20:00', off: wd === 0 ? 1 : 0 })) };
  sheet(`<h3>${m.id ? 'Мастер' : 'Новый мастер'}</h3><form class="col gap" data-submit="mSave"><input type="hidden" name="id" value="${m.id || ''}">
    <div class="row gap">${fld('Имя и фамилия', `<input class="inp" name="name" value="${esc(m.name || '')}" required>`)}<label class="field fit"><span>Цвет</span><input class="inp color" type="color" name="color" value="${esc(m.color)}"></label></div>
    ${fld('Специализация', `<input class="inp" name="title" value="${esc(m.title || '')}" maxlength="80">`)}${fld('О мастере', `<textarea class="inp" name="bio" rows="2" maxlength="600">${esc(m.bio || '')}</textarea>`)}
    <div class="row gap">${fld('% от выручки (зарплата)', `<input class="inp" type="number" name="commission" min="0" max="100" value="${m.commission}">`)}${fld('Стаж, лет', `<input class="inp" type="number" name="experience" min="0" max="60" value="${m.experience}">`)}</div>
    ${m.id ? '' : `<div class="row gap">${fld('E-mail для входа', '<input class="inp" type="email" name="email" required autocomplete="off">')}${fld('Пароль', '<input class="inp" name="password" minlength="6" required autocomplete="off">')}</div>`}
    <b>График работы</b><div class="sched">${[1, 2, 3, 4, 5, 6, 0].map((wd) => { const s = m.schedule.find((x) => x.weekday === wd) || { start: '10:00', end: '20:00', off: 1 };
      return `<div class="sched-r"><label class="chk"><input type="checkbox" name="on${wd}" ${s.off ? '' : 'checked'}><span>${WDF[wd]}</span></label><input class="inp" type="time" name="s${wd}" value="${s.start}" step="1800" aria-label="Начало"><input class="inp" type="time" name="e${wd}" value="${s.end}" step="1800" aria-label="Конец"></div>`; }).join('')}</div>
    <b>Услуги мастера</b><div class="checks">${S.boot.services.filter((s) => s.active).map((s) => `<label class="chk"><input type="checkbox" name="svc" value="${s.id}" ${m.services.includes(s.id) ? 'checked' : ''}><span>${esc(s.name)}</span></label>`).join('')}</div>
    ${sw('active', 'Принимает клиентов', m.active)}<button class="btn block">Сохранить</button></form>`, { wide: true }); };
A.mSave = (f) => busy(f.querySelector('button.block'), async () => { const d = formData(f);
  const schedule = [...Array(7)].map((_, wd) => ({ weekday: wd, start: d['s' + wd], end: d['e' + wd], off: !d['on' + wd] }));
  await api('/api/admin/masters', { body: { ...d, active: !!d.active, schedule, services: new FormData(f).getAll('svc') } }); await reload('Мастер сохранён'); });

// дизайны
const DCOL = Object.keys(COLORS), DSTY = ['классика', 'френч', 'омбре', 'блеск', 'арт', 'минимализм'], DSEA = ['всесезон', 'весна', 'лето', 'осень', 'зима'];
route('/a/designs', async () => `<div class="page">${head('Дизайны для примерки', `<button class="icon-btn" data-act="dEdit" aria-label="Добавить дизайн">${ic('plus')}</button>`)}
  <button class="btn block" data-act="dEdit">${ic('plus')} Загрузить новый дизайн</button><p class="muted small">Дизайн сразу появляется в каталоге и в примерке. Можно собрать его из готовых эффектов или загрузить свою текстуру (фото покрытия, слайдер, принт).</p>
  <div class="dgrid">${S.boot.designs.map((d) => `<button class="dcard ${d.active ? '' : 'dim'}" data-act="dEdit" data-id="${d.id}"><div class="dcard-img">${thumb(d)}${d.popular ? '<span class="tag hot">хит</span>' : ''}</div><div class="dcard-t"><b>${esc(d.name)}</b><small>${d.active ? esc(d.style || '') : 'скрыт'}${d.extra ? ' · +' + money(d.extra) : ''}</small></div></button>`).join('')}</div></div>`, O);
let dImg = null;
A.dEdit = (el) => { const d = dsg(el.dataset.id) || { active: 1, params: { type: 'solid', base: '#E8B4B8', accent: '#FFFFFF', accent2: '#D4AF6A', finish: 'gloss' }, shape: 'almond', length: 'medium', color: 'розовый', style: 'классика', season: 'всесезон', extra: 0 }, p = d.params; dImg = d.image || null;
  const w = sheet(`<h3>${d.id ? 'Дизайн' : 'Новый дизайн'}</h3><form class="col gap" data-submit="dSave" data-input="dPrev" data-change="dPrev"><input type="hidden" name="id" value="${d.id || ''}">
    <div class="dprev"><canvas id="dprev1"></canvas><canvas id="dprev2"></canvas></div>
    ${fld('Название', `<input class="inp" name="name" value="${esc(d.name || '')}" required maxlength="80">`)}
    <div class="row gap">${fld('Эффект', `<select class="inp" name="type">${Object.entries(TYPES).map(([k, v]) => opt(k, v, p.type)).join('')}</select>`)}${fld('Покрытие', `<select class="inp" name="finish">${Object.entries(FINISHES).map(([k, v]) => opt(k, v, p.finish)).join('')}</select>`)}</div>
    <div class="row gap">${[['base', 'Основа'], ['accent', 'Акцент'], ['accent2', 'Акцент 2']].map(([k, l]) => `<label class="field"><span>${l}</span><input class="inp color" type="color" name="${k}" value="${esc(p[k] || '#FFFFFF')}"></label>`).join('')}</div>
    <label class="chk"><input type="checkbox" name="mix" ${p.mix ? 'checked' : ''}><span>Акцент только на двух пальцах</span></label>
    <div class="row gap"><label class="btn soft grow">${ic('image')} Загрузить текстуру<input type="file" accept="image/*" hidden data-change="dTex"></label><button type="button" class="btn ghost" data-act="dTexDel" id="dtexdel" ${dImg ? '' : 'hidden'}>Убрать текстуру</button></div>
    <div class="row gap">${fld('Форма', `<select class="inp" name="shape">${Object.entries(SHAPES).map(([k, v]) => opt(k, v, d.shape)).join('')}</select>`)}${fld('Длина', `<select class="inp" name="length">${Object.entries(LENGTHS).map(([k, v]) => opt(k, v, d.length)).join('')}</select>`)}</div>
    <div class="row gap">${fld('Цвет', `<select class="inp" name="color">${DCOL.map((c) => opt(c, c, d.color)).join('')}</select>`)}${fld('Стиль', `<select class="inp" name="style">${DSTY.map((c) => opt(c, c, d.style)).join('')}</select>`)}${fld('Сезон', `<select class="inp" name="season">${DSEA.map((c) => opt(c, c, d.season)).join('')}</select>`)}</div>
    ${fld('Доплата за дизайн, ₽', `<input class="inp" type="number" name="extra" min="0" step="50" value="${d.extra || 0}">`)}${sw('popular', 'Показывать в «Популярных»', d.popular)}${sw('active', 'Доступен клиентам', d.active)}
    <div class="row gap">${d.id ? `<button type="button" class="btn ghost danger-t" data-act="dDel" data-id="${d.id}">Удалить</button>` : ''}<button class="btn grow">Сохранить</button></div></form>`, { wide: true });
  dPreview(w.querySelector('form')); };
function dPreview(f) { const d = formData(f), des = { params: { type: d.type, base: d.base, accent: d.accent, accent2: d.accent2, finish: d.finish, mix: d.mix ? 1 : 0 }, shape: d.shape, length: d.length, image: dImg };
  drawPreview(document.getElementById('dprev1'), des); drawPreview(document.getElementById('dprev2'), des, { single: true }); }
A.dPrev = (el) => dPreview(el.closest('form'));
A.dTex = async (el) => { const f = el.files?.[0]; if (!f) return; try { dImg = await fileToDataUrl(f, 512, 0.9); document.getElementById('dtexdel').hidden = false; dPreview(el.closest('form')); } catch (e) { toast(e.message, 'err'); } };
A.dTexDel = (el) => { dImg = null; el.hidden = true; dPreview(el.closest('form')); };
A.dSave = (f) => busy(f.querySelector('button.grow'), async () => { const d = formData(f);
  await api('/api/admin/designs', { body: { id: d.id, name: d.name, params: { type: d.type, base: d.base, accent: d.accent, accent2: d.accent2, finish: d.finish, mix: !!d.mix }, color: d.color, style: d.style, season: d.season, shape: d.shape, length: d.length, extra: d.extra, popular: !!d.popular, active: !!d.active,
    dataUrl: dImg?.startsWith('data:') ? dImg : undefined, remove_image: !dImg } }); await reload('Дизайн сохранён'); });
A.dDel = async (el) => { if (!(await confirmSheet('Удалить дизайн?', 'Если дизайн уже выбирали в записях, он будет скрыт из каталога.', 'Удалить', true))) return; try { await api('/api/admin/designs/' + el.dataset.id, { method: 'DELETE' }); await reload('Готово'); } catch (e) { toast(e.message, 'err'); } };

// акции
route('/a/promos', async () => `<div class="page">${head('Акции', `<button class="icon-btn" data-act="prEdit" aria-label="Добавить акцию">${ic('plus')}</button>`)}
  <div class="col gap">${S.boot.promos.map((p) => `<button class="card promo-row ${p.active && p.date_to >= today() ? '' : 'dim'}" data-act="prEdit" data-id="${p.id}"><span class="promo-p">−${p.percent}%</span><div class="grow"><b>${esc(p.title)}</b><small class="muted">${esc(p.service_id ? svc(p.service_id)?.name || '' : 'Все услуги')}</small><small class="muted">${dShort(p.date_from)} — ${dShort(p.date_to)}${p.active ? (p.date_to < today() ? ' · завершена' : '') : ' · выключена'}</small></div>${ic('edit')}</button>`).join('') || '<div class="empty"><p>Акций пока нет</p></div>'}</div>
  <p class="muted small">Скидка применяется автоматически при онлайн-записи на дату в период акции и показывается клиентам на главной.</p></div>`, O);
A.prEdit = (el) => { const p = S.boot.promos.find((x) => x.id === +el.dataset.id) || { active: 1, percent: 10, date_from: today(), date_to: addDays(today(), 30) };
  sheet(`<h3>${p.id ? 'Акция' : 'Новая акция'}</h3><form class="col gap" data-submit="prSave"><input type="hidden" name="id" value="${p.id || ''}">${fld('Название', `<input class="inp" name="title" value="${esc(p.title || '')}" required maxlength="80">`)}${fld('Описание', `<input class="inp" name="description" value="${esc(p.description || '')}" maxlength="300">`)}
    <div class="row gap">${fld('Скидка, %', `<input class="inp" type="number" name="percent" min="1" max="90" value="${p.percent}">`)}${fld('Услуга', `<select class="inp" name="service_id"><option value="">Все услуги</option>${S.boot.services.map((s) => opt(s.id, s.name, p.service_id)).join('')}</select>`)}</div>
    <div class="row gap">${fld('С', `<input class="inp" type="date" name="date_from" value="${p.date_from}" required>`)}${fld('По', `<input class="inp" type="date" name="date_to" value="${p.date_to}" required>`)}</div>
    ${sw('active', 'Акция включена', p.active)}<div class="row gap">${p.id ? `<button type="button" class="btn ghost danger-t" data-act="prDel" data-id="${p.id}">Удалить</button>` : ''}<button class="btn grow">Сохранить</button></div></form>`); };
A.prSave = (f) => busy(f.querySelector('button.grow'), async () => { const d = formData(f); await api('/api/admin/promos', { body: { ...d, active: !!d.active } }); await reload('Акция сохранена'); });
A.prDel = async (el) => { try { await api('/api/admin/promos/' + el.dataset.id, { method: 'DELETE' }); await reload('Акция удалена'); } catch (e) { toast(e.message, 'err'); } };

// бонусы
route('/a/loyalty', async () => { const s = S.boot.settings;
  return `<div class="page">${head('Бонусная программа')}<form class="card col gap" data-submit="loySave">
    <div class="row gap">${fld('Приветственные бонусы', `<input class="inp" type="number" name="welcome_bonus" min="0" value="${s.welcome_bonus}">`)}${fld('Макс. оплата бонусами, %', `<input class="inp" type="number" name="bonus_max_pay_pct" min="0" max="100" value="${s.bonus_max_pay_pct}">`)}</div>
    <b>Уровни кэшбэка</b><div class="lvl lvl-h"><small>Название</small><small>Потрачено от, ₽</small><small>Кэшбэк, %</small></div>${s.levels.map((l, i) => `<div class="lvl"><input class="inp" name="n${i}" value="${esc(l.name)}" aria-label="Название уровня"><input class="inp" type="number" name="f${i}" min="0" value="${l.from}" ${i ? '' : 'readonly'} aria-label="Порог"><input class="inp" type="number" name="p${i}" min="0" max="50" value="${l.pct}" aria-label="Процент"></div>`).join('')}
    <button class="btn block">Сохранить</button></form><p class="muted small">1 бонус = 1 ₽. Бонусы начисляются при завершении визита от суммы, оплаченной деньгами или сертификатом.</p></div>`; }, O);
A.loySave = (f) => busy(f.querySelector('button'), async () => { const d = formData(f), levels = S.boot.settings.levels.map((_, i) => ({ name: d['n' + i], from: d['f' + i], pct: d['p' + i] }));
  await api('/api/admin/settings', { method: 'PUT', body: { welcome_bonus: d.welcome_bonus, bonus_max_pay_pct: d.bonus_max_pay_pct, levels } }); await reload('Настройки сохранены'); });

// сертификаты
route('/a/certs', async () => { const { items } = await api('/api/admin/certificates');
  return `<div class="page">${head('Подарочные сертификаты')}<form class="card col gap" data-submit="certNew"><b>Выпустить сертификат</b><div class="row gap">${fld('Сумма, ₽', '<input class="inp" type="number" name="amount" min="500" max="50000" step="500" value="3000" required>')}${fld('Получатель', '<input class="inp" name="recipient" maxlength="80">')}</div><button class="btn block">${ic('gift')} Выпустить</button></form>
    <h3 class="sec-t">Все сертификаты · ${items.length}</h3><div class="card list">${items.map((c) => `<div class="item ${c.balance ? '' : 'dim'}"><div class="grow"><b><code>${esc(c.code)}</code></b><small class="muted">${esc(c.recipient || 'без получателя')} · купил(а) ${esc(c.buyer || '—')} · ${esc(dHuman(c.created_at.slice(0, 10), false))}</small></div><div class="price"><b>${money(c.balance)}</b><small class="muted">из ${money(c.amount)}</small></div></div>`).join('')}</div></div>`; }, O);
A.certNew = (f) => busy(f.querySelector('button'), async () => { const r = await api('/api/certificates', { body: formData(f) }); toast('Сертификат ' + r.certificate.code + ' выпущен'); render(); });

// салон
route('/a/salon', async () => { const s = S.boot.salon;
  return `<div class="page">${head('О салоне')}<form class="card col gap" data-submit="salonSave">${fld('Название', `<input class="inp" name="salon_name" value="${esc(s.name)}" required>`)}${fld('Подзаголовок', `<input class="inp" name="salon_tagline" value="${esc(s.tagline)}">`)}${fld('Адрес', `<input class="inp" name="salon_address" value="${esc(s.address)}">`)}${fld('Телефон', `<input class="inp" name="salon_phone" value="${esc(s.phone)}">`)}${fld('Часы работы', `<input class="inp" name="salon_hours" value="${esc(s.hours)}">`)}<button class="btn block">Сохранить</button></form></div>`; }, O);
A.salonSave = (f) => busy(f.querySelector('button'), async () => { await api('/api/admin/settings', { method: 'PUT', body: formData(f) }); await reload('Сохранено'); });
