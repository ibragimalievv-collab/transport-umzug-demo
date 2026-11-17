// Экраны мастера + общая карточка клиента (используется и владельцем)
import { S, A, api, route, go, render, sheet, closeSheet, confirmSheet, toast, busy, formData, fileToDataUrl,
  esc, money, ic, thumb, avatar, dHuman, dur, today, addDays, parseD, WD, plural, endTime, phoneFmt, initials } from './core.js';
import { head, STATUS, designLine, portfolioItem, designCard } from './client.js';

export const dateNav = (date, base) => `<div class="datenav"><a class="icon-btn" href="#${base}date=${addDays(date, -1)}" aria-label="Предыдущий день">${ic('left')}</a>
  <label class="datenav-c"><b>${esc(dHuman(date))}</b><input type="date" value="${date}" data-change="navDate" data-base="${base}" aria-label="Выбрать дату"></label>
  <a class="icon-btn" href="#${base}date=${addDays(date, 1)}" aria-label="Следующий день">${ic('right')}</a></div>`;
A.navDate = (el) => el.value && go(el.dataset.base + 'date=' + el.value);

export const staffAppt = (a, role) => { const st = STATUS[a.status], canClose = a.status === 'booked' && a.date <= today();
  return `<div class="card appt ${a.status}" style="--c:${esc(a.master_color)}"><div class="row between"><b class="time">${esc(a.time)}–${endTime(a.time, a.duration)}</b><span class="badge ${st[1]}">${st[0]}</span></div>
    <div class="appt-b"><a class="client-l" href="#/${role === 'owner' ? 'a' : 'm'}/clients/${a.client_id}"><span class="ava sm" style="--c:#C9A9A6">${esc(initials(a.client))}</span><b>${esc(a.client)}</b>${ic('right')}</a>
      <b>${esc(a.service)}</b><small class="muted">${dur(a.duration)} · ${money(a.price - a.discount)}${role === 'owner' ? ' · ' + esc(a.master) : ''}</small>${designLine(a)}
      ${a.snapshot ? `<button class="snap" data-act="zoom" data-src="${esc(a.snapshot)}"><img src="${esc(a.snapshot)}" alt="Фото примерки клиента" loading="lazy"><span>Фото примерки</span></button>` : ''}
      ${a.comment ? `<p class="quote">«${esc(a.comment)}»</p>` : ''}${a.master_note ? `<p class="note">${ic('edit')} ${esc(a.master_note)}</p>` : ''}</div>
    <div class="row gap wrap">${canClose ? `<button class="btn sm grow" data-act="apStatus" data-id="${a.id}" data-s="done">${ic('check')} Завершить</button><button class="btn ghost sm" data-act="apStatus" data-id="${a.id}" data-s="noshow">Неявка</button>` : ''}
      <button class="btn soft sm" data-act="apNote" data-id="${a.id}" data-note="${esc(a.master_note)}">Заметка</button>${a.client_phone ? `<a class="btn soft sm" href="tel:+${esc(a.client_phone)}" aria-label="Позвонить">${ic('phone')}</a>` : ''}
      ${a.status === 'booked' && role === 'owner' ? `<button class="btn ghost sm danger-t" data-act="apCancel" data-id="${a.id}">Отменить</button>` : ''}</div></div>`; };
