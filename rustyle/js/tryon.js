// Примерка маникюра: камера или фото + распознавание руки MediaPipe Hands
import { S, A, route, go, after, onLeave, toast, esc, ic, dsg, thumb, money, hydrate, fileToDataUrl, BASE } from './core.js';
import { SHAPES, LENGTHS, FINISHES, LENGTH_K, nailPath, paintNail, getImage } from './nailart.js';

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3';
const MODEL_CDN = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const PALETTE = ['#F1DCD3', '#E8B4B8', '#F08FA9', '#D6336C', '#B3202A', '#7A1022', '#5A1220', '#F28C4B', '#F6E27A', '#A8DCC8', '#2E8B6A', '#0E3B2E', '#A9D3EE', '#1F3A8A', '#101A4D', '#B9A6E0', '#6B3FA0', '#FFFFFF', '#C9CDD6', '#D4AF6A', '#8A5A2B', '#17141A'];
const FINGERS = [[3, 4], [7, 8], [11, 12], [15, 16], [19, 20]];
const WK = [0.25, 0.2, 0.205, 0.19, 0.16]; // ширина ногтя относительно ширины ладони
// нарисованная демо-рука (если нет камеры): нормированные координаты 21 точки
const DEMO = [[.5, .92], [.37, .84], [.27, .74], [.2, .64], [.15, .55], [.37, .58], [.33, .44], [.31, .35], [.295, .27], [.49, .55], [.49, .39], [.49, .29], [.49, .2],
  [.6, .57], [.63, .43], [.65, .34], [.665, .26], [.7, .63], [.76, .53], [.79, .46], [.815, .39]].map(([x, y]) => ({ x, y, z: 0 }));

const T = { design: null, color: null, finish: 'gloss', shape: 'almond', length: 'medium', scale: 1, facing: 'environment', mode: 'camera', tab: 'design', hands: [], img: null, tex: null };
let landmarker = null, lmPromise = null, stream = null, raf = 0, running = false, smooth = [], lastSeen = 0;

function loadLandmarker() {
  return (lmPromise ||= (async () => {
    let vision, base = BASE + 'vendor';
    try { vision = await import(BASE + 'vendor/vision_bundle.mjs'); } catch { base = CDN; vision = await import(/* @vite-ignore */ CDN + '/vision_bundle.mjs'); }
    const fileset = await vision.FilesetResolver.forVisionTasks(base + '/wasm');
    let model = BASE + 'vendor/hand_landmarker.task';
    try { const r = await fetch(model, { method: 'HEAD' }); if (!r.ok || !/octet|task/.test(r.headers.get('content-type') || 'octet')) model = MODEL_CDN; } catch { model = MODEL_CDN; }
    const make = (delegate) => vision.HandLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: model, delegate }, runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { landmarker = await make('GPU'); } catch { landmarker = await make('CPU'); }
    landmarker._mode = 'VIDEO';
    return landmarker;
  })().catch((e) => { lmPromise = null; throw e; }));
}
const params = () => (T.design ? { ...T.design.params } : { type: 'solid', base: T.color || '#E8B4B8', finish: T.finish });

// ---------- кадр для распознавания и замеров ----------
// Распознаём руку и меряем пальцы на одной и той же уменьшенной копии кадра: так точки руки
// гарантированно соответствуют картинке, которую видит человек (без расхождений поворота и обрезки видео).
const det = document.createElement('canvas'), dctx = det.getContext('2d', { willReadFrequently: true });
let detData = null, detX = 0, detY = 0; const ema = new Map();
// читаем пиксели только вокруг рук — так быстрее на телефоне
function readPixels(hands) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const h of hands) for (const l of h.lm) { x0 = Math.min(x0, l.x); y0 = Math.min(y0, l.y); x1 = Math.max(x1, l.x); y1 = Math.max(y1, l.y); }
  const mx = (x1 - x0) * 0.25 + 0.02, my = (y1 - y0) * 0.25 + 0.02, W = det.width, H = det.height;
  detX = Math.max(0, Math.floor((x0 - mx) * W)); detY = Math.max(0, Math.floor((y0 - my) * H));
  const w = Math.min(W, Math.ceil((x1 + mx) * W)) - detX, h = Math.min(H, Math.ceil((y1 + my) * H)) - detY;
  detData = w > 4 && h > 4 ? dctx.getImageData(detX, detY, w, h) : null;
}
function grab(src, sw, sh) {
  const k = Math.min(1, 960 / Math.max(sw, sh)), w = Math.max(2, Math.round(sw * k)), h = Math.max(2, Math.round(sh * k));
  if (det.width !== w || det.height !== h) { det.width = w; det.height = h; }
  dctx.drawImage(src, 0, 0, w, h);
}
// цвет точки: яркость учитываем слабее, чем оттенок, чтобы тень на краю пальца не считалась границей
function colorAt(x, y) {
  const w = detData.width, h = detData.height; x = Math.round(x) - detX; y = Math.round(y) - detY;
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  const d = detData.data, i = (y * w + x) * 4, Y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  return [Y * 0.35, d[i + 2] - Y, d[i] - Y];
}
function refColor(x, y) {
  const a = [0, 0, 0]; let n = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = colorAt(x + dx, y + dy); if (c) { a[0] += c[0]; a[1] += c[1]; a[2] += c[2]; n++; } }
  return n ? a.map((v) => v / n) : null;
}
// идём от точки по направлению, пока цвет не «уйдёт» от образца на 3 пикселя подряд; возвращает расстояние или -1
function scan(x, y, dx, dy, max, ref, thr = 26) {
  let run = 0;
  for (let s = 1; s <= max; s++) {
    const c = colorAt(x + dx * s, y + dy * s);
    if (!c || Math.hypot(c[0] - ref[0], c[1] - ref[1], c[2] - ref[2]) > thr) { if (++run >= 3) return s - 2; } else run = 0;
  }
  return -1;
}
const palmScale = (P) => { const d3 = (a, b) => Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y, P[a].z - P[b].z); return Math.max(d3(5, 17), d3(0, 9) * 0.62); };
// Замер каждого пальца по картинке: реальная ширина, смещение оси и положение кончика (в долях расчётных величин)
function measure(hand, hi, live) {
  if (!detData) return;
  const W = det.width, H = det.height, P = hand.lm.map((l) => ({ x: l.x * W, y: l.y * H, z: (l.z || 0) * W })), scale = palmScale(P);
  hand.meas = FINGERS.map(([di, ti], f) => {
    const D = P[di], Tp = P[ti], vx = Tp.x - D.x, vy = Tp.y - D.y, L2 = Math.hypot(vx, vy);
    const m = { fw: 1, off: 0, e: 0.42, ok: 0 };
    if (L2 < 4) return m;
    const ux = vx / L2, uy = vy / L2, nx = -uy, ny = ux, w0 = WK[f] * scale, fw0 = w0 / 0.8;
    // 1) ширина пальца — на коже чуть ниже ногтя, по трём сечениям; складка или тень дают заниженный замер, поэтому берём наибольший
    for (const thr of [26, 40]) { if (m.ok) break; for (const t of [0.24, 0.35, 0.46]) { // второй проход — с более грубым порогом, если мешает тень
      const mx = D.x + vx * t, my = D.y + vy * t, ref = refColor(mx, my);
      if (!ref) continue;
      const a = scan(mx, my, nx, ny, fw0 * 0.95, ref, thr), b = scan(mx, my, -nx, -ny, fw0 * 0.95, ref, thr);
      let fw = 0, off = 0;
      if (a > 0 && b > 0) { fw = a + b; off = (a - b) / 2; } else if (a > 0 || b > 0) fw = 2 * Math.max(a, b); // сосед-палец вплотную: берём видимую сторону
      if (fw >= 0.78 * fw0 && fw <= 1.4 * fw0 && fw / fw0 > (m.ok ? m.fw : 0)) { m.fw = fw / fw0; m.off = Math.max(-0.2, Math.min(0.2, off / fw0)); m.ok = 1; m.dbg = [mx + nx * a, my + ny * a, mx - nx * b, my - ny * b]; }
    } }
    // 2) кончик пальца — от точки «кончик» вперёд до границы с фоном
    const tx = Tp.x + nx * m.off * fw0, ty = Tp.y + ny * m.off * fw0, refT = refColor(tx, ty);
    if (refT) { const lim = scale < Math.min(W, H) * 0.16 ? 1.7 : 1.05; // рука далеко — точки руки менее точны, ищем кончик дальше
      const e = scan(tx, ty, ux, uy, w0 * (lim + 0.1), refT, 30); if (e >= 0.1 * w0 && e <= lim * w0) { m.e = e / w0; m.ok |= 2; } }
    if (live) { // сглаживание замеров во времени
      const key = hi + ':' + f, pr = ema.get(key);
      if (pr) for (const k of ['fw', 'off', 'e']) m[k] = pr[k] + (m[k] - pr[k]) * 0.3;
      ema.set(key, { fw: m.fw, off: m.off, e: m.e });
    }
    return m;
  });
}

