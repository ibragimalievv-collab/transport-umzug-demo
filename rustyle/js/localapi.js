// СГЕНЕРИРОВАНО scripts/build-static.mjs — не редактировать.
// «Сервер в браузере» для демо на статическом хостинге: тот же код server.js и db.js,
// но SQLite работает через sql.js (WebAssembly), а данные сохраняются в IndexedDB этого устройства.
/* eslint-disable */
function __db(module, exports, require, process, __dirname, Buffer, setInterval) {
// База данных (SQLite, встроенный модуль Node.js) + демо-данные
process.removeAllListeners('warning');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'salon.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, role TEXT NOT NULL DEFAULT 'client', name TEXT NOT NULL,
  phone TEXT UNIQUE, email TEXT UNIQUE, pass TEXT, birthday TEXT,
  bonus INTEGER NOT NULL DEFAULT 0, total_spent INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS services(
  id INTEGER PRIMARY KEY, category TEXT NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '',
  duration INTEGER NOT NULL, price INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS masters(
  id INTEGER PRIMARY KEY, user_id INTEGER, name TEXT NOT NULL, title TEXT DEFAULT '', bio TEXT DEFAULT '',
  color TEXT DEFAULT '#C98B8B', photo TEXT, commission INTEGER NOT NULL DEFAULT 40, experience INTEGER DEFAULT 3,
  active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS master_services(master_id INTEGER, service_id INTEGER, PRIMARY KEY(master_id, service_id));
CREATE TABLE IF NOT EXISTS schedules(master_id INTEGER, weekday INTEGER, start TEXT, end TEXT, off INTEGER DEFAULT 0, PRIMARY KEY(master_id, weekday));
CREATE TABLE IF NOT EXISTS designs(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, params TEXT NOT NULL, color TEXT, style TEXT, season TEXT,
  shape TEXT DEFAULT 'almond', length TEXT DEFAULT 'medium', extra INTEGER DEFAULT 0, popular INTEGER DEFAULT 0,
  image TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT (datetime('now','localtime')));
CREATE TABLE IF NOT EXISTS favorites(user_id INTEGER, design_id INTEGER, PRIMARY KEY(user_id, design_id));
CREATE TABLE IF NOT EXISTS appointments(
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL, master_id INTEGER NOT NULL, service_id INTEGER NOT NULL,
  design_id INTEGER, tryon TEXT, snapshot TEXT, date TEXT NOT NULL, time TEXT NOT NULL, duration INTEGER NOT NULL,
  price INTEGER NOT NULL, discount INTEGER DEFAULT 0, bonus_used INTEGER DEFAULT 0, cert_used INTEGER DEFAULT 0,
  cert_code TEXT, bonus_earned INTEGER DEFAULT 0, promo_id INTEGER, status TEXT NOT NULL DEFAULT 'booked',
  comment TEXT DEFAULT '', master_note TEXT DEFAULT '', r24 INTEGER DEFAULT 0, r2 INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')));
CREATE INDEX IF NOT EXISTS ix_appt_date ON appointments(date, master_id);
CREATE TABLE IF NOT EXISTS reviews(
  id INTEGER PRIMARY KEY, appointment_id INTEGER UNIQUE, client_id INTEGER, master_id INTEGER,
  rating INTEGER, text TEXT, created_at TEXT DEFAULT (datetime('now','localtime')));
CREATE TABLE IF NOT EXISTS portfolio(id INTEGER PRIMARY KEY, master_id INTEGER, design_id INTEGER, image TEXT, title TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now','localtime')));
CREATE TABLE IF NOT EXISTS certificates(
  id INTEGER PRIMARY KEY, code TEXT UNIQUE, amount INTEGER, balance INTEGER, buyer_id INTEGER,
  recipient TEXT DEFAULT '', message TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now','localtime')));
CREATE TABLE IF NOT EXISTS promos(
  id INTEGER PRIMARY KEY, title TEXT, description TEXT DEFAULT '', percent INTEGER DEFAULT 10, service_id INTEGER,
  date_from TEXT, date_to TEXT, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, body TEXT, kind TEXT DEFAULT 'info', appointment_id INTEGER,
  is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now','localtime')));
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
`);

const q = (sql, ...a) => db.prepare(sql).all(...a);
const q1 = (sql, ...a) => db.prepare(sql).get(...a);
const run = (sql, ...a) => db.prepare(sql).run(...a);
const tx = (fn) => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };

function hashPass(p, salt = crypto.randomBytes(12).toString('hex')) {
  return salt + ':' + crypto.scryptSync(String(p), salt, 32).toString('hex');
}
function checkPass(p, stored) {
  if (!stored) return false;
  const [salt, h] = stored.split(':');
  const a = Buffer.from(h, 'hex'), b = crypto.scryptSync(String(p), salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

const DEFAULT_SETTINGS = {
  salon_name: 'Rustyle', salon_tagline: 'Салон красоты · Анапа', salon_address: 'г. Анапа',
  salon_phone: '', salon_hours: 'Ежедневно 10:00–21:00',
  welcome_bonus: '300', bonus_max_pay_pct: '30',
  levels: JSON.stringify([
    { name: 'Жемчуг', from: 0, pct: 3 }, { name: 'Розовое золото', from: 15000, pct: 5 }, { name: 'Бриллиант', from: 40000, pct: 7 }]),
};

function seed() {
  if (q1('SELECT COUNT(*) c FROM users').c > 0) return;
  let s = 20240607; // детерминированный генератор случайных чисел
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  tx(() => {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) run('INSERT OR IGNORE INTO settings VALUES(?,?)', k, v);

    const SERVICES = [
      ['Маникюр', 'Маникюр без покрытия', 'Комбинированный или аппаратный маникюр, придание формы', 60, 1500],
      ['Маникюр', 'Маникюр с покрытием гель-лак', 'Маникюр, выравнивание, однотонное покрытие', 90, 2600],
      ['Маникюр', 'Маникюр с укреплением и гель-лаком', 'Укрепление гелем или акригелем, покрытие', 120, 3200],
      ['Маникюр', 'Снятие + маникюр + гель-лак', 'Бережное снятие старого покрытия и новое', 120, 2900],
      ['Маникюр', 'Японский маникюр', 'Оздоравливающий уход, полировка с пастой и пудрой', 60, 2200],
      ['Наращивание', 'Наращивание ногтей гелем', 'Моделирование на формах, любая длина и форма', 180, 4500],
      ['Наращивание', 'Коррекция наращивания', 'Коррекция отросшей длины, новое покрытие', 150, 3600],
      ['Педикюр', 'Педикюр без покрытия', 'Аппаратный педикюр, обработка стоп', 90, 2800],
      ['Педикюр', 'Педикюр с покрытием гель-лак', 'Полный педикюр и стойкое покрытие', 120, 3500],
      ['Педикюр', 'Экспресс-педикюр (пальчики)', 'Обработка пальцев и покрытие', 60, 2300],
      ['Дизайн', 'Френч / лунный дизайн', 'Классический или цветной френч на все ногти', 30, 600],
      ['Дизайн', 'Художественный дизайн (все ногти)', 'Роспись, втирка, слайдеры, стемпинг', 30, 900],
      ['Уход', 'SPA-уход для рук', 'Пилинг, маска, массаж рук, парафинотерапия', 30, 1200],
      ['Уход', 'Снятие покрытия', 'Аппаратное снятие гель-лака без повреждений', 30, 500],
      ['Комплексы', 'Маникюр + педикюр с покрытием', 'В четыре руки или последовательно. Выгода 600 ₽', 210, 5500],
      ['Комплексы', 'Мужской маникюр', 'Аккуратная обработка, полировка', 60, 1700],
    ];
    SERVICES.forEach((x, i) => run('INSERT INTO services(category,name,description,duration,price,sort) VALUES(?,?,?,?,?,?)', ...x, i));

    // Пользователи
    // SEED=empty — «чистый» салон: только услуги и владелец (OWNER_EMAIL / OWNER_PASSWORD)
    const empty = process.env.SEED === 'empty';
    run("INSERT INTO users(role,name,phone,email,pass) VALUES('owner',?,?,?,?)", empty ? 'Владелец' : 'Елена Власова', empty ? null : '79000000001',
      (empty && process.env.OWNER_EMAIL || 'owner@rustyle.demo').toLowerCase(), hashPass(empty && process.env.OWNER_PASSWORD || 'owner123'));
    const MASTERS = [
      ['Анна Соколова', 'Топ-мастер', 'Обожаю сложные дизайны и идеальные блики. Работаю с 2016 года, призёр чемпионата Nail Pro.', '#C98B8B', 45, 9, 'master@rustyle.demo', '79000000002'],
      ['Мария Лебедева', 'Мастер маникюра и педикюра', 'Аккуратный комбинированный маникюр и педикюр, бережно к натуральным ногтям.', '#B58DB6', 40, 6, 'maria@rustyle.demo', '79000000003'],
      ['Виктория Орлова', 'Мастер-дизайнер', 'Роспись от руки, аэрография, корейские тренды. Каждый набор — маленькая коллекция.', '#D4A373', 40, 5, 'vika@rustyle.demo', '79000000004'],
      ['Дарья Ким', 'Мастер наращивания', 'Архитектура ногтя, наращивание любой сложности, укрепление.', '#8FAE9D', 42, 7, 'dasha@rustyle.demo', '79000000005'],
    ];
    const mIds = (empty ? [] : MASTERS).map(([name, title, bio, color, com, exp, email, phone]) => {
      const uid = run("INSERT INTO users(role,name,phone,email,pass) VALUES('master',?,?,?,?)", name, phone, email, hashPass('master123')).lastInsertRowid;
      return run('INSERT INTO masters(user_id,name,title,bio,color,commission,experience) VALUES(?,?,?,?,?,?,?)', uid, name, title, bio, color, com, exp).lastInsertRowid;
    });
    const MS = { 0: [1, 2, 3, 4, 5, 11, 12, 13, 14, 16], 1: [1, 2, 4, 8, 9, 10, 13, 14, 15, 16], 2: [1, 2, 3, 4, 11, 12, 14], 3: [2, 3, 4, 6, 7, 11, 14] };
    mIds.forEach((mid, i) => {
      MS[i].forEach((sid) => run('INSERT INTO master_services VALUES(?,?)', mid, sid));
      for (let wd = 0; wd < 7; wd++) {
        const off = (i === 0 && wd === 1) || (i === 1 && wd === 3) || (i === 2 && (wd === 0 || wd === 1)) || (i === 3 && (wd === 2 || wd === 6));
        run('INSERT INTO schedules VALUES(?,?,?,?,?)', mid, wd, i % 2 ? '11:00' : '10:00', i % 2 ? '21:00' : '20:00', off ? 1 : 0);
      }
    });

    // Дизайны: [название, тип, база, акцент, акцент2, финиш, цвет, стиль, сезон, форма, длина, доплата, популярный, mix]
    const D = [
      ['Молочный нюд', 'solid', '#F1DCD3', null, null, 'gloss', 'нюд', 'классика', 'всесезон', 'oval', 'short', 0, 1],
      ['Пудровая роза', 'solid', '#E8B4B8', null, null, 'gloss', 'розовый', 'классика', 'весна', 'almond', 'medium', 0, 1],
      ['Классический красный', 'solid', '#B3202A', null, null, 'gloss', 'красный', 'классика', 'всесезон', 'squoval', 'short', 0, 1],
      ['Вишня в шоколаде', 'solid', '#5A1220', null, null, 'gloss', 'красный', 'классика', 'осень', 'almond', 'medium', 0, 1],
      ['Чёрный бархат', 'solid', '#17141A', null, null, 'matte', 'чёрный', 'минимализм', 'зима', 'coffin', 'long', 0, 0],
      ['Белый френч', 'french', '#F3D9D0', '#FFFFFF', null, 'gloss', 'нюд', 'френч', 'всесезон', 'square', 'medium', 600, 1],
      ['Розовый френч', 'french', '#F6E1DC', '#F08FA9', null, 'gloss', 'розовый', 'френч', 'весна', 'almond', 'medium', 600, 0],
      ['Чёрный френч', 'french', '#EFD6CC', '#1B181D', null, 'gloss', 'чёрный', 'френч', 'осень', 'almond', 'long', 600, 0],
      ['Золотой френч', 'french', '#F2DCD2', '#D4AF6A', null, 'shimmer', 'золото', 'френч', 'зима', 'stiletto', 'long', 700, 1],
      ['Радужный френч', 'french', '#F5E3DD', '#7EC8E3', '#F7A8C4', 'gloss', 'мульти', 'френч', 'лето', 'almond', 'medium', 700, 0, 1],
      ['Baby boomer', 'ombre', '#F4C9CB', '#FFFFFF', null, 'gloss', 'нюд', 'омбре', 'всесезон', 'almond', 'medium', 700, 1],
      ['Закат на море', 'ombre', '#FF8E72', '#FFD166', null, 'gloss', 'оранжевый', 'омбре', 'лето', 'almond', 'long', 700, 0],
      ['Лавандовый туман', 'ombre', '#B9A6E0', '#F4E9F7', null, 'gloss', 'фиолетовый', 'омбре', 'весна', 'oval', 'medium', 700, 0],
      ['Глубина океана', 'ombre', '#0F4C75', '#7FD8E8', null, 'gloss', 'синий', 'омбре', 'лето', 'coffin', 'long', 700, 0],
      ['Шампань', 'glitter', '#EBD3B8', '#FFF4D6', null, 'shimmer', 'золото', 'блеск', 'зима', 'almond', 'medium', 500, 1],
      ['Розовое золото', 'glitter', '#E3A9A0', '#FFE3DA', null, 'shimmer', 'розовый', 'блеск', 'зима', 'almond', 'medium', 500, 1, 1],
      ['Звёздная ночь', 'glitter', '#1C2340', '#DDE6FF', null, 'shimmer', 'синий', 'блеск', 'зима', 'stiletto', 'long', 500, 0],
      ['Жидкое серебро', 'chrome', '#C9CDD6', '#FFFFFF', null, 'gloss', 'серебро', 'блеск', 'зима', 'almond', 'long', 600, 1],
      ['Жемчужная втирка', 'chrome', '#F3E4E6', '#FFFFFF', null, 'gloss', 'белый', 'блеск', 'всесезон', 'oval', 'short', 600, 1],
      ['Золотой хром', 'chrome', '#D8B36A', '#FFF3C4', null, 'gloss', 'золото', 'блеск', 'осень', 'coffin', 'long', 600, 0],
      ['Кошачий глаз «Изумруд»', 'cateye', '#0E3B2E', '#6FE3B4', null, 'gloss', 'зелёный', 'блеск', 'осень', 'almond', 'medium', 500, 1],
      ['Кошачий глаз «Бордо»', 'cateye', '#4A0D1C', '#FF8FA8', null, 'gloss', 'красный', 'блеск', 'зима', 'almond', 'medium', 500, 0],
      ['Кошачий глаз «Сапфир»', 'cateye', '#101A4D', '#8FB4FF', null, 'gloss', 'синий', 'блеск', 'зима', 'oval', 'medium', 500, 0],
      ['Горошек ретро', 'dots', '#F7EDE6', '#C0392B', null, 'gloss', 'красный', 'арт', 'лето', 'squoval', 'short', 900, 0],
      ['Монохром точки', 'dots', '#F1DDD4', '#1B181D', null, 'matte', 'чёрный', 'минимализм', 'всесезон', 'oval', 'short', 700, 0, 1],
      ['Морская полоска', 'stripes', '#FFFFFF', '#1F3A68', null, 'gloss', 'синий', 'арт', 'лето', 'square', 'short', 900, 0],
      ['Тонкие линии', 'lines', '#EED5CB', '#C9A36B', null, 'gloss', 'нюд', 'минимализм', 'всесезон', 'almond', 'medium', 700, 1, 1],
      ['Белый мрамор', 'marble', '#F6F3F1', '#8C8C96', '#D4AF6A', 'gloss', 'белый', 'арт', 'всесезон', 'coffin', 'long', 900, 1],
      ['Розовый кварц', 'marble', '#F5CDD3', '#FFFFFF', '#D4AF6A', 'gloss', 'розовый', 'арт', 'весна', 'almond', 'medium', 900, 0],
      ['Малахит', 'marble', '#156A52', '#0A3B2E', '#D4AF6A', 'gloss', 'зелёный', 'арт', 'осень', 'oval', 'medium', 900, 0],
      ['Сердечки', 'hearts', '#FBE4E6', '#E0435C', null, 'gloss', 'розовый', 'арт', 'весна', 'almond', 'medium', 900, 1, 1],
      ['Ромашки', 'flowers', '#BFE3F2', '#FFFFFF', '#F5C542', 'gloss', 'голубой', 'арт', 'лето', 'oval', 'short', 900, 1],
      ['Сакура', 'flowers', '#FCEFF1', '#F4A6BC', '#D6336C', 'gloss', 'розовый', 'арт', 'весна', 'almond', 'medium', 900, 0],
      ['Лунный нюд', 'halfmoon', '#D9A7A0', '#F8EDE8', null, 'gloss', 'нюд', 'минимализм', 'всесезон', 'oval', 'short', 600, 0],
      ['Геометрия терракот', 'geo', '#F2E2D5', '#C4623E', '#2F2A2B', 'matte', 'оранжевый', 'арт', 'осень', 'squoval', 'short', 900, 0],
      ['Звёздная пыль', 'stars', '#232046', '#F6D77A', null, 'gloss', 'фиолетовый', 'арт', 'зима', 'almond', 'long', 900, 0],
      ['Леопард', 'leopard', '#E9C9A3', '#8A5A2B', '#1B181D', 'gloss', 'нюд', 'арт', 'осень', 'almond', 'medium', 900, 1, 1],
      ['Аура', 'aura', '#F7D9E3', '#FF6FA5', null, 'gloss', 'розовый', 'арт', 'лето', 'almond', 'long', 800, 1],
      ['Аура «Северное сияние»', 'aura', '#CFE8FF', '#8B6CF6', null, 'gloss', 'фиолетовый', 'арт', 'зима', 'almond', 'long', 800, 0],
      ['Снежинки', 'snow', '#A9C7E8', '#FFFFFF', null, 'shimmer', 'голубой', 'арт', 'зима', 'oval', 'medium', 900, 0, 1],
      ['Мятная свежесть', 'solid', '#A8DCC8', null, null, 'gloss', 'зелёный', 'классика', 'весна', 'squoval', 'short', 0, 0],
      ['Лимонный сорбет', 'solid', '#F6E27A', null, null, 'gloss', 'жёлтый', 'классика', 'лето', 'oval', 'short', 0, 0],
    ];
    D.forEach(([name, type, base, accent, accent2, finish, color, style, season, shape, length, extra, popular, mix]) =>
      run('INSERT INTO designs(name,params,color,style,season,shape,length,extra,popular) VALUES(?,?,?,?,?,?,?,?,?)',
        name, JSON.stringify({ type, base, accent, accent2, finish, mix: mix ? 1 : 0 }), color, style, season, shape, length, extra, popular));
    const nD = D.length;
    if (empty) return;

    // Портфолио
    mIds.forEach((mid, i) => { for (let k = 0; k < 8; k++) run('INSERT INTO portfolio(master_id,design_id) VALUES(?,?)', mid, ((i * 9 + k * 5) % nD) + 1); });

    // Клиенты
    const CL = ['Ольга Миронова', 'Екатерина Белова', 'Алина Захарова', 'Юлия Новикова', 'Софья Кузнецова', 'Наталья Громова', 'Полина Зайцева',
      'Ирина Фролова', 'Вероника Тихонова', 'Кристина Павлова', 'Татьяна Ершова', 'Елизавета Морозова', 'Диана Волкова', 'Марина Савина'];
    const demoClient = run("INSERT INTO users(role,name,phone,email,pass,birthday,bonus,notes) VALUES('client','Ольга Миронова','79001112233','client@rustyle.demo',?,?,300,?)",
      hashPass('client123'), '1994-05-18', 'Любит нюдовые оттенки, чувствительная кутикула. Кофе без сахара.').lastInsertRowid;
    const cIds = [demoClient];
    CL.slice(1).forEach((n, i) => cIds.push(run("INSERT INTO users(role,name,phone,pass,bonus) VALUES('client',?,?,?,300)", n, '7900555' + pad(i) + pad(i * 3 + 11), hashPass('client123')).lastInsertRowid));

    // Записи: 45 дней назад … +10 дней вперёд
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const REV = ['Идеальный маникюр, ношу уже три недели — ни скола!', 'Очень уютно и аккуратно. Примерила дизайн заранее — получилось один в один.',
      'Мастер — волшебница, блики как в рекламе.', 'Быстро, чисто, красиво. Вернусь ещё.', 'Лучший салон в районе, кофе и атмосфера отдельная любовь.',
      'Спасибо за терпение с моим сложным дизайном!', 'Всё понравилось, форма идеальная.', 'Аккуратно и без боли, кутикула в порядке.'];
    const svc = (id) => q1('SELECT * FROM services WHERE id=?', id);
    const levels = JSON.parse(DEFAULT_SETTINGS.levels);
    const pctFor = (spent) => [...levels].reverse().find((l) => spent >= l.from).pct;
    for (let off = -45; off <= 10; off++) {
      const day = addDays(today, off), date = ymd(day), wd = day.getDay();
      mIds.forEach((mid, mi) => {
        const sch = q1('SELECT * FROM schedules WHERE master_id=? AND weekday=?', mid, wd);
        if (sch.off) return;
        let t = toMin(sch.start); const end = toMin(sch.end);
        const fill = off > 3 ? 0.3 : off >= 0 ? 0.55 : 0.72;
        while (t < end - 60) {
          if (rnd() > fill) { t += 60; continue; }
          const sv = svc(pick(MS[mi]));
          if (t + sv.duration > end) { t += 30; continue; }
          const cid = (off >= 0 && rnd() < 0.03) || (off < 0 && rnd() < 0.05) ? demoClient : pick(cIds.slice(1));
          const clash = q1("SELECT 1 x FROM appointments WHERE client_id=? AND date=? AND status!='cancelled'", cid, date);
          if (clash) { t += 30; continue; }
          const withDesign = sv.category !== 'Уход' && rnd() < 0.6;
          const did = withDesign ? Math.floor(rnd() * nD) + 1 : null;
          const extra = did ? D[did - 1][11] : 0;
          const price = sv.price + extra;
          let status = 'booked', earned = 0;
          if (off < 0) { const r = rnd(); status = r < 0.9 ? 'done' : r < 0.95 ? 'cancelled' : 'noshow'; }
          if (status === 'done') {
            const u = q1('SELECT total_spent FROM users WHERE id=?', cid);
            earned = Math.round(price * pctFor(u.total_spent) / 100);
            run('UPDATE users SET total_spent=total_spent+?, bonus=bonus+? WHERE id=?', price, earned, cid);
          }
          const id = run(`INSERT INTO appointments(client_id,master_id,service_id,design_id,date,time,duration,price,bonus_earned,status,comment,r24,r2,created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, cid, mid, sv.id, did, date, toTime(t), sv.duration, price, earned, status,
            rnd() < 0.15 ? 'Хочу покороче и помягче форму' : '', off < 1 ? 1 : 0, off < 0 ? 1 : 0, ymd(addDays(day, -3)) + ' 12:00:00').lastInsertRowid;
          if (status === 'done' && rnd() < 0.45) {
            run('INSERT INTO reviews(appointment_id,client_id,master_id,rating,text,created_at) VALUES(?,?,?,?,?,?)', id, cid, mid, rnd() < 0.82 ? 5 : 4, pick(REV), date + ' 20:00:00');
          }
          t += sv.duration + (rnd() < 0.5 ? 0 : 30);
        }
      });
    }
    // Гарантированная ближайшая запись демо-клиента (завтра или ближайший рабочий день Анны)
    for (let off = 1; off < 8; off++) {
      const day = addDays(today, off), date = ymd(day);
      if (q1('SELECT off FROM schedules WHERE master_id=? AND weekday=?', mIds[0], day.getDay()).off) continue;
      run("DELETE FROM appointments WHERE date=? AND (client_id=? OR (master_id=? AND time>='12:00' AND time<'14:30'))", date, demoClient, mIds[0]);
      run(`INSERT INTO appointments(client_id,master_id,service_id,design_id,date,time,duration,price,status,comment,tryon)
        VALUES(?,?,2,11,?,?,90,3300,'booked','Примерила в приложении — хочу именно такой!',?)`, demoClient, mIds[0], date, '12:30',
        JSON.stringify({ shape: 'almond', length: 'medium' }));
      break;
    }
    run('INSERT INTO favorites VALUES(?,?),(?,?),(?,?),(?,?)', demoClient, 11, demoClient, 6, demoClient, 19, demoClient, 31);

    // Акции
    const t0 = ymd(addDays(today, -5)), t1 = ymd(addDays(today, 30));
    run('INSERT INTO promos(title,description,percent,service_id,date_from,date_to) VALUES(?,?,?,?,?,?)', 'Счастливые часы', '−15% на маникюр + педикюр с покрытием до конца месяца', 15, 15, t0, t1);
    run('INSERT INTO promos(title,description,percent,service_id,date_from,date_to) VALUES(?,?,?,?,?,?)', 'SPA в подарок себе', '−20% на SPA-уход для рук', 20, 13, t0, t1);
    run('INSERT INTO promos(title,description,percent,service_id,date_from,date_to,active) VALUES(?,?,?,?,?,?,0)', 'Неделя наращивания', '−10% на наращивание гелем', 10, 6, t0, t1);

    // Сертификаты
    run("INSERT INTO certificates(code,amount,balance,buyer_id,recipient,message) VALUES('RUSTYLE-DEMO-3000',3000,3000,?,'Для любимой подруги','С днём рождения!')", demoClient);
    run("INSERT INTO certificates(code,amount,balance,buyer_id,recipient,message) VALUES('RUSTYLE-GIFT-5000',5000,2400,?,'Маме','С 8 Марта!')", cIds[3]);

    run("INSERT INTO notifications(user_id,title,body,kind) VALUES(?,?,?,'bonus')", demoClient, 'Добро пожаловать в Rustyle', 'Мы начислили вам 300 приветственных бонусов. 1 бонус = 1 ₽.');
  });
  console.log('Демо-данные созданы.');
}
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) run('INSERT OR IGNORE INTO settings VALUES(?,?)', k, v);
seed();