A.zoom = (el) => sheet(`<img class="zoom" src="${esc(el.dataset.src)}" alt="Фото примерки">`);
A.apStatus = async (el) => {
  const done = el.dataset.s === 'done';
  if (!(await confirmSheet(done ? 'Завершить визит?' : 'Отметить неявку?', done ? 'Клиенту начислятся бонусы и придёт просьба оставить отзыв.' : 'Клиент не пришёл. Списанные бонусы вернутся на его счёт.', done ? 'Завершить' : 'Неявка', !done))) return;
  try { await api(`/api/appointments/${el.dataset.id}/status`, { body: { status: el.dataset.s } }); toast(done ? 'Визит завершён' : 'Отмечена неявка'); render({ keep: true }); } catch (e) { toast(e.message, 'err'); }
};
A.apCancel = async (el) => {
  if (!(await confirmSheet('Отменить запись?', 'Клиент получит уведомление об отмене.', 'Отменить запись', true))) return;
  try { await api(`/api/appointments/${el.dataset.id}/cancel`, { method: 'POST' }); toast('Запись отменена'); render({ keep: true }); } catch (e) { toast(e.message, 'err'); }
};
A.apNote = (el) => sheet(`<h3>Заметка к визиту</h3><form class="col gap" data-submit="apNoteSave" data-id="${el.dataset.id}"><textarea class="inp" name="note" rows="4" maxlength="1000" placeholder="Материалы, оттенки, особенности">${esc(el.dataset.note || '')}</textarea><button class="btn block">Сохранить</button></form>`);
A.apNoteSave = (f) => busy(f.querySelector('button'), async () => { await api(`/api/appointments/${f.dataset.id}/note`, { method: 'PUT', body: formData(f) }); closeSheet(); toast('Заметка сохранена'); render({ keep: true }); });

// ---------- Расписание мастера ----------
route('/m', async ({ query }) => {
  const date = /^\d{4}-\d\d-\d\d$/.test(query.date) ? query.date : today();
  const dt = parseD(date), monday = addDays(date, -((dt.getDay() + 6) % 7));
  const [d, w] = await Promise.all([api('/api/master/day?date=' + date), api('/api/master/week?from=' + monday)]);
  const off = !d.schedule || d.schedule.off, act = d.items.filter((a) => a.status !== 'noshow');
  const sum = act.reduce((s, a) => s + a.price - a.discount, 0);
  return `<div class="page">${head('Моё расписание', `<a class="icon-btn" href="#/notifications" aria-label="Уведомления">${ic('bell')}${S.unread ? '<i class="dot"></i>' : ''}</a>`, false)}
    <div class="kpis"><div><small>Визитов за месяц</small><b>${d.month.visits}</b></div><div><small>Выручка</small><b>${money(d.month.revenue)}</b></div><div><small>Моя зарплата (${d.master.commission}%)</small><b>${money(d.month.salary)}</b></div></div>
    <div class="week">${w.days.map((x) => { const t = parseD(x.date); return `<a class="day ${x.date === date ? 'on' : ''} ${x.off ? 'offd' : ''}" href="#/m?date=${x.date}"><small>${WD[t.getDay()]}</small><b>${t.getDate()}</b><i>${x.off ? 'вых' : x.count || '·'}</i></a>`; }).join('')}</div>
    ${dateNav(date, '/m?')}
    <p class="muted small">${off ? 'Выходной по графику' : `Рабочий день ${d.schedule.start}–${d.schedule.end} · ${plural(act.length, 'запись', 'записи', 'записей')} · ${money(sum)}`}</p>
    <div class="col gap">${d.items.map((a) => staffAppt(a, 'master')).join('') || `<div class="empty">${ic('cal')}<p>${off ? 'Отдыхайте — записей нет' : 'На этот день записей пока нет'}</p></div>`}</div></div>`;
}, ['master']);

// ---------- Клиенты ----------
export const clientsList = (items, base) => `<input class="inp search" type="search" placeholder="Поиск по имени или телефону" data-input="cSearch" aria-label="Поиск клиента">
  <div class="card list" id="clist">${items.map((c) => `<a class="item" href="#${base}/${c.id}" data-q="${esc((c.name + ' ' + c.phone).toLowerCase())}"><span class="ava sm" style="--c:#C9A9A6">${esc(initials(c.name))}</span><div class="grow"><b>${esc(c.name)}</b><small class="muted">${esc(phoneFmt(c.phone))} · ${plural(c.visits, 'визит', 'визита', 'визитов')}${c.last_visit ? ' · был(а) ' + esc(dHuman(c.last_visit, false)) : ''}</small></div>
    <div class="price"><b>${money(c.total_spent)}</b>${c.next_visit ? `<small class="ok-t">запись ${esc(dHuman(c.next_visit, false))}</small>` : ''}</div></a>`).join('') || '<p class="muted pad">Клиентов пока нет</p>'}</div>`;