// ---------- нейросеть контура ногтя ----------
// MediaPipe находит пальцы, а эта сеть (своя, обучена на открытом наборе с размеченными ногтями) находит сам ноготь
// на вырезке вокруг кончика пальца. Она работает в фоне несколько раз в секунду; между её ответами ноготь «едет»
// вместе с пальцем, потому что его положение хранится относительно точек пальца.
const PS = 64, CROP = 3.6;
let seg = null, segPromise = null, segBusy = false; const nailState = new Map();
const atlas = document.createElement('canvas'); atlas.width = PS * 10; atlas.height = PS; const actx = atlas.getContext('2d', { willReadFrequently: true });
function loadSeg() {
  return (segPromise ||= (async () => {
    const ort = await import(BASE + 'vendor/ort/ort.wasm.min.mjs');
    ort.env.wasm.wasmPaths = BASE + 'vendor/ort/'; ort.env.wasm.proxy = true; // считаем в отдельном потоке, чтобы картинка не подтормаживала
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
    const session = await ort.InferenceSession.create(BASE + 'models/nail_seg.onnx', { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    seg = { ort, session };
  })().catch((e) => { console.warn('Сеть контура ногтя не загрузилась, работаем по замерам пальца', e); }));
}
// Контур ногтя: 32 луча из центра до границы маски (с интерполяцией между пикселями). Углы отсчитываются от оси ногтя.
const RAYS = 32;
function radial(mask, off, W, H, cx, cy, ax, ay, maxR) {
  const at = (x, y) => { // билинейная выборка вероятности
    x -= 0.5; y -= 0.5; if (x < 0 || y < 0 || x > W - 1 || y > H - 1) return 0;
    const x0 = Math.min(W - 2, x | 0), y0 = Math.min(H - 2, y | 0), fx = x - x0, fy = y - y0, i = off + y0 * W + x0;
    return (mask[i] * (1 - fx) + mask[i + 1] * fx) * (1 - fy) + (mask[i + W] * (1 - fx) + mask[i + W + 1] * fx) * fy;
  };
  if (at(cx, cy) < 0.5) return null;
  const r = new Float32Array(RAYS);
  for (let k = 0; k < RAYS; k++) {
    const th = (k * 2 * Math.PI) / RAYS, dx = Math.cos(th) * ax - Math.sin(th) * ay, dy = Math.cos(th) * ay + Math.sin(th) * ax;
    let t = 0, prev = 1, v = 1;
    while (t < maxR) { t += 0.25; v = at(cx + dx * t, cy + dy * t); if (v < 0.5) break; prev = v; }
    r[k] = v < 0.5 ? t - 0.25 + (0.25 * (prev - 0.5)) / Math.max(1e-3, prev - v) : maxR;
  }
  const out = new Float32Array(RAYS);
  for (let k = 0; k < RAYS; k++) out[k] = (r[(k + RAYS - 1) % RAYS] + 2 * r[k] + r[(k + 1) % RAYS]) / 4; // лёгкое сглаживание
  // ноготь выпуклый: убираем «зазубрины» маски, заменяя контур его выпуклой оболочкой
  const P = Array.from(out, (v, k) => [Math.cos((k * 2 * Math.PI) / RAYS) * v, Math.sin((k * 2 * Math.PI) / RAYS) * v]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  const hull = lo.slice(0, -1).concat(up.slice(0, -1));
  if (hull.length >= 3) for (let k = 0; k < RAYS; k++) {
    const th = (k * 2 * Math.PI) / RAYS, dx = Math.cos(th), dy = Math.sin(th); let best = 0;
    for (let i = 0; i < hull.length; i++) { const a = hull[i], b = hull[(i + 1) % hull.length], ex = b[0] - a[0], ey = b[1] - a[1], den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue; const t = (a[0] * ey - a[1] * ex) / den, u = (a[0] * dy - a[1] * dx) / den; if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.max(best, t); }
    if (best > 0) out[k] = Math.min(best, out[k] * 1.6);
  }
  return out;
}
const fkey = (hand, hi, f) => (hand.label || hi) + ':' + f;
// Разбор маски 64x64: берём пятно ближе к центру и вписываем в него прямоугольник вдоль пальца
function fitNail(mask, off, ux, uy) {
  const N = PS * PS, seen = new Uint8Array(N), stack = new Int32Array(N); let best = null;
  for (let i = 0; i < N; i++) {
    if (seen[i] || mask[off + i] < 0.5) continue;
    let sp = 0, n = 0, sx = 0, sy = 0; const pix = []; stack[sp++] = i; seen[i] = 1;
    while (sp) {
      const q = stack[--sp], x = q % PS, y = (q / PS) | 0; pix.push(q); n++; sx += x; sy += y;
      if (x > 0 && !seen[q - 1] && mask[off + q - 1] >= 0.5) { seen[q - 1] = 1; stack[sp++] = q - 1; }
      if (x < PS - 1 && !seen[q + 1] && mask[off + q + 1] >= 0.5) { seen[q + 1] = 1; stack[sp++] = q + 1; }
      if (y > 0 && !seen[q - PS] && mask[off + q - PS] >= 0.5) { seen[q - PS] = 1; stack[sp++] = q - PS; }
      if (y < PS - 1 && !seen[q + PS] && mask[off + q + PS] >= 0.5) { seen[q + PS] = 1; stack[sp++] = q + PS; }
    }
    if (n < 14) continue;
    const cx = sx / n, cy = sy / n, d = Math.hypot(cx - PS / 2 + 0.5, cy - PS / 2 + 0.5);
    if (d > PS * 0.36) continue; // чужой ноготь с соседнего пальца
    const score = n / (1 + (d / 10) ** 2);
    if (!best || score > best.score) best = { score, pix, cx, cy, n };
  }
  if (!best) return null;
  let xx = 0, yy = 0, xy = 0;
  for (const q of best.pix) { const dx = (q % PS) - best.cx, dy = ((q / PS) | 0) - best.cy; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
  const th = 0.5 * Math.atan2(2 * xy, xx - yy), tr = xx + yy, det_ = Math.sqrt(Math.max(0, (xx - yy) ** 2 / 4 + xy * xy)), l1 = tr / 2 + det_, l2 = Math.max(1e-6, tr / 2 - det_);
  // ось ногтя: если пятно заметно вытянуто — главная ось пятна (та, что ближе к направлению пальца), иначе — ось пальца
  let ax = ux, ay = uy;
  if (Math.sqrt(l1 / l2) > 1.18) {
    const mx = Math.cos(th), my = Math.sin(th), dm = mx * ux + my * uy, dn = -my * ux + mx * uy;
    if (Math.abs(dm) >= Math.abs(dn)) { ax = mx * Math.sign(dm || 1); ay = my * Math.sign(dm || 1); } else { ax = -my * Math.sign(dn || 1); ay = mx * Math.sign(dn || 1); }
    if (ax * ux + ay * uy < 0.8) { ax = ux; ay = uy; } // не даём оси уйти от пальца больше чем на ~35°
  }
  let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  for (const q of best.pix) { const dx = (q % PS) - best.cx, dy = ((q / PS) | 0) - best.cy, a = dx * ax + dy * ay, b = -dx * ay + dy * ax; if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b; }
  const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
  const bx = best.cx + ca * ax - cb * ay + 0.5, by = best.cy + ca * ay + cb * ax + 0.5;
  return { x: bx, y: by, ax, ay, len: a1 - a0 + 1, wid: b1 - b0 + 1, rad: radial(mask, off, PS, PS, bx, by, ax, ay, PS * 0.6) };
}
// Один проход сети по всем видимым пальцам. src — кадр (видео или фото) в полном разрешении.
async function segStep(src, sw, sh, hands, live) {
  if (!seg || segBusy || !hands.length) return;
  const jobs = [];
  hands.slice(0, 2).forEach((hand, hi) => {
    const P = hand.lm.map((l) => ({ x: l.x * sw, y: l.y * sh, z: (l.z || 0) * sw })), scale = palmScale(P);
    FINGERS.forEach(([di, ti], f) => {
      const D = P[di], Tp = P[ti], L2 = Math.hypot(Tp.x - D.x, Tp.y - D.y); if (L2 < 3) return;
      const w0 = WK[f] * scale, side = CROP * w0;
      jobs.push({ key: fkey(hand, hi, f), tx: Tp.x, ty: Tp.y, ux: (Tp.x - D.x) / L2, uy: (Tp.y - D.y) / L2, w0, side });
    });
  });
  if (!jobs.length) return;
  segBusy = true;
  try {
    actx.fillStyle = '#808080'; actx.fillRect(0, 0, PS * jobs.length, PS);
    jobs.forEach((j, i) => { // вырезка вокруг кончика пальца; за краем кадра остаётся серый фон
      const x0 = j.tx - j.side / 2, y0 = j.ty - j.side / 2, cx0 = Math.max(0, x0), cy0 = Math.max(0, y0), cx1 = Math.min(sw, x0 + j.side), cy1 = Math.min(sh, y0 + j.side), k = PS / j.side;
      if (cx1 > cx0 && cy1 > cy0) actx.drawImage(src, cx0, cy0, cx1 - cx0, cy1 - cy0, i * PS + (cx0 - x0) * k, (cy0 - y0) * k, (cx1 - cx0) * k, (cy1 - cy0) * k);
    });
    const px = actx.getImageData(0, 0, PS * jobs.length, PS).data, n = jobs.length, N = PS * PS, inp = new Float32Array(n * 3 * N);
    for (let i = 0; i < n; i++) for (let y = 0; y < PS; y++) for (let x = 0; x < PS; x++) {
      const s4 = (y * PS * n + i * PS + x) * 4, o = i * 3 * N + y * PS + x;
      inp[o] = px[s4] / 255; inp[o + N] = px[s4 + 1] / 255; inp[o + 2 * N] = px[s4 + 2] / 255;
    }
    const out = await seg.session.run({ x: new seg.ort.Tensor('float32', inp, [n, 3, PS, PS]) }), mask = out.mask.data;
    jobs.forEach((j, i) => {
      const r = fitNail(mask, i * N, j.ux, j.uy), st = nailState.get(j.key) || { miss: 0, p: null };
      if (!r) { st.miss++; nailState.set(j.key, st); return; }
      const k = j.side / PS, dx = (r.x - PS / 2) * k, dy = (r.y - PS / 2) * k; // смещение центра ногтя от точки «кончик» в пикселях кадра
      const p = { ou: (dx * j.ux + dy * j.uy) / j.w0, on: (-dx * j.uy + dy * j.ux) / j.w0, ang: Math.atan2(r.ay * j.ux - r.ax * j.uy, r.ax * j.ux + r.ay * j.uy), len: r.len * k / j.w0, wid: r.wid * k / j.w0, rad: r.rad ? Array.from(r.rad, (v) => (v * k) / j.w0) : null };
      if (live && st.p && st.miss < 3) for (const q in p) { // сглаживание во времени
        if (q === 'rad') { if (p.rad && st.p.rad) p.rad = p.rad.map((v, i) => st.p.rad[i] + (v - st.p.rad[i]) * 0.55); }
        else p[q] = st.p[q] + (p[q] - st.p[q]) * 0.55;
      }
      st.p = p; st.miss = 0; st.t = performance.now(); nailState.set(j.key, st);
    });
    T.segRuns = (T.segRuns || 0) + 1;
  } catch (e) { console.warn(e); } finally { segBusy = false; }
}

// ---------- поиск ногтей по всему кадру (когда руку «скелетом» найти не удалось) ----------
// Рука снята под углом, обрезана краем кадра или в кадре только пальцы — MediaPipe её не видит.
// Тогда сеть проходит по всему кадру, а направление каждого ногтя (где кончик) определяем по тому,
// в какую сторону от ногтя дальше тянется кожа пальца.
const fcv = document.createElement('canvas'), fctx = fcv.getContext('2d', { willReadFrequently: true });
let fullSide = 448, fullNails = [], fullAt = 0, fullPrev = [];
function components(mask, W, H, minArea) {
  const N = W * H, seen = new Uint8Array(N), stack = new Int32Array(N), out = [];
  for (let i = 0; i < N; i++) {
    if (seen[i] || mask[i] < 0.5) continue;
    let sp = 0, sx = 0, sy = 0; const pix = []; stack[sp++] = i; seen[i] = 1;
    while (sp) {
      const q = stack[--sp], x = q % W, y = (q / W) | 0; pix.push(q); sx += x; sy += y;
      if (x > 0 && !seen[q - 1] && mask[q - 1] >= 0.5) { seen[q - 1] = 1; stack[sp++] = q - 1; }
      if (x < W - 1 && !seen[q + 1] && mask[q + 1] >= 0.5) { seen[q + 1] = 1; stack[sp++] = q + 1; }
      if (y > 0 && !seen[q - W] && mask[q - W] >= 0.5) { seen[q - W] = 1; stack[sp++] = q - W; }
      if (y < H - 1 && !seen[q + W] && mask[q + W] >= 0.5) { seen[q + W] = 1; stack[sp++] = q + W; }
    }
    if (pix.length < minArea) continue;
    const n = pix.length, cx = sx / n, cy = sy / n; let xx = 0, yy = 0, xy = 0, conf = 0;
    for (const q of pix) { const dx = (q % W) - cx, dy = ((q / W) | 0) - cy; xx += dx * dx; yy += dy * dy; xy += dx * dy; conf += mask[q]; }
    const th = 0.5 * Math.atan2(2 * xy, xx - yy), mx = Math.cos(th), my = Math.sin(th);
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
    for (const q of pix) { const dx = (q % W) - cx, dy = ((q / W) | 0) - cy, a = dx * mx + dy * my, b = -dx * my + dy * mx; if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b; }
    const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
    out.push({ x: cx + ca * mx - cb * my + 0.5, y: cy + ca * my + cb * mx + 0.5, mx, my, major: a1 - a0 + 1, minor: b1 - b0 + 1, n, conf: conf / n });
  }
  return out;
}
async function fullStep(src, sw, sh) {
  if (!seg || segBusy) return;
  segBusy = true;
  try {
    const k = fullSide / Math.max(sw, sh), W = Math.max(64, Math.round(sw * k / 8) * 8), H = Math.max(64, Math.round(sh * k / 8) * 8), N = W * H;
    if (fcv.width !== W || fcv.height !== H) { fcv.width = W; fcv.height = H; }
    fctx.drawImage(src, 0, 0, W, H);
    const px = fctx.getImageData(0, 0, W, H).data, inp = new Float32Array(3 * N);
    for (let i = 0; i < N; i++) { inp[i] = px[i * 4] / 255; inp[i + N] = px[i * 4 + 1] / 255; inp[i + 2 * N] = px[i * 4 + 2] / 255; }
    const mask = (await seg.session.run({ x: new seg.ort.Tensor('float32', inp, [1, 3, H, W]) })).mask.data;
    const comps = components(mask, W, H, 18).filter((c) => c.conf > 0.72 && c.major / c.minor < 3.2 && c.n > 0.5 * c.major * c.minor);
    // цвет точки кадра (те же веса, что и в замерах)
    const col = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return null; const i = (y * W + x) * 4, Y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; return [Y * 0.35, px[i + 2] - Y, px[i] - Y]; };
    // похоже ли на кожу: красный канал заметно выше зелёного и синего (ткань, стол, стена этот тест обычно не проходят)
    const skinAt = (x, y) => { let ok = 0; for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = Math.round(x + ox), yy = Math.round(y + oy); if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const i = (yy * W + xx) * 4, r = px[i], g = px[i + 1], bl = px[i + 2]; if (r > 70 && r > g + 10 && r > bl + 14 && g > bl - 12) ok++; } return ok >= 3; };
    const run = (x, y, dx, dy, start, max) => { // сколько пикселей от края ногтя тянется «та же» кожа
      const ref = col(x + dx * (start + 2), y + dy * (start + 2)); if (!ref) return 0; let bad = 0;
      for (let s = start + 3; s < start + max; s++) { const c = col(x + dx * s, y + dy * s); if (!c || mask[Math.round(y + dy * s) * W + Math.round(x + dx * s)] >= 0.5 || Math.hypot(c[0] - ref[0], c[1] - ref[1], c[2] - ref[2]) > 24) { if (++bad >= 2) return s - start - 2; } else bad = 0; }
      return max;
    };
    let nails = comps.map((c) => {
      const el = c.major / c.minor, max = Math.max(c.major, c.minor) * 3.5;
      const cand = [[c.mx, c.my, c.major, c.minor, el > 1.15 ? 1.6 : 1], [-c.mx, -c.my, c.major, c.minor, el > 1.15 ? 1.6 : 1], [-c.my, c.mx, c.minor, c.major, 1], [c.my, -c.mx, c.minor, c.major, 1]]
        .map(([dx, dy, len, wid, pr]) => ({ dx, dy, len, wid, score: run(c.x, c.y, dx, dy, len / 2, max) * pr, skin: skinAt(c.x + dx * (len / 2 + 3), c.y + dy * (len / 2 + 3)) }))
        .sort((a, b) => b.score - a.score);
      const size = Math.max(c.major, c.minor), embedded = cand.every((q) => q.score / (q.len === c.major && el > 1.15 ? 1.6 : 1) >= size * 1.2); // кожа со всех сторон — скорее складка, чем ноготь
      const b = cand.find((q) => q.skin) || cand[0], sure = b.skin && b.score > 1.4 * (cand.filter((q) => q !== b)[0].score + 2);
      // палец — в сторону b, значит кончик ногтя — в противоположную
      return { x: c.x / W, y: c.y / H, embedded, cxp: c.x, cyp: c.y, ax: -b.dx, ay: -b.dy, len: b.len / W, wid: b.wid / W, sure, skin: b.skin, run: b.score, major: c.major, minor: c.minor, mx: c.mx, my: c.my, px: Math.min(c.major, c.minor) };
    });
    // ложные пятна (складки ткани, блики): рядом с настоящим ногтем есть кожа пальца, и ногти одной руки близки по размеру
    nails = nails.filter((n) => n.skin && n.run > n.px * 0.8);
    if (nails.some((n) => !n.embedded)) nails = nails.filter((n) => !n.embedded);
    if (nails.length > 2) { const med = nails.map((n) => n.px).sort((a, b) => a - b)[nails.length >> 1]; nails = nails.filter((n) => n.px > med * 0.45 && n.px < med * 2.2); }
    // неуверенные ногти ориентируем как большинство уверенных (пальцы одной руки смотрят примерно в одну сторону)
    const good = nails.filter((n) => n.sure); let gx = 0, gy = 0; good.forEach((n) => { gx += n.ax; gy += n.ay; });
    if (good.length) nails.forEach((n) => { if (!n.sure) { const d = n.mx * gx + n.my * gy, e = -n.my * gx + n.mx * gy;
      if (Math.abs(d) >= Math.abs(e) || n.major / n.minor > 1.15) { const sg = Math.sign(d || 1); n.ax = n.mx * sg; n.ay = n.my * sg; n.len = n.major / W; n.wid = n.minor / W; } else { const sg = Math.sign(e || 1); n.ax = -n.my * sg; n.ay = n.mx * sg; n.len = n.minor / W; n.wid = n.major / W; } } });
    // подстройка масштаба: сеть обучена на ногтях шириной 13–28 пикселей
    if (nails.length) { const med = nails.map((n) => n.px).sort((a, b) => a - b)[nails.length >> 1]; if (med < 12 || med > 30) fullSide = Math.max(256, Math.min(1024, Math.round(fullSide * 19 / med / 32) * 32)); T.fullRetry = (med < 12 || med > 30) && !T.fullRetried; }
    else { T.fullRetry = false; if (T.mode === 'camera') { const cyc = [448, 256, 640, 160]; fullSide = cyc[(cyc.indexOf(fullSide) + 1) % cyc.length]; } } // ничего не нашли — в следующий раз пробуем другой масштаб
    if (T.debug) console.info('[примерка] весь кадр', W + 'x' + H, 'пятен', comps.length, 'ногтей', nails.length, JSON.stringify(comps.map((c) => [Math.round(c.x), Math.round(c.y), Math.round(c.major), Math.round(c.minor), +c.conf.toFixed(2)])));
    nails.forEach((n) => { const r = radial(mask, 0, W, H, n.cxp, n.cyp, n.ax, n.ay, Math.max(n.major, n.minor)); n.rad = r ? Array.from(r, (v) => v / W) : null; });
    if (T.mode === 'camera') { const prev = fullPrev; fullPrev = nails; if (prev.length) { const kept = nails.filter((n) => sameNail(n, prev)); if (kept.length) nails = kept; } } // в живом режиме — подтверждение предыдущим кадром
    fullNails = nails; fullAt = performance.now(); T.segRuns = (T.segRuns || 0) + 1;
  } catch (e) { console.warn(e); } finally { segBusy = false; }
}

// ---------- отрисовка ногтей ----------
// ноготь по центру ложа (cx, cy), направлению к кончику ang, ширине w и длине ложа bed
// rad — контур настоящего ногтя (32 луча из центра, в пикселях). Лак заливает именно его,
// а выбранная форма и длина дорисовывают свободный край за кончиком.
function drawNail(ctx, cx, cy, ang, w, bed, p, f, rad) {
  if (!rad) { // контура нет — рисуем фигурой по размерам
    const h = bed + LENGTH_K[T.length] * w;
    ctx.save();
    ctx.translate(cx - Math.cos(ang) * bed / 2, cy - Math.sin(ang) * bed / 2);
    ctx.rotate(ang + Math.PI / 2);
    ctx.save(); ctx.shadowColor = 'rgba(30,10,15,.4)'; ctx.shadowBlur = w * 0.12; ctx.shadowOffsetY = w * 0.03;
    nailPath(ctx, w, h, T.shape); ctx.fillStyle = p.base; ctx.fill(); ctx.restore();
    paintNail(ctx, w, h, p, T.shape, { finger: f, img: T.tex });
    ctx.restore();
    return;
  }
  const pts = []; let half = 0;
  for (let k = 0; k < RAYS; k++) { const th = (k * 2 * Math.PI) / RAYS, x = Math.cos(th) * rad[k], y = Math.sin(th) * rad[k]; pts.push([x, y]); half = Math.max(half, Math.abs(y)); }
  const back = rad[RAYS / 2], front = rad[0], bedLen = back + front, wn = half * 2, h = bedLen + (T.length === 'short' ? 0 : LENGTH_K[T.length] * wn);
  // Рисуем на двух вспомогательных холстах: A — дизайн, B — силуэт (контур ногтя + свободный край выбранной формы),
  // затем обрезаем A по B. Так нет швов и двойных бликов на стыке ногтя и отращённой части.
  const pad = Math.ceil(wn * 0.2) + 4, cw = Math.ceil(wn + pad * 2), ch = Math.ceil(h + pad * 2), ox = cw / 2, oy = ch - pad;
  for (const c of [offA, offB]) { if (c.width < cw || c.height < ch) { c.width = Math.max(c.width, cw); c.height = Math.max(c.height, ch); } }
  octxB.setTransform(1, 0, 0, 1, 0, 0); octxB.clearRect(0, 0, cw, ch); octxB.fillStyle = '#000';
  octxB.beginPath(); // контур: ось ногтя (x) смотрит вверх, начало координат — у кутикулы
  for (let k = 0; k <= RAYS; k++) { const a = pts[k % RAYS], b = pts[(k + 1) % RAYS], X = (q) => ox + q[1], Y = (q) => oy - (q[0] + back), mx = (X(a) + X(b)) / 2, my = (Y(a) + Y(b)) / 2; if (k === 0) octxB.moveTo(mx, my); else octxB.quadraticCurveTo(X(a), Y(a), mx, my); }
  octxB.closePath(); octxB.fill();
  if (h > bedLen + 1) { octxB.save(); octxB.translate(ox, oy); octxB.beginPath(); octxB.rect(-cw, -ch, cw * 2, ch - bedLen * 0.7); octxB.clip(); nailPath(octxB, wn, h, T.shape); octxB.fill(); octxB.restore(); }
  octxA.setTransform(1, 0, 0, 1, 0, 0); octxA.globalCompositeOperation = 'source-over'; octxA.clearRect(0, 0, cw, ch);
  octxA.save(); octxA.translate(ox, oy); octxA.fillStyle = p.base; octxA.fillRect(-cw, -ch, cw * 2, ch * 2);
  paintNail(octxA, wn, h, p, T.shape, { finger: f, img: T.tex, noClip: true }); octxA.restore();
  octxA.globalCompositeOperation = 'destination-in'; octxA.drawImage(offB, 0, 0, cw, ch, 0, 0, cw, ch); octxA.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(ang + Math.PI / 2); // «вверх» вспомогательного холста — к кончику ногтя
  ctx.shadowColor = 'rgba(30,10,15,.38)'; ctx.shadowBlur = wn * 0.07; ctx.shadowOffsetY = wn * 0.02;
  ctx.drawImage(offA, 0, 0, cw, ch, -ox, back - oy, cw, ch);
  ctx.restore();
}
const offA = document.createElement('canvas'), offB = document.createElement('canvas'), octxA = offA.getContext('2d'), octxB = offB.getContext('2d');
const sameNail = (a, list) => list.some((b) => Math.hypot(a.x - b.x, a.y - b.y) < Math.max(a.len, a.wid, b.len, b.wid) * 0.6);
const fullActive = () => fullNails.length && (T.mode === 'photo' || performance.now() - fullAt < 1500);
function drawFullNails(ctx, W, H) {
  const p = params(), order = [...fullNails].sort((a, b) => a.x - b.x);
  order.forEach((n, i) => drawNail(ctx, n.x * W, n.y * H, Math.atan2(n.ay, n.ax), n.wid * W * 1.04 * T.scale, n.len * W * 1.04, p, (i % 4) + 1, n.rad && n.rad.map((v) => v * W * 1.03 * T.scale)));
}
function drawNails(ctx, W, H, hands) {
  const p = params();
  for (const hand of hands) {
    const P = hand.lm.map((l) => ({ x: l.x * W, y: l.y * H, z: (l.z || 0) * W }));
    const scale = palmScale(P);
    hand.far = scale < Math.min(W, H) * 0.16;
    // тыльная сторона ладони? (знак векторного произведения зависит от того, левая это рука или правая)
    const hi = hands.indexOf(hand), states = FINGERS.map((_, f) => nailState.get(fkey(hand, hi, f)));
    const bySeg = !!seg && !!hand.label && states.some((st) => st); // сеть уже посмотрела на эту руку — рисуем только там, где она видит ноготь
    if (bySeg) hand.back = states.some((st) => st && st.p && st.miss < 3);
    else if (hand.label) {
      const c = (P[5].x - P[0].x) * (P[17].y - P[0].y) - (P[5].y - P[0].y) * (P[17].x - P[0].x);
      hand.back = hand.label === 'Left' ? c < 0 : c > 0; // проверено на тестовых фото MediaPipe
      if (!hand.back) continue;
    } else hand.back = true;
    FINGERS.forEach(([di, ti], f) => {
      if (bySeg) {
        const st = states[f]; if (!st || !st.p || st.miss >= 3) return;
        const D = P[di], Tp = P[ti], L2 = Math.hypot(Tp.x - D.x, Tp.y - D.y); if (L2 < 2) return;
        const ux = (Tp.x - D.x) / L2, uy = (Tp.y - D.y) / L2, w0 = WK[f] * scale, q = st.p;
        drawNail(ctx, Tp.x + (ux * q.ou - uy * q.on) * w0, Tp.y + (uy * q.ou + ux * q.on) * w0, Math.atan2(uy, ux) + q.ang, q.wid * w0 * 1.04 * T.scale, q.len * w0 * 1.04, p, f, q.rad && q.rad.map((v) => v * w0 * 1.03 * T.scale));
        return;
      }
      const D = P[di], Tp = P[ti];
      const vx = Tp.x - D.x, vy = Tp.y - D.y, L2 = Math.hypot(vx, vy), L3 = Math.hypot(vx, vy, Tp.z - D.z) || 1;
      const fs = Math.min(1, L2 / L3); // ракурс: палец направлен на камеру — ноготь короче
      if (fs < 0.38 || L2 < 2) return;
      const ux = vx / L2, uy = vy / L2, nx = -uy, ny = ux, w0 = WK[f] * scale, m = hand.meas?.[f] || { fw: 1, off: 0, e: 0.42 };
      const w = w0 * m.fw * T.scale, sh = m.off * w0 / 0.8;
      // E — конец пальца (свободный край натурального ногтя), от него откладываем ногтевое ложе назад
      const ex = Tp.x + nx * sh + ux * m.e * w0, ey = Tp.y + ny * sh + uy * m.e * w0;
      const bed = Math.min(1.22 * w, Math.hypot(ex - D.x, ey - D.y) * 0.64), over = LENGTH_K[T.length] * w * Math.max(fs, 0.6);
      const h = bed + over;
      ctx.save();
      ctx.translate(ex - ux * bed, ey - uy * bed);
      ctx.rotate(Math.atan2(uy, ux) + Math.PI / 2);
      ctx.save(); ctx.shadowColor = 'rgba(30,10,15,.45)'; ctx.shadowBlur = w * 0.14; ctx.shadowOffsetY = w * 0.04;
      nailPath(ctx, w, h, T.shape); ctx.fillStyle = p.base; ctx.fill(); ctx.restore();
      ctx.globalAlpha = 0.97;
      paintNail(ctx, w, h, p, T.shape, { finger: f, img: T.tex });
      ctx.restore();
    });
    if (T.debug) { // служебный режим ?debug=1: точки руки и найденные края пальцев
      const k = W / det.width; ctx.save();
      ctx.fillStyle = '#00e5ff'; P.forEach((q) => { ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2, W / 300), 0, 7); ctx.fill(); });
      ctx.strokeStyle = '#ffe600'; ctx.lineWidth = Math.max(1.5, W / 400);
      (hand.meas || []).forEach((m) => { if (m.dbg) { ctx.beginPath(); ctx.moveTo(m.dbg[0] * k, m.dbg[1] * k); ctx.lineTo(m.dbg[2] * k, m.dbg[3] * k); ctx.stroke(); } });
      ctx.fillStyle = '#fff'; ctx.font = `${Math.round(W / 40)}px sans-serif`; ctx.fillText(`${hand.label} ${bySeg ? 'сеть ' + states.map((st) => (st && st.p && st.miss < 3 ? 1 : 0)).join('') : 'замер ' + (hand.meas || []).map((m) => m.ok).join('')} ${W}x${H}`, P[0].x, P[0].y);
      ctx.restore();
    }
  }
}
function drawDemoHand(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#F6E9E4'); g.addColorStop(1, '#E9D3CF'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const P = DEMO.map((l) => ({ x: l.x * W, y: l.y * H })), sc = Math.hypot(P[5].x - P[17].x, P[5].y - P[17].y);
  const skin = (off, col) => {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = sc * 0.36 + off; ctx.beginPath(); [0, 1, 5, 9, 13, 17].forEach((i, k) => (k ? ctx.lineTo(P[i].x, P[i].y) : ctx.moveTo(P[i].x, P[i].y))); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = sc * 0.62 + off; ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y); ctx.lineTo(P[0].x + sc * 0.05, H * 1.05); ctx.stroke();
    [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]].forEach((ch, f) => {
      ctx.lineWidth = WK[f] * sc * 1.42 + off; ctx.beginPath(); ch.forEach((i, k) => (k ? ctx.lineTo(P[i].x, P[i].y) : ctx.moveTo(P[i].x, P[i].y)));
      const a = P[ch[2]], b = P[ch[3]]; ctx.lineTo(b.x + (b.x - a.x) * 0.12, b.y + (b.y - a.y) * 0.12); ctx.stroke();
    });
  };
  ctx.save(); ctx.shadowColor = 'rgba(120,70,70,.25)'; ctx.shadowBlur = sc * 0.12; ctx.shadowOffsetY = sc * 0.05; skin(4, '#D9A98A'); ctx.restore();
  skin(0, '#EDC4A6');
}
// руку «скелетом» не нашли или сеть не видит ногтей там, где он их ждёт (скелет ошибся) — ищем ногти по всему кадру
function needFull() {
  if (!seg || T.mode === 'demo') return false;
  if (!T.hands.length) return true;
  return T.hands.every((hand, hi) => { const st = FINGERS.map((_, f) => nailState.get(fkey(hand, hi, f))); return st.some((x) => x) && st.filter((x) => x && x.p && x.miss < 3).length < 3; });
}
function paint() {
  const cv = document.getElementById('ty-canvas'); if (!cv) return;
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  if (T.mode === 'demo') drawDemoHand(ctx, W, H);
  else if (T.mode === 'photo' && T.img) ctx.drawImage(T.img, 0, 0, W, H);
  else { const v = document.getElementById('ty-video'); if (!v || v.readyState < 2) return; ctx.drawImage(v, 0, 0, W, H); }
  const useFull = needFull() && fullActive();
  if (useFull) drawFullNails(ctx, W, H); else drawNails(ctx, W, H, T.hands);
  const visible = useFull || T.hands.some((h) => h.back);
  if (visible) lastSeen = performance.now();
  status(visible ? (T.mode === 'camera' && T.hands.length && T.hands.every((h) => !h.back || h.far) ? 'Поднесите руку ближе — так ногти лягут точнее' : '') : T.hands.length ? 'Поверните руку тыльной стороной ладони к камере' : T.mode === 'photo' ? 'Не нашли ногти на фото. Попробуйте другое: пальцы крупно, ногти видны, хороший свет' : performance.now() - lastSeen > 700 ? 'Наведите камеру на руку — ногти должны быть видны' : null);
}
function status(text, spin) {
  const el = document.getElementById('ty-status'); if (!el || text === null) return;
  if (el.dataset.t === text) return;
  el.dataset.t = text; el.hidden = !text; el.innerHTML = (spin ? '<i class="spin"></i>' : '') + esc(text);
}
const toHands = (res) => (res.landmarks || []).map((lm, i) => ({ lm, label: (res.handedness || res.handednesses)?.[i]?.[0]?.categoryName || null }));
function loop() {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  const v = document.getElementById('ty-video'), cv = document.getElementById('ty-canvas');
  if (!v || !cv || v.readyState < 2 || !v.videoWidth) return;
  if (cv.width !== v.videoWidth) { cv.width = v.videoWidth; cv.height = v.videoHeight; }
  if (landmarker) {
    try {
      grab(v, v.videoWidth, v.videoHeight);
      const hands = toHands(landmarker.detectForVideo(det, performance.now()));
      hands.forEach((h, i) => { // сглаживаем только мелкое дрожание, быстрые движения — без задержки
        const prev = smooth[i];
        if (prev) h.lm = h.lm.map((l, k) => { const q = prev[k], a = Math.hypot(l.x - q.x, l.y - q.y) > 0.01 ? 1 : 0.5; return { x: q.x + (l.x - q.x) * a, y: q.y + (l.y - q.y) * a, z: q.z + (l.z - q.z) * 0.4 }; });
        smooth[i] = h.lm;
      });
      smooth.length = hands.length;
      if (hands.length) { readPixels(hands); hands.forEach((h, i) => measure(h, i, true)); segStep(v, v.videoWidth, v.videoHeight, hands, true); } else { ema.clear(); nailState.clear(); }
      if (needFull()) fullStep(v, v.videoWidth, v.videoHeight);
      T.hands = hands;
    } catch (e) { console.warn(e); }
  }
  paint();
}
function stopCamera() { running = false; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); stream = null; }
async function setMode(mode) {
  if (landmarker && landmarker._mode !== mode) { await landmarker.setOptions({ runningMode: mode }); landmarker._mode = mode; }
}
async function startCamera() {
  stopCamera(); T.mode = 'camera'; T.hands = []; smooth = []; ema.clear(); nailState.clear();
  const v = document.getElementById('ty-video'), cv = document.getElementById('ty-canvas'); if (!v) return;
  document.getElementById('ty-fallback').hidden = true;
  if (!navigator.mediaDevices?.getUserMedia) return noCamera('Браузер не даёт доступ к камере (нужен HTTPS).');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: T.facing }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  } catch (e) { return noCamera(e.name === 'NotAllowedError' ? 'Нет доступа к камере. Разрешите его в настройках браузера.' : 'Камера не найдена.'); }
  if (!document.getElementById('ty-video')) return stopCamera(); // ушли со страницы, пока ждали разрешение
  v.srcObject = stream; await v.play().catch(() => {});
  const front = (stream.getVideoTracks()[0].getSettings().facingMode || (T.facing === 'user' ? 'user' : '')) === 'user';
  cv.classList.toggle('mirror', front); cv.classList.remove('fit');
  await setMode('VIDEO');
  running = true; lastSeen = performance.now(); loop();
}
function noCamera(msg) {
  const f = document.getElementById('ty-fallback'); if (!f) return;
  f.hidden = false; f.querySelector('p').textContent = msg + ' Загрузите фото руки или примерьте на демо-руке.';
  status('');
}
async function usePhoto(file) {
  stopCamera();
  const url = await fileToDataUrl(file, 1600, 0.92), img = await getImage(url);
  if (!img) return toast('Не удалось открыть фото', 'err');
  const cv = document.getElementById('ty-canvas'); cv.classList.remove('mirror'); cv.classList.add('fit');
  T.mode = 'photo'; T.img = img; cv.width = img.width; cv.height = img.height; T.hands = [];
  document.getElementById('ty-fallback').hidden = true;
  status('Ищем руку на фото…', true); paint();
  try {
    await loadLandmarker(); await setMode('IMAGE'); grab(img, img.width, img.height);
    const hands = toHands(landmarker.detect(det));
    nailState.clear();
    if (hands.length) { readPixels(hands); hands.forEach((h, i) => measure(h, i, false)); await loadSeg(); await segStep(img, img.width, img.height, hands, false); }
    T.hands = hands; fullNails = []; fullSide = 448; T.fullRetried = false;
    if (!hands.length) await loadSeg();
    if (needFull()) { // крупный план или мелкая рука: пробуем несколько масштабов и берём тот, где сеть увидела больше всего ногтя
      let best = [], bestArea = 0; const sets = [];
      for (const side of [448, 256, 160, 720]) {
        fullSide = side; await fullStep(img, img.width, img.height); sets.push(fullNails);
        const area = fullNails.reduce((a, n) => a + n.len * n.wid, 0);
        if (area > bestArea * 1.15) { best = fullNails; bestArea = area; }
      }
      const agreed = best.filter((n) => sets.some((st) => st !== best && sameNail(n, st))); // ноготь подтверждён на другом масштабе
      if (agreed.length) best = agreed;
      fullNails = best;
    }
    T.hands = hands;
  } catch (e) { console.error(e); toast('Не удалось загрузить модель распознавания', 'err'); }
  paint();
}
function useDemo() {
  nailState.clear(); stopCamera(); T.mode = 'demo'; T.hands = [{ lm: DEMO, label: null }];
  const cv = document.getElementById('ty-canvas'); cv.classList.remove('mirror', 'fit'); cv.width = 900; cv.height = 1200;
  document.getElementById('ty-fallback').hidden = true; paint();
}