module.exports = { db, q, q1, run, tx, hashPass, checkPass, ymd, addDays, toMin, toTime, pad, DATA_DIR };

}
function __server(module, exports, require, process, __dirname, Buffer, setInterval) {
// Сервер приложения Rustyle: API + раздача PWA
const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { q, q1, run, tx, hashPass, checkPass, ymd, addDays, toMin, toTime, DATA_DIR } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));
// изоляция страницы: разрешает многопоточный WebAssembly (сеть контура ногтя считает в 2–4 раза быстрее)
app.use((req, res, next) => { res.setHeader('Cross-Origin-Opener-Policy', 'same-origin'); res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless'); res.setHeader('Cross-Origin-Resource-Policy', 'same-origin'); next(); });

// ---------- вспомогательное ----------
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };
const wrap = (fn) => (req, res, next) => { try { const r = fn(req, res); if (r !== undefined) res.json(r); } catch (e) { next(e); } };
const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const isTime = (s) => /^\d{2}:\d{2}$/.test(s || '');
const normPhone = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); if (d.length === 10) d = '7' + d; return d; };
const settings = () => Object.fromEntries(q('SELECT * FROM settings').map((r) => [r.key, r.value]));
const levels = () => JSON.parse(settings().levels);
const levelFor = (spent) => { const L = levels(); let cur = L[0], next = null; L.forEach((l, i) => { if (spent >= l.from) { cur = l; next = L[i + 1] || null; } }); return { ...cur, next }; };
const notify = (userId, title, body, kind = 'info', apptId = null) => run('INSERT INTO notifications(user_id,title,body,kind,appointment_id) VALUES(?,?,?,?,?)', userId, title, body, kind, apptId);
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const human = (date, time) => { const [, m, d] = date.split('-').map(Number); return `${d} ${MONTHS[m - 1]} в ${time}`; };