A.cSearch = (el) => { const v = el.value.trim().toLowerCase(), d = v.replace(/\D/g, ''); document.querySelectorAll('#clist .item').forEach((i) => { i.hidden = !!v && !i.dataset.q.includes(v) && !(d && i.dataset.q.includes(d)); }); };
route('/m/clients', async () => { const { items } = await api('/api/master/clients'); return `<div class="page">${head('Мои клиенты', '', false)}${clientsList(items, '/m/clients')}</div>`; }, ['master']);

export async function clientCard(id, role) {
  const { client: c, history, favorites } = await api('/api/clients/' + id);
  const lastDesign = history.find((a) => a.design || a.tryon?.color);
  return `<div class="page">${head('Карточка клиента')}
    <div class="mhero"><span class="ava xl" style="--c:#C9A9A6">${esc(initials(c.name))}</span><h2>${esc(c.name)}</h2>
      <p class="muted">${esc(phoneFmt(c.phone))}${c.birthday ? ' · ДР ' + esc(dHuman(c.birthday, false).replace(/^(Сегодня|Завтра), /, '')) : ''}</p>
      <div class="row gap center">${c.phone ? `<a class="btn soft sm" href="tel:+${esc(c.phone)}">${ic('phone')} Позвонить</a>` : ''}</div></div>
    <div class="kpis"><div><small>Визитов</small><b>${c.visits}</b></div><div><small>Потрачено</small><b>${money(c.total_spent)}</b></div><div><small>Бонусы · ${esc(c.level.name)}</small><b>${c.bonus}</b></div></div>
    ${lastDesign ? `<h3 class="sec-t">Выбранный дизайн</h3><div class="card">${designLine(lastDesign)}<small class="muted">${esc(dHuman(lastDesign.date, false))} · ${esc(lastDesign.service)}</small>${lastDesign.snapshot ? `<button class="snap" data-act="zoom" data-src="${esc(lastDesign.snapshot)}"><img src="${esc(lastDesign.snapshot)}" alt="Фото примерки"><span>Фото примерки</span></button>` : ''}</div>` : ''}
    <h3 class="sec-t">Заметки</h3><form class="card col gap" data-submit="cNotes" data-id="${c.id}"><textarea class="inp" name="notes" rows="3" maxlength="2000" placeholder="Аллергии, предпочтения, любимые оттенки…">${esc(c.notes)}</textarea>
      ${role === 'owner' ? `<label class="field"><span>Бонусный баланс</span><input class="inp" type="number" name="bonus" min="0" value="${c.bonus}"></label>` : ''}<button class="btn soft">Сохранить</button></form>
    ${favorites.length ? `<h3 class="sec-t">Избранные дизайны</h3><div class="hscroll">${favorites.map(designCard).join('')}</div>` : ''}
    <h3 class="sec-t">История визитов · ${history.length}</h3><div class="col gap">${history.map((a) => `<div class="card appt ${a.status}"><div class="row between"><b>${esc(dHuman(a.date, false))}, ${esc(a.time)}</b><span class="badge ${STATUS[a.status][1]}">${STATUS[a.status][0]}</span></div>
      <div class="appt-b"><b>${esc(a.service)}</b><small class="muted">${esc(a.master)} · ${money(a.price - a.discount)}</small>${designLine(a)}${a.comment ? `<p class="quote">«${esc(a.comment)}»</p>` : ''}${a.master_note ? `<p class="note">${ic('edit')} ${esc(a.master_note)}</p>` : ''}</div></div>`).join('') || '<p class="muted">Визитов пока не было</p>'}</div></div>`;
}
A.cNotes = (f) => busy(f.querySelector('button'), async () => { await api('/api/clients/' + f.dataset.id, { method: 'PUT', body: formData(f) }); toast('Сохранено'); });
route('/m/clients/:id', ({ params }) => clientCard(params.id, 'master'), ['master']);