// ---------- интерфейс ----------
function panel() {
  const d = T.design, tabs = [['design', 'Дизайны'], ['color', 'Цвет'], ['shape', 'Форма'], ['length', 'Длина']];
  let body = '';
  if (T.tab === 'design') body = `<div class="ty-row">${S.boot.designs.map((x) => `<button class="ty-d ${d?.id === x.id ? 'on' : ''}" data-act="tyDesign" data-id="${x.id}">${thumb(x, '', { single: true, shape: 'almond', length: 'medium' })}<small>${esc(x.name)}</small></button>`).join('')}</div>`;
  if (T.tab === 'color') body = `<div class="ty-row colors">${PALETTE.map((c) => `<button class="ty-c ${!d && T.color === c ? 'on' : ''}" style="background:${c}" data-act="tyColor" data-c="${c}" aria-label="Цвет ${c}"></button>`).join('')}<label class="ty-c pick" aria-label="Свой цвет"><input type="color" value="${esc(T.color || '#E8B4B8')}" data-input="tyPick">+</label></div>
    <div class="ty-row opts">${Object.entries(FINISHES).map(([k, v]) => `<button class="chip ${!d && T.finish === k ? 'on' : ''}" data-act="tyFinish" data-v="${k}">${v}</button>`).join('')}</div>`;
  if (T.tab === 'shape') body = `<div class="ty-row opts">${Object.entries(SHAPES).map(([k, v]) => `<button class="ty-s ${T.shape === k ? 'on' : ''}" data-act="tyShape" data-v="${k}">${thumb({ type: 'solid', base: '#E8B4B8' }, '', { single: true, shape: k, length: 'medium' })}<small>${v}</small></button>`).join('')}</div>`;
  if (T.tab === 'length') body = `<div class="ty-row opts">${Object.entries(LENGTHS).map(([k, v]) => `<button class="chip ${T.length === k ? 'on' : ''}" data-act="tyLength" data-v="${k}">${v}</button>`).join('')}</div>
    <label class="ty-range"><span>Размер ногтя</span><input type="range" min="0.75" max="1.35" step="0.01" value="${T.scale}" data-input="tyScale" aria-label="Размер ногтя"></label>`;
  return `<div class="ty-name"><b>${d ? esc(d.name) : 'Свой цвет'}</b><small>${esc(SHAPES[T.shape])} · ${esc(LENGTHS[T.length].toLowerCase())}${d?.extra ? ' · дизайн +' + money(d.extra) : ''}</small></div>
    <div class="ty-tabs">${tabs.map(([k, v]) => `<button class="${T.tab === k ? 'on' : ''}" data-act="tyTab" data-v="${k}">${v}</button>`).join('')}</div>${body}
    <div class="row gap ty-cta"><button class="btn ghost" data-act="tySave" aria-label="Сохранить фото">${ic('download')}<span>Сохранить</span></button><button class="btn grow" data-act="tyBook">${ic('cal')} Записаться с этим дизайном</button></div>`;
}
function redraw(keepScroll = true) {
  const p = document.getElementById('ty-panel'); if (!p) return;
  const sc = keepScroll ? p.querySelector('.ty-row')?.scrollLeft || 0 : 0;
  p.innerHTML = panel(); hydrate(p);
  const row = p.querySelector('.ty-row'); if (row) row.scrollLeft = sc;
  if (T.mode !== 'camera' || !running) paint();
}
async function setDesign(d) {
  T.design = d; T.tex = null;
  if (d) { T.shape = d.shape || T.shape; T.length = d.length || T.length; if (d.image) T.tex = await getImage(d.image); }
}
route('/tryon', async ({ query }) => {
  if (query.design && dsg(query.design)) await setDesign(dsg(query.design));
  else if (!T.design && !T.color) await setDesign(S.boot.designs[0]);
  T.fromBook = !!query.book; T.tab = 'design'; T.debug = !!query.debug;
  onLeave(stopCamera);
  after(async () => {
    status('Загружаем распознавание руки…', true);
    document.querySelector('.ty-d.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    loadSeg();
    const lm = loadLandmarker().then(() => status(''), (e) => { console.error(e); status('Не удалось загрузить распознавание руки. Проверьте интернет и обновите страницу.'); });
    if (T.mode === 'photo' && T.img) { const cv = document.getElementById('ty-canvas'); cv.classList.add('fit'); cv.width = T.img.width; cv.height = T.img.height; await lm; paint(); }
    else if (T.mode === 'demo') useDemo();
    else startCamera();
  });
  return `<div class="tryon"><div class="ty-stage"><video id="ty-video" playsinline muted autoplay></video><canvas id="ty-canvas" width="720" height="960"></canvas>
      <div class="ty-top"><button class="icon-btn glass" data-act="back" aria-label="Закрыть">${ic('close')}</button><b>Примерка</b>
        <div class="row gap"><button class="icon-btn glass" data-act="tyFlip" aria-label="Сменить камеру">${ic('flip')}</button><label class="icon-btn glass" aria-label="Загрузить фото руки">${ic('image')}<input type="file" accept="image/*" hidden data-change="tyFile"></label></div></div>
      <div id="ty-status" class="ty-status" hidden></div>
      <div id="ty-fallback" class="ty-fallback" hidden><div>${ic('camera')}<p></p><label class="btn">${ic('image')} Загрузить фото руки<input type="file" accept="image/*" hidden data-change="tyFile"></label>
        <button class="btn ghost" data-act="tyDemo">Примерить на демо-руке</button><button class="btn ghost" data-act="tyCam">Включить камеру</button></div></div></div>
    <div id="ty-panel" class="ty-panel">${panel()}</div></div>`;
});
A.tyTab = (el) => { T.tab = el.dataset.v; redraw(false); if (T.tab === 'design') document.querySelector('.ty-d.on')?.scrollIntoView({ inline: 'center', block: 'nearest' }); };
A.tyDesign = async (el) => { await setDesign(dsg(el.dataset.id)); redraw(); };
A.tyColor = (el) => { T.design = null; T.tex = null; T.color = el.dataset.c; redraw(); };
A.tyPick = (el) => { T.design = null; T.tex = null; T.color = el.value; if (T.mode !== 'camera' || !running) paint(); document.querySelector('.ty-name b').textContent = 'Свой цвет'; };
A.tyFinish = (el) => { T.design = null; T.tex = null; T.color ||= '#E8B4B8'; T.finish = el.dataset.v; redraw(); };
A.tyShape = (el) => { T.shape = el.dataset.v; redraw(); };
A.tyLength = (el) => { T.length = el.dataset.v; redraw(); };
A.tyScale = (el) => { T.scale = +el.value; if (T.mode !== 'camera' || !running) paint(); };
A.tyFlip = () => { T.facing = T.facing === 'user' ? 'environment' : 'user'; startCamera(); };
A.tyCam = () => startCamera();
A.tyDemo = () => useDemo();
A.tyFile = (el) => { const f = el.files?.[0]; el.value = ''; if (f) usePhoto(f).catch((e) => toast(e.message, 'err')); };
function snapshot(max, q) {
  const cv = document.getElementById('ty-canvas'), k = Math.min(1, max / Math.max(cv.width, cv.height)), c = document.createElement('canvas');
  c.width = Math.round(cv.width * k); c.height = Math.round(cv.height * k);
  const x = c.getContext('2d'); if (cv.classList.contains('mirror')) { x.translate(c.width, 0); x.scale(-1, 1); }
  x.drawImage(cv, 0, 0, c.width, c.height); return c;
}
A.tySave = () => snapshot(1920).toBlob(async (blob) => {
  const file = new File([blob], 'primerka-rustyle.jpg', { type: 'image/jpeg' });
  try { if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer:coarse)').matches) { await navigator.share({ files: [file], title: 'Мой маникюр' }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); toast('Фото сохранено');
}, 'image/jpeg', 0.92);
A.tyBook = () => {
  const has = T.hands.some((h) => h.back) && T.mode !== 'demo';
  const b = T.fromBook || S.book.service_id ? { ...S.book } : {};
  delete b.resched; delete b.pickDesign;
  b.design_id = T.design?.id; b.tryon = { shape: T.shape, length: T.length, ...(T.design ? {} : { color: T.color, finish: T.finish }) };
  if (has) b.snapshot = snapshot(640).toDataURL('image/jpeg', 0.8); else delete b.snapshot;
  S.book = b; try { sessionStorage.setItem('book', JSON.stringify(b)); } catch {}
  go('/book?step=' + (b.service_id && b.date && b.time ? 4 : b.service_id ? 2 : 1));
};