// ---------- сессии ----------
app.use((req, res, next) => {
  const m = /(?:^|;\s*)sid=([a-f0-9]{48})/.exec(req.headers.cookie || '');
  if (m) {
    const u = q1('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?', m[1]);
    if (u) { req.user = u; req.sid = m[1]; if (u.role === 'master') req.master = q1('SELECT * FROM masters WHERE user_id=?', u.id); }
  }
  next();
});
const auth = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Войдите в аккаунт' });
  if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Недостаточно прав' });
  next();
};
const publicUser = (u) => {
  if (!u) return null;
  const m = u.role === 'master' ? q1('SELECT id FROM masters WHERE user_id=?', u.id) : null;
  return { id: u.id, role: u.role, name: u.name, phone: u.phone, email: u.email, birthday: u.birthday, bonus: u.bonus, total_spent: u.total_spent, level: levelFor(u.total_spent), master_id: m?.id || null };
};
const startSession = (res, req, userId) => {
  const token = crypto.randomBytes(24).toString('hex');
  run('INSERT INTO sessions(token,user_id) VALUES(?,?)', token, userId);
  res.setHeader('Set-Cookie', `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 60}${req.secure ? '; Secure' : ''}`);
};
const attempts = new Map();
const throttle = (req) => {
  const k = req.ip, now = Date.now(), a = (attempts.get(k) || []).filter((t) => now - t < 10 * 60e3);
  if (a.length >= 20) fail(429, 'Слишком много попыток. Попробуйте через 10 минут');
  a.push(now); attempts.set(k, a);
};

