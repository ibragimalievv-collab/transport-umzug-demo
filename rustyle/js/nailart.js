// Процедурная отрисовка ногтей и дизайнов. Используется и в каталоге, и в примерке.
export const SHAPES = { round: 'Круглая', oval: 'Овал', squoval: 'Мягкий квадрат', square: 'Квадрат', almond: 'Миндаль', stiletto: 'Стилет', coffin: 'Балерина' };
export const LENGTHS = { short: 'Короткие', medium: 'Средние', long: 'Длинные', xl: 'Экстра' };
export const FINISHES = { gloss: 'Глянец', matte: 'Матовый', shimmer: 'Шиммер' };
export const TYPES = {
  solid: 'Однотон', french: 'Френч', ombre: 'Омбре', glitter: 'Блёстки', chrome: 'Втирка / хром', cateye: 'Кошачий глаз', dots: 'Горошек',
  stripes: 'Полоска', lines: 'Тонкие линии', marble: 'Мрамор', hearts: 'Сердечки', flowers: 'Цветы', halfmoon: 'Лунный', geo: 'Геометрия',
  stars: 'Звёзды', leopard: 'Леопард', aura: 'Аура', snow: 'Снежинки',
};
// относительная длина свободного края (в ширинах ногтя)
export const LENGTH_K = { short: 0.05, medium: 0.35, long: 0.75, xl: 1.2 };

const imgCache = new Map();
export function getImage(url) {
  if (!imgCache.has(url)) imgCache.set(url, new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; }));
  return imgCache.get(url);
}
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function shade(hex, k) { // k<0 темнее, k>0 светлее
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// Контур ногтя: начало координат — центр кутикулы, ось Y направлена к кончику (отрицательные значения)
export function nailPath(ctx, w, h, shape) {
  const r = w / 2, cut = Math.min(w * 0.4, h * 0.3), top = -h, body = h - cut;
  ctx.beginPath();
  ctx.moveTo(-r, -cut);
  ctx.bezierCurveTo(-r, cut * 0.33, r, cut * 0.33, r, -cut);
  switch (shape) {
    case 'square': case 'squoval': {
      const c = w * (shape === 'square' ? 0.07 : 0.24);
      ctx.lineTo(r, top + c); ctx.quadraticCurveTo(r, top, r - c, top); ctx.lineTo(-r + c, top); ctx.quadraticCurveTo(-r, top, -r, top + c); break;
    }
    case 'round': case 'oval': {
      const ry = Math.min(body * 0.95, r * (shape === 'round' ? 0.8 : 1.45));
      ctx.lineTo(r, top + ry); ctx.ellipse(0, top + ry, r, ry, 0, 0, Math.PI, true); break;
    }
    case 'stiletto':
      ctx.bezierCurveTo(r, -cut - body * 0.5, w * 0.06, top + h * 0.1, 0, top);
      ctx.bezierCurveTo(-w * 0.06, top + h * 0.1, -r, -cut - body * 0.5, -r, -cut); break;
    case 'coffin': {
      const tw = w * 0.27;
      ctx.lineTo(r, -cut - body * 0.25); ctx.lineTo(tw + w * 0.02, top + w * 0.06); ctx.quadraticCurveTo(tw, top, tw - w * 0.05, top);
      ctx.lineTo(-tw + w * 0.05, top); ctx.quadraticCurveTo(-tw, top, -tw - w * 0.02, top + w * 0.06); ctx.lineTo(-r, -cut - body * 0.25); break;
    }
    default: // almond
      ctx.bezierCurveTo(r, -cut - body * 0.6, w * 0.2, top, 0, top);
      ctx.bezierCurveTo(-w * 0.2, top, -r, -cut - body * 0.6, -r, -cut);
  }
  ctx.closePath();
}

function heart(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.35, y - s * 0.8, x, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 0.35, y - s * 0.8, x + s * 0.9, y - s * 0.25, x, y + s * 0.35); ctx.fill();
}
function star(ctx, x, y, s) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? s * 0.28 : s; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}
function flower(ctx, x, y, s, petal, center) {
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5 - Math.PI / 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.42, s * 0.3, a, 0, 7); ctx.fill(); }
  ctx.fillStyle = center; ctx.beginPath(); ctx.arc(x, y, s * 0.26, 0, 7); ctx.fill();
}