// ---------- Портфолио ----------
route('/m/portfolio', async () => {
  const { portfolio } = await api('/api/masters/' + S.user.master_id);
  return `<div class="page">${head('Портфолио', '', false)}
    <div class="row gap"><label class="btn grow">${ic('camera')} Загрузить фото<input type="file" accept="image/*" hidden data-change="pUpload"></label><button class="btn soft grow" data-act="pPick">${ic('grid')} Из каталога</button></div>
    <p class="muted small">Работы видят клиенты на вашей странице. ${plural(portfolio.length, 'работа', 'работы', 'работ')}.</p>
    <div class="pgrid">${portfolio.map((p) => portfolioItem(p, true)).join('')}</div>${portfolio.length ? '' : `<div class="empty">${ic('image')}<p>Добавьте первые работы</p></div>`}</div>`;
}, ['master']);
A.pUpload = async (el) => { const f = el.files?.[0]; el.value = ''; if (!f) return;
  try { const dataUrl = await fileToDataUrl(f, 1280); await api('/api/master/portfolio', { body: { dataUrl } }); toast('Фото добавлено'); render({ keep: true }); } catch (e) { toast(e.message, 'err'); } };
A.pPick = () => sheet(`<h3>Дизайн из каталога</h3><div class="dgrid three">${S.boot.designs.map((d) => `<button class="dcard" data-act="pAdd" data-id="${d.id}"><div class="dcard-img">${thumb(d)}</div><div class="dcard-t"><b>${esc(d.name)}</b></div></button>`).join('')}</div>`, { wide: true });
A.pAdd = async (el) => { try { await api('/api/master/portfolio', { body: { design_id: +el.dataset.id } }); closeSheet(); toast('Добавлено в портфолио'); render({ keep: true }); } catch (e) { toast(e.message, 'err'); } };
A.pDel = async (el) => { if (!(await confirmSheet('Удалить работу?', 'Она исчезнет из вашего портфолио.', 'Удалить', true))) return;
  try { await api('/api/master/portfolio/' + el.dataset.id, { method: 'DELETE' }); render({ keep: true }); } catch (e) { toast(e.message, 'err'); } };

// ---------- Профиль мастера ----------
route('/m/profile', async () => {
  const m = S.boot.masters.find((x) => x.id === S.user.master_id) || {};
  return `<div class="page">${head('Профиль', '', false)}<div class="mhero">${avatar(m, 'xl')}<h2>${esc(m.name)}</h2><p class="muted">${esc(S.user.email || '')}</p></div>
    <form class="card col gap" data-submit="mProfile"><label class="field"><span>Специализация</span><input class="inp" name="title" value="${esc(m.title)}" maxlength="80"></label>
      <label class="field"><span>О себе (видят клиенты)</span><textarea class="inp" name="bio" rows="4" maxlength="600">${esc(m.bio)}</textarea></label><button class="btn block">Сохранить</button></form>
    <h3 class="sec-t">Мой график</h3><div class="card list">${[1, 2, 3, 4, 5, 6, 0].map((wd) => { const s = m.schedule?.find((x) => x.weekday === wd); return `<div class="item"><div class="grow"><b>${['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][wd]}</b></div><span class="${!s || s.off ? 'muted' : ''}">${!s || s.off ? 'выходной' : s.start + '–' + s.end}</span></div>`; }).join('')}</div>
    <p class="muted small">График меняет владелец салона.</p>
    <a class="btn soft block mt" href="#/me/profile">${ic('gear')} Имя и пароль</a><button class="btn ghost block mt" data-act="logout">${ic('logout')} Выйти</button></div>`;
}, ['master']);
A.mProfile = (f) => busy(f.querySelector('button'), async () => { await api('/api/master/profile', { method: 'PUT', body: formData(f) }); const { loadBoot } = await import('./core.js'); await loadBoot(); toast('Сохранено'); });