app.post('/api/auth/login', wrap((req, res) => {
  throttle(req);
  const login = str(req.body.login, 100).toLowerCase();
  const u = login.includes('@') ? q1('SELECT * FROM users WHERE email=?', login) : q1('SELECT * FROM users WHERE phone=?', normPhone(login));
  if (!u || !checkPass(req.body.password, u.pass)) fail(400, 'Неверный логин или пароль');
  startSession(res, req, u.id);
  return { user: publicUser(u) };
}));
app.post('/api/auth/register', wrap((req, res) => {
  throttle(req);
  const name = str(req.body.name, 80), phone = normPhone(req.body.phone), password = String(req.body.password || '');
  if (name.length < 2) fail(400, 'Укажите имя');
  if (phone.length !== 11) fail(400, 'Укажите телефон в формате +7 900 000-00-00');
  if (password.length < 6) fail(400, 'Пароль — не короче 6 символов');
  const ex = q1('SELECT * FROM users WHERE phone=?', phone);
  let id;
  if (ex && ex.pass) fail(400, 'Этот телефон уже зарегистрирован — войдите');
  const welcome = int(settings().welcome_bonus);
  if (ex) { run('UPDATE users SET name=?, pass=?, bonus=bonus+? WHERE id=?', name, hashPass(password), welcome, ex.id); id = ex.id; } // клиента завёл администратор
  else id = run("INSERT INTO users(role,name,phone,pass,bonus) VALUES('client',?,?,?,?)", name, phone, hashPass(password), welcome).lastInsertRowid;
  if (welcome) notify(id, 'Добро пожаловать!', `Мы начислили вам ${welcome} приветственных бонусов. 1 бонус = 1 ₽.`, 'bonus');
  startSession(res, req, id);
  return { user: publicUser(q1('SELECT * FROM users WHERE id=?', id)) };
}));
app.post('/api/auth/logout', wrap((req, res) => { if (req.sid) run('DELETE FROM sessions WHERE token=?', req.sid); res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0'); return { ok: true }; }));
app.get('/api/me', wrap((req) => ({ user: publicUser(req.user) })));
app.put('/api/me', auth(), wrap((req) => {
  const name = str(req.body.name, 80); if (name.length < 2) fail(400, 'Укажите имя');
  const birthday = isDate(req.body.birthday) ? req.body.birthday : null;
  run('UPDATE users SET name=?, birthday=? WHERE id=?', name, birthday, req.user.id);
  if (req.body.password) { if (String(req.body.password).length < 6) fail(400, 'Пароль — не короче 6 символов'); run('UPDATE users SET pass=? WHERE id=?', hashPass(req.body.password), req.user.id); }
  return { user: publicUser(q1('SELECT * FROM users WHERE id=?', req.user.id)) };
}));

// ---------- каталог ----------
const mastersList = (all) => q(`SELECT m.*, (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.master_id=m.id) rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.master_id=m.id) reviews FROM masters m ${all ? '' : 'WHERE m.active=1'} ORDER BY m.id`)
  .map((m) => ({ ...m, services: q('SELECT service_id FROM master_services WHERE master_id=?', m.id).map((x) => x.service_id),
    schedule: q('SELECT weekday,start,end,off FROM schedules WHERE master_id=? ORDER BY weekday', m.id) }));
const designRow = (d) => ({ ...d, params: JSON.parse(d.params) });
const activePromos = () => { const t = ymd(new Date()); return q('SELECT * FROM promos WHERE active=1 AND date_from<=? AND date_to>=?', t, t); };

app.get('/api/bootstrap', wrap((req) => {
  const admin = req.user?.role === 'owner';
  const s = settings();
  return {
    user: publicUser(req.user),
    salon: { name: s.salon_name, tagline: s.salon_tagline, address: s.salon_address, phone: s.salon_phone, hours: s.salon_hours },
    settings: { levels: JSON.parse(s.levels), welcome_bonus: int(s.welcome_bonus), bonus_max_pay_pct: int(s.bonus_max_pay_pct) },
    services: q(`SELECT * FROM services ${admin ? '' : 'WHERE active=1'} ORDER BY sort,id`),
    masters: mastersList(admin).map((m) => admin ? m : { ...m, commission: undefined, user_id: undefined }),
    designs: q(`SELECT * FROM designs ${admin ? '' : 'WHERE active=1'} ORDER BY popular DESC, id`).map(designRow),
    promos: admin ? q('SELECT * FROM promos ORDER BY id DESC') : activePromos(),
    favorites: req.user ? q('SELECT design_id FROM favorites WHERE user_id=?', req.user.id).map((x) => x.design_id) : [],
    demo: process.env.DEMO !== '0',
  };
}));
app.get('/api/masters/:id', wrap((req) => {
  const id = int(req.params.id);
  return {
    portfolio: q('SELECT * FROM portfolio WHERE master_id=? ORDER BY id DESC', id),
    reviews: q(`SELECT r.id, r.rating, r.text, r.created_at, u.name client, s.name service FROM reviews r JOIN users u ON u.id=r.client_id
      LEFT JOIN appointments a ON a.id=r.appointment_id LEFT JOIN services s ON s.id=a.service_id WHERE r.master_id=? ORDER BY r.created_at DESC LIMIT 40`, id)
      .map((r) => ({ ...r, client: r.client.split(' ')[0] })),
  };
}));

// ---------- свободное время ----------
function freeSlots(masterId, date, duration, excludeId = 0) {
  const d = new Date(date + 'T00:00:00');
  const sch = q1('SELECT * FROM schedules WHERE master_id=? AND weekday=?', masterId, d.getDay());
  if (!sch || sch.off) return [];
  const busy = q("SELECT time,duration FROM appointments WHERE master_id=? AND date=? AND status IN ('booked','done') AND id!=?", masterId, date, excludeId)
    .map((a) => [toMin(a.time), toMin(a.time) + a.duration]);
  const now = new Date(), today = ymd(now);
  if (date < today) return [];
  const minStart = date === today ? now.getHours() * 60 + now.getMinutes() + 30 : 0;
  const out = [];
  for (let t = toMin(sch.start); t + duration <= toMin(sch.end); t += 30) {
    if (t < minStart) continue;
    if (busy.some(([a, b]) => t < b && t + duration > a)) continue;
    out.push(toTime(t));
  }
  return out;
}
const mastersFor = (serviceId) => q('SELECT m.* FROM masters m JOIN master_services ms ON ms.master_id=m.id WHERE ms.service_id=? AND m.active=1', serviceId);
function slotsFor(serviceId, masterId, date, excludeId) {
  const sv = q1('SELECT * FROM services WHERE id=?', serviceId); if (!sv) fail(400, 'Услуга не найдена');
  const ms = mastersFor(serviceId).filter((m) => !masterId || m.id === masterId);
  const map = {};
  for (const m of ms) for (const t of freeSlots(m.id, date, sv.duration, excludeId)) (map[t] ||= []).push(m.id);
  return Object.keys(map).sort().map((time) => ({ time, masters: map[time] }));
}
app.get('/api/slots', wrap((req) => {
  if (!isDate(req.query.date)) fail(400, 'Неверная дата');
  return { slots: slotsFor(int(req.query.service_id), int(req.query.master_id), req.query.date, int(req.query.exclude)) };
}));
// ближайшие дни со свободным временем (для календаря)
app.get('/api/days', wrap((req) => {
  const out = []; const t = new Date();
  for (let i = 0; i < 21; i++) { const date = ymd(addDays(t, i)); out.push({ date, free: slotsFor(int(req.query.service_id), int(req.query.master_id), date, int(req.query.exclude)).length }); }
  return { days: out };
}));

// ---------- записи ----------
const APPT_SQL = `SELECT a.*, s.name service, s.category, m.name master, m.color master_color, u.name client, u.phone client_phone,
  d.name design, d.params design_params, d.image design_image, (SELECT rating FROM reviews r WHERE r.appointment_id=a.id) review
  FROM appointments a JOIN services s ON s.id=a.service_id JOIN masters m ON m.id=a.master_id JOIN users u ON u.id=a.client_id
  LEFT JOIN designs d ON d.id=a.design_id`;
const apptRow = (a) => a && ({ ...a, design_params: a.design_params ? JSON.parse(a.design_params) : null, tryon: a.tryon ? JSON.parse(a.tryon) : null,
  pay: a.price - a.discount - a.bonus_used - a.cert_used });
const getAppt = (id) => apptRow(q1(APPT_SQL + ' WHERE a.id=?', id));

function saveImage(dataUrl) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) fail(400, 'Неверный формат изображения');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 5 * 1024 * 1024) fail(400, 'Изображение больше 5 МБ');
  const name = crypto.randomBytes(10).toString('hex') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
  fs.writeFileSync(path.join(DATA_DIR, 'uploads', name), buf);
  return '/uploads/' + name;
}
app.post('/api/upload', auth(), wrap((req) => ({ url: saveImage(req.body.dataUrl) })));