/**
 * Рисует один ноготь. p — параметры дизайна {type, base, accent, accent2, finish, mix}
 * opt: { finger: 0..4, img: Image|null, light: 0..1 }
 */
export function paintNail(ctx, w, h, p, shape, opt = {}) {
  const finger = opt.finger ?? 2, r = w / 2, cut = Math.min(w * 0.4, h * 0.3);
  const base = p.base || '#E8B4B8', accent = p.accent || '#FFFFFF', accent2 = p.accent2 || accent;
  const R = rng(finger + 7);
  let type = p.type || 'solid';
  if (p.mix && type !== 'french' && finger !== 1 && finger !== 3) type = 'solid'; // акцент только на двух пальцах
  ctx.save();
  if (!opt.noClip) { nailPath(ctx, w, h, shape); ctx.clip(); } // noClip: границу задаёт внешний контур (настоящий ноготь)
  ctx.fillStyle = base; ctx.fillRect(-r, -h, w, h + cut);

  if (opt.img) { // загруженная текстура: вписываем с заполнением
    const i = opt.img, k = Math.max(w / i.width, (h + cut) / i.height), iw = i.width * k, ih = i.height * k;
    ctx.drawImage(i, -iw / 2, -h + (h + cut - ih) / 2, iw, ih);
  } else switch (type) {
    case 'french': {
      const th = Math.min(h * 0.42, w * 0.52), col = p.mix && finger % 2 ? accent2 : accent;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-r, -h - 2); ctx.lineTo(-r, -h + th * 1.3);
      ctx.quadraticCurveTo(0, -h + th * 0.35, r, -h + th * 1.3); ctx.lineTo(r, -h - 2); ctx.fill(); break;
    }
    case 'ombre': {
      const g = ctx.createLinearGradient(0, 0, 0, -h); g.addColorStop(0.15, base); g.addColorStop(0.85, accent);
      ctx.fillStyle = g; ctx.fillRect(-r, -h, w, h + cut); break;
    }
    case 'glitter': {
      for (let i = 0; i < 90; i++) {
        const y = -Math.pow(R(), 0.6) * h, x = (R() - 0.5) * w, s = w * (0.012 + R() * 0.03);
        ctx.fillStyle = R() < 0.6 ? accent : shade(base, 0.5); ctx.globalAlpha = 0.5 + R() * 0.5;
        ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1; break;
    }
    case 'chrome': {
      const g = ctx.createLinearGradient(-r, 0, r, -h * 0.3);
      [[0, shade(base, -0.35)], [0.25, base], [0.42, accent], [0.55, shade(base, 0.25)], [0.8, shade(base, -0.2)], [1, shade(base, -0.4)]].forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g; ctx.fillRect(-r, -h, w, h + cut); break;
    }
    case 'cateye': {
      ctx.save(); ctx.translate(0, -h * 0.5); ctx.rotate(-0.5);
      const g = ctx.createLinearGradient(0, -h * 0.28, 0, h * 0.28); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, accent); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.85; ctx.fillStyle = g; ctx.fillRect(-h, -h * 0.28, h * 2, h * 0.56); ctx.restore(); break;
    }
    case 'dots': {
      ctx.fillStyle = accent; const st = w * 0.3;
      for (let j = 0, y = -st * 0.4; y > -h - st; y -= st, j++) for (let x = -r + (j % 2 ? st * 0.5 : 0); x < r + st; x += st) { ctx.beginPath(); ctx.arc(x, y, w * 0.065, 0, 7); ctx.fill(); }
      break;
    }
    case 'stripes': {
      ctx.fillStyle = accent; const st = w * 0.3;
      for (let y = -st * 0.3; y > -h - st; y -= st) ctx.fillRect(-r, y - st * 0.45, w, st * 0.45);
      break;
    }
    case 'lines': {
      ctx.strokeStyle = accent; ctx.lineWidth = Math.max(1, w * 0.035); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-r, -h * 0.25); ctx.quadraticCurveTo(0, -h * 0.5, r, -h * 0.85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r, -h * 0.4); ctx.quadraticCurveTo(w * 0.1, -h * 0.62, r * 0.9, -h); ctx.stroke(); break;
    }
    case 'marble': {
      ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = i === 4 ? accent2 : accent; ctx.globalAlpha = i === 4 ? 0.9 : 0.25 + R() * 0.4; ctx.lineWidth = w * (i === 4 ? 0.025 : 0.02 + R() * 0.07);
        let x = (R() - 0.5) * w, y = cut; ctx.beginPath(); ctx.moveTo(x, y);
        while (y > -h) { const nx = x + (R() - 0.5) * w * 0.6, ny = y - h * (0.12 + R() * 0.15); ctx.quadraticCurveTo(x + (R() - 0.5) * w * 0.5, (y + ny) / 2, nx, ny); x = nx; y = ny; }
        ctx.stroke();
      }
      ctx.globalAlpha = 1; break;
    }
    case 'hearts': ctx.fillStyle = accent; heart(ctx, 0, -h * 0.52, w * 0.3); heart(ctx, -w * 0.24, -h * 0.2, w * 0.11); heart(ctx, w * 0.22, -h * 0.82, w * 0.1); break;
    case 'flowers': flower(ctx, -w * 0.08, -h * 0.55, w * 0.2, accent, accent2); flower(ctx, w * 0.24, -h * 0.25, w * 0.13, accent, accent2); flower(ctx, w * 0.18, -h * 0.85, w * 0.11, accent, accent2); break;
    case 'halfmoon': ctx.fillStyle = accent; ctx.beginPath(); ctx.ellipse(0, cut * 0.1, r * 0.95, Math.min(h * 0.3, w * 0.45), 0, 0, 7); ctx.fill(); break;
    case 'geo': {
      ctx.fillStyle = accent; ctx.beginPath(); ctx.moveTo(-r, -h * 0.35); ctx.lineTo(r, -h * 0.75); ctx.lineTo(r, -h - 2); ctx.lineTo(-r, -h - 2); ctx.fill();
      ctx.strokeStyle = accent2; ctx.lineWidth = w * 0.035; ctx.beginPath(); ctx.moveTo(-r, -h * 0.27); ctx.lineTo(r, -h * 0.67); ctx.stroke(); break;
    }
    case 'stars': {
      ctx.fillStyle = accent; star(ctx, w * 0.05, -h * 0.55, w * 0.2); star(ctx, -w * 0.25, -h * 0.25, w * 0.09); star(ctx, w * 0.24, -h * 0.85, w * 0.08);
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((R() - 0.5) * w, -R() * h, w * 0.018, 0, 7); ctx.fill(); }
      break;
    }
    case 'leopard': {
      for (let i = 0; i < 9; i++) {
        const x = (R() - 0.5) * w * 0.9, y = -R() * h, s = w * (0.07 + R() * 0.05), a = R() * 6;
        ctx.fillStyle = accent; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.75, a, 0, 7); ctx.fill();
        ctx.strokeStyle = accent2; ctx.lineWidth = w * 0.035; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.ellipse(x, y, s * 1.35, s * 1.05, a, 0.3, 2.3); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, s * 1.35, s * 1.05, a, 3.3, 5.4); ctx.stroke();
      }
      break;
    }
    case 'aura': {
      const g = ctx.createRadialGradient(0, -h * 0.5, 0, 0, -h * 0.5, Math.max(w, h) * 0.55); g.addColorStop(0, accent); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.9; ctx.fillStyle = g; ctx.fillRect(-r, -h, w, h + cut); ctx.globalAlpha = 1; break;
    }
    case 'snow': {
      ctx.strokeStyle = accent; ctx.fillStyle = accent; ctx.lineCap = 'round';
      const flake = (x, y, s) => { ctx.lineWidth = s * 0.14; for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke(); } };
      flake(0, -h * 0.55, w * 0.22); flake(-w * 0.22, -h * 0.2, w * 0.1);
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc((R() - 0.5) * w, -R() * h, w * 0.022, 0, 7); ctx.fill(); }
      break;
    }
  }

  // объём: затемнение по краям
  const light = opt.light ?? 1;
  const e = ctx.createLinearGradient(-r, 0, r, 0);
  e.addColorStop(0, 'rgba(40,10,20,.30)'); e.addColorStop(0.22, 'rgba(40,10,20,0)'); e.addColorStop(0.8, 'rgba(40,10,20,0)'); e.addColorStop(1, 'rgba(40,10,20,.26)');
  ctx.fillStyle = e; ctx.fillRect(-r, -h, w, h + cut);
  const finish = p.finish || 'gloss';
  if (finish === 'shimmer') {
    const S = rng(finger + 99);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.25 + S() * 0.5})`; ctx.beginPath(); ctx.arc((S() - 0.5) * w, -S() * h, w * 0.012, 0, 7); ctx.fill(); }
  }
  if (finish === 'matte') { ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(-r, -h, w, h + cut); }
  else { // блик
    ctx.save(); ctx.translate(-w * 0.2, -h * 0.5); ctx.scale(1, Math.max(1, (h * 0.34) / (w * 0.09)));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.1); g.addColorStop(0, `rgba(255,255,255,${0.62 * light})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w * 0.1, 0, 7); ctx.fill(); ctx.restore();
    const g2 = ctx.createLinearGradient(0, 0, 0, cut * 1.5 - h * 0.1); g2.addColorStop(0, `rgba(255,255,255,${0.16 * light})`); g2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g2; ctx.fillRect(-r, -h * 0.3, w, h * 0.3 + cut);
  }
  ctx.restore();
}