function priceFor(service, design, date) {
  const price = service.price + (design ? design.extra : 0);
  const promo = q('SELECT * FROM promos WHERE active=1 AND date_from<=? AND date_to>=? AND (service_id IS NULL OR service_id=?) ORDER BY percent DESC', date, date, service.id)[0];
  const discount = promo ? Math.round(service.price * promo.percent / 100) : 0;
  return { price, discount, promo };
}
function createAppointment({ clientId, body, byStaff }) {
  const service = q1('SELECT * FROM services WHERE id=? AND active=1', int(body.service_id)); if (!service) fail(400, 'Выберите услугу');
  if (!isDate(body.date) || !isTime(body.time)) fail(400, 'Выберите дату и время');
  const design = body.design_id ? q1('SELECT * FROM designs WHERE id=?', int(body.design_id)) : null;
  return tx(() => {
    const slot = slotsFor(service.id, int(body.master_id), body.date).find((s) => s.time === body.time);
    if (!slot) fail(409, 'Это время уже занято. Выберите другое');
    // «любой мастер»: берём наименее загруженного в этот день
    const load = (mid) => q1("SELECT COUNT(*) c FROM appointments WHERE master_id=? AND date=? AND status='booked'", mid, body.date).c;
    const masterId = [...slot.masters].sort((a, b) => load(a) - load(b))[0];
    const { price, discount, promo } = priceFor(service, design, body.date);
    let rest = price - discount, bonusUsed = 0, certUsed = 0, certCode = null;
    const client = q1('SELECT * FROM users WHERE id=?', clientId);
    if (!byStaff && body.use_bonus) {
      bonusUsed = Math.min(client.bonus, Math.floor(rest * int(settings().bonus_max_pay_pct) / 100));
      rest -= bonusUsed;
    }
    if (!byStaff && body.cert_code) {
      const c = q1('SELECT * FROM certificates WHERE code=?', str(body.cert_code, 40).toUpperCase());
      if (!c || c.balance <= 0) fail(400, 'Сертификат не найден или уже использован');
      certUsed = Math.min(c.balance, rest); certCode = c.code;
      run('UPDATE certificates SET balance=balance-? WHERE id=?', certUsed, c.id);
    }
    if (bonusUsed) run('UPDATE users SET bonus=bonus-? WHERE id=?', bonusUsed, clientId);
    const tryon = body.tryon && typeof body.tryon === 'object' ? JSON.stringify({ shape: str(body.tryon.shape, 20), length: str(body.tryon.length, 20), color: str(body.tryon.color, 9) || undefined, finish: str(body.tryon.finish, 12) || undefined }) : null;
    const snapshot = body.snapshot ? saveImage(body.snapshot) : null;
    const id = run(`INSERT INTO appointments(client_id,master_id,service_id,design_id,tryon,snapshot,date,time,duration,price,discount,bonus_used,cert_used,cert_code,promo_id,comment)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, clientId, masterId, service.id, design?.id || null, tryon, snapshot, body.date, body.time, service.duration,
      price, discount, bonusUsed, certUsed, certCode, promo?.id || null, str(body.comment, 400)).lastInsertRowid;
    const m = q1('SELECT * FROM masters WHERE id=?', masterId);
    notify(clientId, 'Вы записаны', `${service.name}, мастер ${m.name} — ${human(body.date, body.time)}. Мы напомним за сутки и за 2 часа.`, 'booking', id);
    if (m.user_id) notify(m.user_id, 'Новая запись', `${client.name}: ${service.name} — ${human(body.date, body.time)}${design ? `. Дизайн: ${design.name}` : ''}`, 'booking', id);
    return getAppt(id);
  });
}
function cancelAppointment(a, who) {
  tx(() => {
    run("UPDATE appointments SET status='cancelled' WHERE id=?", a.id);
    if (a.bonus_used) run('UPDATE users SET bonus=bonus+? WHERE id=?', a.bonus_used, a.client_id);
    if (a.cert_used && a.cert_code) run('UPDATE certificates SET balance=balance+? WHERE code=?', a.cert_used, a.cert_code);
    const m = q1('SELECT * FROM masters WHERE id=?', a.master_id);
    if (who !== 'client') notify(a.client_id, 'Запись отменена', `${a.service} — ${human(a.date, a.time)}. Списанные бонусы и сертификат возвращены.`, 'booking', a.id);
    else if (m.user_id) notify(m.user_id, 'Клиент отменил запись', `${a.client}: ${a.service} — ${human(a.date, a.time)}`, 'booking', a.id);
  });
}
const canTouch = (req, a) => {
  if (!a) fail(404, 'Запись не найдена');
  const u = req.user;
  if (u.role === 'owner' || (u.role === 'client' && a.client_id === u.id) || (u.role === 'master' && req.master?.id === a.master_id)) return a;
  fail(403, 'Недостаточно прав');
};
const isFuture = (a) => new Date(`${a.date}T${a.time}:00`) > new Date();

app.get('/api/price', wrap((req) => {
  const service = q1('SELECT * FROM services WHERE id=?', int(req.query.service_id)); if (!service) fail(400, 'Услуга не найдена');
  const design = q1('SELECT * FROM designs WHERE id=?', int(req.query.design_id));
  const p = priceFor(service, design, isDate(req.query.date) ? req.query.date : ymd(new Date()));
  return { ...p, promo: p.promo ? { title: p.promo.title, percent: p.promo.percent } : null };
}));
app.get('/api/my/appointments', auth('client'), wrap((req) => ({ items: q(APPT_SQL + ' WHERE a.client_id=? ORDER BY a.date DESC, a.time DESC', req.user.id).map(apptRow) })));
app.post('/api/appointments', auth('client'), wrap((req) => ({ appointment: createAppointment({ clientId: req.user.id, body: req.body }) })));
app.post('/api/appointments/:id/cancel', auth(), wrap((req) => {
  const a = canTouch(req, getAppt(int(req.params.id)));
  if (a.status !== 'booked') fail(400, 'Эту запись нельзя отменить');
  if (req.user.role === 'client' && !isFuture(a)) fail(400, 'Запись уже началась');
  cancelAppointment(a, req.user.role);
  return { appointment: getAppt(a.id) };
}));
app.post('/api/appointments/:id/reschedule', auth(), wrap((req) => {
  const a = canTouch(req, getAppt(int(req.params.id)));
  if (a.status !== 'booked') fail(400, 'Эту запись нельзя перенести');
  if (!isDate(req.body.date) || !isTime(req.body.time)) fail(400, 'Выберите дату и время');
  const masterId = int(req.body.master_id) || a.master_id;
  tx(() => {
    const slot = slotsFor(a.service_id, masterId, req.body.date, a.id).find((s) => s.time === req.body.time);
    if (!slot) fail(409, 'Это время уже занято. Выберите другое');
    run('UPDATE appointments SET date=?, time=?, master_id=?, r24=0, r2=0 WHERE id=?', req.body.date, req.body.time, masterId, a.id);
    const m = q1('SELECT * FROM masters WHERE id=?', masterId);
    const txt = `${a.service}: ${human(a.date, a.time)} → ${human(req.body.date, req.body.time)}`;
    if (req.user.role !== 'client') notify(a.client_id, 'Запись перенесена', txt, 'booking', a.id);
    else if (m.user_id) notify(m.user_id, 'Клиент перенёс запись', `${a.client}. ${txt}`, 'booking', a.id);
  });
  return { appointment: getAppt(a.id) };
}));
app.post('/api/appointments/:id/status', auth('master', 'owner'), wrap((req) => {
  const a = canTouch(req, getAppt(int(req.params.id)));
  const status = req.body.status;
  if (!['done', 'noshow'].includes(status)) fail(400, 'Неверный статус');
  if (a.status !== 'booked') fail(400, 'Статус уже установлен');
  if (a.date > ymd(new Date())) fail(400, 'Нельзя закрыть будущую запись');
  tx(() => {
    if (status === 'done') {
      const u = q1('SELECT * FROM users WHERE id=?', a.client_id);
      const paid = a.price - a.discount - a.bonus_used; // сертификат — это деньги, бонусы — нет
      const earned = Math.round(paid * levelFor(u.total_spent).pct / 100);
      run("UPDATE appointments SET status='done', bonus_earned=? WHERE id=?", earned, a.id);
      run('UPDATE users SET bonus=bonus+?, total_spent=total_spent+? WHERE id=?', earned, paid, a.client_id);
      notify(a.client_id, `Спасибо за визит! +${earned} бонусов`, `Как вам ${a.service.toLowerCase()} у мастера ${a.master}? Оставьте отзыв — это займёт минуту.`, 'review', a.id);
    } else {
      run("UPDATE appointments SET status='noshow' WHERE id=?", a.id);
      if (a.bonus_used) run('UPDATE users SET bonus=bonus+? WHERE id=?', a.bonus_used, a.client_id);
      if (a.cert_used && a.cert_code) run('UPDATE certificates SET balance=balance+? WHERE code=?', a.cert_used, a.cert_code);
    }
  });
  return { appointment: getAppt(a.id) };
}));
app.put('/api/appointments/:id/note', auth('master', 'owner'), wrap((req) => {
  const a = canTouch(req, getAppt(int(req.params.id)));
  run('UPDATE appointments SET master_note=? WHERE id=?', str(req.body.note, 1000), a.id);
  return { ok: true };
}));
app.post('/api/appointments/:id/review', auth('client'), wrap((req) => {
  const a = canTouch(req, getAppt(int(req.params.id)));
  if (a.status !== 'done') fail(400, 'Отзыв можно оставить после визита');
  if (a.review) fail(400, 'Вы уже оставили отзыв');
  const rating = Math.max(1, Math.min(5, int(req.body.rating, 5)));
  run('INSERT INTO reviews(appointment_id,client_id,master_id,rating,text) VALUES(?,?,?,?,?)', a.id, a.client_id, a.master_id, rating, str(req.body.text, 1000));
  return { ok: true };
}));

// ---------- избранное, бонусы, сертификаты, уведомления ----------
app.post('/api/favorites/:id', auth(), wrap((req) => {
  const id = int(req.params.id);
  const has = q1('SELECT 1 x FROM favorites WHERE user_id=? AND design_id=?', req.user.id, id);
  if (has) run('DELETE FROM favorites WHERE user_id=? AND design_id=?', req.user.id, id); else run('INSERT INTO favorites VALUES(?,?)', req.user.id, id);
  return { favorite: !has };
}));
app.get('/api/my/loyalty', auth('client'), wrap((req) => ({
  user: publicUser(q1('SELECT * FROM users WHERE id=?', req.user.id)),
  history: q("SELECT a.id, a.date, a.bonus_earned, a.bonus_used, a.status, s.name service FROM appointments a JOIN services s ON s.id=a.service_id WHERE a.client_id=? AND (a.bonus_earned>0 OR (a.bonus_used>0 AND a.status IN ('booked','done'))) ORDER BY a.date DESC LIMIT 30", req.user.id),
  certificates: q('SELECT * FROM certificates WHERE buyer_id=? ORDER BY id DESC', req.user.id),
})));
app.post('/api/certificates', auth('client', 'owner'), wrap((req) => {
  const amount = int(req.body.amount);
  if (amount < 500 || amount > 50000) fail(400, 'Сумма сертификата — от 500 до 50 000 ₽');
  const code = 'RUSTYLE-' + crypto.randomBytes(2).toString('hex').toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
  run('INSERT INTO certificates(code,amount,balance,buyer_id,recipient,message) VALUES(?,?,?,?,?,?)', code, amount, amount, req.user.id, str(req.body.recipient, 80), str(req.body.message, 300));
  if (req.user.role === 'client') notify(req.user.id, 'Сертификат оформлен', `Сертификат на ${amount} ₽, код ${code}. Оплата — в салоне или по ссылке от администратора.`, 'gift');
  return { certificate: q1('SELECT * FROM certificates WHERE code=?', code) };
}));
app.get('/api/certificates/check', auth(), wrap((req) => {
  const c = q1('SELECT code, amount, balance FROM certificates WHERE code=?', str(req.query.code, 40).toUpperCase());
  if (!c) fail(404, 'Сертификат не найден');
  if (c.balance <= 0) fail(400, 'Сертификат уже использован');
  return { certificate: c };
}));
app.get('/api/notifications', auth(), wrap((req) => ({ items: q('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50', req.user.id) })));
app.post('/api/notifications/read', auth(), wrap((req) => { run('UPDATE notifications SET is_read=1 WHERE user_id=?', req.user.id); return { ok: true }; }));

// ---------- мастер ----------
app.get('/api/master/day', auth('master'), wrap((req) => {
  const date = isDate(req.query.date) ? req.query.date : ymd(new Date());
  const sch = q1('SELECT * FROM schedules WHERE master_id=? AND weekday=?', req.master.id, new Date(date + 'T00:00:00').getDay());
  const items = q(APPT_SQL + " WHERE a.master_id=? AND a.date=? AND a.status!='cancelled' ORDER BY a.time", req.master.id, date).map(apptRow);
  const month = date.slice(0, 7);
  const st = q1("SELECT COUNT(*) n, COALESCE(SUM(price-discount),0) rev FROM appointments WHERE master_id=? AND status='done' AND substr(date,1,7)=?", req.master.id, month);
  return { date, schedule: sch, items, master: req.master, month: { visits: st.n, revenue: st.rev, salary: Math.round(st.rev * req.master.commission / 100) } };
}));
app.get('/api/master/week', auth('master'), wrap((req) => {
  const from = isDate(req.query.from) ? req.query.from : ymd(new Date());
  const out = [];
  for (let i = 0; i < 7; i++) {
    const date = ymd(addDays(new Date(from + 'T00:00:00'), i));
    const sch = q1('SELECT * FROM schedules WHERE master_id=? AND weekday=?', req.master.id, new Date(date + 'T00:00:00').getDay());
    out.push({ date, off: !sch || !!sch.off, start: sch?.start, end: sch?.end, count: q1("SELECT COUNT(*) c FROM appointments WHERE master_id=? AND date=? AND status IN ('booked','done')", req.master.id, date).c });
  }
  return { days: out };
}));
const clientsSql = (where) => `SELECT u.id, u.name, u.phone, u.bonus, u.total_spent, u.notes, u.birthday, u.created_at,
  (SELECT COUNT(*) FROM appointments a WHERE a.client_id=u.id AND a.status='done') visits,
  (SELECT MAX(date) FROM appointments a WHERE a.client_id=u.id AND a.status='done') last_visit,
  (SELECT MIN(date) FROM appointments a WHERE a.client_id=u.id AND a.status='booked' AND a.date>=date('now','localtime')) next_visit
  FROM users u WHERE u.role='client' ${where} ORDER BY u.name`;
app.get('/api/master/clients', auth('master'), wrap((req) => ({ items: q(clientsSql('AND u.id IN (SELECT client_id FROM appointments WHERE master_id=?)'), req.master.id) })));
app.get('/api/clients/:id', auth('master', 'owner'), wrap((req) => {
  const id = int(req.params.id);
  if (req.user.role === 'master' && !q1('SELECT 1 x FROM appointments WHERE client_id=? AND master_id=?', id, req.master.id)) fail(403, 'Это не ваш клиент');
  const c = q(clientsSql('AND u.id=?'), id)[0]; if (!c) fail(404, 'Клиент не найден');
  return { client: { ...c, level: levelFor(c.total_spent) }, history: q(APPT_SQL + ' WHERE a.client_id=? ORDER BY a.date DESC, a.time DESC LIMIT 60', id).map(apptRow),
    favorites: q('SELECT d.* FROM favorites f JOIN designs d ON d.id=f.design_id WHERE f.user_id=?', id).map(designRow) };
}));
app.put('/api/clients/:id', auth('master', 'owner'), wrap((req) => {
  const id = int(req.params.id);
  if (req.user.role === 'master' && !q1('SELECT 1 x FROM appointments WHERE client_id=? AND master_id=?', id, req.master.id)) fail(403, 'Это не ваш клиент');
  run("UPDATE users SET notes=? WHERE id=? AND role='client'", str(req.body.notes, 2000), id);
  if (req.user.role === 'owner' && req.body.bonus !== undefined) run("UPDATE users SET bonus=? WHERE id=? AND role='client'", Math.max(0, int(req.body.bonus)), id);
  return { ok: true };
}));
app.post('/api/master/portfolio', auth('master'), wrap((req) => {
  const designId = int(req.body.design_id) || null;
  const image = req.body.dataUrl ? saveImage(req.body.dataUrl) : null;
  if (!designId && !image) fail(400, 'Выберите дизайн или загрузите фото');
  run('INSERT INTO portfolio(master_id,design_id,image,title) VALUES(?,?,?,?)', req.master.id, designId, image, str(req.body.title, 80));
  return { ok: true };
}));
app.delete('/api/master/portfolio/:id', auth('master'), wrap((req) => { run('DELETE FROM portfolio WHERE id=? AND master_id=?', int(req.params.id), req.master.id); return { ok: true }; }));
app.put('/api/master/profile', auth('master'), wrap((req) => { run('UPDATE masters SET bio=?, title=? WHERE id=?', str(req.body.bio, 600), str(req.body.title, 80), req.master.id); return { ok: true }; }));

// ---------- владелец ----------
const own = auth('owner');
app.get('/api/admin/journal', own, wrap((req) => {
  const from = isDate(req.query.from) ? req.query.from : ymd(new Date()), to = isDate(req.query.to) ? req.query.to : from;
  return { items: q(APPT_SQL + " WHERE a.date BETWEEN ? AND ? AND a.status!='cancelled' ORDER BY a.date, a.time", from, to).map(apptRow) };
}));
app.post('/api/admin/appointments', own, wrap((req) => {
  let clientId = int(req.body.client_id);
  if (!clientId) {
    const name = str(req.body.client_name, 80), phone = normPhone(req.body.client_phone);
    if (name.length < 2 || phone.length !== 11) fail(400, 'Укажите имя и телефон клиента');
    clientId = q1('SELECT id FROM users WHERE phone=?', phone)?.id || run("INSERT INTO users(role,name,phone) VALUES('client',?,?)", name, phone).lastInsertRowid;
  }
  return { appointment: createAppointment({ clientId, body: req.body, byStaff: true }) };
}));
app.get('/api/admin/clients', own, wrap(() => ({ items: q(clientsSql('')) })));

app.post('/api/admin/services', own, wrap((req) => {
  const b = req.body, id = int(b.id);
  const v = [str(b.category, 40) || 'Маникюр', str(b.name, 120), str(b.description, 400), Math.max(30, Math.round(int(b.duration, 60) / 30) * 30), Math.max(0, int(b.price)), b.active === false || b.active === 0 ? 0 : 1];
  if (!v[1]) fail(400, 'Укажите название услуги');
  if (id) run('UPDATE services SET category=?,name=?,description=?,duration=?,price=?,active=? WHERE id=?', ...v, id);
  else run('INSERT INTO services(category,name,description,duration,price,active,sort) VALUES(?,?,?,?,?,?,999)', ...v);
  return { ok: true };
}));
app.delete('/api/admin/services/:id', own, wrap((req) => {
  const id = int(req.params.id);
  if (q1('SELECT 1 x FROM appointments WHERE service_id=?', id)) run('UPDATE services SET active=0 WHERE id=?', id); // есть история — только скрываем
  else { run('DELETE FROM services WHERE id=?', id); run('DELETE FROM master_services WHERE service_id=?', id); }
  return { ok: true };
}));
app.post('/api/admin/masters', own, wrap((req) => {
  const b = req.body; let id = int(b.id);
  const name = str(b.name, 80); if (name.length < 2) fail(400, 'Укажите имя мастера');
  const v = [name, str(b.title, 80), str(b.bio, 600), /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : '#C98B8B', Math.max(0, Math.min(100, int(b.commission, 40))), int(b.experience, 1), b.active === false || b.active === 0 ? 0 : 1];
  tx(() => {
    if (id) run('UPDATE masters SET name=?,title=?,bio=?,color=?,commission=?,experience=?,active=? WHERE id=?', ...v, id);
    else {
      const email = str(b.email, 100).toLowerCase(), password = String(b.password || '');
      if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) fail(400, 'Для входа мастера укажите e-mail и пароль (от 6 символов)');
      if (q1('SELECT 1 x FROM users WHERE email=?', email)) fail(400, 'Этот e-mail уже занят');
      const uid = run("INSERT INTO users(role,name,email,pass) VALUES('master',?,?,?)", name, email, hashPass(password)).lastInsertRowid;
      id = run('INSERT INTO masters(name,title,bio,color,commission,experience,active,user_id) VALUES(?,?,?,?,?,?,?,?)', ...v, uid).lastInsertRowid;
      for (let wd = 0; wd < 7; wd++) run('INSERT INTO schedules VALUES(?,?,?,?,?)', id, wd, '10:00', '20:00', wd === 0 ? 1 : 0);
    }
    const m = q1('SELECT * FROM masters WHERE id=?', id);
    if (m.user_id) run('UPDATE users SET name=? WHERE id=?', name, m.user_id);
    if (Array.isArray(b.services)) { run('DELETE FROM master_services WHERE master_id=?', id); b.services.forEach((s) => run('INSERT OR IGNORE INTO master_services VALUES(?,?)', id, int(s))); }
    if (Array.isArray(b.schedule)) b.schedule.forEach((s) => {
      const wd = int(s.weekday); if (wd < 0 || wd > 6 || !isTime(s.start) || !isTime(s.end) || s.start >= s.end) fail(400, 'Проверьте график: начало должно быть раньше конца');
      run('INSERT OR REPLACE INTO schedules VALUES(?,?,?,?,?)', id, wd, s.start, s.end, s.off ? 1 : 0);
    });
  });
  return { id };
}));
app.post('/api/admin/designs', own, wrap((req) => {
  const b = req.body, id = int(b.id), p = b.params || {};
  const hex = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : null);
  const params = JSON.stringify({ type: str(p.type, 20) || 'solid', base: hex(p.base) || '#E8B4B8', accent: hex(p.accent), accent2: hex(p.accent2), finish: str(p.finish, 12) || 'gloss', mix: p.mix ? 1 : 0 });
  const name = str(b.name, 80); if (!name) fail(400, 'Укажите название дизайна');
  let image = id ? q1('SELECT image FROM designs WHERE id=?', id)?.image : null;
  if (b.dataUrl) image = saveImage(b.dataUrl); else if (b.remove_image) image = null;
  const v = [name, params, str(b.color, 20), str(b.style, 20), str(b.season, 20), str(b.shape, 20) || 'almond', str(b.length, 20) || 'medium', Math.max(0, int(b.extra)), b.popular ? 1 : 0, image, b.active === false || b.active === 0 ? 0 : 1];
  if (id) run('UPDATE designs SET name=?,params=?,color=?,style=?,season=?,shape=?,length=?,extra=?,popular=?,image=?,active=? WHERE id=?', ...v, id);
  else run('INSERT INTO designs(name,params,color,style,season,shape,length,extra,popular,image,active) VALUES(?,?,?,?,?,?,?,?,?,?,?)', ...v);
  return { ok: true };
}));
app.delete('/api/admin/designs/:id', own, wrap((req) => {
  const id = int(req.params.id);
  if (q1('SELECT 1 x FROM appointments WHERE design_id=?', id)) run('UPDATE designs SET active=0 WHERE id=?', id);
  else { run('DELETE FROM designs WHERE id=?', id); run('DELETE FROM favorites WHERE design_id=?', id); run('DELETE FROM portfolio WHERE design_id=?', id); }
  return { ok: true };
}));
app.post('/api/admin/promos', own, wrap((req) => {
  const b = req.body, id = int(b.id);
  if (!str(b.title)) fail(400, 'Укажите название акции');
  if (!isDate(b.date_from) || !isDate(b.date_to) || b.date_from > b.date_to) fail(400, 'Проверьте даты акции');
  const v = [str(b.title, 80), str(b.description, 300), Math.max(1, Math.min(90, int(b.percent, 10))), int(b.service_id) || null, b.date_from, b.date_to, b.active === false || b.active === 0 ? 0 : 1];
  if (id) run('UPDATE promos SET title=?,description=?,percent=?,service_id=?,date_from=?,date_to=?,active=? WHERE id=?', ...v, id);
  else run('INSERT INTO promos(title,description,percent,service_id,date_from,date_to,active) VALUES(?,?,?,?,?,?,?)', ...v);
  return { ok: true };
}));
app.delete('/api/admin/promos/:id', own, wrap((req) => { run('DELETE FROM promos WHERE id=?', int(req.params.id)); return { ok: true }; }));
app.put('/api/admin/settings', own, wrap((req) => {
  const b = req.body, set = (k, v) => run('INSERT OR REPLACE INTO settings VALUES(?,?)', k, String(v));
  for (const k of ['salon_name', 'salon_tagline', 'salon_address', 'salon_phone', 'salon_hours']) if (b[k] !== undefined) set(k, str(b[k], 120));
  if (b.welcome_bonus !== undefined) set('welcome_bonus', Math.max(0, int(b.welcome_bonus)));
  if (b.bonus_max_pay_pct !== undefined) set('bonus_max_pay_pct', Math.max(0, Math.min(100, int(b.bonus_max_pay_pct))));
  if (Array.isArray(b.levels) && b.levels.length) {
    const L = b.levels.map((l) => ({ name: str(l.name, 30) || 'Уровень', from: Math.max(0, int(l.from)), pct: Math.max(0, Math.min(50, int(l.pct))) })).sort((a, c) => a.from - c.from);
    L[0].from = 0; set('levels', JSON.stringify(L));
  }
  return { ok: true };
}));
app.get('/api/admin/certificates', own, wrap(() => ({ items: q('SELECT c.*, u.name buyer FROM certificates c LEFT JOIN users u ON u.id=c.buyer_id ORDER BY c.id DESC') })));
app.get('/api/admin/reports', own, wrap((req) => {
  const to = isDate(req.query.to) ? req.query.to : ymd(new Date());
  const from = isDate(req.query.from) ? req.query.from : ymd(addDays(new Date(), -29));
  const R = "a.date BETWEEN ? AND ? AND a.status='done'";
  const tot = q1(`SELECT COUNT(*) visits, COALESCE(SUM(price-discount),0) revenue, COALESCE(SUM(bonus_used),0) bonus_used, COALESCE(SUM(cert_used),0) cert_used,
    COALESCE(SUM(discount),0) discounts, COUNT(DISTINCT client_id) clients FROM appointments a WHERE ${R}`, from, to);
  const other = q1("SELECT SUM(status='noshow') noshow, SUM(status='cancelled') cancelled, SUM(status='booked') booked FROM appointments a WHERE a.date BETWEEN ? AND ?", from, to);
  const byDay = q(`SELECT date, SUM(price-discount) revenue, COUNT(*) visits FROM appointments a WHERE ${R} GROUP BY date ORDER BY date`, from, to);
  const services = q(`SELECT s.name, s.category, COUNT(*) n, SUM(a.price-a.discount) revenue FROM appointments a JOIN services s ON s.id=a.service_id WHERE ${R} GROUP BY s.id ORDER BY n DESC`, from, to);
  const designs = q(`SELECT d.id, d.name, d.params, d.image, COUNT(*) n FROM appointments a JOIN designs d ON d.id=a.design_id WHERE a.date BETWEEN ? AND ? AND a.status IN ('done','booked') GROUP BY d.id ORDER BY n DESC LIMIT 6`, from, to).map(designRow);
  // рабочие минуты по графику за период
  const days = []; for (let d = new Date(from + 'T00:00:00'); ymd(d) <= to && days.length < 400; d = addDays(d, 1)) days.push(d.getDay());
  const masters = q('SELECT * FROM masters ORDER BY id').map((m) => {
    const sch = q('SELECT * FROM schedules WHERE master_id=?', m.id);
    const work = days.reduce((s, wd) => { const x = sch.find((r) => r.weekday === wd); return s + (x && !x.off ? toMin(x.end) - toMin(x.start) : 0); }, 0);
    const st = q1(`SELECT COUNT(*) visits, COALESCE(SUM(price-discount),0) revenue FROM appointments a WHERE a.master_id=? AND ${R}`, m.id, from, to);
    const busy = q1("SELECT COALESCE(SUM(duration),0) m FROM appointments a WHERE a.master_id=? AND a.date BETWEEN ? AND ? AND a.status IN ('done','booked')", m.id, from, to).m;
    return { id: m.id, name: m.name, color: m.color, commission: m.commission, visits: st.visits, revenue: st.revenue, salary: Math.round(st.revenue * m.commission / 100),
      occupancy: work ? Math.round(busy / work * 100) : 0, hours: Math.round(busy / 60) };
  });
  const newClients = q1("SELECT COUNT(*) c FROM users WHERE role='client' AND date(created_at) BETWEEN ? AND ?", from, to).c;
  return { from, to, total: { ...tot, ...other, avg: tot.visits ? Math.round(tot.revenue / tot.visits) : 0, new_clients: newClients, salary: masters.reduce((s, m) => s + m.salary, 0) }, byDay, services, designs, masters };
}));

// ---------- напоминания (каждую минуту) ----------
function reminders() {
  const now = Date.now();
  for (const a of q(APPT_SQL + " WHERE a.status='booked' AND (a.r24=0 OR a.r2=0) AND a.date>=date('now','localtime','-1 day')")) {
    const h = (new Date(`${a.date}T${a.time}:00`).getTime() - now) / 36e5;
    if (h <= 0) continue;
    if (h <= 2 && !a.r2) { run('UPDATE appointments SET r2=1, r24=1 WHERE id=?', a.id); notify(a.client_id, 'Ждём вас через 2 часа', `${a.service}, мастер ${a.master} — сегодня в ${a.time}.`, 'reminder', a.id); }
    else if (h <= 24 && !a.r24) { run('UPDATE appointments SET r24=1 WHERE id=?', a.id); notify(a.client_id, 'Напоминание о записи', `${a.service}, мастер ${a.master} — ${human(a.date, a.time)}. Если планы изменились, перенесите запись в приложении.`, 'reminder', a.id); }
  }
}
setInterval(() => { try { reminders(); } catch (e) { console.error(e); } }, 60e3).unref();
reminders();

// ---------- статика ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Не найдено' }));
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads'), { maxAge: '30d' }));
app.use(express.static(path.join(__dirname, 'web'), { setHeaders: (res, p) => { if (/(sw\.js|index\.html)$/.test(p)) res.setHeader('Cache-Control', 'no-cache'); } }));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'web', 'index.html')));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (!err.status) console.error(err);
  res.status(err.status || (err.type === 'entity.too.large' ? 413 : 500)).json({ error: err.status ? err.message : err.type === 'entity.too.large' ? 'Файл слишком большой' : 'Ошибка сервера' });
});
app.listen(PORT, () => console.log(`Rustyle запущено: http://localhost:${PORT}`));

}
export async function initLocalApi(BASE) {
  await new Promise((res, rej) => { const s = document.createElement('script'); s.src = BASE + 'vendor/sql/sql-wasm.js'; s.onload = res; s.onerror = () => rej(new Error('Не удалось загрузить базу данных')); document.head.append(s); });
  const SQL = await window.initSqlJs({ locateFile: (f) => BASE + 'vendor/sql/' + f });
  const VER = 'v1';
  const idb = await new Promise((res) => { try { const r = indexedDB.open('rustyle-demo', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch { res(null); } });
  const kvGet = (k) => new Promise((res) => { if (!idb) return res(null); try { const q = idb.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result ?? null); q.onerror = () => res(null); } catch { res(null); } });
  const kvSet = (k, v) => { try { idb && idb.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch {} };
  const saved = await kvGet('db-' + VER), uploads = (await kvGet('uploads-' + VER)) || {};
  const sdb = saved ? new SQL.Database(saved) : new SQL.Database();
  const persist = () => { kvSet('db-' + VER, sdb.export()); kvSet('uploads-' + VER, uploads); };
  const norm = (a) => a.map((v) => (v === undefined ? null : typeof v === 'boolean' ? +v : typeof v === 'bigint' ? Number(v) : v));
  class DatabaseSync {
    exec(sql) { sdb.exec(sql); }
    prepare(sql) {
      const rows = (a, one) => { const st = sdb.prepare(sql); try { st.bind(norm(a)); const out = []; while (st.step()) { out.push(st.getAsObject()); if (one) break; } return out; } finally { st.free(); } };
      return { all: (...a) => rows(a, false), get: (...a) => rows(a, true)[0], run: (...a) => { sdb.run(sql, norm(a)); return { lastInsertRowid: sdb.exec('SELECT last_insert_rowid()')[0].values[0][0], changes: sdb.getRowsModified() }; } };
    }
  }
  const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  const weakHash = (str, len) => { // демо-режим: настоящих паролей здесь нет, криптостойкость не нужна
    const out = new Uint8Array(len); let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let r = 0; r < 4; r++) for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i) + r; h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); h1 ^= h2 >>> 13; h2 ^= h1 >>> 11; }
    for (let i = 0; i < len; i++) { h1 = Math.imul(h1 ^ (h1 >>> 15), 2246822507) + i; h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909) ^ h1; out[i] = (h1 ^ h2) & 255; }
    return out;
  };
  const Buf = { from: (x, enc) => (enc === 'hex' ? { hex: x, length: x.length / 2 } : { b64: x, length: Math.floor(x.length * 0.75) }) };
  const crypto_ = {
    randomBytes: (n) => { const b = self.crypto.getRandomValues(new Uint8Array(n)); return { toString: () => hex(b) }; },
    scryptSync: (p, salt, len) => { const h = hex(weakHash(salt + '|' + p, len)); return { hex: h, length: len, toString: () => h }; },
    timingSafeEqual: (a, b) => a.hex === b.hex,
  };
  const fs_ = { mkdirSync() {}, writeFileSync(p, buf) { const name = String(p).split('/').pop(), ext = name.split('.').pop(); uploads[name] = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.b64}`; } };
  const path_ = { join: (...a) => a.join('/') };
  function express() {
    const layers = [], app = { disable() {}, set() {}, listen() {}, use(a, b) { layers.push(typeof a === 'string' ? { prefix: a, fn: b } : { fn: a }); } };
    for (const m of ['get', 'post', 'put', 'delete']) app[m] = (path, ...fns) => layers.push({ method: m.toUpperCase(), path, fns });
    const match = (pattern, req) => {
      if (pattern instanceof RegExp) return false;
      const keys = [], re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$'), m = re.exec(req.path);
      if (!m) return false; req.params = Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])); return true;
    };
    app.handle = (req, res) => {
      let i = 0, err = null;
      const next = (e) => {
        if (e) err = e;
        while (i < layers.length) {
          const L = layers[i++];
          if (err) { if (!L.method && L.fn && L.fn.length === 4) return L.fn(err, req, res, next); continue; }
          if (L.method) {
            if (L.method !== req.method || !match(L.path, req)) continue;
            let j = 0; const step = (e2) => { if (e2) return next(e2); const f = L.fns[j++]; return f ? f(req, res, step) : next(); };
            return step();
          }
          if (!L.fn || L.fn.length === 4 || L.fn.isStatic || (L.prefix && !req.path.startsWith(L.prefix))) continue;
          return L.fn(req, res, next);
        }
      };
      next();
    };
    return app;
  }
  express.json = () => (req, res, next) => next();
  express.static = () => Object.assign((req, res, next) => next(), { isStatic: true });
  let app = null;
  const origExpress = express, expressHook = Object.assign(() => (app = origExpress()), { json: express.json, static: express.static });
  const proc = { env: {}, removeAllListeners() {} };
  const interval = (fn, ms) => { self.setInterval(() => { try { fn(); persist(); } catch (e) { console.warn(e); } }, ms); return { unref() {} }; };
  const mods = { 'express': expressHook, 'node:crypto': crypto_, 'node:fs': fs_, 'node:path': path_, 'node:sqlite': { DatabaseSync } };
  const req_ = (name) => { if (name === './db') return mods.db; if (!(name in mods)) throw new Error('нет модуля ' + name); return mods[name]; };
  const dbm = { exports: {} }; __db(dbm, dbm.exports, req_, proc, '', Buf, interval); mods.db = dbm.exports;
  const sm = { exports: {} }; __server(sm, sm.exports, req_, proc, '', Buf, interval);
  if (!saved) persist();
  return async (method, url, body) => {
    const u = new URL(url, 'http://local');
    const req = { method, path: u.pathname, query: Object.fromEntries(u.searchParams), body: body ? JSON.parse(JSON.stringify(body)) : {}, params: {}, headers: { cookie: localStorage.getItem('rustyle-demo-sid') || '' }, ip: 'local', secure: true };
    const out = { status: 200, json: {} };
    const res = { status(c) { out.status = c; return res; }, json(o) { out.json = o; return res; }, sendFile() {},
      setHeader(k, v) { if (k !== 'Set-Cookie') return; const m = /^sid=([^;]*)/.exec(v); try { if (!m || !m[1] || /Max-Age=0/.test(v)) localStorage.removeItem('rustyle-demo-sid'); else localStorage.setItem('rustyle-demo-sid', 'sid=' + m[1]); } catch {} } };
    app.handle(req, res);
    if (method !== 'GET') persist();
    // загруженные фото лежат в памяти браузера: подставляем их содержимое вместо адресов /uploads/…
    out.json = JSON.parse(JSON.stringify(out.json ?? {}).replace(/"\/uploads\/([\w.-]+)"/g, (m, name) => (uploads[name] ? JSON.stringify(uploads[name]) : m)));
    return out;
  };
}