// Превью набора из пяти ногтей (или одного крупного) на canvas
const FAN = [[-0.36, 0.2, 0.8, -0.2], [-0.19, 0.06, 0.95, -0.09], [0, 0, 1, 0], [0.19, 0.06, 0.93, 0.09], [0.36, 0.2, 0.78, 0.2]];
export function drawPreview(canvas, design, { shape, length, single = false } = {}) {
  const p = design.params || design, sh = shape || design.shape || 'almond', len = length || design.length || 'medium';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth || canvas.width, H = canvas.clientHeight || canvas.height;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const render = (img) => {
    ctx.clearRect(0, 0, W, H);
    const lk = 1.25 + LENGTH_K[len] * 0.8;
    if (single) {
      const w = Math.min(W * 0.5, (H * 0.8) / lk), h = w * lk;
      ctx.save(); ctx.translate(W / 2, H / 2 + h / 2 - w * 0.1); ctx.shadowColor = 'rgba(90,40,50,.25)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
      nailPath(ctx, w, h, sh); ctx.fillStyle = p.base || '#eee'; ctx.fill(); ctx.shadowColor = 'transparent';
      paintNail(ctx, w, h, p, sh, { finger: 1, img }); ctx.restore(); return;
    }
    const w0 = Math.min(W * 0.2, (H * 0.8) / lk), base = H / 2 + (w0 * lk) / 2 - w0 * 0.12;
    FAN.forEach(([dx, dy, k, rot], i) => {
      const w = w0 * k, h = w * lk;
      ctx.save(); ctx.translate(W / 2 + dx * w0 * 5.6, base + dy * w0 * 0.9); ctx.rotate(rot * 0.55);
      ctx.shadowColor = 'rgba(90,40,50,.22)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      nailPath(ctx, w, h, sh); ctx.fillStyle = p.base || '#eee'; ctx.fill(); ctx.shadowColor = 'transparent';
      paintNail(ctx, w, h, p, sh, { finger: i, img }); ctx.restore();
    });
  };
  render(null);
  if (design.image) getImage(design.image).then((img) => img && canvas.isConnected !== false && render(img));
}
